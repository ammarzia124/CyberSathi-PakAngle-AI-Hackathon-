import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { StatsCard } from "../components/dashboard/StatsCard.jsx";
import { ThreatChart } from "../components/dashboard/ThreatChart.jsx";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Scans"
            value={analytics?.totalScans ?? 0}
          />
          <StatsCard
            title="Average Risk Score"
            value={analytics?.avgRiskScore != null ? `${analytics.avgRiskScore}/100` : "N/A"}
          />
          <StatsCard
            title="Threat Types"
            value={analytics?.threatDistribution ? Object.keys(analytics.threatDistribution).length : 0}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <ThreatChart data={analytics?.threatDistribution || {}} />
        </div>

        {analytics?.recentScans && analytics.recentScans.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold">Recent Scans</h3>
            <div className="divide-y">
              {analytics.recentScans.map((scan, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{scan.inputType}</span>
                  <span className="text-sm font-medium">{scan.riskScore}/100</span>
                  <span className={`text-sm px-2 py-0.5 rounded ${
                    scan.threatLevel === "Critical" ? "bg-red-100 text-red-800" :
                    scan.threatLevel === "High" ? "bg-orange-100 text-orange-800" :
                    scan.threatLevel === "Suspicious" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {scan.threatLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
