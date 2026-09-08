import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/", label: "Shopping", end: true },
  { to: "/expenses", label: "Expenses" },
  { to: "/medications", label: "Medications" },
  { to: "/kepa", label: "ΚΕΠΑ procedure" },
  { to: "/pension", label: "Σύνταξη & Επίδομα" },
  { to: "/medical-exams", label: "Medical exams" },
];

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className="w-56 shrink-0 border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-semibold text-teal-accent tracking-wide">Frieda</h1>
        </div>
        <nav className="flex-1 py-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-5 py-2 text-sm ${
                  isActive
                    ? "text-teal-accent bg-slate-800 border-r-2 border-teal-accent"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-500">
          <p className="truncate mb-2">{user?.email}</p>
          <button className="btn-secondary w-full" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-4xl">
        <Outlet />
      </main>
    </div>
  );
}
