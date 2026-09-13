import { useState } from "react";

export default function UrlInput({ onSubmit, loading }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">URL</label>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
        required
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700"
      >
        {loading ? "Analyzing..." : "Analyze URL"}
      </button>
    </form>
  );
}
