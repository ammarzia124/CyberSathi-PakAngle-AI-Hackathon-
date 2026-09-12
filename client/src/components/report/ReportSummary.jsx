export function ReportSummary({ report }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold">Summary</h2>
      <p className="text-gray-600">{report.explanation}</p>
    </div>
  );
}
