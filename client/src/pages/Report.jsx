import { useParams } from "react-router-dom";
import { useReport } from "../hooks/useReport.js";

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Report</h1>
        <p className="text-gray-500">
          Report components will be implemented by Toseef.
        </p>
        {report && (
          <pre className="mt-4 bg-white p-4 rounded shadow text-sm overflow-auto">
            {JSON.stringify(report, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
