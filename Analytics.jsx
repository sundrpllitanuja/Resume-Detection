import { useEffect, useState } from "react";
import { getStatistics, getAnalyses } from "../api";

function MetricCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background:"var(--white)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)",
      padding:"20px 22px", boxShadow:"var(--shadow-sm)", display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:46, height:46, borderRadius:"var(--r-md)", background:bg,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:28, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12.5, color:"var(--text-muted)", marginTop:4 }}>{label}</div>
      </div>
    </div>
  );
}

function DonutRing({ pct, color, size = 120, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(pct / 100, 1)) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--slate-pale)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1s ease" }}/>
    </svg>
  );
}

function BarChart({ data, max }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:140, padding:"0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ fontSize:12, fontWeight:700, color: d.color }}>{d.value}</div>
          <div style={{
            width:"100%", borderRadius:"6px 6px 0 0",
            background: d.color,
            height: max > 0 ? `${Math.max(4, (d.value/max)*110)}px` : "4px",
            transition:"height 0.8s ease",
            opacity: 0.85,
          }}/>
          <div style={{ fontSize:11, color:"var(--text-muted)", textAlign:"center", lineHeight:1.3 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStatistics(), getAnalyses()])
      .then(([s, a]) => { setStats(s.data.statistics); setAnalyses(a.data.analyses); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding:"48px 36px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
        {[...Array(4)].map((_,i) => <div key={i} style={{ height:96, borderRadius:"var(--r-lg)", background:"var(--slate-pale)", animation:"shimmer 1.5s ease infinite" }}/>)}
      </div>
    </div>
  );
  if (!stats) return null;

  const fraudPct = stats.total_analyzed > 0 ? (stats.fraudulent_detected / stats.total_analyzed) * 100 : 0;

  const buckets = [
    { label:"0–20",  range:[0,20],  color:"var(--danger)" },
    { label:"20–40", range:[20,40], color:"#fb923c" },
    { label:"40–60", range:[40,60], color:"var(--warning)" },
    { label:"60–80", range:[60,80], color:"#34d399" },
    { label:"80–100",range:[80,100],color:"var(--success)" },
  ].map(b => ({ ...b, value: analyses.filter(a => a.fraud_score >= b.range[0] && a.fraud_score < b.range[1]).length }));
  const maxBucket = Math.max(...buckets.map(b => b.value), 1);

  const flagCounts = {};
  analyses.forEach(a => (a.red_flags || []).forEach(f => { flagCounts[f] = (flagCounts[f]||0)+1; }));
  const topFlags = Object.entries(flagCounts).sort((a,b) => b[1]-a[1]).slice(0, 6);

  return (
    <div style={{ padding:"36px 36px 48px" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:6 }}>Analytics</h1>
        <p style={{ fontSize:14, color:"var(--text-secondary)" }}>
          Fraud detection insights across {stats.total_analyzed} total analyses.
        </p>
      </div>

      {/* metrics row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <MetricCard label="Total Analyzed" value={stats.total_analyzed} icon="📋" color="var(--blue)" bg="var(--blue-pale)"/>
        <MetricCard label="Fraudulent Detected" value={stats.fraudulent_detected} icon="🚨" color="var(--danger)" bg="var(--danger-bg)"/>
        <MetricCard label="Legitimate" value={stats.legitimate} icon="✅" color="var(--success)" bg="var(--success-bg)"/>
        <MetricCard label="Avg Legitimacy Score" value={`${stats.average_fraud_score}`} icon="📊" color="var(--blue)" bg="var(--blue-pale)"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:20, marginBottom:20 }}>
        {/* donut overview */}
        <div style={{ background:"var(--white)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)",
          padding:"24px", boxShadow:"var(--shadow-sm)" }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase",
            letterSpacing:"0.07em", marginBottom:22 }}>Detection Overview</h3>
          <div style={{ display:"flex", justifyContent:"center", gap:32 }}>
            {[
              { label:"Fraudulent", pct:fraudPct, color:"var(--danger)", value:stats.fraudulent_detected },
              { label:"Legitimate", pct:100-fraudPct, color:"var(--success)", value:stats.legitimate },
            ].map(d => (
              <div key={d.label} style={{ textAlign:"center" }}>
                <div style={{ position:"relative", display:"inline-block" }}>
                  <DonutRing pct={d.pct} color={d.color}/>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)" }}>{d.pct.toFixed(0)}%</div>
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginTop:8 }}>{d.label}</div>
                <div style={{ fontSize:12, color:"var(--text-muted)" }}>{d.value} resumes</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid var(--border)" }}>
            {[
              ["Detection Rate", `${stats.detection_rate}%`, "var(--danger)"],
              ["Average Score", `${stats.average_fraud_score}/100`, "var(--blue)"],
              ["Total Analyses", stats.total_analyzed, "var(--text-primary)"],
            ].map(([l,v,c]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"9px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:13, color:"var(--text-secondary)" }}>{l}</span>
                <span style={{ fontSize:14, fontWeight:700, color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* score distribution bar chart */}
        <div style={{ background:"var(--white)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)",
          padding:"24px", boxShadow:"var(--shadow-sm)" }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase",
            letterSpacing:"0.07em", marginBottom:22 }}>Score Distribution</h3>
          <BarChart data={buckets} max={maxBucket}/>
          <div style={{ display:"flex", gap:20, marginTop:18, justifyContent:"center" }}>
            {[["Fraud Risk","var(--danger)"],["Review","var(--warning)"],["Safe","var(--success)"]].map(([l,c]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text-muted)" }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }}/>
                {l}
              </div>
            ))}
          </div>
          <p style={{ marginTop:12, fontSize:12, color:"var(--text-muted)", textAlign:"center" }}>
            Resumes grouped by legitimacy score bucket
          </p>
        </div>
      </div>

      {/* top red flags */}
      <div style={{ background:"var(--white)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)",
        padding:"24px", boxShadow:"var(--shadow-sm)" }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase",
          letterSpacing:"0.07em", marginBottom:20 }}>Most Common Red Flags</h3>
        {topFlags.length === 0 ? (
          <div style={{ fontSize:14, color:"var(--text-muted)", padding:"20px 0", textAlign:"center" }}>
            No red flags recorded yet.
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 32px" }}>
            {topFlags.map(([flag, count]) => (
              <div key={flag} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"var(--text-primary)" }}>{flag}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--danger)",
                    padding:"2px 8px", borderRadius:40, background:"var(--danger-bg)" }}>{count}×</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:"var(--slate-pale)", overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:3,
                    background:"linear-gradient(90deg, var(--danger), #f87171)",
                    width:`${(count/(topFlags[0]?.[1]||1))*100}%`,
                    transition:"width 0.8s ease",
                  }}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}