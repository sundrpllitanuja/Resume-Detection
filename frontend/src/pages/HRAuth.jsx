import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { loginHR, signupHR } from "../api";

/* ── Shared input ────────────────────────────────────────────────────────────── */
function Field({ label, type = "text", value, onChange, placeholder, error, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "var(--slate-light)" }}>{hint}</span>}
      </div>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px",
          border: `1.5px solid ${error ? "var(--danger)" : focused ? "var(--blue)" : "var(--border)"}`,
          borderRadius: "var(--r-md)", outline: "none",
          background: error ? "var(--danger-bg)" : focused ? "#fafcff" : "var(--white)",
          fontSize: 14, color: "var(--text-primary)",
          transition: "all 0.18s",
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
        }}
      />
      {error && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────────────────────────── */
function Btn({ children, onClick, loading, variant = "primary" }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: {
      background: hov ? "#1d4ed8" : "var(--blue)",
      color: "#fff", border: "none",
      boxShadow: hov ? "0 8px 24px rgba(37,99,235,0.35)" : "0 4px 14px rgba(37,99,235,0.25)",
    },
    ghost: {
      background: hov ? "var(--blue-pale)" : "transparent",
      color: "var(--blue)", border: "1.5px solid var(--blue-soft)",
    },
  };
  return (
    <button
      onClick={onClick} disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", padding: "12px 0", borderRadius: "var(--r-md)",
        fontSize: 14, fontWeight: 700, letterSpacing: "0.02em",
        cursor: loading ? "wait" : "pointer", transition: "all 0.18s",
        transform: hov && !loading ? "translateY(-1px)" : "none",
        opacity: loading ? 0.7 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        ...styles[variant],
      }}
    >
      {loading
        ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Processing…</>
        : children}
    </button>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      padding: "14px 18px", borderRadius: "var(--r-md)",
      background: isErr ? "var(--danger-bg)" : "var(--success-bg)",
      border: `1px solid ${isErr ? "var(--danger-border)" : "var(--success-border)"}`,
      color: isErr ? "var(--danger)" : "var(--success)",
      fontSize: 13.5, fontWeight: 500, maxWidth: 340,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "var(--shadow-lg)", animation: "slideR 0.3s ease",
    }}>
      <span style={{ fontSize: 16 }}>{isErr ? "⚠" : "✓"}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none",
        color: "inherit", fontSize: 18, lineHeight: 1, opacity: 0.6, cursor: "pointer" }}>×</button>
    </div>
  );
}

/* ── MAIN ────────────────────────────────────────────────────────────────────── */
export default function HRAuth() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  const setF = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (mode === "signup") {
      if (!form.username || form.username.trim().length < 2) e.username = "Name must be at least 2 characters";
      if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = mode === "login"
        ? await loginHR(form.email, form.password)
        : await signupHR(form.username, form.email, form.password);
      const { data } = res;
      if (!data.success) { setToast({ msg: data.error, type: "error" }); return; }
      login(data.user, data.token);
      setToast({ msg: data.message, type: "success" });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setToast({ msg: err.response?.data?.error || "Connection error — is Flask running on port 5000?", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", background: "var(--off-white)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />

      {/* ── Left panel (branding) ─────────────────────────────────────────────── */}
      <div style={{
        width: 480, flexShrink: 0, display: "flex", flexDirection: "column",
        background: "linear-gradient(160deg, var(--navy) 0%, var(--navy-mid) 55%, #1e50c8 100%)",
        padding: "48px 52px", position: "relative", overflow: "hidden",
      }}>
        {/* decorative circles */}
        {[{size:380,top:-80,right:-100,op:0.07},{size:260,bottom:60,left:-60,op:0.06},{size:140,top:"45%",right:40,op:0.1}].map((c,i)=>(
          <div key={i} style={{
            position:"absolute",width:c.size,height:c.size,borderRadius:"50%",
            border:"1.5px solid rgba(255,255,255,0.15)",
            top:c.top,bottom:c.bottom,left:c.left,right:c.right,
            background:`rgba(255,255,255,${c.op})`,pointerEvents:"none",
          }}/>
        ))}

        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "auto" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="white" fillOpacity="0.9"/>
              <path d="M9 12l2 2 4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>FraudDetect</span>
        </div>

        {/* hero text */}
        <div style={{ paddingTop: 80 }}>
          <div style={{
            display:"inline-block", padding:"5px 12px", borderRadius:40,
            background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)",
            fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.7)",
            textTransform:"uppercase", marginBottom:20,
          }}>HR Intelligence Portal</div>
          <h1 style={{
            fontSize: 38, fontWeight: 700, lineHeight: 1.2, color: "white",
            fontFamily: "'Fraunces', serif", marginBottom: 18, letterSpacing: "-0.02em",
          }}>
            Detect resume<br />
            <span style={{ fontStyle:"italic", color:"#93c5fd" }}>fraud instantly.</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 300 }}>
            AI-powered resume verification system that helps your HR team identify fraudulent applications before they reach your desk.
          </p>
        </div>

        {/* feature pills */}
        <div style={{ paddingTop: 52, display:"flex", flexDirection:"column", gap:12 }}>
          {[
            ["🔐", "JWT-secured authentication"],
            ["📄", "PDF & text resume analysis"],
            ["📊", "Real-time fraud scoring"],
            ["👥", "Multi-HR team access"],
          ].map(([icon, text]) => (
            <div key={text} style={{
              display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
              background:"rgba(255,255,255,0.07)", borderRadius: "var(--r-md)",
              border:"1px solid rgba(255,255,255,0.1)",
            }}>
              <span style={{fontSize:16}}>{icon}</span>
              <span style={{fontSize:13, color:"rgba(255,255,255,0.7)", fontWeight:500}}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.4s ease" }}>

          {/* tab switcher */}
          <div style={{
            display:"flex", background:"var(--slate-pale)", borderRadius: "var(--r-lg)",
            padding:4, marginBottom:32, border:"1px solid var(--border)",
          }}>
            {[["login","Sign In"],["signup","Create Account"]].map(([m,label])=>(
              <button key={m} onClick={()=>{setMode(m);setErrors({});}} style={{
                flex:1, padding:"9px 0", borderRadius:12, border:"none",
                fontWeight:600, fontSize:13.5, cursor:"pointer", transition:"all 0.2s",
                background: mode===m ? "var(--white)" : "transparent",
                color: mode===m ? "var(--blue)" : "var(--slate-mid)",
                boxShadow: mode===m ? "var(--shadow-sm)" : "none",
              }}>{label}</button>
            ))}
          </div>

          <h2 style={{ fontSize:24, fontWeight:800, color:"var(--text-primary)", marginBottom:6, letterSpacing:"-0.02em" }}>
            {mode==="login" ? "Welcome back 👋" : "Create your account"}
          </h2>
          <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28 }}>
            {mode==="login"
              ? "Sign in to access the HR fraud detection dashboard."
              : "Register a new HR account to start reviewing resumes."}
          </p>

          {/* pre-created accounts */}
          {mode==="login" && (
            <div style={{
              marginBottom:24, padding:"14px 16px", borderRadius:"var(--r-md)",
              background:"var(--blue-pale)", border:"1px solid var(--blue-soft)",
            }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--blue)", letterSpacing:"0.08em",
                textTransform:"uppercase", marginBottom:8 }}>🔑 Pre-created HR Accounts</p>
              {[
                ["Admin","hr.admin@company.com","Admin@HR2024"],
                ["HR Manager","hr.manager@company.com","Manager@HR2024"],
              ].map(([role,email,pass])=>(
                <div key={email} style={{
                  display:"flex", alignItems:"center", gap:10, marginBottom:6,
                  padding:"7px 10px", background:"white", borderRadius:"var(--r-sm)",
                  border:"1px solid var(--border)",
                }}>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4,
                    background: role==="Admin" ? "var(--blue)" : "var(--slate-pale)",
                    color: role==="Admin" ? "white" : "var(--slate)",
                  }}>{role}</span>
                  <span style={{fontSize:12, color:"var(--slate)", fontFamily:"monospace"}}>{email}</span>
                  <span style={{fontSize:12, color:"var(--slate-light)", fontFamily:"monospace",marginLeft:"auto"}}>{pass}</span>
                </div>
              ))}
            </div>
          )}

          {/* form */}
          {mode==="signup" && (
            <Field label="Full Name" value={form.username} onChange={setF("username")} placeholder="Jane Smith" error={errors.username}/>
          )}
          <Field label="Work Email" type="email" value={form.email} onChange={setF("email")} placeholder="hr@company.com" error={errors.email}/>
          <Field label="Password" type="password" value={form.password} onChange={setF("password")} placeholder="Min. 6 characters" error={errors.password} hint={mode==="signup"?"At least 6 characters":""}/>
          {mode==="signup" && (
            <Field label="Confirm Password" type="password" value={form.confirm} onChange={setF("confirm")} placeholder="Repeat your password" error={errors.confirm}/>
          )}

          <div style={{marginTop:8}}>
            <Btn onClick={submit} loading={loading}>
              {mode==="login" ? "Sign In to Dashboard" : "Create HR Account"}
              {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            </Btn>
          </div>

          <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--text-muted)" }}>
            {mode==="login" ? "New to FraudDetect? " : "Already have an account? "}
            <button onClick={()=>setMode(mode==="login"?"signup":"login")} style={{
              background:"none", border:"none", color:"var(--blue)", fontSize:13,
              fontWeight:700, textDecoration:"underline", textUnderlineOffset:3,
            }}>
              {mode==="login" ? "Create an account" : "Sign in instead"}
            </button>
          </p>

          <div style={{
            marginTop:32, paddingTop:24, borderTop:"1px solid var(--border)",
            display:"flex", justifyContent:"center", gap:20,
          }}>
            {["JWT Secured","bcrypt Hashed","Role-Based Access"].map(b=>(
              <span key={b} style={{fontSize:11, color:"var(--slate-light)", display:"flex", alignItems:"center", gap:4}}>
                <span style={{color:"var(--success)"}}>✓</span>{b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}