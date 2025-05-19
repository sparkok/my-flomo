
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus, KeyRound } from 'lucide-react'; // Added KeyRound

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // For signup
  const [isLoginMode, setIsLoginMode] = useState(true); // To toggle between login and signup
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const user = await loginWithEmail(email, password);
        if (user) {
          toast({ title: 'Login Successful', description: `Welcome back, ${user.displayName || user.email}!` });
        } else {
          throw new Error('Login failed. Please check your credentials.');
        }
      } else { // Signup mode
        if (!displayName.trim()) {
            toast({ title: 'Signup Failed', description: 'Display name cannot be empty.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }
        const user = await signupWithEmail(email, password, displayName);
        if (user) {
          toast({ title: 'Signup Successful', description: `Welcome, ${user.displayName || user.email}! You can now log in.` });
          setIsLoginMode(true); // Switch to login mode after successful signup
        } else {
          throw new Error('Signup failed. Please try again.');
        }
      }
    } catch (error) {
      toast({
        title: isLoginMode ? 'Login Failed' : 'Signup Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        toast({ title: 'Google Login Successful', description: `Welcome, ${user.displayName || user.email}!` });
      } else {
        // Error might be handled by loginWithGoogle or just return null
        throw new Error('Google login failed. Please try again.');
      }
    } catch (error) {
      toast({
        title: 'Google Login Failed',
        description: (error as Error).message || 'Could not sign in with Google.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">{isLoginMode ? 'Welcome Back!' : 'Create an Account'}</CardTitle>
          <CardDescription>{isLoginMode ? 'Log in to access your Sparkok notes.' : 'Sign up to start organizing your thoughts.'}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLoginMode && (
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  required={!isLoginMode}
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isLoginMode ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />)}
              {isLoginMode ? 'Log In' : 'Sign Up'}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
              <Button
                variant="link"
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="font-semibold text-primary"
                disabled={isLoading}
              >
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
