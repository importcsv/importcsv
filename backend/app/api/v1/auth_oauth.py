"""
OAuth authentication endpoints using Authlib.
Supports Google and GitHub providers.
"""
import logging
import uuid
from urllib.parse import urlparse

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import get_db
from app.models.user import User
from app.api.v1.auth import create_access_token, set_auth_cookie

logger = logging.getLogger(__name__)

# Allowed redirect paths (prevent open redirect vulnerability)
ALLOWED_REDIRECT_PATHS = {"/dashboard", "/settings", "/imports", "/importers", "/api-keys"}


def validate_redirect(redirect: str) -> str:
    """Validate redirect is a safe internal path."""
    parsed = urlparse(redirect)
    # Must be relative path (no scheme/netloc)
    if parsed.scheme or parsed.netloc:
        logger.warning(f"Blocked absolute URL redirect attempt: {redirect}")
        return "/dashboard"
    # Must start with / and be in allowed list or be a subpath
    if not redirect.startswith("/"):
        return "/dashboard"
    # Check if it's an allowed path or starts with an allowed prefix
    for allowed in ALLOWED_REDIRECT_PATHS:
        if redirect == allowed or redirect.startswith(allowed + "/"):
            return redirect
    logger.warning(f"Blocked non-whitelisted redirect: {redirect}")
    return "/dashboard"

router = APIRouter()

# Initialize OAuth client
oauth = OAuth()

# Register Google provider (only if credentials are configured)
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

# Register GitHub provider (only if credentials are configured)
if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET:
    oauth.register(
        name="github",
        client_id=settings.GITHUB_CLIENT_ID,
        client_secret=settings.GITHUB_CLIENT_SECRET,
        authorize_url="https://github.com/login/oauth/authorize",
        access_token_url="https://github.com/login/oauth/access_token",
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "user:email"},
    )


def get_or_create_oauth_user(
    db: Session,
    email: str,
    name: str | None,
    profile_image: str | None = None,
) -> User:
    """Get existing user or create new one from OAuth data."""
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=name,
            hashed_password=None,  # OAuth users don't have passwords
            is_active=True,
            is_verified=True,  # OAuth users are pre-verified
            profile_image=profile_image,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new OAuth user: {user.id}")
    else:
        # Update profile info if not set (batch updates for atomicity)
        updated = False
        if profile_image and not user.profile_image:
            user.profile_image = profile_image
            updated = True
        if name and not user.full_name:
            user.full_name = name
            updated = True
        if updated:
            db.commit()
            logger.debug(f"Updated OAuth user profile: {user.id}")

    return user


# --- Google OAuth ---


@router.get("/login/google")
async def login_google(request: Request, redirect: str = "/dashboard"):
    """Initiate Google OAuth login."""
    if not hasattr(oauth, "google"):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=google_not_configured"
        )

    # Validate and store redirect URL in session for callback
    request.session["oauth_redirect"] = validate_redirect(redirect)
    redirect_uri = str(request.url_for("auth_google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback/google", name="auth_google_callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error(f"Google OAuth failed: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=oauth_failed"
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
        profile_image=user_info.get("picture"),
    )

    # Generate JWT
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # Get redirect URL from session
    redirect_url = request.session.pop("oauth_redirect", "/dashboard")

    # Set cookie and redirect
    response = RedirectResponse(url=f"{settings.FRONTEND_URL}{redirect_url}")
    set_auth_cookie(response, access_token)
    return response


# --- GitHub OAuth ---


@router.get("/login/github")
async def login_github(request: Request, redirect: str = "/dashboard"):
    """Initiate GitHub OAuth login."""
    if not hasattr(oauth, "github"):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=github_not_configured"
        )

    # Validate and store redirect URL in session for callback
    request.session["oauth_redirect"] = validate_redirect(redirect)
    redirect_uri = str(request.url_for("auth_github_callback"))
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/callback/github", name="auth_github_callback")
async def auth_github_callback(request: Request, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback."""
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        logger.error(f"GitHub OAuth failed: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/signin?error=oauth_failed"
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
        profile_image=user_info.get("avatar_url"),
    )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    redirect_url = request.session.pop("oauth_redirect", "/dashboard")
    response = RedirectResponse(url=f"{settings.FRONTEND_URL}{redirect_url}")
    set_auth_cookie(response, access_token)
    return response


# --- Provider availability check ---


@router.get("/providers")
async def get_available_providers():
    """Return which OAuth providers are configured."""
    return {
        "google": hasattr(oauth, "google"),
        "github": hasattr(oauth, "github"),
    }
