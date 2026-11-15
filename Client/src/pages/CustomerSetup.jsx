import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiPlus,
  FiTrash2,
  FiMapPin,
  FiGrid,
  FiServer,
} from "react-icons/fi";
import Header from "../components/Header";
import PageHeader from "../components/UI/PageHeader";
import CountrySelect from "../components/UI/CountrySelect";
import { fetchCustomerById, setupCustomer } from "../api/customers";

/**
 * Setup-wizard voor een NIEUWE klant (de klant zelf bestaat al, die maak je op Klantenbeheer).
 * Route: /klanten/:klantId/setup
 *
 * Stappen: Site → Locaties → Racks → Overzicht.
 *  - Elke stap mag overgeslagen worden; afbreken kan altijd (de klant blijft bestaan).
 *  - Er wordt pas iets opgeslagen op "Opslaan" in het overzicht, in één transactie
 *    (POST /customers/:id/setup): alles of niets.
 *  - Meerdere sites: "Nog een site toevoegen" in het overzicht.
 */

const STEPS = ["Site", "Locaties", "Racks", "Overzicht"];

const INPUT =
  "w-full px-3 py-2 border border-border text-sm bg-bg-subtle text-fg focus:outline-none focus:border-accent transition-colors";
const BTN_NEXT =
  "px-4 py-2 text-sm font-medium border border-border bg-bg-subtle text-fg hover:border-accent focus-visible:border-accent focus:outline-none transition-colors cursor-pointer disabled:opacity-50";
const BTN_GHOST =
  "px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg hover:bg-bg-subtle cursor-pointer disabled:opacity-50";
const ICON_BTN =
  "p-2 text-fg-subtle hover:text-destructive cursor-pointer";

const INPUT_ERROR =
  "w-full px-3 py-2 border border-destructive text-sm bg-destructive/10 text-fg focus:outline-none focus:border-destructive transition-colors";
const inputClass = (bad) => (bad ? INPUT_ERROR : INPUT);

let uidCounter = 0;
const uid = () => `k${++uidCounter}`;
const newRack = () => ({ key: uid(), name: "", height_u: 42 });
const newLocation = () => ({ key: uid(), name: "", description: "", racks: [] });

const EMPTY_SITE = {
  name: "",
  street: "",
  house_number: "",
  postal_code: "",
  city: "",
  country: "België",
};

function findDuplicate(names) {
  const seen = new Set();
  for (const n of names) {
    const k = n.trim().toLowerCase();
    if (seen.has(k)) return n.trim();
    seen.add(k);
  }
  return null;
}

function addressLine(site) {
  const street = [site.street, site.house_number].filter(Boolean).join(" ");
  const city = [site.postal_code, site.city].filter(Boolean).join(" ");
  return [street, city, site.country].filter(Boolean).join(", ");
}

// `as="div"` voor velden met een eigen dropdown: in een <label> zouden klikken
// in het uitklapmenu doorgestuurd worden naar de knop en het menu meteen sluiten.
function Field({ label, required, className = "", as: Tag = "label", children }) {
  return (
    <Tag className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold text-fg-muted">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </Tag>
  );
}

export default function CustomerSetup() {
  const { klantId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dashboardPath = `/klanten/${klantId}`;

  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer", klantId],
    queryFn: () => fetchCustomerById(klantId),
    enabled: !!klantId,
  });

  const [step, setStep] = useState(0);
  const [sites, setSites] = useState([]); // afgeronde sites (nog niet opgeslagen)
  const [site, setSite] = useState(EMPTY_SITE); // site die nu ingevuld wordt
  const [locations, setLocations] = useState([newLocation()]);

  // Velden die rood oplichten na "Volgende". Gekoppeld aan de stap, zodat de
  // markering vanzelf verdwijnt zodra je naar een andere stap gaat.
  const [invalidState, setInvalidState] = useState({ step: -1, keys: {} });
  const invalid = invalidState.step === step ? invalidState.keys : {};
  const markInvalid = (keys) => setInvalidState({ step, keys });
  const clearInvalid = (key) =>
    setInvalidState((prev) => {
      if (!prev.keys[key]) return prev;
      const keys = { ...prev.keys };
      delete keys[key];
      return { ...prev, keys };
    });

  const dirty = sites.length > 0 || site.name.trim() !== "";

  const saveMutation = useMutation({
    mutationFn: ({ sites: payload }) => setupCustomer(klantId, payload),
    onSuccess: (data, { openRack }) => {
      queryClient.invalidateQueries({ queryKey: ["customer-overview", klantId] });
      queryClient.invalidateQueries({ queryKey: ["patchplans-index", klantId] });
      toast.success("Klant ingericht");
      const firstRack = data.sites
        .flatMap((s) => s.locations)
        .flatMap((l) => l.racks)[0];
      navigate(
        openRack && firstRack
          ? `/klanten/${klantId}/racks/${firstRack.id}`
          : dashboardPath,
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Opslaan mislukt");
    },
  });

  // ── algemeen ──────────────────────────────────────────────
  const abort = () => {
    if (
      dirty &&
      !window.confirm(
        "Wizard afbreken? Wat je hier invulde wordt niet opgeslagen. De klant zelf blijft bestaan.",
      )
    ) {
      return;
    }
    navigate(dashboardPath);
  };

  const finishSite = (locs) => {
    const trimmed = Object.fromEntries(
      Object.entries(site).map(([k, v]) => [k, v.trim()]),
    );
    setSites((prev) => [...prev, { ...trimmed, locations: locs }]);
    setStep(3);
  };

  const addAnotherSite = () => {
    setSite(EMPTY_SITE);
    setLocations([newLocation()]);
    setStep(0);
  };

  const removeSite = (index) =>
    setSites((prev) => prev.filter((_, i) => i !== index));

  // ── stap 1: site ──────────────────────────────────────────
  const setSiteField = (name, value) => {
    if (name === "name") clearInvalid("site_name");
    setSite((prev) => ({ ...prev, [name]: value }));
  };

  const submitSite = (e) => {
    e.preventDefault();
    const name = site.name.trim();
    if (!name) {
      markInvalid({ site_name: true });
      toast.error("Geef de site een naam");
      return;
    }
    if (sites.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Site "${name}" heb je al toegevoegd`);
      return;
    }
    setStep(1);
  };

  const skipSite = () => {
    if (sites.length === 0) navigate(dashboardPath);
    else setStep(3);
  };

  // ── stap 2: locaties ──────────────────────────────────────
  const setLocationField = (key, field, value) => {
    if (field === "name") clearInvalid(`loc:${key}`);
    setLocations((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)),
    );
  };

  const addLocation = () => setLocations((prev) => [...prev, newLocation()]);

  const removeLocation = (key) =>
    setLocations((prev) =>
      prev.length === 1 ? [newLocation()] : prev.filter((l) => l.key !== key),
    );

  const submitLocations = (e) => {
    e.preventDefault();
    const kept = locations.filter((l) => l.name.trim() || l.description.trim());
    const missingName = kept.filter((l) => !l.name.trim());
    if (missingName.length > 0) {
      markInvalid(
        Object.fromEntries(missingName.map((l) => [`loc:${l.key}`, true])),
      );
      toast.error("Elke locatie heeft een naam nodig");
      return;
    }
    const dup = findDuplicate(kept.map((l) => l.name));
    if (dup) {
      toast.error(`Locatie "${dup}" komt twee keer voor`);
      return;
    }
    if (kept.length === 0) {
      markInvalid({ [`loc:${locations[0].key}`]: true });
      toast.error("Voeg minstens één locatie toe");
      return;
    }
    // Elke locatie start met één lege rack-rij in de volgende stap.
    setLocations(
      kept.map((l) => ({
        ...l,
        racks: l.racks.length ? l.racks : [newRack()],
      })),
    );
    setStep(2);
  };

  const skipLocations = () => finishSite([]);

  // ── stap 3: racks ─────────────────────────────────────────
  const addRack = (locKey) =>
    setLocations((prev) =>
      prev.map((l) =>
        l.key === locKey ? { ...l, racks: [...l.racks, newRack()] } : l,
      ),
    );

  const setRackField = (locKey, rackKey, field, value) =>
    setLocations((prev) =>
      prev.map((l) =>
        l.key !== locKey
          ? l
          : {
              ...l,
              racks: l.racks.map((r) =>
                r.key === rackKey ? { ...r, [field]: value } : r,
              ),
            },
      ),
    );

  const removeRack = (locKey, rackKey) =>
    setLocations((prev) =>
      prev.map((l) =>
        l.key !== locKey
          ? l
          : {
              ...l,
              racks:
                l.racks.length === 1
                  ? [newRack()]
                  : l.racks.filter((r) => r.key !== rackKey),
            },
      ),
    );

  const submitRacks = (e) => {
    e.preventDefault();
    // Minstens één ingevulde rack per locatie, en geldige hoogtes.
    const noRacks = locations.filter(
      (l) => !l.racks.some((r) => r.name.trim()),
    );
    const badHeights = locations
      .flatMap((l) => l.racks)
      .filter((r) => {
        const h = Number(r.height_u);
        return r.name.trim() && (!Number.isInteger(h) || h < 1 || h > 100);
      });
    if (noRacks.length > 0 || badHeights.length > 0) {
      markInvalid({
        ...Object.fromEntries(
          noRacks.map((l) => [`rackname:${l.racks[0]?.key}`, true]),
        ),
        ...Object.fromEntries(badHeights.map((r) => [`rack:${r.key}`, true])),
      });
      toast.error(
        noRacks.length > 0
          ? "Voeg minstens één rack toe aan elke locatie"
          : "De hoogte van een rack moet tussen 1 en 100 U liggen",
      );
      return;
    }
    const cleaned = [];
    for (const l of locations) {
      const racks = l.racks.filter((r) => r.name.trim());
      const dup = findDuplicate(racks.map((r) => r.name));
      if (dup) {
        toast.error(`Rack "${dup}" komt twee keer voor in ${l.name}`);
        return;
      }
      for (const r of racks) {
        const h = Number(r.height_u);
        if (!Number.isInteger(h) || h < 1 || h > 100) {
          toast.error(`Rack "${r.name}": hoogte moet tussen 1 en 100 U liggen`);
          return;
        }
      }
      cleaned.push({
        name: l.name.trim(),
        description: l.description.trim(),
        racks: racks.map((r) => ({
          name: r.name.trim(),
          height_u: Number(r.height_u),
        })),
      });
    }
    finishSite(cleaned);
  };

  const skipRacks = () =>
    finishSite(
      locations.map((l) => ({
        name: l.name.trim(),
        description: l.description.trim(),
        racks: [],
      })),
    );

  // ── render ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg pb-12">
        <Header />
        <div className="flex justify-center items-center h-64 text-fg-subtle font-medium">
          Laden...
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-bg pb-12">
        <Header />
        <div className="mt-8 p-4 bg-destructive/10 border border-destructive/40 text-destructive font-medium text-center">
          Klant niet gevonden.
        </div>
      </div>
    );
  }

  const rackCount = sites.reduce(
    (n, s) => n + s.locations.reduce((m, l) => m + l.racks.length, 0),
    0,
  );
  const locationCount = sites.reduce((n, s) => n + s.locations.length, 0);
  const currentSiteName = site.name.trim();

  return (
    <div className="min-h-screen bg-bg pb-12">
      <Header
        breadcrumb={[
          { label: "Klanten", to: "/" },
          { label: customer.name },
          { label: "Setup" },
        ]}
      />

      <div className="w-full">
        <PageHeader
          title={`Klant Setup — ${customer.name}`}
          subtitle="Zet in een paar stappen de basisstructuur op: site, locaties en racks. Alles is later aanpasbaar op het dashboard, en elke stap mag je overslaan."
          actions={
            <button type="button" onClick={abort} className={BTN_GHOST}>
              Afbreken
            </button>
          }
        />

        {/* Stappen-indicator */}
        <ol className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                  active
                    ? "border-accent bg-bg-subtle text-fg"
                    : done
                      ? "border-border text-fg-muted"
                      : "border-border text-fg-subtle"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center text-[11px] ${
                    active || done
                      ? "bg-accent text-accent-fg"
                      : "bg-bg-subtle text-fg-subtle"
                  }`}
                >
                  {done ? <FiCheck /> : i + 1}
                </span>
                <span className="truncate">{label}</span>
              </li>
            );
          })}
        </ol>

        <section className="bg-card border border-border shadow-[var(--shadow-border)] p-6">
          {/* ── Stap 1: site ── */}
          {step === 0 && (
            <form onSubmit={submitSite} className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-fg inline-flex items-center gap-2">
                  <FiMapPin className="text-fg-subtle" />
                  {sites.length === 0 ? "Eerste site" : `Site ${sites.length + 1}`}
                </h2>
                <p className="text-sm text-fg-subtle mt-1">
                  Een site is een vestiging of gebouw van de klant. Enkel de
                  naam is verplicht.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <Field label="Sitenaam" required className="lg:col-span-6">
                  <input
                    autoFocus
                    type="text"
                    value={site.name}
                    onChange={(e) => setSiteField("name", e.target.value)}
                    placeholder="bijv. Hoofdkantoor"
                    aria-invalid={!!invalid.site_name}
                    className={inputClass(invalid.site_name)}
                  />
                </Field>
                <Field label="Straat" className="lg:col-span-3">
                  <input
                    type="text"
                    value={site.street}
                    onChange={(e) => setSiteField("street", e.target.value)}
                    placeholder="bijv. Kerkstraat"
                    className={INPUT}
                  />
                </Field>
                <Field label="Huisnummer" className="lg:col-span-1">
                  <input
                    type="text"
                    value={site.house_number}
                    onChange={(e) => setSiteField("house_number", e.target.value)}
                    placeholder="bijv. 12A"
                    className={INPUT}
                  />
                </Field>
                <Field label="Postcode" className="lg:col-span-2">
                  <input
                    type="text"
                    value={site.postal_code}
                    onChange={(e) => setSiteField("postal_code", e.target.value)}
                    placeholder="bijv. 2000"
                    className={INPUT}
                  />
                </Field>
                <Field label="Stad" className="lg:col-span-3">
                  <input
                    type="text"
                    value={site.city}
                    onChange={(e) => setSiteField("city", e.target.value)}
                    placeholder="bijv. Antwerpen"
                    className={INPUT}
                  />
                </Field>
                <Field label="Land" as="div" className="lg:col-span-3">
                  <CountrySelect
                    value={site.country}
                    onChange={(name) => setSiteField("country", name)}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <button type="button" onClick={skipSite} className={BTN_GHOST}>
                  {sites.length === 0 ? "Setup overslaan" : "Overslaan"}
                </button>
                <button type="submit" className={BTN_NEXT}>
                  Volgende: locaties
                </button>
              </div>
            </form>
          )}

          {/* ── Stap 2: locaties ── */}
          {step === 1 && (
            <form onSubmit={submitLocations} className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-fg inline-flex items-center gap-2">
                  <FiGrid className="text-fg-subtle" />
                  Locaties van {currentSiteName}
                </h2>
                <p className="text-sm text-fg-subtle mt-1">
                  Een locatie is een ruimte binnen de site, zoals een
                  serverruimte of een technische kast. Lege rijen worden
                  genegeerd. Voeg minstens één locatie toe om verder te gaan.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {locations.map((l, i) => (
                  <div
                    key={l.key}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_auto] gap-3 items-end"
                  >
                    <Field label={i === 0 ? "Naam" : "\u00A0"} required={i === 0}>
                      <input
                        autoFocus={i === 0}
                        type="text"
                        value={l.name}
                        onChange={(e) =>
                          setLocationField(l.key, "name", e.target.value)
                        }
                        placeholder="bijv. Serverruimte"
                        aria-invalid={!!invalid[`loc:${l.key}`]}
                        className={inputClass(invalid[`loc:${l.key}`])}
                      />
                    </Field>
                    <Field label={i === 0 ? "Omschrijving (optioneel)" : "\u00A0"}>
                      <input
                        type="text"
                        value={l.description}
                        onChange={(e) =>
                          setLocationField(l.key, "description", e.target.value)
                        }
                        placeholder="bijv. Kelder, gebouw B"
                        className={INPUT}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => removeLocation(l.key)}
                      className={ICON_BTN}
                      title="Verwijderen"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addLocation}
                className={`${BTN_GHOST} inline-flex items-center gap-1.5 w-fit`}
              >
                <FiGrid /> Nog een locatie toevoegen
              </button>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className={BTN_GHOST}
                  >
                    Terug
                  </button>
                  <button
                    type="button"
                    onClick={skipLocations}
                    className={BTN_GHOST}
                  >
                    Overslaan
                  </button>
                </div>
                <button type="submit" className={BTN_NEXT}>
                  Volgende: racks
                </button>
              </div>
            </form>
          )}

          {/* ── Stap 3: racks ── */}
          {step === 2 && (
            <form onSubmit={submitRacks} noValidate className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-fg inline-flex items-center gap-2">
                  <FiServer className="text-fg-subtle" />
                  Racks in {currentSiteName}
                </h2>
                <p className="text-sm text-fg-subtle mt-1">
                  Voeg per locatie de racks toe. Standaard is een rack 42U
                  hoog. Lege rijen worden genegeerd. Elke locatie heeft minstens
                  één rack nodig om verder te gaan.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {locations.map((l) => (
                  <div
                    key={l.key}
                    className="border border-border bg-bg-subtle p-4 flex flex-col gap-3"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle inline-flex items-center gap-1.5">
                      <FiGrid className="text-sm" />
                      {l.name}
                    </h3>

                    {l.racks.map((r, i) => (
                      <div
                        key={r.key}
                        className="grid grid-cols-[1fr_6rem_auto] gap-2 items-end"
                      >
                        <Field
                          label={
                            i === 0 ? (
                              <span className="inline-flex items-center gap-1.5">
                                <FiServer className="text-sm" />
                                Rack
                              </span>
                            ) : (
                              "\u00A0"
                            )
                          }
                          required={i === 0}
                        >
                          <input
                            type="text"
                            value={r.name}
                            onChange={(e) => {
                              clearInvalid(`rackname:${r.key}`);
                              setRackField(l.key, r.key, "name", e.target.value);
                            }}
                            placeholder="bijv. Rack 01"
                            aria-invalid={!!invalid[`rackname:${r.key}`]}
                            className={inputClass(invalid[`rackname:${r.key}`])}
                          />
                        </Field>
                        <Field label={i === 0 ? "Hoogte (U)" : "\u00A0"}>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            placeholder="42"
                            value={r.height_u}
                            onChange={(e) => {
                              clearInvalid(`rack:${r.key}`);
                              setRackField(
                                l.key,
                                r.key,
                                "height_u",
                                e.target.value,
                              );
                            }}
                            aria-invalid={!!invalid[`rack:${r.key}`]}
                            className={inputClass(invalid[`rack:${r.key}`])}
                          />
                        </Field>
                        <button
                          type="button"
                          onClick={() => removeRack(l.key, r.key)}
                          className={ICON_BTN}
                          title="Verwijderen"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addRack(l.key)}
                      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent hover:text-fg cursor-pointer"
                    >
                      <FiPlus /> Rack toevoegen
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={BTN_GHOST}
                  >
                    Terug
                  </button>
                  <button
                    type="button"
                    onClick={skipRacks}
                    className={BTN_GHOST}
                  >
                    Overslaan
                  </button>
                </div>
                <button type="submit" className={BTN_NEXT}>
                  Volgende: overzicht
                </button>
              </div>
            </form>
          )}

          {/* ── Stap 4: overzicht ── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-fg">Overzicht</h2>
                <p className="text-sm text-fg-subtle mt-1">
                  {sites.length === 0
                    ? "Er is niets om op te slaan."
                    : `${sites.length} ${sites.length === 1 ? "site" : "sites"}, ${locationCount} ${locationCount === 1 ? "locatie" : "locaties"}, ${rackCount} ${rackCount === 1 ? "rack" : "racks"}. Er wordt pas iets opgeslagen als je hieronder bevestigt.`}
                </p>
              </div>

              {sites.length > 0 && (
                <ul className="flex flex-col gap-4">
                  {sites.map((s, i) => (
                    <li key={`${s.name}-${i}`} className="border border-border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
                            <FiMapPin className="text-fg-subtle shrink-0" />
                            {s.name}
                          </p>
                          {addressLine(s) && (
                            <p className="mt-0.5 text-xs text-fg-subtle">
                              {addressLine(s)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSite(i)}
                          disabled={saveMutation.isPending}
                          className={ICON_BTN}
                          title="Site verwijderen uit setup"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      {s.locations.length === 0 ? (
                        <p className="mt-3 text-xs italic text-fg-subtle">
                          Geen locaties
                        </p>
                      ) : (
                        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {s.locations.map((l) => (
                            <li
                              key={l.name}
                              className="border border-border bg-bg-subtle p-3"
                            >
                              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg">
                                <FiGrid className="text-fg-subtle shrink-0" />
                                {l.name}
                              </p>
                              {l.racks.length === 0 ? (
                                <p className="mt-2 text-xs italic text-fg-subtle">
                                  Geen racks
                                </p>
                              ) : (
                                <ul className="mt-2 flex flex-col gap-1">
                                  {l.racks.map((r) => (
                                    <li
                                      key={r.name}
                                      className="flex items-center justify-between gap-2 text-xs text-fg-muted"
                                    >
                                      <span className="inline-flex items-center gap-1.5 truncate">
                                        <FiServer className="text-fg-subtle shrink-0" />
                                        {r.name}
                                      </span>
                                      <span className="tabular-nums text-fg-subtle">
                                        {r.height_u}U
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={addAnotherSite}
                  disabled={saveMutation.isPending}
                  className={`${BTN_GHOST} inline-flex items-center gap-1.5 w-fit`}
                >
                  <FiMapPin /> Nog een site toevoegen
                </button>

                {sites.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate(dashboardPath)}
                    className={BTN_NEXT}
                  >
                    Naar dashboard
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {rackCount > 0 && (
                      <button
                        type="button"
                        disabled={saveMutation.isPending}
                        onClick={() =>
                          saveMutation.mutate({ sites, openRack: true })
                        }
                        className={BTN_NEXT}
                      >
                        Opslaan en eerste rack openen
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={saveMutation.isPending}
                      onClick={() =>
                        saveMutation.mutate({ sites, openRack: false })
                      }
                      className={BTN_NEXT}
                    >
                      {saveMutation.isPending
                        ? "Bezig met opslaan..."
                        : "Opslaan en naar dashboard"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
