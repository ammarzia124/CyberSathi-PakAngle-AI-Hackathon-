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

export function ThreatChart({ data }) {
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    return (
      <div className="chart-card">
        <h3>Threat Categories</h3>
        <p className="text-center py-8" style={{ color: "#687284" }}>
          No scan data available yet. Complete a scan to see threat distribution charts.
        </p>
      </div>
    );
  }

  const barData = entries.map(([name, count]) => ({
    name,
    scans: count,
  }));

  const pieData = entries.map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h3>Threat Categories</h3>
        <div className="chart-plot">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="scans" fill="#315fd4" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <h3>Risk Distribution</h3>
        <div className="chart-plot">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                outerRadius={105}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={["#dc3545", "#f59e0b", "#eab308", "#22a06b"][index % 4]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={28} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
