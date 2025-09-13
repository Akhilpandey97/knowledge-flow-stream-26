import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener...');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state changed:', event, !!session);
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to defer the async operation and prevent deadlocks
          setTimeout(() => {
            fetchUserProfile(session.user);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
        
        // Always set loading to false for auth state changes
        if (event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Then check for existing session with proper error handling
    const initializeSession = async () => {
      try {
        console.log('AuthContext: Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        if (session?.user) {
          console.log('AuthContext: Found existing session, fetching profile...');
          await fetchUserProfile(session.user);
        } else {
          console.log('AuthContext: No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Error in session initialization:', error);
        setLoading(false);
      }
    };

    initializeSession();

    // Set a fallback timeout to ensure loading never stays true indefinitely
    const fallbackTimeout = setTimeout(() => {
      console.warn('AuthContext: Fallback timeout triggered, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second fallback

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    console.log('AuthContext: Fetching user profile for user:', {
      id: supabaseUser.id,
      email: supabaseUser.email
    });
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      console.log('AuthContext: Database query result:', {
        profile,
        error,
        hasProfile: !!profile
      });

      if (error) {
        console.error('AuthContext: Error fetching user profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Create a fallback user if profile doesn't exist
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
          email: supabaseUser.email || '',
          role: 'exiting', // Default role
          department: 'General',
          avatar: supabaseUser.user_metadata?.avatar_url || ''
        };
        console.log('AuthContext: Using fallback user due to error:', fallbackUser);
        setUser(fallbackUser);
        return;
      }

      if (profile) {
        console.log('AuthContext: Raw profile from database:', profile);
        
        const mappedRole = mapDatabaseRole(profile.role);
        console.log('AuthContext: Role mapping:', {
          originalRole: profile.role,
          mappedRole: mappedRole
        });
        
        const mappedUser: User = {
          id: profile.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
          email: profile.email,
          role: mappedRole,
          department: getDepartmentForRole(profile.role),
          avatar: supabaseUser.user_metadata?.avatar_url || ''
        };
        
        console.log('AuthContext: Final mapped user:', mappedUser);
        setUser(mappedUser);
      } else {
        console.log('AuthContext: No profile found in database for user ID:', supabaseUser.id);
        
        // Create a fallback user if no profile found
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
          email: supabaseUser.email || '',
          role: 'exiting', // Default role
          department: 'General',
          avatar: supabaseUser.user_metadata?.avatar_url || ''
        };
        console.log('AuthContext: Using fallback user (no profile):', fallbackUser);
        setUser(fallbackUser);
      }
    } catch (error) {
      console.error('AuthContext: Unexpected error in fetchUserProfile:', error);
      
      // Create a fallback user even if there's an unexpected error
      const fallbackUser: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
        email: supabaseUser.email || '',
        role: 'exiting', // Default role
        department: 'General',
        avatar: supabaseUser.user_metadata?.avatar_url || ''
      };
      console.log('AuthContext: Using fallback user due to exception:', fallbackUser);
      setUser(fallbackUser);
    }
  };

  const mapDatabaseRole = (dbRole: string): UserRole => {
    console.log('AuthContext: Mapping database role:', dbRole);
    
    // Normalize the role string by converting to lowercase and removing spaces/special chars
    const normalizedRole = dbRole?.toLowerCase().replace(/[^a-z]/g, '');
    
    switch (normalizedRole) {
      // Legacy role mapping
      case 'employee': return 'exiting';
      case 'manager': return 'hr-manager';
      // New role mapping
      case 'admin': return 'admin';
      case 'exiting': return 'exiting';
      case 'successor': return 'successor';
      case 'hrmanager': return 'hr-manager';
      case 'hr-manager': return 'hr-manager';
      default: 
        console.warn('AuthContext: Unknown role, defaulting to exiting:', dbRole);
        return 'exiting';
    }
  };

  const getDepartmentForRole = (role: string): string => {
    switch (role) {
      // Legacy role mapping
      case 'employee': return 'Sales';
      case 'manager': return 'Human Resources';
      // New role mapping
      case 'admin': return 'Administration';
      case 'exiting': return 'Sales';
      case 'successor': return 'Sales';
      case 'hr-manager': return 'Human Resources';
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
    if (loggingOut) return; // Prevent multiple simultaneous logout calls
    
    setLoggingOut(true);
    
    try {
      // Clear local state immediately for better UX
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Handle common session errors gracefully
        if (error.message.includes('session_not_found') || error.message.includes('Session not found')) {
          console.log('Session already invalidated, logout successful');
        } else {
          console.error('Logout error:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setLoggingOut(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && !!session,
    signUp,
    loading,
    loggingOut,
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