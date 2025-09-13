import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RecentDemoAccount {
  email: string;
  role: string;
  department: string;
}

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentAccount, setRecentAccount] = useState<RecentDemoAccount | null>(null);
  const { login } = useAuth();

  // localStorage utilities for recent demo account
  const saveRecentAccount = (account: RecentDemoAccount) => {
    localStorage.setItem('recentDemoAccount', JSON.stringify(account));
    setRecentAccount(account);
  };

  const getRecentAccount = (): RecentDemoAccount | null => {
    try {
      const stored = localStorage.getItem('recentDemoAccount');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const clearRecentAccount = () => {
    localStorage.removeItem('recentDemoAccount');
    setRecentAccount(null);
  };

  useEffect(() => {
    // Load recent account from localStorage
    const recent = getRecentAccount();
    setRecentAccount(recent);

    try {
      const k = 'demoSeededV1';
      if (localStorage.getItem(k)) return;
      supabase.functions.invoke('seed_demo', { body: {} }).then(() => {
        localStorage.setItem(k, '1');
        console.log('Demo data seeded');
      }).catch((e) => console.warn('Seed demo failed', e));
    } catch (e) {
      console.warn('Seed demo init error', e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      
      // Check if this was a demo account login and save it
      const demoAccount = demoCredentials.find(demo => demo.email === email);
      if (demoAccount && password === 'demo123') {
        saveRecentAccount({
          email: demoAccount.email,
          role: demoAccount.role,
          department: demoAccount.department
        });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccountClick = (demo: typeof demoCredentials[0]) => {
    setEmail(demo.email);
    setPassword('demo123');
    
    // Save as recent account when clicked
    saveRecentAccount({
      email: demo.email,
      role: demo.role,
      department: demo.department
    });
  };

  const demoCredentials = [
    { email: 'ap79020@gmail.com', role: 'HR Manager', department: 'Human Resources' },
    { email: 'arbaaz.jawed@gmail.com', role: 'Successor', department: 'Sales' },
    { email: 'john.doe@company.com', role: 'Exiting Employee', department: 'Sales' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-large">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Seamless Handover
            </CardTitle>
            <CardDescription>
              Secure knowledge transfer platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {recentAccount && (
          <Card className="shadow-medium border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-primary">Recently Used Account</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentAccount}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Quick access to your last used demo account</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => {
                  setEmail(recentAccount.email);
                  setPassword('demo123');
                }}
              >
                <div className="font-medium text-sm text-primary">{recentAccount.role}</div>
                <div className="text-xs text-muted-foreground">{recentAccount.email}</div>
                <div className="text-xs text-muted-foreground">{recentAccount.department}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Demo Accounts</CardTitle>
            <CardDescription>Use these credentials to explore different roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoCredentials.map((demo, index) => (
              <div 
                key={index}
                className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleDemoAccountClick(demo)}
              >
                <div className="font-medium text-sm">{demo.role}</div>
                <div className="text-xs text-muted-foreground">{demo.email}</div>
                <div className="text-xs text-muted-foreground">{demo.department}</div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground text-center mt-4">
              Password for all demo accounts: <code className="bg-muted px-1 py-0.5 rounded">demo123</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
