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
      
      // Fetch all users except those with 'exiting' role and the current user
      let query = supabase
        .from('users')
        .select('id, email, role')
        .neq('role', 'exiting');
      
      // Also exclude the current user if available
      if (currentUser?.id) {
        query = query.neq('id', currentUser.id);
      }
      
      const { data, error } = await query;
      
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