'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { signUpWithEmail, signInWithOAuth } from '@/utils/supabase/auth-service';

/**
 * Interface for signup form state
 */
interface SignupFormState {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly error: string;
  readonly loading: boolean;
  readonly success: boolean;
}

/**
 * Client-side signup component
 * Handles user registration with email and OAuth providers
 */
export function SignupClient(): React.ReactElement | null {
  const [formState, setFormState] = useState<SignupFormState>({
    email: '',
    password: '',
    confirmPassword: '',
    error: '',
    loading: false,
    success: false
  });
  
  const { authState } = useAuth();
  const router = useRouter();
  
  // Check if user is already logged in
  useEffect(() => {
    // console.log(authState)
    if (typeof window !== 'undefined' && authState.loading) {
      
      return; // Prevent redirect until authentication is resolved
    }
  
    if (authState.user) {
      //console.log("User is already logged in", authState.user)
      router.push('/dashboard');
    }
  }, [authState.user, authState.loading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    
    // Validate inputs
    if (!formState.email.trim()) {
      setFormState(prev => ({ ...prev, error: 'Email is required' }));
      return;
    }

    if (!formState.password.trim()) {
      setFormState(prev => ({ ...prev, error: 'Password is required' }));
      return;
    }
    
    if (formState.password !== formState.confirmPassword) {
      setFormState(prev => ({ ...prev, error: 'Passwords do not match' }));
      return;
    }
    
    // Simple password strength validation
    if (formState.password.length < 8) {
      setFormState(prev => ({ ...prev, error: 'Password must be at least 8 characters long' }));
      return;
    }
    
    setFormState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      await signUpWithEmail(formState.email, formState.password);
      
      setFormState(prev => ({ 
        ...prev, 
        loading: false,
        success: true
      }));
      
      // Redirect to verification page after short delay
      setTimeout(() => {
        router.push('/verify-email');
      }, 2000);
      
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Signup failed. Please try again.'
      }));
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'facebook'): Promise<void> => {
    setFormState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      await signInWithOAuth(provider);
      // Note: This won't actually execute as the user will be redirected to the OAuth provider
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : `${provider} signup failed. Please try again.`
      }));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
      error: ''
    }));
  };

  // Show nothing if already logged in to prevent flash
  // if (typeof window !== 'undefined' && authState.user) {
  //   return null;
  // }

  if (formState.success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Signup Successful!</CardTitle>
            <CardDescription className="text-center">
              We&apos;ve sent a verification email to your address. Please check your inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm">Redirecting to verification page...</p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign up for Vote With Sense</CardTitle>
          <CardDescription className="text-center">
            Create an account to start voting with blockchain technology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => handleOAuthSignup('google')}
                disabled={formState.loading}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleOAuthSignup('facebook')}
                disabled={formState.loading}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                  <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
                </svg>
                Facebook
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formState.email}
                  onChange={handleInputChange}
                  disabled={formState.loading}
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formState.password}
                  onChange={handleInputChange}
                  disabled={formState.loading}
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formState.confirmPassword}
                  onChange={handleInputChange}
                  disabled={formState.loading}
                  aria-required="true"
                />
              </div>
              {formState.error && (
                <p className="text-red-500 text-sm" role="alert">{formState.error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full"
                disabled={formState.loading}
              >
                {formState.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
