import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  const S = styles;
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>FinanceOS</div>
        <div style={S.subtitle}>Sign in to your account</div>

        {error && <div style={S.error}>{error}</div>}

        <div style={S.field}>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" placeholder="you@example.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>
        <div style={S.field}>
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" placeholder="••••••••"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>

        <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={S.footer}>
          No account? <Link to="/register" style={S.link}>Register here</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:     { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060d0a", fontFamily: "'JetBrains Mono', monospace" },
  card:     { width: 400, background: "#090f0c", border: "1px solid #1a2e22", padding: "40px 36px" },
  logo:     { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "2rem", color: "#3ddc84", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#4a7a5a", letterSpacing: "0.1em", marginBottom: 28 },
  error:    { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 12, marginBottom: 16 },
  field:    { marginBottom: 18 },
  label:    { display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#4a7a5a", marginBottom: 8 },
  input:    { width: "100%", background: "#060d0a", border: "1px solid #1a2e22", color: "#e2efe8", padding: "10px 14px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" as const },
  btn:      { width: "100%", background: "#3ddc84", color: "#060d0a", border: "none", padding: "12px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: 8, fontFamily: "'JetBrains Mono', monospace" },
  footer:   { textAlign: "center" as const, fontSize: 11, color: "#4a7a5a", marginTop: 20 },
  link:     { color: "#3ddc84", textDecoration: "none" },
};
