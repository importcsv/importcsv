from pydantic import BaseModel, EmailStr

class TokenResponse(BaseModel):
    """Schema for token response containing access and refresh tokens"""
    access_token: str
    refresh_token: str
    token_type: str


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Schema for password reset request"""
    email: EmailStr
