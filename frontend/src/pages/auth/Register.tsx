import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    try {
      await register(form.full_name, form.email, form.password, form.phone || undefined);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  const S = styles;
  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <input style={S.input} type={type} placeholder={placeholder}
        value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>FinanceOS</div>
        <div style={S.subtitle}>Create your account</div>

        {error && <div style={S.error}>{error}</div>}

        {field("Full Name", "full_name", "text", "Althaf Ahamed")}
        {field("Email", "email", "email", "you@example.com")}
        {field("Phone (optional)", "phone", "tel", "+94 77 000 0000")}
        {field("Password", "password", "password", "Min 8 characters")}
        {field("Confirm Password", "confirm", "password", "Repeat password")}

        <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div style={S.footer}>
          Have an account? <Link to="/login" style={S.link}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:     { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060d0a", fontFamily: "'JetBrains Mono', monospace", padding: "40px 20px" },
  card:     { width: 420, background: "#090f0c", border: "1px solid #1a2e22", padding: "40px 36px" },
  logo:     { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "2rem", color: "#3ddc84", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#4a7a5a", letterSpacing: "0.1em", marginBottom: 28 },
  error:    { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 12, marginBottom: 16 },
  field:    { marginBottom: 16 },
  label:    { display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#4a7a5a", marginBottom: 8 },
  input:    { width: "100%", background: "#060d0a", border: "1px solid #1a2e22", color: "#e2efe8", padding: "10px 14px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" as const },
  btn:      { width: "100%", background: "#3ddc84", color: "#060d0a", border: "none", padding: "12px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, cursor: "pointer", marginTop: 8, fontFamily: "'JetBrains Mono', monospace" },
  footer:   { textAlign: "center" as const, fontSize: 11, color: "#4a7a5a", marginTop: 20 },
  link:     { color: "#3ddc84", textDecoration: "none" },
};
