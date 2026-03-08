import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { formatCurrency } from "../../utils/format";

type Step = "form" | "confirm" | "success";

export default function Transfer() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ receiver_account: "", amount: "", description: "" });
  const [receiverName, setReceiverName] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const lookupAccount = async () => {
    if (form.receiver_account.length < 10) return;
    setLookupLoading(true); setLookupError("");
    try {
      const { data } = await api.get(`/users/lookup?account_number=${form.receiver_account}`);
      if (data.found) setReceiverName(data.full_name);
      else { setReceiverName(""); setLookupError("Account not found"); }
    } catch { setLookupError("Lookup failed"); }
    finally { setLookupLoading(false); }
  };

  const handleConfirm = async () => {
    setError(""); setSubmitLoading(true);
    try {
      const { data } = await api.post("/transactions/transfer", {
        receiver_account: form.receiver_account,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
      });
      setResult(data);
      await refreshUser();
      setStep("success");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Transfer failed");
      setStep("form");
    } finally { setSubmitLoading(false); }
  };

  const S = styles;

  if (step === "success") return (
    <div>
      <div style={S.eyebrow}>Transaction Complete</div>
      <h1 style={S.title}>Transfer Sent</h1>
      <div style={{ ...S.card, borderLeft: "4px solid #3ddc84", marginTop: 24 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✓</div>
        <div style={S.successAmt}>{formatCurrency(result?.amount)}</div>
        <div style={S.successLabel}>sent to {receiverName}</div>
        <div style={S.ref}>Ref: {result?.reference}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button style={S.btn} onClick={() => { setStep("form"); setForm({ receiver_account: "", amount: "", description: "" }); setReceiverName(""); }}>
            New Transfer
          </button>
          <button style={{ ...S.btn, background: "transparent", color: "#3ddc84", border: "1px solid #3ddc84" }}
            onClick={() => navigate("/transactions")}>
            View History
          </button>
        </div>
      </div>
    </div>
  );

  if (step === "confirm") return (
    <div>
      <div style={S.eyebrow}>Confirm Transfer</div>
      <h1 style={S.title}>Review Details</h1>
      <div style={{ ...S.card, marginTop: 24 }}>
        {[
          ["From",    `${user?.full_name} · ${user?.account_number}`],
          ["To",      `${receiverName} · ${form.receiver_account}`],
          ["Amount",  formatCurrency(parseFloat(form.amount))],
          ["Balance after", formatCurrency((user?.balance || 0) - parseFloat(form.amount))],
          ["Description", form.description || "—"],
        ].map(([label, val]) => (
          <div key={label} style={S.confirmRow}>
            <span style={S.confirmLabel}>{label}</span>
            <span style={S.confirmVal}>{val}</span>
          </div>
        ))}
        {error && <div style={S.errBox}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button style={S.btn} onClick={handleConfirm} disabled={submitLoading}>
            {submitLoading ? "Processing..." : "Confirm Transfer"}
          </button>
          <button style={{ ...S.btn, background: "transparent", color: "#e2efe8", border: "1px solid #1a2e22" }}
            onClick={() => setStep("form")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Step: form
  const canProceed = form.receiver_account && receiverName && form.amount && parseFloat(form.amount) > 0;

  return (
    <div>
      <div style={S.eyebrow}>Money Transfer</div>
      <h1 style={S.title}>Send Money</h1>
      <div style={S.balancePill}>Available: {formatCurrency(user?.balance || 0)}</div>

      <div style={{ ...S.card, marginTop: 24, maxWidth: 520 }}>
        {/* Receiver account */}
        <div style={S.field}>
          <label style={S.label}>Receiver Account Number</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="12-digit account number"
              value={form.receiver_account}
              onChange={(e) => { setForm({ ...form, receiver_account: e.target.value }); setReceiverName(""); setLookupError(""); }}
              onBlur={lookupAccount} />
            <button style={S.lookupBtn} onClick={lookupAccount} disabled={lookupLoading}>
              {lookupLoading ? "..." : "Verify"}
            </button>
          </div>
          {receiverName && <div style={S.receiverFound}>✓ {receiverName}</div>}
          {lookupError && <div style={S.lookupErr}>{lookupError}</div>}
        </div>

        {/* Amount */}
        <div style={S.field}>
          <label style={S.label}>Amount (USD)</label>
          <input style={S.input} type="number" placeholder="0.00" min="0.01"
            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          {parseFloat(form.amount) > (user?.balance || 0) && (
            <div style={S.lookupErr}>Exceeds available balance</div>
          )}
        </div>

        {/* Description */}
        <div style={S.field}>
          <label style={S.label}>Description (optional)</label>
          <input style={S.input} placeholder="e.g. Rent, Invoice #123..."
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <button style={{ ...S.btn, opacity: canProceed ? 1 : 0.4 }}
          disabled={!canProceed} onClick={() => setStep("confirm")}>
          Review Transfer →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  eyebrow:       { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3ddc84", marginBottom: 4 },
  title:         { fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#e2efe8", marginBottom: 0 },
  balancePill:   { display: "inline-block", marginTop: 10, background: "rgba(61,220,132,0.1)", border: "1px solid rgba(61,220,132,0.3)", color: "#3ddc84", fontSize: 11, padding: "4px 12px", letterSpacing: "0.1em" },
  card:          { background: "#090f0c", border: "1px solid #1a2e22", padding: "32px" },
  field:         { marginBottom: 20 },
  label:         { display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#4a7a5a", marginBottom: 8 },
  input:         { width: "100%", background: "#060d0a", border: "1px solid #1a2e22", color: "#e2efe8", padding: "10px 14px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: "none", boxSizing: "border-box" as const },
  lookupBtn:     { background: "#1a2e22", border: "1px solid #2a4a32", color: "#3ddc84", padding: "10px 16px", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const },
  receiverFound: { fontSize: 11, color: "#3ddc84", marginTop: 6, letterSpacing: "0.05em" },
  lookupErr:     { fontSize: 11, color: "#f87171", marginTop: 6 },
  btn:           { background: "#3ddc84", color: "#060d0a", border: "none", padding: "12px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" },
  confirmRow:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #0d1a12" },
  confirmLabel:  { fontSize: 10, color: "#4a7a5a", letterSpacing: "0.15em", textTransform: "uppercase" as const },
  confirmVal:    { fontSize: 12, color: "#e2efe8", maxWidth: "60%", textAlign: "right" as const },
  errBox:        { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 12, marginTop: 16 },
  successAmt:    { fontFamily: "'Syne', sans-serif", fontSize: "3rem", fontWeight: 800, color: "#3ddc84" },
  successLabel:  { fontSize: 13, color: "#4a7a5a", marginTop: 4 },
  ref:           { fontSize: 10, color: "#2a4a32", letterSpacing: "0.15em", marginTop: 8 },
};
