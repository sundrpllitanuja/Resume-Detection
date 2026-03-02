import { useState } from "react";
import { analyzeResume } from "../api";

function Field({ label, value, onChange, placeholder, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "10px 13px", borderRadius: "var(--r-md)",
          border: `1.5px solid ${focused ? "var(--blue)" : "var(--border)"}`,
          background: focused ? "#fafcff" : "var(--white)", outline: "none",
          fontSize: 14, color: "var(--text-primary)", transition: "all 0.15s",
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.09)" : "none",
        }}
      />
    </div>
  );
}

function ResultPanel({ result }) {
  const isHigh = result.risk_level === "HIGH";
  const isMed  = result.risk_level === "MEDIUM";
  const color  = isHigh ? "var(--danger)" : isMed ? "var(--warning)" : "var(--success)";
  const bg     = isHigh ? "var(--danger-bg)" : isMed ? "var(--warning-bg)" : "var(--success-bg)";
  const border = isHigh ? "var(--danger-border)" : isMed ? "var(--warning-border)" : "var(--success-border)";

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* score header */}
      <div style={{
        padding: "24px 28px", borderRadius: "var(--r-lg)",
        background: bg, border: `1.5px solid ${border}`, marginBottom: 16,
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 52, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.04em" }}>
            {result.fraud_score?.toFixed(0)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color, opacity: 0.7, letterSpacing: "0.08em" }}>/ 100</div>
        </div>
        <div style={{ width: 1, height: 64, background: `${color}30` }}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>{isHigh ? "⚠️" : isMed ? "🔶" : "✅"}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color }}>
              {isHigh ? "Likely Fraudulent" : isMed ? "Needs Review" : "Appears Legitimate"}
            </span>
          </div>
          <div style={{ fontSize: 13, color, opacity: 0.8 }}>
            Risk level: <strong>{result.risk_level}</strong> · Confidence: <strong>{result.confidence}%</strong>
          </div>
        </div>
      </div>

      {/* red flags */}
      {result.red_flags?.length > 0 ? (
        <div style={{
          background: "var(--white)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: "20px 24px",
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--danger)" }}>⚠</span> Red Flags Detected ({result.red_flags.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.red_flags.map((flag, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: "var(--danger-bg)", borderRadius: "var(--r-md)",
                border: "1px solid var(--danger-border)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", flexShrink: 0 }}/>
                <span style={{ fontSize: 13.5, color: "var(--danger)", fontWeight: 500 }}>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          padding: "16px 20px", borderRadius: "var(--r-lg)",
          background: "var(--success-bg)", border: "1px solid var(--success-border)",
          display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--success)", fontWeight: 500,
        }}>
          <span style={{ fontSize: 18 }}>✅</span> No red flags detected — resume appears clean.
        </div>
      )}
    </div>
  );
}

export default function Analyzer() {
  const [tab, setTab] = useState("text");
  const [form, setForm] = useState({ candidate_name: "", email: "", phone: "", resume_text: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(""); setResult(null);
    if (tab === "text" && !form.resume_text.trim()) { setError("Please paste resume text."); return; }
    if (tab === "file" && !file) { setError("Please select a PDF file."); return; }
    setLoading(true);
    try {
      const res = await analyzeResume(tab === "file" ? { ...form, resume_file: file } : form);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Analysis failed. Is the backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "36px 36px 48px", maxWidth: 820 }}>
      {/* header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Analyze Resume
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Submit a resume via text or PDF upload to run our fraud detection analysis.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* left: form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* candidate info card */}
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--shadow-sm)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Candidate Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Full Name" value={form.candidate_name} onChange={setF("candidate_name")} placeholder="Jane Smith"/>
              <Field label="Email Address" type="email" value={form.email} onChange={setF("email")} placeholder="candidate@example.com"/>
              <Field label="Phone Number" value={form.phone} onChange={setF("phone")} placeholder="(555) 123-4567"/>
            </div>
          </div>

          {/* resume input card */}
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--shadow-sm)", flex: 1 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["text","📝 Paste Text"],["file","📄 Upload PDF"]].map(([t, label]) => (
                <button key={t} onClick={() => { setTab(t); setResult(null); setError(""); }} style={{
                  flex: 1, padding: "8px 0", borderRadius: "var(--r-md)", border: "1.5px solid",
                  borderColor: tab === t ? "var(--blue)" : "var(--border)",
                  background: tab === t ? "var(--blue-pale)" : "transparent",
                  color: tab === t ? "var(--blue)" : "var(--slate)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}>{label}</button>
              ))}
            </div>

            {tab === "text" ? (
              <textarea
                value={form.resume_text}
                onChange={setF("resume_text")}
                placeholder="Paste the full resume text here…&#10;&#10;Include work experience, education, skills, contact info etc."
                rows={12}
                style={{
                  width: "100%", resize: "vertical", padding: "12px 14px",
                  border: "1.5px solid var(--border)", borderRadius: "var(--r-md)",
                  background: "var(--off-white)", outline: "none",
                  fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6,
                  transition: "border 0.15s", fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = "var(--blue)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            ) : (
              <div
                onClick={() => document.getElementById("pdf-upload").click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setFile(f); }}
                style={{
                  border: `2px dashed ${file ? "var(--blue)" : "var(--border-mid)"}`,
                  borderRadius: "var(--r-lg)", padding: "40px 20px", textAlign: "center",
                  background: file ? "var(--blue-pale)" : "var(--off-white)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <input id="pdf-upload" type="file" accept=".pdf" style={{ display: "none" }}
                  onChange={e => setFile(e.target.files[0])}/>
                {file ? (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)", marginBottom: 4 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "var(--slate-light)" }}>{(file.size/1024).toFixed(1)} KB · Click to change</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>☁️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Drop PDF here or click to browse</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF files only · Max 10MB</div>
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: "var(--r-md)",
              background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
              color: "var(--danger)", fontSize: 13, fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{
            padding: "14px 0", borderRadius: "var(--r-md)", border: "none",
            background: loading ? "var(--slate-pale)" : "linear-gradient(135deg, var(--blue) 0%, var(--navy-mid) 100%)",
            color: loading ? "var(--slate-light)" : "white",
            fontSize: 14, fontWeight: 700, letterSpacing: "0.02em",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 18px rgba(37,99,235,0.3)",
            transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading
              ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Analyzing…</>
              : <>🔍 Run Fraud Analysis</>}
          </button>
        </div>

        {/* right: result / info */}
        <div>
          {result ? (
            <ResultPanel result={result}/>
          ) : (
            <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "28px 24px", boxShadow: "var(--shadow-sm)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>How it works</h3>
              {[
                ["📝", "Fill in candidate details", "Name, email and phone help improve accuracy."],
                ["📄", "Paste text or upload PDF", "We support both input methods."],
                ["🤖", "AI analysis runs instantly", "Our model checks 8+ fraud indicators."],
                ["📊", "Get a detailed score", "0–100 legitimacy score with risk breakdown."],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--blue-pale)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: "var(--r-md)",
                background: "var(--blue-pale)", border: "1px solid var(--blue-soft)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", marginBottom: 8 }}>SCORE GUIDE</div>
                {[["65–100","var(--success)","var(--success-bg)","Low Risk — Verified"],
                  ["40–64","var(--warning)","var(--warning-bg)","Medium Risk — Review"],
                  ["0–39","var(--danger)","var(--danger-bg)","High Risk — Fraudulent"]].map(([range,c,bg,label])=>(
                  <div key={range} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:40, background:bg, color:c }}>{range}</span>
                    <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}