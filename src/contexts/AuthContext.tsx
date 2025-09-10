import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Create a fallback user if profile doesn't exist
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
          email: supabaseUser.email || '',
          role: 'exiting', // Default role
          department: 'General',
          avatar: supabaseUser.user_metadata?.avatar_url || ''
        };
        setUser(fallbackUser);
        return;
      }

      if (profile) {
        const mappedUser: User = {
          id: profile.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
          email: profile.email,
          role: mapDatabaseRole(profile.role),
          department: getDepartmentForRole(profile.role),
          avatar: supabaseUser.user_metadata?.avatar_url || ''
        };
        setUser(mappedUser);
      } else {
        // Create a fallback user if no profile found
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
          email: supabaseUser.email || '',
          role: 'exiting', // Default role
          department: 'General',
          avatar: supabaseUser.user_metadata?.avatar_url || ''
        };
        setUser(fallbackUser);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Create a fallback user even if there's an unexpected error
      const fallbackUser: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
        email: supabaseUser.email || '',
        role: 'exiting', // Default role
        department: 'General',
        avatar: supabaseUser.user_metadata?.avatar_url || ''
      };
      setUser(fallbackUser);
    }
  };

  const mapDatabaseRole = (dbRole: string): UserRole => {
    switch (dbRole) {
      case 'employee': return 'exiting';
      case 'successor': return 'successor';
      case 'manager': return 'hr-manager';
      default: return 'exiting';
    }
  };

  const getDepartmentForRole = (role: string): string => {
    switch (role) {
      case 'employee': return 'Sales';
      case 'successor': return 'Sales';
      case 'manager': return 'Human Resources';
      default: return 'Unknown';
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && !!session,
    signUp,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};