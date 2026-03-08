import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { Summary, MonthlyData, Transaction } from "../../types";
import { formatCurrency, formatDate } from "../../utils/format";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<MonthlyData[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    refreshUser();
    fetchData();
  }, [period]);

  const fetchData = async () => {
    const [s, c, h] = await Promise.all([
      api.get(`/transactions/summary?period=${period}`),
      api.get("/transactions/chart/monthly"),
      api.get("/transactions/history?page_size=5"),
    ]);
    setSummary(s.data);
    setChart(c.data);
    setRecent(h.data.items);
  };

  const S = styles;

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div style={{ ...S.card, borderTop: `3px solid ${color}` }}>
      <div style={S.cardLabel}>{label}</div>
      <div style={{ ...S.cardValue, color }}>{formatCurrency(value)}</div>
    </div>
  );

  const txColor = (t: Transaction) => {
    if (t.type === "deposit") return "#3ddc84";
    if (t.type === "withdraw") return "#f87171";
    return t.sender_id === user?.id ? "#f87171" : "#3ddc84";
  };

  const txSign = (t: Transaction) => {
    if (t.type === "deposit") return "+";
    if (t.type === "withdraw") return "-";
    return t.sender_id === user?.id ? "-" : "+";
  };

  return (
    <div>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>Overview</div>
          <h1 style={S.title}>Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["week", "month", "year"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ ...S.periodBtn, ...(period === p ? S.periodActive : {}) }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Balance hero */}
      <div style={S.balanceHero}>
        <div style={S.balanceLabel}>Current Balance</div>
        <div style={S.balanceValue}>{formatCurrency(user?.balance || 0)}</div>
        <div style={S.accountNum}>Account · {user?.account_number}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button style={S.actionBtn} onClick={() => navigate("/transfer")}>Send Money →</button>
          <button style={{ ...S.actionBtn, background: "transparent", color: "#3ddc84", border: "1px solid #3ddc84" }}
            onClick={() => navigate("/transactions")}>View History</button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={S.statsGrid}>
          <StatCard label="Total Received"    value={summary.total_received}    color="#3ddc84" />
          <StatCard label="Total Sent"        value={summary.total_sent}        color="#f87171" />
          <StatCard label="Total Deposits"    value={summary.total_deposits}    color="#5b9cf6" />
          <StatCard label="Net Flow"          value={summary.net_flow}          color={summary.net_flow >= 0 ? "#3ddc84" : "#f87171"} />
        </div>
      )}

      {/* Chart */}
      {chart.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionTitle}>Monthly Activity</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: "#4a7a5a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4a7a5a", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#090f0c", border: "1px solid #1a2e22", color: "#e2efe8", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: "#4a7a5a" }} />
                <Bar dataKey="received" name="Received" fill="#3ddc84" radius={[2,2,0,0]} />
                <Bar dataKey="sent"     name="Sent"     fill="#f87171" radius={[2,2,0,0]} />
                <Bar dataKey="deposits" name="Deposits" fill="#5b9cf6" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.sectionTitle}>Recent Transactions</div>
          <button style={S.viewAll} onClick={() => navigate("/transactions")}>View all →</button>
        </div>
        {recent.length === 0 && <div style={S.empty}>No transactions yet. Make your first transfer!</div>}
        {recent.map((t) => (
          <div key={t.id} style={S.txRow}>
            <div style={{ ...S.txIcon, background: txColor(t) + "22", color: txColor(t) }}>
              {t.type === "deposit" ? "↓" : t.type === "withdraw" ? "↑" : "⇄"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={S.txTitle}>{t.title || t.description || t.type}</div>
              <div style={S.txMeta}>{t.reference} · {formatDate(t.created_at)}</div>
            </div>
            <div style={{ ...S.txAmount, color: txColor(t) }}>
              {txSign(t)}{formatCurrency(t.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  eyebrow:      { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3ddc84", marginBottom: 4 },
  title:        { fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#e2efe8" },
  periodBtn:    { background: "transparent", border: "1px solid #1a2e22", color: "#4a7a5a", padding: "6px 14px", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" },
  periodActive: { borderColor: "#3ddc84", color: "#3ddc84", background: "rgba(61,220,132,0.08)" },
  balanceHero:  { background: "linear-gradient(135deg, #0d1f15 0%, #091209 100%)", border: "1px solid #1a2e22", padding: "36px 40px", marginBottom: 24, borderLeft: "4px solid #3ddc84" },
  balanceLabel: { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a7a5a", marginBottom: 8 },
  balanceValue: { fontFamily: "'Syne', sans-serif", fontSize: "3rem", fontWeight: 800, color: "#3ddc84", letterSpacing: "-0.02em" },
  accountNum:   { fontSize: 11, color: "#4a7a5a", letterSpacing: "0.15em", marginTop: 6 },
  actionBtn:    { background: "#3ddc84", color: "#060d0a", border: "none", padding: "10px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" },
  statsGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 },
  card:         { background: "#090f0c", border: "1px solid #1a2e22", padding: "20px 24px" },
  cardLabel:    { fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4a7a5a", marginBottom: 8 },
  cardValue:    { fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: 700 },
  section:      { background: "#090f0c", border: "1px solid #1a2e22", padding: "24px", marginBottom: 20 },
  sectionTitle: { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a7a5a", marginBottom: 16 },
  viewAll:      { background: "transparent", border: "none", color: "#3ddc84", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" },
  txRow:        { display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #0d1a12" },
  txIcon:       { width: 36, height: 36, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  txTitle:      { fontSize: 12, color: "#e2efe8", marginBottom: 2 },
  txMeta:       { fontSize: 10, color: "#4a7a5a", letterSpacing: "0.05em" },
  txAmount:     { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" },
  empty:        { fontSize: 12, color: "#4a7a5a", textAlign: "center", padding: "24px 0" },
};
