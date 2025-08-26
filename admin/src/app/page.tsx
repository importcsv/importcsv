'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/importers');
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">ImportCSV Admin</h1>
        <p className="text-gray-500">
          {status === 'loading' ? 'Loading...' : status === 'authenticated' ? 'Redirecting to importers...' : 'Redirecting to sign in...'}
        </p>
      </div>
    </div>
  );
}
