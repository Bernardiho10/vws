'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined' && !user) {
      router.push('/login');
    }
  }, [user, router]);

  // Don't render anything during SSR to prevent hydration mismatches
  if (!isClient) {
    return null;
  }

  // If not authenticated and on client-side, show loading
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If authenticated, render children
  return <>{children}</>;
};
