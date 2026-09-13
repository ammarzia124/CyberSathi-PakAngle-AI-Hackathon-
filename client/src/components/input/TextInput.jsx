export default function TextInput({ value, onChange, loading }) {
  return (
    <textarea
      placeholder="Paste your suspicious message here..."
      rows="4"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
    />
  );
}
