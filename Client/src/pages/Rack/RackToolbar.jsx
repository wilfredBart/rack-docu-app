import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiChevronDown,
  FiHardDrive,
  FiGrid,
  FiLayers,
  FiPlus,
  FiTag,
} from "react-icons/fi";

export const ADD_KIND_OPTIONS = [
  {
    kind: "device",
    label: "Device",
    description: "Switch, router, firewall, server, …",
    icon: FiHardDrive,
  },
  {
    kind: "patch_panel",
    label: "Patch panel",
    description: "Patchpaneel met poorten",
    icon: FiGrid,
  },
  {
    kind: "cable_management",
    label: "Cable management",
    description: "Borstel / vingers organizer",
    icon: FiLayers,
  },
];

/**
 * Samenhangende toolbar op rack detail:
 * Toevoegen ▾ | Patchplannen | VLAN beheer
 *
 * Geen overflow-hidden op de nav: dat knipte het dropdown-menu af.
 */
export default function RackToolbar({
  disabled = false,
  onAdd,
  patchplanTo,
  /** Bouwt VLAN-link met rackId zodat breadcrumb terug naar dit rack gaat. */
  klantId,
  rackId,
  vlanTo: vlanToOverride,
}) {
  const vlanTo =
    vlanToOverride ||
    (klantId && rackId
      ? `/klanten/${klantId}/vlans?rackId=${rackId}`
      : klantId
        ? `/klanten/${klantId}/vlans`
        : "/");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePick(kind) {
    setAddMenuOpen(false);
    onAdd?.(kind);
  }

  const itemClass =
    "inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-fg hover:bg-bg-subtle transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  return (
    <nav
      className="relative z-30 mb-4 flex flex-wrap items-stretch rounded-xl border border-border bg-card shadow-[var(--shadow-border)]"
      aria-label="Rack toolbox"
    >
      {/* Toevoegen */}
      <div className="relative border-r border-border" ref={addMenuRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAddMenuOpen((open) => !open)}
          aria-expanded={addMenuOpen}
          aria-haspopup="menu"
          className={`${itemClass} rounded-l-xl`}
        >
          <FiPlus className="text-fg-subtle" />
          Toevoegen
          <FiChevronDown
            className={`text-fg-subtle transition-transform ${addMenuOpen ? "rotate-180" : ""}`}
          />
        </button>
        {addMenuOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-border bg-card py-1.5 shadow-lg"
          >
            {ADD_KIND_OPTIONS.map(({ kind, label, description, icon: Icon }) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                onClick={() => handlePick(kind)}
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-bg-subtle transition cursor-pointer first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-subtle text-fg-muted">
                  <Icon className="text-base" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{label}</span>
                  <span className="block text-xs text-fg-subtle">{description}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patchplannen */}
      <Link to={patchplanTo} className={`${itemClass} border-r border-border`}>
        <FiBox className="text-fg-subtle" />
        Patchplannen
      </Link>

      {/* VLAN beheer */}
      <Link to={vlanTo} className={`${itemClass} rounded-r-xl`}>
        <FiTag className="text-fg-subtle" />
        VLAN beheer
      </Link>
    </nav>
  );
}
