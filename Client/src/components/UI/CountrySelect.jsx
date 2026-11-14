import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";
import { countries } from "country-data-list";
// Vlaggen worden door Vite mee gebundeld (geen CDN) → werkt ook offline.
import "flag-icons/css/flag-icons.min.css";

/**
 * Landkeuze met zoekveld en vlaggetjes. Werkt volledig offline:
 *  - landenlijst: `country-data-list` (zit in de bundle)
 *  - Nederlandse landnamen: `Intl.DisplayNames` (zit in de browser)
 *  - vlaggen: `flag-icons` (svg's in de bundle)
 *
 * `value` en `onChange` werken met de (Nederlandse) landnaam als string, zodat
 * de bestaande `country`-kolom en API ongewijzigd blijven. Een waarde die niet
 * in de lijst staat (oude vrije tekst) wordt gewoon getoond, zonder vlag.
 */

const nlNames = new Intl.DisplayNames(["nl"], { type: "region" });

export const COUNTRY_OPTIONS = countries.all
  .filter((c) => c.status === "assigned" || c.alpha2 === "XK")
  .map((c) => {
    const nl = nlNames.of(c.alpha2);
    return {
      code: c.alpha2.toLowerCase(),
      name: nl && nl !== c.alpha2 ? nl : c.name,
      englishName: c.name,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "nl"));

const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const SEARCHABLE = COUNTRY_OPTIONS.map((c) => ({
  ...c,
  haystack: normalize(`${c.name} ${c.englishName} ${c.code}`),
}));

function findByName(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return (
    COUNTRY_OPTIONS.find(
      (c) => c.name.toLowerCase() === n || c.englishName.toLowerCase() === n,
    ) ?? null
  );
}

function Flag({ code }) {
  return <span className={`fi fi-${code} shrink-0`} aria-hidden="true" />;
}

export default function CountrySelect({
  value = "",
  onChange,
  placeholder = "Kies een land",
  className = "",
  id,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = findByName(value);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? SEARCHABLE.filter((c) => c.haystack.includes(q)) : SEARCHABLE;
  }, [query]);

  // Sluit bij klik buiten de dropdown.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Zoekveld focussen bij openen.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Actief item in beeld houden bij pijltjes-navigatie.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openDropdown = () => {
    const idx = selected ? SEARCHABLE.findIndex((c) => c.code === selected.code) : 0;
    setQuery("");
    setActive(Math.max(idx, 0));
    setOpen(true);
  };

  const choose = (country) => {
    onChange?.(country ? country.name : "");
    setOpen(false);
  };

  const onSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // Voorkomt dat Enter het omliggende formulier (wizard) indient.
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 border border-border text-sm bg-bg-subtle text-fg text-left focus:outline-none focus:border-accent transition-colors cursor-pointer"
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <Flag code={selected.code} />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : value ? (
          <span className="truncate">{value}</span>
        ) : (
          <span className="text-fg-subtle">{placeholder}</span>
        )}
        <FiChevronDown
          className={`shrink-0 text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 border border-border bg-card shadow-[var(--shadow-border)]">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <FiSearch className="shrink-0 text-fg-subtle" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Zoek land..."
              className="w-full py-2 text-sm bg-transparent text-fg focus:outline-none"
            />
          </div>

          <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => choose(null)}
                  className="w-full px-3 py-2 text-left text-sm italic text-fg-subtle hover:bg-bg-subtle cursor-pointer"
                >
                  Geen land
                </button>
              </li>
            )}

            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-fg-subtle">
                Geen land gevonden.
              </li>
            ) : (
              filtered.map((c, i) => (
                <li key={c.code}>
                  <button
                    type="button"
                    data-index={i}
                    role="option"
                    aria-selected={selected?.code === c.code}
                    onClick={() => choose(c)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg cursor-pointer ${
                      i === active ? "bg-bg-subtle" : ""
                    }`}
                  >
                    <Flag code={c.code} />
                    <span className="flex-1 truncate">{c.name}</span>
                    {selected?.code === c.code && (
                      <FiCheck className="shrink-0 text-accent" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
