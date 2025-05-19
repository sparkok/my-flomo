
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // For redirection
import { Loader2, UserCircle } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, loadingAuth, updateUserDisplayName } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !currentUser) {
      router.push('/'); // Redirect to home if not logged in
    } else if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser, loadingAuth, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !displayName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Display name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await updateUserDisplayName(displayName.trim());
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: (error as Error).message || 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
          </div>
          <CardDescription>Update your personal information here.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={currentUser.email || ''}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Your email address cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
