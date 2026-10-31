/**
 * Opulia Supabase Environment Configuration
 * 
 * This file provides the client-side configuration for Supabase.
 * - When served over HTTP/HTTPS (e.g. Live Server, local dev server, production host),
 *   it will automatically read NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.
 * - If running locally via file:// protocol or without a server, you can also fill in
 *   the credentials directly below.
 * 
 * SECURITY NOTE:
 * Exclusively use the Supabase ANON public key. NEVER expose the service_role secret key!
 */

window.ENV_SUPABASE_URL = window.ENV_SUPABASE_URL || '';
window.ENV_SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || '';

(function initSupabaseEnv() {
    // If keys are already configured, do nothing
    if (window.ENV_SUPABASE_URL && window.ENV_SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
        window.ENV_SUPABASE_ANON_KEY && window.ENV_SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        return;
    }

    // Try fetching .env when running on HTTP/HTTPS
    if (typeof fetch === 'function' && window.location.protocol.startsWith('http')) {
        fetch('.env')
            .then(function(res) {
                if (!res.ok) return '';
                return res.text();
            })
            .then(function(text) {
                if (!text) return;
                var lines = text.split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line || line.startsWith('#')) continue;
                    var eqIdx = line.indexOf('=');
                    if (eqIdx === -1) continue;
                    var key = line.slice(0, eqIdx).trim();
                    var val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');

                    if (key === 'NEXT_PUBLIC_SUPABASE_URL' && val && val !== 'YOUR_SUPABASE_PROJECT_URL') {
                        window.ENV_SUPABASE_URL = val;
                    }
                    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && val && val !== 'YOUR_SUPABASE_ANON_KEY') {
                        window.ENV_SUPABASE_ANON_KEY = val;
                    }
                }
            })
            .catch(function(err) {
                // Ignore errors fetching .env directly
            });
    }
})();

