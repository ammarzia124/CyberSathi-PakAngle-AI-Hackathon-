import { useState } from "react";

export default function TextInput({ onSubmit, loading }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Message</label>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste suspicious message here..."
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
        required
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700"
      >
        {loading ? "Analyzing..." : "Analyze Message"}
      </button>
    </form>
  );
}
