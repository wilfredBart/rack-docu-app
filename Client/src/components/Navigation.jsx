import { NavLink, useParams } from "react-router-dom";

function Navigation() {
  const { klantId } = useParams();

  const linkStyle = ({ isActive }) =>
    `px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
      isActive
        ? "bg-blue-600 text-white shadow-xs"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <nav className="flex gap-2 p-1 bg-gray-50/80 rounded-xl border border-gray-100 w-fit">
      <NavLink to="/" end className={linkStyle}>
        Klanten
      </NavLink>

      {klantId && (
        <>
          <NavLink to={`/klanten/${klantId}`} end className={linkStyle}>
            Overzicht
          </NavLink>
          <NavLink to={`/klanten/${klantId}/patchplan`} className={linkStyle}>
            Patchplan
          </NavLink>
        </>
      )}
    </nav>
  );
}

export default Navigation;
