import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/dashboard",     label: "Dashboard",     icon: "⬡" },
  { to: "/transfer",      label: "Transfer",       icon: "⇄" },
  { to: "/transactions",  label: "Transactions",   icon: "≡" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060d0a", color: "#e2efe8", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: "#090f0c", borderRight: "1px solid #1a2e22", display: "flex", flexDirection: "column", padding: "28px 0" }}>
        {/* Logo */}
        <div style={{ padding: "0 24px 32px", borderBottom: "1px solid #1a2e22" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3ddc84", marginBottom: 6 }}>BankApp</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: "#e2efe8" }}>FinanceOS</div>
        </div>

        {/* Account */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a2e22" }}>
          <div style={{ fontSize: 10, color: "#4a7a5a", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Account</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{user?.full_name}</div>
          <div style={{ fontSize: 10, color: "#4a7a5a", letterSpacing: "0.1em" }}>{user?.account_number}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#3ddc84", marginTop: 10 }}>
            ${Number(user?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 4,
                marginBottom: 4,
                textDecoration: "none",
                fontSize: 12,
                letterSpacing: "0.05em",
                color: isActive ? "#3ddc84" : "#5a8a6a",
                background: isActive ? "rgba(61,220,132,0.08)" : "transparent",
                borderLeft: isActive ? "2px solid #3ddc84" : "2px solid transparent",
                transition: "all 0.15s",
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "0 12px 12px" }}>
          <button
            onClick={handleLogout}
            style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "1px solid #1a2e22", color: "#4a7a5a", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", borderRadius: 4, transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = "#f87171"; (e.target as HTMLElement).style.color = "#f87171"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = "#1a2e22"; (e.target as HTMLElement).style.color = "#4a7a5a"; }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
