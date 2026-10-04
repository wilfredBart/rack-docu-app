import { NavLink } from "react-router-dom";

function Navigation() {
  const linkStyle = ({ isActive }) =>
    `px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
      isActive
        ? "bg-accent text-accent-fg shadow-xs"
        : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
    }`;

  return (
    <nav className="flex gap-2 p-1 bg-bg-subtle rounded-xl border border-border w-fit">
      <NavLink to="/" end className={linkStyle}>
        Klanten
      </NavLink>
    </nav>
  );
}

export default Navigation;