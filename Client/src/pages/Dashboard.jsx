import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { fetchCustomerOverview } from "../api/customers";
import { createSite, updateSite, deleteSite } from "../api/sites";
import {
  createLocation,
  updateLocation,
  deleteLocation,
} from "../api/locations";
import { createRack, updateRack, deleteRack } from "../api/racks";
import Header from "../components/Header";
import Modal from "../components/UI/Modal";
import FormModal from "../components/UI/FormModal";
import {
  FiArrowLeft,
  FiChevronRight,
  FiMapPin,
  FiServer,
  FiHardDrive,
  FiGrid,
  FiBox,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiExternalLink,
} from "react-icons/fi";

const KPI_ITEMS = [
  { key: "sites", label: "Sites", icon: FiMapPin },
  { key: "locations", label: "Locaties", icon: FiGrid },
  { key: "racks", label: "Racks", icon: FiServer },
  { key: "devices", label: "Devices", icon: FiHardDrive },
  { key: "patch_panels", label: "Patch panels", icon: FiBox },
];

const SITE_FIELDS = [
  { name: "name", label: "Sitenaam", type: "text", required: true },
  { name: "street", label: "Straat", type: "text" },
  { name: "house_number", label: "Huisnummer", type: "text" },
  { name: "postal_code", label: "Postcode", type: "text" },
  { name: "city", label: "Stad", type: "text" },
  { name: "country", label: "Land", type: "text" },
];

const EMPTY_SITE = {
  name: "",
  street: "",
  house_number: "",
  postal_code: "",
  city: "",
  country: "",
};

const LOCATION_FIELDS = [
  { name: "name", label: "Naam", type: "text", required: true },
  { name: "description", label: "Omschrijving", type: "textarea" },
];

const EMPTY_LOCATION = {
  name: "",
  description: "",
};

const RACK_FIELDS = [
  { name: "name", label: "Naam", type: "text", required: true },
  { name: "height_u", label: "Hoogte (U)", type: "number", required: true },
  { name: "notes", label: "Notities", type: "textarea" },
];

const EMPTY_RACK = {
  name: "",
  height_u: 42,
  notes: "",
};

function occupancyPercent(rack) {
  const total = Number(rack.height_u) || 0;
  if (!total) return 0;
  const used = Number(rack.occupied_u) || 0;
  return Math.min(100, Math.round((used / total) * 100));
}

function formatAddress(site) {
  const line = [site.street, site.house_number].filter(Boolean).join(" ");
  const cityLine = [site.postal_code, site.city].filter(Boolean).join(" ");
  const parts = [line, cityLine, site.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export default function Dashboard() {
  const { klantId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState(null);

  const [rackModalOpen, setRackModalOpen] = useState(false);
  const [rackModalLocationId, setRackModalLocationId] = useState(null);
  const [editingRack, setEditingRack] = useState(null);
  const [deleteRackTarget, setDeleteRackTarget] = useState(null);

  const overviewQueryKey = ["customer-overview", klantId];

  const {
    data: overview,
    isLoading,
    error,
  } = useQuery({
    queryKey: overviewQueryKey,
    queryFn: () => fetchCustomerOverview(klantId),
    enabled: !!klantId,
  });

  const sites = overview?.sites ?? [];

  useEffect(() => {
    if (!sites.length) {
      setSelectedSiteId(null);
      return;
    }
    const stillExists = sites.some((s) => s.id === selectedSiteId);
    if (!stillExists) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  const filteredSites = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const city = (s.city || "").toLowerCase();
      return name.includes(q) || city.includes(q);
    });
  }, [sites, searchTerm]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) ?? null;

  const invalidateOverview = () =>
    queryClient.invalidateQueries({ queryKey: overviewQueryKey });

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: (created) => {
      invalidateOverview();
      if (created?.id) setSelectedSiteId(created.id);
      toast.success("Site aangemaakt");
      setSiteModalOpen(false);
      setEditingSite(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij aanmaken van site");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSite,
    onSuccess: () => {
      invalidateOverview();
      toast.success("Site bijgewerkt");
      setSiteModalOpen(false);
      setEditingSite(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij bijwerken van site");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: (data) => {
      invalidateOverview();
      toast.success(data?.message || "Site verwijderd");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij verwijderen van site",
      );
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      invalidateOverview();
      toast.success("Locatie aangemaakt");
      setLocationModalOpen(false);
      setEditingLocation(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij aanmaken van locatie",
      );
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      invalidateOverview();
      toast.success("Locatie bijgewerkt");
      setLocationModalOpen(false);
      setEditingLocation(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij bijwerken van locatie",
      );
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: (data) => {
      invalidateOverview();
      toast.success(data?.message || "Locatie verwijderd");
      setDeleteLocationTarget(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij verwijderen van locatie",
      );
    },
  });

  const openNewLocation = () => {
    setEditingLocation(null);
    setLocationModalOpen(true);
  };

  const openEditLocation = (location) => {
    setEditingLocation(location);
    setLocationModalOpen(true);
  };

  const handleLocationSubmit = (values) => {
    const payload = {
      name: values.name,
      description: values.description || null,
    };

    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, ...payload });
    } else {
      createLocationMutation.mutate({
        site_id: selectedSite.id,
        ...payload,
      });
    }
  };

  const createRackMutation = useMutation({
    mutationFn: createRack,
    onSuccess: () => {
      invalidateOverview();
      toast.success("Rack aangemaakt");
      setRackModalOpen(false);
      setEditingRack(null);
      setRackModalLocationId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij aanmaken van rack");
    },
  });

  const updateRackMutation = useMutation({
    mutationFn: updateRack,
    onSuccess: () => {
      invalidateOverview();
      toast.success("Rack bijgewerkt");
      setRackModalOpen(false);
      setEditingRack(null);
      setRackModalLocationId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij bijwerken van rack");
    },
  });

  const deleteRackMutation = useMutation({
    mutationFn: deleteRack,
    onSuccess: (data) => {
      invalidateOverview();
      toast.success(data?.message || "Rack verwijderd");
      setDeleteRackTarget(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij verwijderen van rack",
      );
    },
  });

  const openNewRack = (locationId) => {
    setEditingRack(null);
    setRackModalLocationId(locationId);
    setRackModalOpen(true);
  };

  const openEditRack = (rack, locationId) => {
    setEditingRack(rack);
    setRackModalLocationId(locationId);
    setRackModalOpen(true);
  };

  const handleRackSubmit = (values) => {
    const payload = {
      name: values.name,
      height_u: Number(values.height_u) || 42,
      notes: values.notes || null,
    };

    if (editingRack) {
      updateRackMutation.mutate({ id: editingRack.id, ...payload });
    } else {
      createRackMutation.mutate({
        location_id: rackModalLocationId,
        ...payload,
      });
    }
  };

  const openNewSite = () => {
    setEditingSite(null);
    setSiteModalOpen(true);
  };

  const openEditSite = (site) => {
    setEditingSite(site);
    setSiteModalOpen(true);
  };

  const handleSiteSubmit = (values) => {
    const payload = {
      name: values.name,
      street: values.street || null,
      house_number: values.house_number || null,
      postal_code: values.postal_code || null,
      city: values.city || null,
      country: values.country || null,
    };

    if (editingSite) {
      updateMutation.mutate({ id: editingSite.id, ...payload });
    } else {
      createMutation.mutate({
        customer_id: Number(klantId),
        ...payload,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <Header />
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Laden van klantgegevens...
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <Header />
        <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-center">
          Er is een fout opgetreden bij het laden van de klantgegevens.
        </div>
      </div>
    );
  }

  const stats = overview.stats ?? {
    sites: 0,
    locations: 0,
    racks: 0,
    devices: 0,
    patch_panels: 0,
  };

  const address = selectedSite ? formatAddress(selectedSite) : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 hover:text-gray-800 transition font-medium"
          >
            <FiArrowLeft className="text-base" />
            Klanten
          </Link>
          <FiChevronRight className="text-gray-300" />
          <span className="text-gray-800 font-medium">{overview.name}</span>
        </nav>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {overview.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Infrastructuur-overzicht
            </p>
          </div>
          <button
            type="button"
            onClick={openNewSite}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm cursor-pointer"
          >
            <FiPlus /> Nieuwe site
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {KPI_ITEMS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 text-gray-400">
                <Icon className="text-base" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">
                {stats[key] ?? 0}
              </div>
            </div>
          ))}
        </div>

        {sites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-slate-50 border border-gray-200 flex items-center justify-center text-gray-400">
              <FiMapPin className="text-xl" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Nog geen sites
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Er zijn nog geen vestigingen gekoppeld aan {overview.name}.
            </p>
            <button
              type="button"
              onClick={openNewSite}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm cursor-pointer"
            >
              <FiPlus /> Eerste site toevoegen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
            <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 h-fit">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-1 mb-2">
                Sites
              </p>
              <div className="relative mb-2">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Zoek op naam of stad..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              {filteredSites.length === 0 ? (
                <p className="text-sm text-gray-400 px-1 py-3">
                  Geen sites gevonden.
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredSites.map((site) => {
                    const active = site.id === selectedSiteId;
                    return (
                      <li key={site.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSiteId(site.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl border transition cursor-pointer ${
                            active
                              ? "border-blue-200 bg-blue-50"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                        >
                          <span className="block text-sm font-semibold text-gray-900">
                            {site.name}
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1 truncate">
                              <FiMapPin className="shrink-0" />
                              {site.city || "Geen stad"}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {site.rack_count ?? 0}{" "}
                              {(site.rack_count ?? 0) === 1 ? "rack" : "racks"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {selectedSite ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedSite.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1 inline-flex items-start gap-1.5">
                        <FiMapPin className="mt-0.5 shrink-0" />
                        {address || (
                          <span className="italic">Geen adres opgegeven</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/klanten/${klantId}/patchplan?siteId=${selectedSite.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                      >
                        <FiBox className="text-base" /> Patchplan
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditSite(selectedSite)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 cursor-pointer"
                        title="Bewerken"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(selectedSite)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 cursor-pointer"
                        title="Verwijderen"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Locaties
                    </h3>
                    <button
                      type="button"
                      onClick={openNewLocation}
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                    >
                      <FiPlus /> Nieuwe locatie
                    </button>
                  </div>

                  {(selectedSite.locations ?? []).length === 0 ? (
                    <div className="mt-3 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <p className="text-sm text-gray-400">
                        Nog geen locaties voor deze site.
                      </p>
                      <button
                        type="button"
                        onClick={openNewLocation}
                        className="mt-3 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                      >
                        <FiPlus /> Eerste locatie toevoegen
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedSite.locations.map((location) => (
                        <div
                          key={location.id}
                          className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <FiFolder className="text-gray-400 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {location.name}
                                </p>
                                {location.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {location.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditLocation(location)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 cursor-pointer"
                                title="Bewerken"
                              >
                                <FiEdit2 className="text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteLocationTarget(location)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 cursor-pointer"
                                title="Verwijderen"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              {(location.racks?.length ?? 0)}{" "}
                              {(location.racks?.length ?? 0) === 1
                                ? "rack"
                                : "racks"}
                            </p>
                            <button
                              type="button"
                              onClick={() => openNewRack(location.id)}
                              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              <FiPlus className="text-xs" /> Rack
                            </button>
                          </div>

                          {(location.racks?.length ?? 0) > 0 && (
                            <ul className="flex flex-col gap-1.5 mt-1">
                              {location.racks.map((rack) => {
                                const pct = occupancyPercent(rack);
                                return (
                                  <li
                                    key={rack.id}
                                    className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-2 bg-slate-50/50"
                                  >
                                    <FiServer className="text-gray-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-gray-800 truncate">
                                          {rack.name}
                                        </span>
                                        <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
                                          {rack.occupied_u ?? 0}/{rack.height_u}U
                                        </span>
                                      </div>
                                      <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            pct >= 90
                                              ? "bg-red-500"
                                              : pct >= 70
                                                ? "bg-amber-500"
                                                : "bg-blue-500"
                                          }`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate(
                                            `/klanten/${klantId}/racks/${rack.id}`,
                                          )
                                        }
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 cursor-pointer"
                                        title="Openen"
                                      >
                                        <FiExternalLink className="text-sm" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEditRack(rack, location.id)
                                        }
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 cursor-pointer"
                                        title="Bewerken"
                                      >
                                        <FiEdit2 className="text-sm" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeleteRackTarget(rack)
                                        }
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 cursor-pointer"
                                        title="Verwijderen"
                                      >
                                        <FiTrash2 className="text-sm" />
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Selecteer een site.</p>
              )}
            </section>
          </div>
        )}
      </div>

      <FormModal
        key={editingSite?.id ?? "new-site"}
        isOpen={siteModalOpen}
        onClose={() => {
          setSiteModalOpen(false);
          setEditingSite(null);
        }}
        title={editingSite ? "Site bewerken" : "Nieuwe site"}
        fields={SITE_FIELDS}
        initialValues={
          editingSite
            ? {
                name: editingSite.name || "",
                street: editingSite.street || "",
                house_number: editingSite.house_number || "",
                postal_code: editingSite.postal_code || "",
                city: editingSite.city || "",
                country: editingSite.country || "",
              }
            : EMPTY_SITE
        }
        onSubmit={handleSiteSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Site verwijderen"
      >
        <p className="text-sm text-gray-600">
          Weet je zeker dat je <strong>{deleteTarget?.name}</strong> wilt
          verwijderen?
          <span className="text-xs text-red-500 mt-2 block font-medium">
            Let op: alle locaties, racks, devices, patch panels en verbindingen
            onder deze site gaan mee weg (CASCADE).
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Verwijderen..." : "Site verwijderen"}
          </button>
        </div>
      </Modal>

      <FormModal
        key={editingLocation?.id ?? "new-location"}
        isOpen={locationModalOpen}
        onClose={() => {
          setLocationModalOpen(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? "Locatie bewerken" : "Nieuwe locatie"}
        fields={LOCATION_FIELDS}
        initialValues={
          editingLocation
            ? {
                name: editingLocation.name || "",
                description: editingLocation.description || "",
              }
            : EMPTY_LOCATION
        }
        onSubmit={handleLocationSubmit}
        isSubmitting={
          createLocationMutation.isPending || updateLocationMutation.isPending
        }
      />

      <Modal
        isOpen={!!deleteLocationTarget}
        onClose={() => setDeleteLocationTarget(null)}
        title="Locatie verwijderen"
      >
        <p className="text-sm text-gray-600">
          Weet je zeker dat je <strong>{deleteLocationTarget?.name}</strong>{" "}
          wilt verwijderen?
          <span className="text-xs text-red-500 mt-2 block font-medium">
            Let op: alle racks, devices, patch panels en verbindingen onder
            deze locatie gaan mee weg (CASCADE).
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteLocationTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() =>
              deleteLocationMutation.mutate(deleteLocationTarget.id)
            }
            disabled={deleteLocationMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
          >
            {deleteLocationMutation.isPending
              ? "Verwijderen..."
              : "Locatie verwijderen"}
          </button>
        </div>
      </Modal>

      <FormModal
        key={editingRack?.id ?? `new-rack-${rackModalLocationId ?? ""}`}
        isOpen={rackModalOpen}
        onClose={() => {
          setRackModalOpen(false);
          setEditingRack(null);
          setRackModalLocationId(null);
        }}
        title={editingRack ? "Rack bewerken" : "Nieuw rack"}
        fields={RACK_FIELDS}
        initialValues={
          editingRack
            ? {
                name: editingRack.name || "",
                height_u: editingRack.height_u ?? 42,
                notes: editingRack.notes || "",
              }
            : EMPTY_RACK
        }
        onSubmit={handleRackSubmit}
        isSubmitting={
          createRackMutation.isPending || updateRackMutation.isPending
        }
      />

      <Modal
        isOpen={!!deleteRackTarget}
        onClose={() => setDeleteRackTarget(null)}
        title="Rack verwijderen"
      >
        <p className="text-sm text-gray-600">
          Weet je zeker dat je <strong>{deleteRackTarget?.name}</strong> wilt
          verwijderen?
          <span className="text-xs text-red-500 mt-2 block font-medium">
            Let op: alle devices, patch panels en cable management in dit
            rack gaan mee weg (CASCADE).
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteRackTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => deleteRackMutation.mutate(deleteRackTarget.id)}
            disabled={deleteRackMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
          >
            {deleteRackMutation.isPending
              ? "Verwijderen..."
              : "Rack verwijderen"}
          </button>
        </div>
      </Modal>
    </div>
  );
}