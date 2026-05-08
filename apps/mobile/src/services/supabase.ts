import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Variáveis EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY não encontradas. ' +
      'Crie um arquivo .env em apps/mobile/ baseado no .env.example.',
  );
}

// Cliente único compartilhado por todo o app.
// Em web, supabase-js usa localStorage automaticamente para guardar a sessão.
// Em mobile, depois trocamos para expo-secure-store.
export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
