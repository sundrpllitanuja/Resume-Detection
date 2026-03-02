import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getStatistics, getAnalyses } from "../api";

function StatCard({ label, value, sub, color, bg, icon, trend }) {
  return (
    <div style={{
      background: "var(--white)", border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)", padding: "22px 24px",
      boxShadow: "var(--shadow-sm)", flex: 1, minWidth: 160,
      animation: "fadeUp 0.4s ease both",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: bg,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 600, color, padding: "3px 8px",
            borderRadius: 40, background: bg }}>
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

function QuickAction({ icon, title, desc, color, bg, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, padding: "20px", borderRadius: "var(--r-lg)", cursor: "pointer",
        background: hov ? bg : "var(--white)",
        border: `1.5px solid ${hov ? color+"44" : "var(--border)"}`,
        boxShadow: hov ? `0 8px 24px ${color}18` : "var(--shadow-sm)",
        transition: "all 0.2s", animation: "fadeUp 0.4s ease both",
      }}>
      <div style={{ width: 42, height: 42, borderRadius: "var(--r-md)", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 20 }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function RiskBadge({ score }) {
  if (score < 40) return <span style={{ padding: "3px 10px", borderRadius: 40, fontSize: 11, fontWeight: 700,
    background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger-border)" }}>HIGH RISK</span>;
  if (score < 65) return <span style={{ padding: "3px 10px", borderRadius: 40, fontSize: 11, fontWeight: 700,
    background: "var(--warning-bg)", color: "var(--warning)", border: "1px solid var(--warning-border)" }}>MEDIUM</span>;
  return <span style={{ padding: "3px 10px", borderRadius: 40, fontSize: 11, fontWeight: 700,
    background: "var(--success-bg)", color: "var(--success)", border: "1px solid var(--success-border)" }}>VERIFIED</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStatistics(), getAnalyses()])
      .then(([s, a]) => { setStats(s.data.statistics); setRecent(a.data.analyses.slice(0, 6)); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding: "36px 36px 48px" }}>
      {/* header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--blue)", marginBottom: 6 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
              {greeting}, {user?.username?.split(" ")[0]} 👋
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Here's your fraud detection overview for today.
            </p>
          </div>
          <button onClick={() => navigate("/analyzer")} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "11px 20px",
            background: "var(--blue)", color: "white", border: "none",
            borderRadius: "var(--r-md)", fontSize: 13.5, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(37,99,235,0.3)", cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--blue)"; e.currentTarget.style.transform = "none"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Analyze Resume
          </button>
        </div>
      </div>

      {/* stats */}
      {loading ? (
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          {[...Array(4)].map((_,i) => (
            <div key={i} style={{ flex:1, height:140, borderRadius:"var(--r-lg)", background:"var(--slate-pale)", animation:"shimmer 1.5s ease infinite" }}/>
          ))}
        </div>
      ) : stats ? (
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="Total Analyzed" value={stats.total_analyzed} sub="all time" icon="📋" color="var(--blue)" bg="var(--blue-pale)" trend={`+${stats.total_analyzed}`}/>
          <StatCard label="Fraudulent" value={stats.fraudulent_detected} sub="flagged for review" icon="⚠️" color="var(--danger)" bg="var(--danger-bg)" trend={`${stats.detection_rate}%`}/>
          <StatCard label="Legitimate" value={stats.legitimate} sub="passed verification" icon="✅" color="var(--success)" bg="var(--success-bg)"/>
          <StatCard label="Avg Score" value={stats.average_fraud_score} sub="legitimacy score / 100" icon="📊" color="var(--slate)" bg="var(--slate-pale)"/>
        </div>
      ) : null}

      {/* quick actions */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Quick Actions</h2>
      <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
        <QuickAction icon="🔍" title="Analyze New Resume" desc="Upload a PDF or paste resume text for instant fraud detection." color="var(--blue)" bg="var(--blue-pale)" onClick={() => navigate("/analyzer")}/>
        <QuickAction icon="📁" title="View All Results" desc="Browse and search through all past resume analyses." color="#7c3aed" bg="#f5f3ff" onClick={() => navigate("/results")}/>
        <QuickAction icon="📈" title="Analytics Report" desc="View charts, trends and fraud pattern breakdowns." color="var(--success)" bg="var(--success-bg)" onClick={() => navigate("/analytics")}/>
      </div>

      {/* recent analyses */}
      <div style={{ background: "var(--white)", borderRadius: "var(--r-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Recent Analyses</h2>
          <button onClick={() => navigate("/results")} style={{
            fontSize: 12, fontWeight: 600, color: "var(--blue)", background: "none",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          }}>View all <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No analyses yet. <button onClick={() => navigate("/analyzer")} style={{ color: "var(--blue)", background: "none", border: "none", fontWeight: 600, cursor: "pointer" }}>Analyze your first resume →</button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Candidate", "Email", "Score", "Risk Level", "Date"].map(h => (
                  <th key={h} style={{ padding: "10px 22px", textAlign: "left", fontSize: 11,
                    fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < recent.length-1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--off-white)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 22px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{a.candidate_name || "—"}</div>
                  </td>
                  <td style={{ padding: "14px 22px" }}>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{a.email || "—"}</div>
                  </td>
                  <td style={{ padding: "14px 22px" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: a.fraud_score < 40 ? "var(--danger)" : a.fraud_score < 65 ? "var(--warning)" : "var(--success)" }}>
                      {a.fraud_score?.toFixed(0)}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>/100</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 22px" }}><RiskBadge score={a.fraud_score}/></td>
                  <td style={{ padding: "14px 22px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(a.created_at).toLocaleDateString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}