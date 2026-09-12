export function EvidenceList({ indicators }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Evidence</h3>
      {indicators.length === 0 ? (
        <p className="text-gray-500">No indicators found.</p>
      ) : (
        indicators.map((indicator, i) => (
          <div key={i} className="border rounded p-4">
            <span className="font-medium">{indicator.type}</span>
            <p className="text-sm text-gray-600">{indicator.description}</p>
          </div>
        ))
      )}
    </div>
  );
}
