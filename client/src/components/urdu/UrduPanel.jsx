export function UrduPanel({ urduExplanation }) {
  if (!urduExplanation) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4" dir="rtl">
      <h3 className="text-lg font-semibold mb-2 text-right">اردو وضاحت</h3>
      <p className="text-gray-700 text-right">{urduExplanation}</p>
    </div>
  );
}
