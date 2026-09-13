import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const LEVEL_COLORS = {
  Critical: "#ef4444",
  High: "#f97316",
  Suspicious: "#eab308",
  Low: "#22c55e",
};

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

export function ThreatChart({ data }) {
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500 text-center py-8">
          No scan data available yet. Complete a scan to see threat distribution charts.
        </p>
      </div>
    );
  }

  const barData = entries.map(([name, count]) => ({
    name,
    count,
  }));

  const pieData = entries.map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Threat Categories</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Scans" radius={[5, 5, 0, 0]}>
              {barData.map((entry) => (
                <Cell key={entry.name} fill={LEVEL_COLORS[entry.name] || "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={28} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
