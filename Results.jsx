import { useEffect, useState } from "react";
import { getAnalyses } from "../api";

function RiskBadge({ score }) {
  if (score < 40) return (
    <span style={{ padding:"3px 10px", borderRadius:40, fontSize:11, fontWeight:700,
      background:"var(--danger-bg)", color:"var(--danger)", border:"1px solid var(--danger-border)" }}>HIGH RISK</span>
  );
  if (score < 65) return (
    <span style={{ padding:"3px 10px", borderRadius:40, fontSize:11, fontWeight:700,
      background:"var(--warning-bg)", color:"var(--warning)", border:"1px solid var(--warning-border)" }}>MEDIUM</span>
  );
  return (
    <span style={{ padding:"3px 10px", borderRadius:40, fontSize:11, fontWeight:700,
      background:"var(--success-bg)", color:"var(--success)", border:"1px solid var(--success-border)" }}>VERIFIED</span>
  );
}

export default function Results() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getAnalyses().then(r => setAll(r.data.analyses)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = all.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.candidate_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "fraud" ? a.is_fraudulent : !a.is_fraudulent);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: "36px 36px 48px" }}>
      {/* header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Analysis Results
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          All {all.length} resume analyses stored in your system.
        </p>
      </div>

      {/* toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1", minWidth: 220 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--slate-light)" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ width:"100%", padding:"10px 14px 10px 38px", borderRadius:"var(--r-md)",
              border:"1.5px solid var(--border)", background:"var(--white)", outline:"none",
              fontSize:13.5, color:"var(--text-primary)", transition:"border 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "var(--blue)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>
        <div style={{ display:"flex", gap:6, background:"var(--slate-pale)", borderRadius:"var(--r-md)", padding:4, border:"1px solid var(--border)" }}>
          {[["all","All"],["fraud","Fraudulent"],["legit","Legitimate"]].map(([f,label]) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"7px 14px", borderRadius:"var(--r-sm)", border:"none",
              background: filter===f ? "var(--white)" : "transparent",
              color: filter===f ? "var(--blue)" : "var(--slate-mid)",
              fontWeight: filter===f ? 700 : 500, fontSize:13, cursor:"pointer",
              transition:"all 0.15s", boxShadow: filter===f ? "var(--shadow-sm)" : "none",
            }}>{label}</button>
          ))}
        </div>
        <div style={{ fontSize:13, color:"var(--text-muted)", marginLeft:"auto" }}>
          Showing <strong style={{color:"var(--text-primary)"}}>{filtered.length}</strong> of {all.length}
        </div>
      </div>

      {/* table */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[...Array(5)].map((_,i) => (
            <div key={i} style={{ height:60, borderRadius:"var(--r-md)", background:"var(--slate-pale)", animation:"shimmer 1.5s ease infinite" }}/>
          ))}
        </div>
      ) : (
        <div style={{ background:"var(--white)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"var(--slate-pale)", borderBottom:"1px solid var(--border)" }}>
                {["Candidate","Email","Phone","Score","Risk","Analyzed By","Date",""].map(h => (
                  <th key={h} style={{ padding:"11px 18px", textAlign:"left", fontSize:11,
                    fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em",
                    whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <>
                  <tr key={a.id}
                    style={{ borderBottom: "1px solid var(--border)", cursor:"pointer", transition:"background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--off-white)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)" }}>{a.candidate_name || "—"}</div>
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ fontSize:13, color:"var(--text-secondary)" }}>{a.email || "—"}</div>
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ fontSize:13, color:"var(--text-secondary)" }}>{a.phone || "—"}</div>
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
                        <span style={{ fontSize:17, fontWeight:800,
                          color: a.fraud_score < 40 ? "var(--danger)" : a.fraud_score < 65 ? "var(--warning)" : "var(--success)" }}>
                          {a.fraud_score?.toFixed(0)}
                        </span>
                        <span style={{ fontSize:11, color:"var(--text-muted)" }}>/100</span>
                      </div>
                    </td>
                    <td style={{ padding:"13px 18px" }}><RiskBadge score={a.fraud_score}/></td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ fontSize:12, color:"var(--text-muted)" }}>{a.analyzed_by_name || "System"}</div>
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ fontSize:12, color:"var(--text-muted)" }}>{new Date(a.created_at).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} style={{
                        background:"none", border:"none", fontSize:12, fontWeight:600,
                        color:"var(--blue)", cursor:"pointer", display:"flex", alignItems:"center", gap:4,
                      }}>
                        {expanded === a.id ? "Hide" : "Details"}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          style={{ transition:"transform 0.2s", transform: expanded===a.id ? "rotate(180deg)" : "none" }}>
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {expanded === a.id && (
                    <tr key={`${a.id}-exp`} style={{ background:"var(--blue-pale)" }}>
                      <td colSpan={8} style={{ padding:"16px 18px" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, color:"var(--blue)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Red Flags</div>
                            {(a.red_flags?.length > 0) ? a.red_flags.map((f,j) => (
                              <div key={j} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6,
                                padding:"8px 12px", background:"var(--danger-bg)", borderRadius:"var(--r-sm)",
                                border:"1px solid var(--danger-border)", fontSize:12.5, color:"var(--danger)" }}>
                                <span>⚠</span>{f}
                              </div>
                            )) : (
                              <div style={{ fontSize:12.5, color:"var(--success)", padding:"8px 12px",
                                background:"var(--success-bg)", borderRadius:"var(--r-sm)", border:"1px solid var(--success-border)" }}>
                                ✓ No red flags detected
                              </div>
                            )}
                          </div>
                          {a.resume_text && (
                            <div>
                              <div style={{ fontSize:11, fontWeight:700, color:"var(--blue)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Resume Preview</div>
                              <pre style={{ fontSize:11.5, color:"var(--text-secondary)", whiteSpace:"pre-wrap",
                                maxHeight:120, overflow:"hidden", background:"var(--white)",
                                borderRadius:"var(--r-sm)", padding:"10px 12px", margin:0,
                                border:"1px solid var(--border)", lineHeight:1.6, fontFamily:"monospace" }}>
                                {a.resume_text.slice(0, 350)}{a.resume_text.length > 350 ? "…" : ""}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding:"48px", textAlign:"center", color:"var(--text-muted)", fontSize:14 }}>
                    No results found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}