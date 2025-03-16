'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';

interface LoginFormState {
  readonly username: string;
  readonly error: string;
}

// Default user for easy login
const DEFAULT_USER = 'demo_user';

/**
 * Client-side login component
 */
export function LoginClient(): React.ReactElement | null {
  const [formState, setFormState] = useState<LoginFormState>({
    username: DEFAULT_USER,
    error: ''
  });
  const { user, login } = useAuth();
  const router = useRouter();
  
  // Check if user is already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    
    if (!formState.username.trim()) {
      setFormState(prev => ({ ...prev, error: 'Username is required' }));
      return;
    }
    
    login(formState.username);
    
    // Small delay to allow the login state to be set
    setTimeout(() => {
      router.push('/dashboard');
    }, 100);
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
                type="text"
                name="username"
                placeholder="Username"
                value={formState.username}
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
              onClick={(e) => {
                e.preventDefault();
                login(DEFAULT_USER);
                setTimeout(() => {
                  router.push('/dashboard');
                }, 100);
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
