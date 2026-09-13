import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="app">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4" style={{ color: "#d1d5db" }}>404</h1>
          <p className="mb-4" style={{ color: "#687284" }}>Page not found</p>
          <Link to="/" style={{ color: "#315fd4", textDecoration: "underline" }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
