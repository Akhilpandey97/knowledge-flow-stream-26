import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  role: string;
}

export const useUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!currentUser) {
      console.log('No authenticated user, skipping successor candidates fetch');
      setUsers([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching successor candidates for user:', currentUser.id);
      
      // Use RPC function to securely fetch eligible successors 
      const { data, error } = await supabase.rpc('list_successor_candidates');
      
      console.log('RPC response:', { data, error });
      
      if (error) {
        console.error('Supabase RPC error:', error);
        
        // If RPC function fails, try fallback direct query
        console.log('Trying fallback direct query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('id, email, role')
          .neq('role', 'exiting')
          .neq('id', currentUser.id);
          
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw error; // Throw original RPC error
        }
        
        console.log('Fallback query successful:', fallbackData?.length || 0);
        setUsers(fallbackData || []);
        setRetryCount(0);
        return;
      }
        
      setUsers(data || []);
      setRetryCount(0); // Reset retry count on success
      console.log('Successfully fetched users:', data?.length || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      setUsers([]);
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        console.log(`Retrying in ${Math.pow(2, retryCount)} seconds... (attempt ${retryCount + 1}/3)`);
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchUsers();
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount, currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const retry = useCallback(() => {
    setRetryCount(0);
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    retry,
    retryCount,
  };
};