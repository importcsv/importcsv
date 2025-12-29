"use client";

import useSWR from "swr";
import apiClient from "@/utils/apiClient";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  profile_image: string | null;
  created_at: string | null;
}

const fetcher = async (url: string): Promise<User> => {
  const response = await apiClient.get(url);
  return response.data;
};

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<User>("/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
  });

  return {
    user: data,
    isLoading,
    isAuthenticated: !!data && !error,
    isUnauthenticated: !data && !isLoading,
    error,
    mutate,
  };
}
