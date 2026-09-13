import { useParams } from "react-router-dom";
import { useReport } from "../hooks/useReport.js";
import { EvidenceList } from "../components/evidence/EvidenceList.jsx";
import { Timeline } from "../components/timeline/Timeline.jsx";
import { UrduPanel } from "../components/urdu/UrduPanel.jsx";

export default function Report() {
  const { id } = useParams();
  const { loading, error, report } = useReport(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#687284" }}>Loading report...</p>
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

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#687284" }}>Report not found.</p>
      </div>
    );
  }

  const riskLevel = (report.threatLevel || "Low").toLowerCase();

  return (
    <div className="app">
      <section className="result-section">
        <div className="section-heading">
          <span>SCAN RESULT</span>
          <h2>Threat Analysis Report</h2>
          <p>CyberSathi has analyzed the submitted content.</p>
        </div>

        <div className={`risk-card risk-${riskLevel}`}>
          <div>
            <span className="risk-label">RISK LEVEL</span>
            <h2>{report.threatLevel?.toUpperCase() || "UNKNOWN"}</h2>
            <p>Threat Type: {report.threatType || "Unknown"}</p>
          </div>
          <div className="risk-score">
            <strong>{report.riskScore ?? "-"}</strong>
            <span>/100</span>
            <small>Risk Score</small>
          </div>
        </div>

        <div className="result-grid">
          <EvidenceList indicators={report.indicators || []} />

          <div className="result-card">
            <h3>&#x1f9e0; Threat Explanation</h3>
            <p className="explanation">
              CyberSathi classified this content as {report.threatType || "Unknown"}.
              Review the reported indicators before taking action.
            </p>
            {report.explanation && (
              <p className="explanation" style={{ marginTop: 12 }}>
                {report.explanation}
              </p>
            )}
            <UrduPanel urduExplanation={report.urduExplanation} />
          </div>
        </div>

        {report.recommendedActions && report.recommendedActions.length > 0 && (
          <div className="recommendation">
            <h3>&#x1f6e1;&#xfe0f; Recommendation</h3>
            {report.recommendedActions.map((action, i) => (
              <p key={i} style={{ marginBottom: 8 }}>
                {i + 1}. {action}
              </p>
            ))}
          </div>
        )}

        {report.urls && report.urls.length > 0 && (
          <div className="recommendation">
            <h3>Analyzed URLs</h3>
            {report.urls.map((url, i) => (
              <p key={i} style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>
                {url}
              </p>
            ))}
          </div>
        )}

        <Timeline events={report.investigationTimeline || []} />
      </section>
    </div>
  );
}
