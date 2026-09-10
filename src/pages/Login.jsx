import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { signInWithGoogle, session, allowed } = useAuth();

  const deniedButSignedIn = session && allowed === false;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-teal-accent tracking-wide mb-1">Frieda</h1>
        <p className="text-slate-400 text-sm mb-8">Care &amp; household — shared with family</p>

        <div className="card p-8 space-y-4">
          {deniedButSignedIn ? (
            <p className="text-red-400 text-sm">
              Signed in as {session.user.email}, but this account isn't on the allowed list.
              Ask for it to be added.
            </p>
          ) : (
            <button className="btn-primary w-full" onClick={signInWithGoogle}>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
