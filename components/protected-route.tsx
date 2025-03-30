'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authState } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authState.isLoading && !authState.user) {
      router.push('/login');
    }
  }, [isClient, authState.user, authState.isLoading, router]);

  if (!isClient || authState.isLoading) {
    return null; // or a loading spinner
  }

  if (!authState.user) {
    return null;
  }

  return <>{children}</>;
};
