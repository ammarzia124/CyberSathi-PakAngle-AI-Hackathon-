import { useState, useRef } from "react";

export default function FileUpload({ onUpload, loading }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload(file);
    }
  };

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Screenshot</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleChange}
        disabled={loading}
        className="w-full border rounded px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {file && (
        <p className="text-sm text-gray-500">{file.name}</p>
      )}
      <button
        type="submit"
        disabled={loading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700"
      >
        {loading ? "Analyzing..." : "Analyze Screenshot"}
      </button>
    </form>
  );
}
