# backend/tests/unit/test_core/test_encryption.py
import pytest
from app.core.encryption import encrypt_credentials, decrypt_credentials


@pytest.mark.unit
def test_encrypt_decrypt_roundtrip():
    """Test that encryption and decryption are reversible."""
    original = {"url": "https://example.supabase.co", "service_key": "secret123"}
    encrypted = encrypt_credentials(original)
    decrypted = decrypt_credentials(encrypted)
    assert decrypted == original


@pytest.mark.unit
def test_encrypted_value_is_different():
    """Test that encrypted value differs from original."""
    original = {"url": "https://example.supabase.co", "service_key": "secret123"}
    encrypted = encrypt_credentials(original)
    assert encrypted != str(original)
    assert "secret123" not in encrypted


@pytest.mark.unit
def test_decrypt_invalid_raises():
    """Test that decrypting invalid data raises an error."""
    with pytest.raises(Exception):
        decrypt_credentials("not-valid-encrypted-data")
