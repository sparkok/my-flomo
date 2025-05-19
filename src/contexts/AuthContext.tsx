
"use client";

import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast'; // Import toast

interface AuthContextType {
  currentUser: User | null;
  loadingAuth: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  signupWithEmail: (email: string, pass: string, displayName?: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserDisplayName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      // Potentially handle API key errors here too if onAuthStateChanged fails
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
         toast({
          title: "Firebase Configuration Error",
          description: "Invalid Firebase API Key. Please check your application setup and .env file.",
          variant: "destructive",
        });
      }
      setCurrentUser(null);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: any, operation: string): null => {
    console.error(`Error during ${operation}:`, error);
    if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
      toast({
        title: "Firebase Configuration Error",
        description: `Firebase API Key is not valid or missing. Please check your .env configuration. (Operation: ${operation})`,
        variant: "destructive",
      });
      // Re-throw or handle differently if you want to stop execution
      // For now, returning null might be handled by the caller
      return null;
    }
    // For other errors, display a generic message or the Firebase error message
    toast({
      title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Failed`,
      description: error.message || "An unexpected error occurred.",
      variant: "destructive",
    });
    return null;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    // Demo Mode Logic
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && pass === "123456") {
      const demoUserEmail = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL;
      if (!demoUserEmail) {
        console.error("Demo mode is enabled, but NEXT_PUBLIC_DEMO_USER_EMAIL is not configured in .env");
        toast({
          title: "Demo Mode Error",
          description: "Demo mode is misconfigured. Please contact support.",
          variant: "destructive",
        });
        return null;
      }
      try {
        console.log(`Attempting demo login with user: ${demoUserEmail}`);
        const userCredential = await signInWithEmailAndPassword(auth, demoUserEmail, "123456");
        toast({
          title: "Demo Login Successful",
          description: `Logged in as demo user: ${userCredential.user.email}. The email you entered was ignored for this demo login.`,
        });
        return userCredential.user;
      } catch (error: any) {
        console.error('Error during demo login with predefined demo account:', error);
         if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
          return handleAuthError(error, 'demo login');
        }
        if ((error as any).code === 'auth/user-not-found' || (error as any).code === 'auth/wrong-password' || (error as any).code === 'auth/invalid-credential') {
           toast({
            title: "Demo Login Failed",
            description: `The preconfigured demo account (${demoUserEmail}) could not be accessed. Please ensure it exists and has the password "123456".`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Demo Login Failed",
            description: "An unexpected error occurred during demo login.",
            variant: "destructive",
          });
        }
        return null;
      }
    }

    // Normal Login Logic
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error, 'email login');
    }
  };

  const signupWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user && displayName) {
        await updateProfile(userCredential.user, { displayName });
        // Manually update currentUser state after profile update for immediate reflection
        setCurrentUser(auth.currentUser);
      }
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error, 'email signup');
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) { // Corrected line: Removed '=>'
      return handleAuthError(error, 'Google login');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      // Optionally show toast on logout error
      toast({
        title: "Logout Error",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateUserDisplayName = async (displayName: string) => {
    if (!currentUser) {
      throw new Error("No user logged in to update profile.");
    }
    try {
      await updateProfile(currentUser, { displayName });
      setCurrentUser(auth.currentUser); 
    } catch (error) {
      console.error("Error updating display name:", error);
      throw error; 
    }
  };

  const value = {
    currentUser,
    loadingAuth,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    updateUserDisplayName,
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
