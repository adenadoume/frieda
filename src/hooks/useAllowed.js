import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "./useSupabaseClient";

// App-level gate on top of RLS: is this signed-in Clerk user's email in
// Supabase's allowed_users table? (RLS itself already enforces the same
// thing on every query — this just lets the UI show a clean "not allowed"
// screen instead of empty tables.)
//
// allowed_users has RLS enabled with NO client-facing policies (see
// supabase/migrations/0001_init.sql), so we can't just .from("allowed_users")
// .select() — nothing is granted to select there directly. Instead we call
// the same security-definer is_allowed_user() function the RLS policies use.
export function useAllowed() {
  const { user, isLoaded: userLoaded } = useUser();
  const supabase = useSupabaseClient();
  const [allowed, setAllowed] = useState(null); // null = unknown/loading

  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  useEffect(() => {
    if (!userLoaded) return;
    if (!email) {
      setAllowed(null);
      return;
    }
    supabase.rpc("is_allowed_user").then(({ data, error }) => {
      setAllowed(error ? false : Boolean(data));
    });
  }, [userLoaded, email, supabase]);

  return { allowed, loading: !userLoaded || (email && allowed === null) };
}
