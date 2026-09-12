export function RiskBadge({ score, level }) {
  const colors = {
    Low: "bg-green-100 text-green-800",
    Suspicious: "bg-yellow-100 text-yellow-800",
    High: "bg-orange-100 text-orange-800",
    Critical: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors[level] || ""}`}>
      {level} ({score}/100)
    </span>
  );
}
