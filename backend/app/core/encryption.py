"""Credential encryption utilities using Fernet symmetric encryption."""
import json
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


def _get_fernet() -> Fernet:
    """Get Fernet instance using app secret key."""
    # Derive a valid Fernet key from SECRET_KEY (must be 32 url-safe base64-encoded bytes)
    # Hash the secret key to get consistent 32 bytes
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_credentials(credentials: dict) -> str:
    """Encrypt credentials dictionary to a string."""
    fernet = _get_fernet()
    json_bytes = json.dumps(credentials).encode('utf-8')
    encrypted = fernet.encrypt(json_bytes)
    return encrypted.decode('utf-8')


def decrypt_credentials(encrypted: str) -> dict:
    """Decrypt credentials string back to dictionary."""
    fernet = _get_fernet()
    try:
        decrypted_bytes = fernet.decrypt(encrypted.encode('utf-8'))
        return json.loads(decrypted_bytes.decode('utf-8'))
    except InvalidToken as e:
        raise ValueError("Invalid encrypted credentials") from e
