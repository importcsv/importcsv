/**
 * Authentication helpers for backend-driven auth.
 * Uses HTTP-only cookies for secure session management.
 */
import { mutate } from "swr";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const signIn = {
  /**
   * Redirect to Google OAuth
   */
  google: (callbackUrl = "/importers") => {
    const redirect = encodeURIComponent(callbackUrl);
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/google?redirect=${redirect}`;
  },

  /**
   * Redirect to GitHub OAuth
   */
  github: (callbackUrl = "/importers") => {
    const redirect = encodeURIComponent(callbackUrl);
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/github?redirect=${redirect}`;
  },

  /**
   * Sign in with email/password
   */
  credentials: async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
      credentials: "include", // Important: sends/receives cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Invalid credentials");
    }

    // Invalidate the SWR cache for /auth/me to force re-fetch with new cookie
    // Don't await - just trigger the invalidation and let navigation happen
    mutate("/auth/me", undefined, { revalidate: true });
  },
};

/**
 * Sign out - clears cookie and redirects
 */
export const signOut = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout request failed:", error);
  }
  window.location.href = "/auth/signin";
};

/**
 * Get available OAuth providers
 */
export const getProviders = async (): Promise<{ google: boolean; github: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/providers`, {
      credentials: "include",
    });
    if (!response.ok) {
      return { google: false, github: false };
    }
    return response.json();
  } catch {
    return { google: false, github: false };
  }
};
