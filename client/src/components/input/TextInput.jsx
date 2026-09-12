export default function TextInput({ onSubmit, loading }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Message</label>
      <textarea
        rows={4}
        placeholder="Paste suspicious message here..."
        className="w-full border rounded px-3 py-2"
        disabled={loading}
      />
      <button
        onClick={onSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Message"}
      </button>
    </div>
  );
}
