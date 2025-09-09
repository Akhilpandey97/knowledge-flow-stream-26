export type UserRole = 'exiting' | 'successor' | 'hr-manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  signUp?: (email: string, password: string) => Promise<void>;
  loading?: boolean;
}