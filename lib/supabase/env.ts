export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

export const isSupabaseEnabled = Boolean(supabaseEnv.url && supabaseEnv.anonKey);
