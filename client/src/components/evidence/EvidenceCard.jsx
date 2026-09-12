export function EvidenceCard({ indicator }) {
  return (
    <div className="border rounded p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{indicator.type}</span>
        <span className="text-sm text-gray-500">{indicator.severity}</span>
      </div>
      <p className="text-sm text-gray-600">{indicator.description}</p>
      {indicator.evidence && (
        <p className="text-xs text-gray-400">{indicator.evidence}</p>
      )}
    </div>
  );
}
