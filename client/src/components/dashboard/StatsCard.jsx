export function StatsCard({ icon, title, value, variant }) {
  return (
    <div className={`stat-card ${variant || ""}`}>
      {icon && <span>{icon}</span>}
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  );
}
