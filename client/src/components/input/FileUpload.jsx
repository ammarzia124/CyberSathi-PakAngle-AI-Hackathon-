export default function FileUpload({ onChange, loading }) {
  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      disabled={loading}
    />
  );
}
