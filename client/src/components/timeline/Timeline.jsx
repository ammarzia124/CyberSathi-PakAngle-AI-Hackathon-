export function Timeline({ events }) {
  const steps = events && events.length > 0
    ? events
    : [
        { name: "Input Received", description: "Investigation step completed by CyberSathi." },
        { name: "Content Analysis", description: "Investigation step completed by CyberSathi." },
        { name: "URL / Message Inspection", description: "Investigation step completed by CyberSathi." },
        { name: "Threat Indicators", description: "Investigation step completed by CyberSathi." },
        { name: "Evidence Collection", description: "Investigation step completed by CyberSathi." },
        { name: "Risk Assessment", description: "Investigation step completed by CyberSathi." },
        { name: "Threat Classification", description: "Investigation step completed by CyberSathi." },
        { name: "Final Verdict", description: "Investigation step completed by CyberSathi." },
      ];

  return (
    <div className="timeline">
      <div className="timeline-heading">
        <span>INVESTIGATION</span>
        <h2>Show me how you detected it</h2>
      </div>
      <div className="timeline-list">
        {steps.map((step, i) => (
          <div className="timeline-item" key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h4>{step.name || step.step || `Step ${i + 1}`}</h4>
              <p>{step.description || step.status || "Investigation step completed by CyberSathi."}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
