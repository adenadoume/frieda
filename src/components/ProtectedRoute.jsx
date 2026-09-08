import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useAllowed } from "../hooks/useAllowed";

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const { allowed, loading } = useAllowed();

  if (!isLoaded || (isSignedIn && loading)) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading…</div>;
  }

  if (!isSignedIn || allowed !== true) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
