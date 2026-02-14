import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeftRight, Lock } from 'lucide-react';
import { PasswordResetDialog } from './PasswordResetDialog';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto enterprise-shadow-md">
            <ArrowLeftRight className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Seamless Handover</h1>
          <p className="text-sm text-muted-foreground">Enterprise knowledge transfer platform</p>
        </div>

        <Card className="enterprise-shadow-md border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Sign in</CardTitle>
            <CardDescription className="text-xs">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-9"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-9" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Signing in...</>
                ) : (
                  <><Lock className="mr-2 h-3.5 w-3.5" />Sign in</>
                )}
              </Button>

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                onClick={() => setIsResetDialogOpen(true)}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </form>

            <PasswordResetDialog
              isOpen={isResetDialogOpen}
              onClose={() => setIsResetDialogOpen(false)}
            />
          </CardContent>
        </Card>

        <p className="text-[11px] text-center text-muted-foreground/60">
          Protected by enterprise-grade encryption
        </p>
      </div>
    </div>
  );
};
