import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { StatsCard } from "../components/dashboard/StatsCard.jsx";
import { ThreatChart } from "../components/dashboard/ThreatChart.jsx";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [analyticsData, scansData] = await Promise.all([
          api.getAnalytics(),
          api.getScans(1),
        ]);
        setAnalytics(analyticsData);
        setScans(scansData.scans || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#687284" }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#dc3545" }}>Error: {error}</p>
      </div>
    );
  }

  const dist = analytics?.threatDistribution || {};
  const high = dist.High || 0;
  const medium = dist.Suspicious || 0;
  const low = dist.Low || 0;
  const safe = dist.Critical || 0;

  const recentScans = scans.slice(0, 10);

  return (
    <div className="app">
      <section className="dashboard-section">
        <div className="section-heading">
          <span>SECURITY DASHBOARD</span>
          <h2>CyberSathi Analytics</h2>
          <p>Monitor scans, threats and overall risk distribution.</p>
        </div>

        <div className="stats-grid">
          <StatsCard
            icon="&#x1f50d;"
            value={analytics?.totalScans ?? 0}
            title="Total Scans"
          />
          <StatsCard
            icon="&#x1f534;"
            value={high}
            title="High Risk"
            variant="high"
          />
          <StatsCard
            icon="&#x1f7e0;"
            value={medium}
            title="Medium Risk"
            variant="medium"
          />
          <StatsCard
            icon="&#x1f7e1;"
            value={low}
            title="Low Risk"
            variant="low"
          />
        </div>

        <div className="stats-grid">
          <StatsCard
            icon="&#x1f7e2;"
            value={safe}
            title="Safe Scans"
            variant="safe"
          />
          <StatsCard
            icon="&#x1f4ca;"
            value={analytics?.avgRiskScore != null ? `${analytics.avgRiskScore}/100` : "N/A"}
            title="Average Risk Score"
          />
        </div>

        <ThreatChart data={dist} />

        {recentScans.length > 0 && (
          <div className="history-card">
            <div className="history-heading">
              <h3>Recent Scan History</h3>
              <span>Live Data</span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Scan ID</th>
                    <th>Type</th>
                    <th>Threat</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, i) => {
                    const riskLevel = scan.threatLevel || "Safe";
                    const levelLower = riskLevel.toLowerCase();
                    const statusClass =
                      levelLower === "high"
                        ? "high-status"
                        : levelLower === "medium" || levelLower === "suspicious"
                          ? "medium-status"
                          : levelLower === "low"
                            ? "low-status"
                            : "safe-status";
                    return (
                      <tr key={scan.reportId || i}>
                        <td>#{`CS-${(scan.reportId || "").slice(0, 4).toUpperCase()}`}</td>
                        <td>{scan.inputType}</td>
                        <td>{scan.threatType}</td>
                        <td>{scan.riskScore}/100</td>
                        <td>
                          <span className={`status ${statusClass}`}>{riskLevel}</span>
                        </td>
                        <td>
                          {scan.createdAt
                            ? new Date(scan.createdAt).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
