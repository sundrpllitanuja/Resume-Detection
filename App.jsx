import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import HRAuth    from "./pages/HRAuth";
import Dashboard from "./pages/Dashboard";
import Analyzer  from "./pages/Analyzer";
import Results   from "./pages/Results";
import Analytics from "./pages/Analytics";

const NAV = [
  { path: "/dashboard", label: "Dashboard",      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { path: "/analyzer",  label: "Analyze Resume", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { path: "/results",   label: "All Results",    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { path: "/analytics", label: "Analytics",      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
];

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function Sidebar() {
  const { user, logout } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || "H";
  return (
    <aside style={{
      width: 252, flexShrink: 0, height: "100vh",
      background: "var(--white)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      boxShadow: "2px 0 8px rgba(15,37,84,0.04)",
    }}>
      {/* logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, var(--blue) 0%, var(--navy) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="white" fillOpacity="0.95"/>
              <path d="M9 12l2 2 4-4" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>FraudDetect</div>
            <div style={{ fontSize: 10, color: "var(--slate-light)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>HR Portal</div>
          </div>
        </div>
      </div>

      {/* nav label */}
      <div style={{ padding: "20px 20px 8px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--slate-light)" }}>Main Menu</span>
      </div>

      {/* nav items */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ path, label, icon }) => (
          <NavLink key={path} to={path} style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: "var(--r-md)",
            textDecoration: "none", fontSize: 13.5, fontWeight: isActive ? 700 : 500,
            transition: "all 0.15s",
            background: isActive ? "var(--blue-pale)" : "transparent",
            color: isActive ? "var(--blue)" : "var(--slate)",
            borderLeft: isActive ? "3px solid var(--blue)" : "3px solid transparent",
          })}>
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* user panel */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: "var(--r-md)",
          background: "var(--slate-pale)", marginBottom: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, var(--blue-light), var(--navy-mid))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 800, fontSize: 13,
          }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username}</div>
            <div style={{ fontSize: 10, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{
          width: "100%", padding: "9px 12px", borderRadius: "var(--r-md)",
          border: "1px solid var(--border)", background: "transparent",
          display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
          fontSize: 13, fontWeight: 600, color: "var(--slate)", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-bg)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger-border)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--slate)"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

function Layout() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", background: "var(--off-white)" }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyzer"  element={<Analyzer />} />
          <Route path="/results"   element={<Results />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HRAuth />} />
      <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}