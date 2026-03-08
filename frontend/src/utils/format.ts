export const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const txnColor = (type: string) => {
  if (type === "deposit") return "text-emerald-400";
  if (type === "received") return "text-emerald-400";
  if (type === "withdraw") return "text-red-400";
  if (type === "transfer") return "text-orange-400";
  return "text-slate-300";
};

export const txnSign = (type: string, isSender: boolean) => {
  if (type === "deposit") return "+";
  if (type === "withdraw") return "-";
  if (type === "transfer") return isSender ? "-" : "+";
  return "";
};
