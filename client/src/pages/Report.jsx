import { useParams } from "react-router-dom";
import { useReport } from "../hooks/useReport.js";
import { RiskBadge } from "../components/report/RiskBadge.jsx";
import { ReportSummary } from "../components/report/ReportSummary.jsx";
import { EvidenceList } from "../components/evidence/EvidenceList.jsx";
import { Timeline } from "../components/timeline/Timeline.jsx";
import { UrduPanel } from "../components/urdu/UrduPanel.jsx";
import { INPUT_TYPES } from "../utils/constants.js";
import { formatDate } from "../utils/formatters.js";

export default function Report() {
  const { id } = useParams();
  const { loading, error, report } = useReport(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading report...</p>
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

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Security Report</h1>
          <span className="text-sm text-gray-400">
            {INPUT_TYPES[report.inputType] || report.inputType}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <RiskBadge score={report.riskScore} level={report.threatLevel} />
          {report.threatType && report.threatType !== "Unknown" && (
            <span className="text-sm text-gray-600">
              Type: <span className="font-medium">{report.threatType}</span>
            </span>
          )}
          <span className="text-sm text-gray-400 ml-auto">
            {formatDate(report.createdAt)}
          </span>
        </div>

        <ReportSummary report={report} />

        <EvidenceList indicators={report.indicators || []} />

        {report.recommendedActions && report.recommendedActions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold">Recommended Actions</h3>
            <ul className="space-y-2">
              {report.recommendedActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 font-medium">{i + 1}.</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.urls && report.urls.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold">Analyzed URLs</h3>
            <ul className="space-y-1">
              {report.urls.map((url, i) => (
                <li key={i} className="text-sm text-gray-700 break-all font-mono">
                  {url}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Timeline events={report.investigationTimeline || []} />

        <UrduPanel urduExplanation={report.urduExplanation} />
      </div>
    </div>
  );
}
