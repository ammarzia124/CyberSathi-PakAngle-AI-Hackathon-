import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <NavLink to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
        CyberSathi
      </NavLink>
      <div className="flex items-center gap-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`
          }
        >
          Scan
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`
          }
        >
          Dashboard
        </NavLink>
      </div>
    </nav>
  );
}
