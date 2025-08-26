'use client';

import { useEffect, ReactNode } from 'react';
import { useSession } from "next-auth/react";
import { setTokenGetter } from "@/utils/apiClient";

export function ApiProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  
  useEffect(() => {
    // Set the token getter to return the NextAuth access token
    setTokenGetter(async () => {
      return (session as any)?.accessToken || null;
    });
  }, [session]);

  return <>{children}</>;
}