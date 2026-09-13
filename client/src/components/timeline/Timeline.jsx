export function Timeline({ events }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Investigation Timeline</h3>
      {!events || events.length === 0 ? (
        <p className="text-gray-500">No events recorded.</p>
      ) : (
        <div className="border-l-2 border-gray-200 pl-4 space-y-4">
          {events.map((event, i) => (
            <div key={event.id || i} className="relative">
              <div className={`absolute -left-6 w-3 h-3 rounded-full ${
                event.status === "completed" ? "bg-green-500" :
                event.status === "failed" ? "bg-red-500" : "bg-blue-500"
              }`} />
              <p className="text-sm text-gray-800">{event.name}</p>
              <p className="text-xs text-gray-400">
                {event.timestamp && new Date(event.timestamp).toLocaleTimeString("en-PK")}
                {event.status && ` — ${event.status}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
