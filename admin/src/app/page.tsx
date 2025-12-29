'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isUnauthenticated, isLoading } = useUser();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/importers');
    } else if (isUnauthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isUnauthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">ImportCSV Admin</h1>
        <p className="text-gray-500">
          {isLoading ? 'Loading...' : isAuthenticated ? 'Redirecting to importers...' : 'Redirecting to sign in...'}
        </p>
      </div>
    </div>
  );
}
