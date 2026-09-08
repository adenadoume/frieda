import { useMemo } from "react";
import { useSession } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables — check .env");
}

// Supabase's official Clerk integration: instead of Supabase's own auth,
// every request carries Clerk's session JWT via this accessToken callback.
// RLS's is_allowed_user() reads auth.jwt()->>'email' out of that token —
// see README for the Clerk "session token → add email claim" step this
// depends on.
export function useSupabaseClient() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(supabaseUrl, supabaseKey, {
      accessToken: async () => session?.getToken() ?? null,
    });
  }, [session]);
}
