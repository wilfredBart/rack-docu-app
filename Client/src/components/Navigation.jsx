import { NavLink } from "react-router-dom";

function Navigation() {
  const linkStyle = ({ isActive }) =>
    `px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
      isActive
        ? "bg-blue-600 text-white shadow-xs"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <nav className="flex gap-2 p-1 bg-gray-50/80 rounded-xl border border-gray-100 w-fit">
      <NavLink to="/" className={linkStyle}>
        Home
      </NavLink>
      <NavLink to="/patchplan" className={linkStyle}>
        Patchplan
      </NavLink>
      <NavLink to="/klanten" className={linkStyle}>
        Klanten
      </NavLink>
    </nav>
  );
}

export default Navigation;
