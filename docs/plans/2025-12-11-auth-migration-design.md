# Auth Migration: Auth.js to Backend-Driven Auth

**Date:** 2025-12-11
**Status:** Design Complete
**Goal:** Replace Auth.js with fully backend-driven auth using polished shadcn/ui components

## Context

### Current State
- **Frontend:** NextAuth.js v4 with JWT strategy
- **Backend:** Custom FastAPI JWT verification
- **Providers:** Credentials (primary), GitHub & Google (optional)
- **Problem:** Hybrid architecture with auth logic split across frontend and backend

### Why Change
- Backend must own auth (API key clients bypass frontend entirely)
- Current setup is complex (auth logic in 3+ places)
- Want fully open-source stack (moved away from Clerk)
- Need consistent auth path for web UI and API clients

## Target Architecture

```
Current:
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │ ───► │  NextAuth   │ ───► │   FastAPI   │
│             │      │ (middleman) │      │  (backend)  │
└─────────────┘      └─────────────┘      └─────────────┘

Target:
┌─────────────┐                          ┌─────────────┐
│   Browser   │ ────────────────────────►│   FastAPI   │
│  (shadcn)   │◄────────────────────────│  (all auth) │
└─────────────┘                          └─────────────┘
                    httpOnly cookies
                    OAuth redirects
                    API key support
```

## Backend Implementation

### Library: Authlib
- Mature, well-maintained Python OAuth library
- Supports OAuth 2.0, OpenID Connect
- Clean integration with FastAPI/Starlette

### Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/auth/login` | POST | Email/password login | Modify (set cookie) |
| `/api/v1/auth/register` | POST | User registration | Modify (set cookie) |
| `/api/v1/auth/me` | GET | Get current user | Keep |
| `/api/v1/auth/logout` | POST | Clear session cookie | New |
| `/api/v1/auth/oauth/{provider}` | GET | Start OAuth flow | New |
| `/api/v1/auth/oauth/{provider}/callback` | GET | Handle OAuth callback | New |
| `/api/v1/auth/refresh` | POST | Refresh access token | New (optional) |

### Session Strategy
- Access token stored in httpOnly cookie (secure, SameSite=Lax)
- Token uses existing JWT format
- Backend sets cookie on login/OAuth success
- Frontend never touches token directly
- API key users continue using `Authorization: Bearer` header

### Files to Modify/Create

**New files:**
- `backend/app/auth/oauth.py` - OAuth client configuration

**Modified files:**
- `backend/app/api/v1/auth.py` - Add OAuth endpoints, modify login/register
- `backend/app/core/config.py` - Add OAuth credentials

## Frontend Implementation

### Remove NextAuth

**Delete:**
- `admin/src/lib/auth.ts`
- `admin/src/app/api/auth/[...nextauth]/route.ts`
- `admin/src/app/api/auth/register/route.ts`
- `admin/src/components/NextAuthProvider.tsx`
- `next-auth` from `package.json`

### New Auth Utilities

**`admin/src/lib/auth.ts`** (new, simpler version):
```typescript
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const auth = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  register: async (data: { email: string; password: string; full_name: string }) => {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  logout: async () => {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  getSession: async () => {
    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  },

  oauthRedirect: (provider: 'github' | 'google') => {
    window.location.href = `${API_URL}/api/v1/auth/oauth/${provider}`;
  },
};
```

**`admin/src/components/AuthProvider.tsx`**:
```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const session = await auth.getSession();
      setUser(session);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Middleware Update

**`admin/src/middleware.ts`**:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/auth/signin', '/auth/signup', '/auth/error'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('access_token');

  if (!authCookie) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

### API Client Simplification

**`admin/src/utils/apiClient.ts`**:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true, // Send cookies automatically
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## UI Components

### New Shared Components

**`admin/src/components/auth/OAuthButton.tsx`**:
```typescript
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

interface OAuthButtonProps {
  provider: 'github' | 'google';
  onClick: () => void;
  isLoading?: boolean;
}

const providerConfig = {
  github: { label: 'GitHub', icon: Github },
  google: { label: 'Google', icon: GoogleIcon }, // Custom or from react-icons
};

export function OAuthButton({ provider, onClick, isLoading }: OAuthButtonProps) {
  const config = providerConfig[provider];
  const Icon = config.icon;

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={isLoading}
    >
      <Icon className="mr-2 h-4 w-4" />
      Continue with {config.label}
    </Button>
  );
}
```

**`admin/src/components/auth/AuthDivider.tsx`**:
```typescript
export function AuthDivider() {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          or continue with
        </span>
      </div>
    </div>
  );
}
```

**`admin/src/components/auth/PasswordInput.tsx`**:
```typescript
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function PasswordInput(props: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
```

### Updated Sign In Page Structure

```
┌─────────────────────────────────┐
│         [Logo]                  │
│         Sign In                 │
│   Welcome back                  │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ ⬡ Continue with Google  │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 🐙 Continue with GitHub │    │
│  └─────────────────────────┘    │
│                                 │
│  ──────── or continue with ─────│
│                                 │
│  Email                          │
│  ┌─────────────────────────┐    │
│  │ name@example.com        │    │
│  └─────────────────────────┘    │
│                                 │
│  Password                       │
│  ┌─────────────────────────┐ 👁 │
│  │ ••••••••                │    │
│  └─────────────────────────┘    │
│                                 │
│  ☐ Remember me    Forgot?       │
│                                 │
│  ┌─────────────────────────┐    │
│  │      Sign In            │    │
│  └─────────────────────────┘    │
│                                 │
│  Don't have an account? Sign up │
└─────────────────────────────────┘
```

## Migration Phases

### Phase 1: Backend OAuth
1. Install `authlib` and `httpx` in backend
2. Add OAuth config to `config.py`
3. Create `backend/app/auth/oauth.py`
4. Add OAuth endpoints to `auth.py`
5. Add logout endpoint
6. Modify login/register to set httpOnly cookie
7. Test OAuth flow via browser

### Phase 2: Frontend Auth Removal
1. Create `AuthProvider` context
2. Create `auth` utility functions
3. Update `apiClient.ts` for cookies
4. Update `middleware.ts`
5. Remove NextAuth files and dependencies
6. Test credentials login

### Phase 3: UI Polish
1. Create `OAuthButton`, `AuthDivider`, `PasswordInput`
2. Update sign-in page
3. Update sign-up page
4. Add loading states and error handling
5. Test full OAuth flow

### Phase 4: Cleanup
1. Remove `/api/v1/auth/oauth/sync` endpoint
2. Remove NextAuth types/configs
3. Update environment documentation
4. Verify API key auth works

## Environment Variables

### Backend (`backend/.env`)
```
# Existing
SECRET_KEY=your-secret-key
NEXTAUTH_SECRET=your-nextauth-secret  # Can remove after migration

# New
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:3001  # For OAuth redirect
```

### Frontend (`admin/.env.local`)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
# Remove NEXTAUTH_SECRET, GITHUB_ID, etc.
```

## Security Considerations

- httpOnly cookies prevent XSS token theft
- SameSite=Lax prevents CSRF on state-changing requests
- OAuth state parameter prevents CSRF on OAuth flow
- CORS configured to allow credentials from frontend origin
- API keys continue working via Authorization header (no cookie)

## Testing Checklist

- [ ] Credentials login sets cookie, redirects to app
- [ ] Credentials registration sets cookie, redirects to app
- [ ] Logout clears cookie, redirects to sign-in
- [ ] GitHub OAuth completes flow, sets cookie
- [ ] Google OAuth completes flow, sets cookie
- [ ] Protected routes redirect to sign-in when no cookie
- [ ] API client sends cookies automatically
- [ ] 401 responses redirect to sign-in
- [ ] API key auth still works for programmatic access
- [ ] Refresh token extends session (if implemented)
