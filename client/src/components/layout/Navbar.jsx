import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="logo" style={{ textDecoration: "none" }}>
        <span>&#x1f6e1;&#xfe0f;</span>
        <div>
          <h2>CyberSathi</h2>
          <p>Cyber Safety Assistant</p>
        </div>
      </NavLink>
      <nav>
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Scan
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>
        <a href="#about">About</a>
      </nav>
    </header>
  );
}
