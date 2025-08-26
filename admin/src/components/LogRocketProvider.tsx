'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Dynamically import LogRocket to handle loading errors
let LogRocket: any = null;

export function LogRocketProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only initialize LogRocket in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Dynamically import LogRocket to avoid build issues
    const initLogRocket = async () => {
      try {
        const LR = await import('logrocket');
        LogRocket = LR.default;
        
        // Initialize LogRocket with error handling
        if (LogRocket && LogRocket.init) {
          LogRocket.init('dwyxun/importcsv');
          
          // Identify user when they're loaded
          if (status === 'authenticated' && session?.user) {
            LogRocket.identify(session.user.id || '', {
              name: session.user.name || '',
              email: session.user.email || '',
            });
          }
        }
      } catch (error) {
        // Silently fail in production, log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('LogRocket initialization skipped:', error);
        }
      }
    };

    initLogRocket();
  }, [status, session]);

  return <>{children}</>;
}
