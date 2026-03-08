import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { Transaction, TransactionPage } from "../../types";
import { formatCurrency, formatDate } from "../../utils/format";

export default function Transactions() {
  const { user } = useAuth();
  const [data, setData] = useState<TransactionPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: "", search: "", start_date: "", end_date: "" });
  const [page, setPage] = useState(1);

  useEffect(() => { fetchHistory(); }, [page, filters]);

  const fetchHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: "15" });
    if (filters.type)       params.set("txn_type",   filters.type);
    if (filters.search)     params.set("search",     filters.search);
    if (filters.start_date) params.set("start_date", filters.start_date);
    if (filters.end_date)   params.set("end_date",   filters.end_date);
    try {
      const { data } = await api.get(`/transactions/history?${params}`);
      setData(data);
    } finally { setLoading(false); }
  };

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

  const txLabel = (t: Transaction) => {
    if (t.type === "deposit") return "Deposit";
    if (t.type === "withdraw") return "Withdrawal";
    return t.sender_id === user?.id
      ? `To ${t.receiver_name || t.receiver_account}`
      : `From ${t.sender_name || t.sender_account}`;
  };

  const S = styles;

  return (
    <div>
      <div style={S.eyebrow}>History</div>
      <h1 style={S.title}>Transactions</h1>

      {/* Filters */}
      <div style={S.filterBar}>
        <input style={S.filterInput} placeholder="Search ref or description..."
          value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />

        <select style={S.filterSelect} value={filters.type}
          onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}>
          <option value="">All Types</option>
          <option value="transfer">Transfer</option>
          <option value="deposit">Deposit</option>
          <option value="withdraw">Withdrawal</option>
        </select>

        <input style={S.filterInput} type="date" placeholder="From"
          value={filters.start_date} onChange={(e) => { setFilters({ ...filters, start_date: e.target.value }); setPage(1); }} />
        <input style={S.filterInput} type="date" placeholder="To"
          value={filters.end_date} onChange={(e) => { setFilters({ ...filters, end_date: e.target.value }); setPage(1); }} />

        {(filters.type || filters.search || filters.start_date) && (
          <button style={S.clearBtn} onClick={() => { setFilters({ type: "", search: "", start_date: "", end_date: "" }); setPage(1); }}>
            Clear ×
          </button>
        )}
      </div>

      {/* Table */}
      <div style={S.table}>
        <div style={S.thead}>
          <span style={{ flex: 1.8 }}>Reference</span>
          <span style={{ flex: 2 }}>Description</span>
          <span style={{ flex: 1 }}>Type</span>
          <span style={{ flex: 1.5 }}>Date</span>
          <span style={{ flex: 1, textAlign: "right" }}>Amount</span>
          <span style={{ flex: 1, textAlign: "right" }}>Balance After</span>
        </div>

        {loading && <div style={S.loading}>Loading...</div>}

        {!loading && data?.items.map((t) => {
          const balAfter = t.sender_id === user?.id ? t.sender_balance_after : t.receiver_balance_after;
          return (
            <div key={t.id} style={S.row}>
              <span style={{ flex: 1.8, fontSize: 10, color: "#4a7a5a", letterSpacing: "0.05em" }}>{t.reference}</span>
              <span style={{ flex: 2, fontSize: 12 }}>{txLabel(t)}{t.description ? ` · ${t.description}` : ""}</span>
              <span style={{ flex: 1 }}>
                <span style={{ ...S.badge, background: txColor(t) + "22", color: txColor(t) }}>
                  {t.type}
                </span>
              </span>
              <span style={{ flex: 1.5, fontSize: 11, color: "#4a7a5a" }}>{formatDate(t.created_at)}</span>
              <span style={{ flex: 1, textAlign: "right", fontFamily: "'Syne', sans-serif", fontWeight: 700, color: txColor(t) }}>
                {txSign(t)}{formatCurrency(t.amount)}
              </span>
              <span style={{ flex: 1, textAlign: "right", fontSize: 11, color: "#4a7a5a" }}>
                {balAfter != null ? formatCurrency(balAfter) : "—"}
              </span>
            </div>
          );
        })}

        {!loading && data?.items.length === 0 && (
          <div style={S.empty}>No transactions found.</div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div style={S.pagination}>
          <span style={{ fontSize: 11, color: "#4a7a5a" }}>
            {data.total} total · page {page} of {data.pages}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={S.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
            {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} style={{ ...S.pageBtn, ...(p === page ? S.pageActive : {}) }} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button style={S.pageBtn} disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  eyebrow:     { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3ddc84", marginBottom: 4 },
  title:       { fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#e2efe8", marginBottom: 24 },
  filterBar:   { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" },
  filterInput: { background: "#090f0c", border: "1px solid #1a2e22", color: "#e2efe8", padding: "8px 14px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none" },
  filterSelect:{ background: "#090f0c", border: "1px solid #1a2e22", color: "#e2efe8", padding: "8px 14px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none" },
  clearBtn:    { background: "transparent", border: "1px solid #f87171", color: "#f87171", padding: "8px 14px", fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" },
  table:       { background: "#090f0c", border: "1px solid #1a2e22" },
  thead:       { display: "flex", padding: "12px 20px", borderBottom: "1px solid #1a2e22", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#2a4a32" },
  row:         { display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #0d1a12", fontSize: 12, color: "#e2efe8", transition: "background 0.1s" },
  badge:       { fontSize: 9, padding: "3px 8px", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 2 },
  loading:     { padding: "32px", textAlign: "center", fontSize: 12, color: "#4a7a5a" },
  empty:       { padding: "32px", textAlign: "center", fontSize: 12, color: "#4a7a5a" },
  pagination:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  pageBtn:     { background: "transparent", border: "1px solid #1a2e22", color: "#4a7a5a", padding: "6px 12px", fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" },
  pageActive:  { borderColor: "#3ddc84", color: "#3ddc84", background: "rgba(61,220,132,0.08)" },
};
