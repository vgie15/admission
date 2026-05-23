import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseClient:
    _instance = None
    
    @staticmethod
    def get_instance() -> Client:
        if SupabaseClient._instance is None:
            url = os.getenv('SUPABASE_URL')
            key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')
            if not url or not key:
                raise RuntimeError('SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_KEY must be set')
            SupabaseClient._instance = create_client(url, key)
        return SupabaseClient._instance

def get_supabase() -> Client:
    return SupabaseClient.get_instance()
