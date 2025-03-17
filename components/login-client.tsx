'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';

interface LoginFormState {
  readonly username: string;
  readonly password: string;
  readonly error: string;
}

// Default user for easy login
const DEFAULT_USER = 'demo@example.com';
const DEFAULT_PASSWORD = 'demo123456';

/**
 * Client-side login component
 */
export function LoginClient(): React.ReactElement | null {
  const [formState, setFormState] = useState<LoginFormState>({
    username: DEFAULT_USER,
    password: DEFAULT_PASSWORD,
    error: ''
  });
  
  const { user, signInWithEmail } = useAuth();
  const router = useRouter();
  
  // Check if user is already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    
    if (!formState.username.trim()) {
      setFormState(prev => ({ ...prev, error: 'Email is required' }));
      return;
    }

    if (!formState.password.trim()) {
      setFormState(prev => ({ ...prev, error: 'Password is required' }));
      return;
    }
    
    try {
      await signInWithEmail({
        email: formState.username,
        password: formState.password
      });
      
      router.push('/dashboard');
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Login failed. Please try again.'
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
  if (typeof window !== 'undefined' && user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Login to Vote With Sense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                name="username"
                placeholder="Email"
                value={formState.username}
                onChange={handleInputChange}
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
                aria-required="true"
              />
            </div>
            {formState.error && (
              <p className="text-red-500 text-sm" role="alert">{formState.error}</p>
            )}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center">
            Don&apos;t have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 hover:underline"
              onClick={() => router.push('/signup')}
            >
              Sign up
            </Button>
            {' | '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 hover:underline"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await signInWithEmail({
                    email: DEFAULT_USER,
                    password: DEFAULT_PASSWORD
                  });
                  router.push('/dashboard');
                } catch {
                  setFormState(prev => ({ 
                    ...prev, 
                    error: 'Demo login failed. Please try with your credentials.'
                  }));
                }
              }}
            >
              Login as Demo User
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
