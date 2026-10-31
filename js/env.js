/**
 * Opulia Supabase Public Client Configuration
 * 
 * SECURITY NOTE:
 * Exclusively uses the public 'anon' / publishable key.
 * All database operations are secured by Supabase Row Level Security (RLS) and stored procedures.
 * NEVER expose the secret 'service_role' key here!
 */

window.ENV_SUPABASE_URL = window.ENV_SUPABASE_URL || 'https://dzfnvsmzbwxjcpctkics.supabase.co';
window.ENV_SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || 'sb_publishable_PIg-TnGs_BtmEKzxus2Ahw_HZpRTmKj';
