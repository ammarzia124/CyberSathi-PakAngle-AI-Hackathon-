export function UrduPanel({ urduExplanation }) {
  if (!urduExplanation) return null;

  return (
    <div className="urdu-box">
      <strong>&#x627;&#x631;&#x62f;&#x648; &#x648;&#x636;&#x62d;&#x627;&#x637;</strong>
      <p>{urduExplanation}</p>
    </div>
  );
}
