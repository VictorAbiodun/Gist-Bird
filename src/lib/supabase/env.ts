export const supabaseEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anon ? { url, anon } : null;
};
export const allowedDomains = (): string[] =>
  (process.env.ALLOWED_EMAIL_DOMAINS ?? '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
