from supabase import create_client, Client
from app.core.config import settings

_supabase: Client | None = None

def get_supabase() -> Client:
    global _supabase
    
    if _supabase is None:
        
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            
            raise RuntimeError("Supabase config missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
    return _supabase