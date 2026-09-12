export default function FileUpload({ onUpload, loading }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Screenshot</label>
      <input type="file" accept="image/*" disabled={loading} />
      <button
        onClick={onUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Screenshot"}
      </button>
    </div>
  );
}
