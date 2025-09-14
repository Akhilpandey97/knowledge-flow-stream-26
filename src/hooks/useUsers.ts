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
    try {
      setLoading(true);
      setError(null);
      
      // Use RPC function to securely fetch eligible successors 
      const { data, error } = await supabase.rpc('list_successor_candidates');
      
      if (error) {
        throw error;
      }
        
      setUsers(data || []);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      setUsers([]);
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchUsers();
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, retryCount]);

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