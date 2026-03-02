import hashlib
import hmac
import secrets
from app.core.config import settings

def generate_raw_api_key() -> str:
    
    token = secrets.token_urlsafe(32)
    return f"wk_live{token}"

def api_key_prefix(raw_key: str, n: int = 10) -> str:
    return raw_key[:n]

def hash_api_key(raw_key: str, pepper: str | None = None) -> str:
    secret = settings.API_KEY_HMAC_SECRET.encode("utf-8")
    msg = raw_key.encode("utf-8")
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()


def safe_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(a, b)
