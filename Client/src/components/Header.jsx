import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { IoIosLogOut } from "react-icons/io";
import { FaUserCircle } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import Navigation from "./Navigation";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  // Haal het user object op uit de Redux store
  const user = useSelector((state) => state.auth.user);

  // Sluit de dropdown automatisch als je er buiten klikt
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout()); // Wist de Redux state & localStorage
  };

  return (
    <div className="mb-8 border-b border-border pb-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-fg tracking-tight">
          Rack Documentation App
        </h1>

        {/* Dropdown Menu Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-bg-subtle hover:bg-card text-fg-muted font-medium transition cursor-pointer border border-border"
          >
            <FaUserCircle className="text-xl text-fg-subtle" />
            <span className="text-sm">
              Welcome,{" "}
              <strong className="font-semibold text-fg">
                {user?.name || "User"}
              </strong>
              !
            </span>
            <IoChevronDown
              className={`text-sm text-fg-subtle transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menu Card */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-[var(--shadow-border)] border border-border py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs text-fg-subtle">Ingelogd als</p>
                <p className="text-xs font-medium text-fg-muted truncate">
                  {user?.email || ""}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition cursor-pointer font-medium"
              >
                <IoIosLogOut className="text-lg" />
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}

export default Header;
