export function EvidenceList({ indicators }) {
  return (
    <div className="result-card">
      <h3>&#x1f6a9; Red Flags / Evidence</h3>
      {indicators.length === 0 ? (
        <div className="evidence-item">
          <strong>No indicators reported</strong>
          <p>The backend did not return any evidence for this scan.</p>
        </div>
      ) : (
        indicators.map((indicator, i) => (
          <div className="evidence-item" key={i}>
            <strong>{indicator.description || indicator.type || "Indicator"}</strong>
            <p>
              Source: {indicator.source || "unknown"}
              {indicator.severity && ` | Severity: ${indicator.severity}`}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
