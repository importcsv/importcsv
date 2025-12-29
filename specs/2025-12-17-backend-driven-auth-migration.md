# Backend-Driven Authentication Migration

**Summary:** Migrate authentication from NextAuth (frontend-driven) to a backend-driven architecture using FastAPI + Authlib, simplifying the auth flow and reducing configuration overhead for self-hosted deployments.

**Date:** 2025-12-17
**Status:** Final
**Author:** Generated via brainstorming session (refined)

---

## Table of Contents

1. [Context & Motivation](#context--motivation)
2. [Current Architecture](#current-architecture)
3. [Proposed Architecture](#proposed-architecture)
4. [Design Decisions](#design-decisions)
5. [Detailed Design](#detailed-design)
6. [Migration Plan](#migration-plan)
7. [Files Changed](#files-changed)
8. [Configuration Changes](#configuration-changes)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Rollback Plan](#rollback-plan)
12. [Future Considerations](#future-considerations)

---

## Context & Motivation

### Why Migrate?

The current authentication setup uses NextAuth in the frontend with a custom sync mechanism to the FastAPI backend. While functional, this creates:

1. **Dual JWT Management** — NextAuth manages its own session JWT while the backend issues separate JWTs, requiring a sync endpoint
2. **Duplicate OAuth Configuration** — OAuth credentials must be configured in both frontend (Next.js env vars) and referenced by the backend sync
3. **Complex Token Flow** — The `ApiProvider` extracts tokens from NextAuth sessions and injects them into API calls
4. **Self-Hosting Overhead** — Users must configure 6+ environment variables across two systems

### Goals

- **Simplify architecture** — Single source of truth for authentication
- **Reduce configuration** — Fewer environment variables for self-hosting
- **Maintain feature parity** — Support email/password + OAuth providers (Google, GitHub)
- **Keep existing UI** — No visual changes to the authentication experience

### Non-Goals

- Adding new authentication methods (magic links, passkeys)
- Team/organization features (future work)
- Changing the frontend component library
- Token refresh mechanisms (30-day expiry is sufficient for this use case)
- "Remember me" functionality (all sessions are 30 days)
- Session invalidation / "logout everywhere" (future work)

---

## Current Architecture

### Sign-In Flow (NextAuth)

```
User clicks "Sign in with Google"
        │
        ▼
┌─────────────────┐
│    NextAuth     │ ◄── OAuth credentials configured here
│  (Next.js app)  │
└────────┬────────┘
        │
        ▼
NextAuth redirects to Google, handles callback
        │
        ▼
┌─────────────────┐      POST /auth/oauth/sync       ┌────────────┐
│  jwt callback   │ ────────────────────────────────►│  Backend   │
│                 │                                  │  FastAPI   │
│                 │◄─────────────────────────────────│            │
└────────┬────────┘      { access_token, user }      └────────────┘
        │
        ▼
NextAuth stores accessToken in its session
```

### API Request Flow (Current)

```
┌─────────────────┐
│   ApiProvider   │  extracts accessToken from NextAuth
│   useSession()  │  session
└────────┬────────┘
        │
        ▼
┌─────────────────┐      Authorization: Bearer <token>   ┌────────────┐
│   apiClient     │ ────────────────────────────────────►│  Backend   │
│                 │                                      │  FastAPI   │
│                 │◄─────────────────────────────────────│            │
└─────────────────┘      { data }                        └────────────┘
```

### Current Files Involved

```
admin/
├── src/
│   ├── lib/auth.ts                      # NextAuth configuration (143 lines)
│   ├── app/api/auth/[...nextauth]/route.ts  # NextAuth API route
│   ├── components/NextAuthProvider.tsx  # Session provider wrapper
│   ├── components/ApiProvider.tsx       # Token injection for API calls
│   ├── middleware.ts                    # NextAuth withAuth middleware
│   └── app/auth/
│       ├── signin/page.tsx              # Sign-in page
│       └── signup/page.tsx              # Sign-up page

backend/
├── app/
│   ├── api/v1/auth.py                   # Auth endpoints including oauth/sync
│   └── auth/jwt_auth.py                 # JWT verification
```

---

## Proposed Architecture

### Sign-In Flow (Backend-Driven)

```
User clicks "Sign in with Google"
        │
        ▼
Frontend redirects to:
GET /api/v1/auth/login/google
        │
        ▼
┌─────────────────┐
│    Backend      │ ◄── OAuth credentials configured here (ONLY place)
│    FastAPI      │
│   + Authlib     │
└────────┬────────┘
        │
        ▼
Backend redirects to Google, handles callback
        │
        ▼
Backend creates/updates user, generates JWT
        │
        ▼
Sets HTTP-only cookie, redirects to frontend
```

### API Request Flow (Proposed)

```
┌─────────────────┐      Cookie sent automatically       ┌────────────┐
│   apiClient     │ ────────────────────────────────────►│  Backend   │
│  (just axios)   │                                      │  FastAPI   │
│                 │◄─────────────────────────────────────│            │
└─────────────────┘      { data }                        └────────────┘

No NextAuth, no ApiProvider, no useSession()
```

### Key Differences

| Aspect | Current (NextAuth) | Proposed (Backend-Driven) |
|--------|-------------------|---------------------------|
| OAuth config location | Next.js env vars | Backend env vars only |
| JWT issuance | Backend (via sync endpoint) | Backend (direct on callback) |
| Session storage | NextAuth session | HTTP-only cookie |
| Token injection | ApiProvider + useSession | Automatic (withCredentials) |
| Frontend auth dependencies | next-auth package | None |
| Self-hosting env vars | 8 variables | 6 variables |

---

## Design Decisions

### Decision 1: HTTP-only Cookies (Not localStorage)

**Choice:** Use HTTP-only cookies for session storage.

**Rationale:**
- Browser automatically sends cookies on every request — no token management code needed
- HTTP-only prevents XSS attacks from accessing the token
- SameSite=Lax prevents CSRF while allowing navigation
- Simpler frontend code (no ApiProvider, no useSession for API calls)

**Trade-off:** Requires same-origin or proper CORS setup. Acceptable since we control both frontend and backend.

**Future compatibility:** When API consumers are needed, they will use Authorization header. The backend already supports both.

### Decision 2: Authlib (Not FastAPI-Users)

**Choice:** Use Authlib for OAuth implementation.

**Rationale:**
- FastAPI-Users is in maintenance mode (security patches only)
- Authlib is actively maintained with regular releases
- We already have user management logic in place — just need OAuth protocol handling
- Authlib is framework-agnostic and well-documented

### Decision 3: Merge Accounts by Email

**Choice:** Same email = same account, regardless of auth method.

**Rationale:**
- User signs up with email/password, later uses "Sign in with Google" with same email → same account
- This is the existing behavior in `/oauth/sync` — we maintain it
- Better UX than requiring users to remember which method they used

### Decision 4: 30-Day Cookie Expiration, No Refresh Tokens

**Choice:** Single long-lived token (30 days), no refresh token mechanism.

**Rationale:**
- Matches current NextAuth session behavior (30-day maxAge)
- Simpler implementation — no refresh token storage or rotation logic
- Acceptable security trade-off for an admin dashboard (not a banking app)
- Users re-login after 30 days or if they clear cookies

**Future:** If shorter sessions are needed, add refresh tokens later. The current design doesn't prevent this.

### Decision 5: No "Remember Me" Toggle

**Choice:** All sessions are 30 days. No shorter session option.

**Rationale:**
- YAGNI — no user has requested this
- Adds UI complexity and conditional logic
- Can be added later if needed

### Decision 6: Session Invalidation is Out of Scope

**Choice:** No "logout everywhere" functionality in this migration.

**Rationale:**
- Requires token blacklist or version tracking in database
- Significant additional complexity
- Current system doesn't have this either
- Document as future enhancement

---

## Detailed Design

### Backend Changes

#### New File: `backend/app/api/v1/auth_oauth.py`

```python
"""
OAuth authentication endpoints using Authlib.
"""
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import get_db
from app.models.user import User
from app.api.v1.auth import create_access_token

router = APIRouter()

# Initialize OAuth client
oauth = OAuth()

# Register Google provider (only if credentials are configured)
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )

# Register GitHub provider (only if credentials are configured)
if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET:
    oauth.register(
        name='github',
        client_id=settings.GITHUB_CLIENT_ID,
        client_secret=settings.GITHUB_CLIENT_SECRET,
        authorize_url='https://github.com/login/oauth/authorize',
        access_token_url='https://github.com/login/oauth/access_token',
        api_base_url='https://api.github.com/',
        client_kwargs={'scope': 'user:email'},
    )


def get_or_create_oauth_user(db: Session, email: str, name: str | None) -> User:
    """Get existing user or create new one from OAuth data."""
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            full_name=name,
            hashed_password=None,  # OAuth users don't have passwords
            is_active=True,
            is_verified=True,  # OAuth users are pre-verified
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif name and not user.full_name:
        # Update name if not already set
        user.full_name = name
        db.commit()

    return user


def set_auth_cookie(response: Response, token: str) -> Response:
    """Set HTTP-only authentication cookie."""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
        path="/",
    )
    return response


@router.get("/login/google")
async def login_google(request: Request, redirect: str = "/importers"):
    """Initiate Google OAuth login."""
    if not hasattr(oauth, 'google'):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=google_not_configured"
        )

    # Store redirect URL in session for callback
    request.session["oauth_redirect"] = redirect
    redirect_uri = str(request.url_for("auth_google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback/google", name="auth_google_callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=oauth_failed&message={str(e)}"
        )

    user_info = token.get("userinfo")

    if not user_info or not user_info.get("email"):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=oauth_no_email"
        )

    # Get or create user
    user = get_or_create_oauth_user(
        db,
        email=user_info["email"],
        name=user_info.get("name"),
    )

    # Generate JWT
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # Get redirect URL from session
    redirect_url = request.session.pop("oauth_redirect", "/importers")

    # Set cookie and redirect
    response = RedirectResponse(url=f"{settings.FRONTEND_URL}{redirect_url}")
    return set_auth_cookie(response, access_token)


@router.get("/login/github")
async def login_github(request: Request, redirect: str = "/importers"):
    """Initiate GitHub OAuth login."""
    if not hasattr(oauth, 'github'):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=github_not_configured"
        )

    request.session["oauth_redirect"] = redirect
    redirect_uri = str(request.url_for("auth_github_callback"))
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/callback/github", name="auth_github_callback")
async def auth_github_callback(request: Request, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback."""
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=oauth_failed&message={str(e)}"
        )

    # GitHub requires separate API call for user info
    resp = await oauth.github.get("user", token=token)
    user_info = resp.json()

    # GitHub may not return email in user info, need separate call
    email = user_info.get("email")
    if not email:
        resp = await oauth.github.get("user/emails", token=token)
        emails = resp.json()
        primary_email = next((e for e in emails if e.get("primary")), None)
        email = primary_email["email"] if primary_email else None

    if not email:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=oauth_no_email"
        )

    user = get_or_create_oauth_user(
        db,
        email=email,
        name=user_info.get("name") or user_info.get("login"),
    )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    redirect_url = request.session.pop("oauth_redirect", "/importers")
    response = RedirectResponse(url=f"{settings.FRONTEND_URL}{redirect_url}")
    return set_auth_cookie(response, access_token)


@router.post("/logout")
async def logout():
    """Clear authentication cookie."""
    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/signin",
        status_code=303,  # See Other - proper redirect after POST
    )
    response.delete_cookie(key="access_token", path="/")
    return response


@router.get("/logout")
async def logout_get():
    """Clear authentication cookie (GET version for simple redirects)."""
    response = RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/signin")
    response.delete_cookie(key="access_token", path="/")
    return response
```

#### Update: `backend/app/api/v1/auth.py`

Add cookie-setting to existing login endpoint:

```python
@router.post("/login")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """OAuth2 compatible token login."""
    # Find user by email
    user = db.query(UserModel).filter(UserModel.email == form_data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # Always set HTTP-only cookie for browser-based auth
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
        path="/",
    )

    # Also return token in body for compatibility
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
```

#### Update: `backend/app/auth/jwt_auth.py`

Support both cookie and header authentication:

```python
from typing import Optional, Dict, Any
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWTError

from app.core.config import settings

security = HTTPBearer(auto_error=False)


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token: Optional[str] = Cookie(default=None),
) -> Dict[str, Any]:
    """
    Verify JWT token from either Authorization header or cookie.

    Priority:
    1. Authorization: Bearer <token> header (for API consumers)
    2. access_token cookie (for browser-based auth)
    """
    token = None

    # Try Authorization header first
    if credentials:
        token = credentials.credentials
    # Fall back to cookie
    elif access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        return payload
    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Rest of the file (get_current_user_id, get_current_user, etc.) remains the same
# but uses the updated verify_token
```

#### Update: `backend/app/main.py`

Add session middleware for OAuth state and register new routes:

```python
from starlette.middleware.sessions import SessionMiddleware

# Add session middleware (required for OAuth state)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    max_age=3600,  # 1 hour for OAuth state
)

# Update CORS to allow credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register OAuth routes
from app.api.v1.auth_oauth import router as auth_oauth_router
app.include_router(auth_oauth_router, prefix="/api/v1/auth", tags=["auth"])
```

#### Update: `backend/app/core/config.py`

Add new settings:

```python
class Settings(BaseSettings):
    # ... existing settings ...

    # Frontend URL for redirects
    FRONTEND_URL: str = "http://localhost:3001"

    # Environment (affects cookie security)
    ENVIRONMENT: str = "development"

    # OAuth providers (optional - OAuth disabled if not set)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
```

### Frontend Changes

#### Delete These Files

- `admin/src/lib/auth.ts` (will be replaced)
- `admin/src/app/api/auth/[...nextauth]/route.ts`
- `admin/src/components/NextAuthProvider.tsx`
- `admin/src/components/ApiProvider.tsx`

#### New: `admin/src/lib/auth.ts` (simplified replacement)

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const signIn = {
  google: (callbackUrl = "/importers") => {
    const redirect = encodeURIComponent(callbackUrl);
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/google?redirect=${redirect}`;
  },
  github: (callbackUrl = "/importers") => {
    const redirect = encodeURIComponent(callbackUrl);
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/github?redirect=${redirect}`;
  },
  credentials: async (email: string, password: string) => {
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

    return response.json();
  },
};

export const signOut = () => {
  window.location.href = `${API_BASE_URL}/api/v1/auth/logout`;
};
```

#### New: `admin/src/hooks/useUser.ts`

```typescript
import useSWR from "swr";
import apiClient from "@/utils/apiClient";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  profile_image: string | null;
}

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<User>("/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    user: data,
    isLoading,
    isAuthenticated: !!data && !error,
    error,
    mutate,
  };
}
```

#### Update: `admin/src/utils/apiClient.ts`

```typescript
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Request interceptor (for logging, common headers, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // No need to manually add token - cookie is sent automatically
    // Add any common headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle 401, errors, etc.)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Redirect to signin on 401 (unauthorized)
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Avoid redirect loops on auth pages
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };

// Keep existing API helper methods unchanged
// (importersApi, importsApi, etc.)
```

#### Update: `admin/src/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Allow auth pages (signin, signup, error)
  if (pathname.startsWith("/auth")) {
    // If already authenticated, redirect to importers
    if (token && pathname === "/auth/signin") {
      return NextResponse.redirect(new URL("/importers", request.url));
    }
    return NextResponse.next();
  }

  // Allow API routes (handled by backend)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Redirect to signin if no token
  if (!token) {
    const signinUrl = new URL("/auth/signin", request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - ingest (analytics)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|ingest|.*\\..*$).*)",
  ],
};
```

#### Update: `admin/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ImportCSV Admin",
  description: "Manage your CSV importers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

#### Update: `admin/src/app/auth/signin/page.tsx`

```tsx
"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { signIn } from "@/lib/auth";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/importers";
  const error = searchParams.get("error");
  const errorMessage = searchParams.get("message");
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Show error from OAuth callback
  useEffect(() => {
    if (error) {
      const messages: Record<string, string> = {
        oauth_failed: "OAuth authentication failed. Please try again.",
        oauth_no_email: "Could not retrieve email from provider.",
        google_not_configured: "Google sign-in is not configured.",
        github_not_configured: "GitHub sign-in is not configured.",
      };
      toast({
        title: "Authentication Error",
        description: messages[error] || errorMessage || "An error occurred",
        variant: "destructive",
      });
    }
  }, [error, errorMessage, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn.credentials(email, password);
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn.google(callbackUrl)}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn.github(callbackUrl)}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
```

---

## Migration Plan

Each phase includes explicit testing gates that must pass before proceeding to the next phase. This ensures we don't break existing functionality while adding new capabilities.

### Phase 1: Backend Preparation (No Breaking Changes)

**Goal:** Add new auth endpoints while keeping existing auth working.

**Duration:** Backend changes only, can be deployed independently.

#### 1.1 Dependencies & Configuration
- Add `authlib`, `itsdangerous` to `requirements.txt`
- Add `FRONTEND_URL`, `ENVIRONMENT` to `backend/app/core/config.py`
- Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` to config (all optional)

#### 1.2 Session Middleware
- Add `SessionMiddleware` to `backend/app/main.py`
- Ensure CORS allows credentials from `FRONTEND_URL`

#### 1.3 JWT Verification Update
- Update `backend/app/auth/jwt_auth.py` to support both cookie and header auth
- **Critical:** Header-based auth must continue to work exactly as before

#### 1.4 New OAuth Endpoints
- Create `backend/app/api/v1/auth_oauth.py` with:
  - `GET /auth/login/google`
  - `GET /auth/callback/google`
  - `GET /auth/login/github`
  - `GET /auth/callback/github`
  - `GET /auth/logout`
  - `POST /auth/logout`

#### 1.5 Login Endpoint Update
- Update `backend/app/api/v1/auth.py` to set cookie on login

#### Phase 1 Testing Gate

**Run before proceeding to Phase 2:**

```bash
# All existing tests must pass (regression check)
cd backend && pytest tests/ -v

# Verify header-based auth still works
curl -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=test@example.com&password=testpass" \
  -H "Content-Type: application/x-www-form-urlencoded"

# Verify new OAuth endpoints exist
curl -I http://localhost:8000/api/v1/auth/login/google
# Should return 302 redirect to Google (or error if not configured)
```

| Test | Type | Must Pass |
|------|------|-----------|
| Existing header-based auth works | Regression | ✓ |
| Cookie-based auth works | Unit | ✓ |
| Both cookie and header work simultaneously | Integration | ✓ |
| OAuth login redirects correctly | Unit | ✓ |
| OAuth callback creates user | Integration | ✓ |
| OAuth callback sets cookie | Integration | ✓ |
| Logout clears cookie | Unit | ✓ |

---

### Phase 2: Frontend Migration

**Goal:** Switch frontend from NextAuth to direct backend calls.

#### 2.1 Add New Files First (No Deletions Yet)
- Create `admin/src/hooks/useUser.ts`
- Create new `admin/src/lib/auth-new.ts` (temporary name)

#### 2.2 Update apiClient
- Add `withCredentials: true` to axios config
- Add request/response interceptors
- Keep existing token getter as fallback (temporary)

#### 2.3 Update Pages to Use New Auth
- Update `admin/src/app/auth/signin/page.tsx` to use new auth helpers
- Update `admin/src/app/auth/signup/page.tsx` to use new auth helpers

#### 2.4 Update Middleware
- Update `admin/src/middleware.ts` to check cookie instead of NextAuth

#### 2.5 Update Layout
- Update `admin/src/app/layout.tsx` to remove providers

#### 2.6 Update Components Using useSession
Replace `useSession` with `useUser` in:
- `admin/src/app/page.tsx`
- `admin/src/app/importers/layout.tsx`
- `admin/src/app/importers/page.tsx`
- `admin/src/app/importers/new/page.tsx`
- `admin/src/app/importers/[id]/preview/page.tsx`

#### 2.7 Remove Old Files
- Delete `admin/src/app/api/auth/[...nextauth]/route.ts`
- Delete `admin/src/components/NextAuthProvider.tsx`
- Delete `admin/src/components/ApiProvider.tsx`
- Delete old `admin/src/lib/auth.ts`
- Rename `admin/src/lib/auth-new.ts` to `admin/src/lib/auth.ts`

#### 2.8 Remove next-auth Package
- Run `npm uninstall next-auth`

#### Phase 2 Testing Gate

**Run before proceeding to Phase 3:**

```bash
# Backend tests still pass
cd backend && pytest tests/ -v

# Frontend builds without errors
cd admin && npm run build

# TypeScript check
cd admin && npm run typecheck
```

**Manual E2E Testing Checklist:**

| Test | Steps | Expected |
|------|-------|----------|
| Credentials login | Enter email/password, click Sign In | Redirect to /importers |
| Google OAuth | Click "Continue with Google" | Redirect to Google → back to /importers |
| GitHub OAuth | Click "Continue with GitHub" | Redirect to GitHub → back to /importers |
| Invalid credentials | Enter wrong password | Error toast shown |
| Protected route redirect | Visit /importers without cookie | Redirect to /auth/signin |
| Logout | Click logout in user menu | Redirect to /auth/signin, cookie cleared |
| API calls | Navigate around app | No 401 errors, data loads |

---

### Phase 3: Cleanup & Verification

**Goal:** Remove deprecated code and verify complete functionality.

#### 3.1 Backend Cleanup
- Remove `oauth/sync` endpoint from `backend/app/api/v1/auth.py`
- Remove `NEXTAUTH_SECRET` from config (use only `SECRET_KEY`)

#### 3.2 Configuration Cleanup
- Update `docker-compose.yml` to remove NextAuth env vars
- Update deployment configs (Railway, Vercel, etc.)
- Update `.env.example` files in both admin and backend

#### 3.3 Documentation
- Update README with new auth setup
- Update self-hosting documentation

#### Phase 3 Testing Gate

**Final verification before merge:**

```bash
# Full backend test suite
cd backend && pytest tests/ -v --cov=app

# Full frontend build
cd admin && npm run build
```

| Test | Type | Must Pass |
|------|------|-----------|
| All backend tests pass | Full Suite | ✓ |
| Frontend builds without errors | Build | ✓ |
| Full auth flow E2E | Manual | ✓ |
| Fresh install works with new config | Integration | ✓ |
| Docker compose up works | Integration | ✓ |

---

## Files Changed

### Backend (New/Modified)

| File | Change |
|------|--------|
| `backend/requirements.txt` | Add `authlib`, `itsdangerous` |
| `backend/app/main.py` | Add session middleware, update CORS, register OAuth routes |
| `backend/app/api/v1/auth_oauth.py` | **NEW** - OAuth endpoints |
| `backend/app/api/v1/auth.py` | Add cookie support to login, remove oauth/sync (Phase 3) |
| `backend/app/auth/jwt_auth.py` | Support cookie + header auth |
| `backend/app/core/config.py` | Add `FRONTEND_URL`, `ENVIRONMENT`, OAuth settings |

### Frontend (Deleted)

| File | Reason |
|------|--------|
| `admin/src/lib/auth.ts` | Replaced with simpler version |
| `admin/src/app/api/auth/[...nextauth]/route.ts` | No longer needed |
| `admin/src/components/NextAuthProvider.tsx` | No longer needed |
| `admin/src/components/ApiProvider.tsx` | No longer needed |

### Frontend (Modified)

| File | Change |
|------|--------|
| `admin/package.json` | Remove `next-auth` |
| `admin/src/utils/apiClient.ts` | Add `withCredentials`, add interceptors |
| `admin/src/middleware.ts` | Simplified cookie check |
| `admin/src/app/layout.tsx` | Remove providers |
| `admin/src/app/auth/signin/page.tsx` | Use new auth helpers |
| `admin/src/app/auth/signup/page.tsx` | Use new auth helpers |
| `admin/src/app/page.tsx` | Replace useSession with useUser |
| `admin/src/app/importers/layout.tsx` | Replace useSession with useUser |
| `admin/src/app/importers/page.tsx` | Replace useSession with useUser |
| `admin/src/app/importers/new/page.tsx` | Replace useSession with useUser |
| `admin/src/app/importers/[id]/preview/page.tsx` | Replace useSession with useUser |

### Frontend (New)

| File | Purpose |
|------|---------|
| `admin/src/hooks/useUser.ts` | SWR-based user hook |
| `admin/src/lib/auth.ts` | Simple auth helpers (signIn, signOut) |

---

## Configuration Changes

### Before (Current)

```bash
# Frontend (admin/.env.local) - 7 variables
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_ID=xxx
GITHUB_SECRET=xxx

# Backend (.env) - 3 variables
SECRET_KEY=your-secret
NEXTAUTH_SECRET=your-secret  # Duplicate!
DATABASE_URL=...
```

### After (Proposed)

```bash
# Frontend (admin/.env.local) - 1 variable
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Backend (.env) - 7 variables (but all in one place)
SECRET_KEY=your-secret
FRONTEND_URL=http://localhost:3001
ENVIRONMENT=development
DATABASE_URL=...
GOOGLE_CLIENT_ID=xxx      # Optional
GOOGLE_CLIENT_SECRET=xxx  # Optional
GITHUB_CLIENT_ID=xxx      # Optional
GITHUB_CLIENT_SECRET=xxx  # Optional
```

**Net effect:**
- Frontend: 7 → 1 variable
- Backend: 3 → 7 variables (but OAuth credentials moved here from frontend)
- Total: 10 → 8 variables
- No more duplication of secrets

---

## Security Considerations

### Cookie Security

| Setting | Value | Purpose |
|---------|-------|---------|
| `httponly` | `True` | Prevents XSS attacks from accessing token via JavaScript |
| `secure` | `True` (production) | Only sent over HTTPS |
| `samesite` | `lax` | Prevents CSRF while allowing top-level navigation |
| `path` | `/` | Cookie available to all routes |
| `max_age` | 30 days | Session duration |

### CORS Configuration

Backend must allow credentials from frontend origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### OAuth State Protection

Authlib handles CSRF protection for OAuth flows via:
- State parameter generated and stored in session
- State verified on callback before exchanging code for token

### Existing Sessions

**Important:** Existing NextAuth sessions will not work after migration. Users will need to re-login. This is acceptable because:
- It's a one-time event
- Sessions are already ephemeral (30-day expiry)
- No data loss — just need to re-authenticate

---

## Testing Strategy

### Backend Unit Tests

Create `backend/tests/unit/test_auth/test_cookie_auth.py`:

```python
@pytest.mark.asyncio
async def test_verify_token_from_cookie():
    """Test that tokens can be verified from cookies."""
    # ... test implementation

@pytest.mark.asyncio
async def test_header_takes_precedence_over_cookie():
    """Test that Authorization header is preferred over cookie."""
    # ... test implementation

@pytest.mark.asyncio
async def test_missing_token_returns_401():
    """Test that missing token raises 401."""
    # ... test implementation
```

### Backend Integration Tests

Create `backend/tests/integration/test_api/test_auth_oauth.py`:

```python
def test_login_sets_cookie(client, test_user):
    """Test that login endpoint sets cookie."""
    response = client.post("/api/v1/auth/login", data={...})
    assert "access_token" in response.cookies

def test_api_works_with_cookie(client, test_user):
    """Test that API endpoints work with cookie auth."""
    # Login first
    login_response = client.post("/api/v1/auth/login", data={...})
    # Use cookie for subsequent request
    response = client.get("/api/v1/auth/me", cookies=login_response.cookies)
    assert response.status_code == 200
```

### Frontend Tests

Create `admin/__tests__/hooks/useUser.test.ts`:

```typescript
describe("useUser hook", () => {
  it("returns user data when authenticated", async () => { ... });
  it("returns isAuthenticated false when API fails", async () => { ... });
});
```

### E2E Tests (Manual or Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Full credentials flow | Sign up → Sign in → Use app → Sign out | Works end-to-end |
| Full OAuth flow | Sign in with Google → Use app → Sign out | Works end-to-end |
| Session persistence | Sign in → Close browser → Reopen | Still authenticated |
| Session expiry | Set short expiry → Wait → Try to use app | Redirected to signin |

---

## Rollback Plan

If issues arise after deployment:

### Immediate Rollback (Phase 2 deployed, issues found)

1. Revert frontend changes (git revert)
2. Redeploy frontend with NextAuth
3. Backend changes are additive — no backend revert needed
4. Cookie-based auth will be ignored, header-based auth works

### Partial Rollback (Keep backend, fix frontend)

1. Keep backend OAuth endpoints
2. Fix frontend issues
3. Redeploy frontend

### Key Points

- Backend changes in Phase 1 are additive — they don't break existing auth
- Frontend is the only "breaking" change
- Cookie auth and header auth work simultaneously during transition
- If frontend breaks, revert frontend only

---

## Future Considerations

These items are explicitly out of scope for this migration but documented for future reference:

### Token Refresh (Future)

If 30-day sessions become a security concern:
1. Add refresh token endpoint
2. Store refresh tokens in database
3. Add refresh logic to frontend apiClient
4. Shorten access token expiry to 15 minutes

### Session Invalidation (Future)

To implement "logout everywhere":
1. Add `token_version` column to User model
2. Include version in JWT payload
3. Check version on each request
4. Increment version on logout-all

### API Keys for External Consumers (Future)

When API consumers are needed:
1. Add API key model to database
2. Create API key management UI
3. Backend already supports header auth — just add key validation

### Additional OAuth Providers (Future)

To add more providers (Apple, Microsoft, etc.):
1. Add client credentials to config
2. Register provider in `auth_oauth.py`
3. Add login/callback endpoints
4. Add button to signin page

---

## References

- [Authlib Documentation](https://docs.authlib.org/en/latest/)
- [Authlib Starlette Integration](https://docs.authlib.org/en/latest/client/starlette.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [HTTP Cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)
