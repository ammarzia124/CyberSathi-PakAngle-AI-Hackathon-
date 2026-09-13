export default function UrlInput({ value, onChange, loading }) {
  return (
    <input
      type="text"
      placeholder="https://example.com"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
    />
  );
}
