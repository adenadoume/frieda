import { useUser, SignInButton, useClerk } from "@clerk/clerk-react";
import { useAllowed } from "../hooks/useAllowed";

export default function Login() {
  const { isSignedIn, user } = useUser();
  const { allowed } = useAllowed();
  const { signOut } = useClerk();

  const deniedButSignedIn = isSignedIn && allowed === false;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-teal-accent tracking-wide mb-1">Frieda</h1>
        <p className="text-slate-400 text-sm mb-8">Care &amp; household — shared with family</p>

        <div className="card p-8 space-y-4">
          {deniedButSignedIn ? (
            <>
              <p className="text-red-400 text-sm">
                Signed in as {user.primaryEmailAddress?.emailAddress}, but this account isn't on the allowed list.
                Ask for it to be added.
              </p>
              <button className="btn-secondary w-full" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <SignInButton mode="redirect" forceRedirectUrl="/">
              <button className="btn-primary w-full">Sign in with Google</button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}
