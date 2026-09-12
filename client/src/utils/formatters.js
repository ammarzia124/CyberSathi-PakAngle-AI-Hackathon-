export function formatScore(score) {
  return `${Math.round(score)}/100`;
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
