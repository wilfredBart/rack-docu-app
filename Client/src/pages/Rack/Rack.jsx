import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRackWithContents } from "../../api/racks";
import { fetchDeviceWithPorts } from "../../api/devices";
import { fetchDeviceTypes } from "../../api/deviceTypes";
import { fetchPatchPanelWithPorts } from "../../api/patchPanels";
import { fetchVlans } from "../../api/vlans";
import Header from "../../components/Header";
import Breadcrumb from "../../components/UI/Breadcrumb";
import {
  FiChevronLeft,
  FiChevronRight,
  FiBox,
  FiHardDrive,
  FiGrid,
  FiLayers,
  FiPlus,
  FiX,
  FiEdit2,
  FiTrash2,
  FiSliders,
} from "react-icons/fi";

import { buildElevationRows, usedU, firstFreeU } from "./rackElevation";
import { usePortAndTypeMutations } from "./usePortAndTypeMutations";
import { deviceType, patchPanelType, cableType } from "./itemTypes/itemTypeConfig";
import { useRackItemCRUD } from "./itemTypes/useRackItemCRUD";
import RackItemFormModal from "./itemTypes/RackItemFormModal";
import RackItemDeleteModal from "./itemTypes/RackItemDeleteModal";
import RackElevationView from "./RackElevationView";
import RackItemDetailPanel from "./RackItemDetailPanel";
import UnifiDeviceFace from "./devices/UnifiDeviceFace";

const ADD_KIND_OPTIONS = [
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

export default function Rack() {
  const { klantId, rackId } = useParams();
  const queryClient = useQueryClient();

  const { data: rack, isLoading } = useQuery({
    queryKey: ["rack-contents", rackId],
    queryFn: () => fetchRackWithContents(rackId),
    enabled: !!rackId,
  });

  const { data: deviceTypes } = useQuery({
    queryKey: ["device-types"],
    queryFn: fetchDeviceTypes,
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [activePortNumber, setActivePortNumber] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [portForm, setPortForm] = useState({
    count: 24,
    prefix: "Port ",
    port_type: "RJ45",
    speed: "1G",
  });

  const invalidateRack = () =>
    queryClient.invalidateQueries({ queryKey: ["rack-contents", rackId] });

  const crudCtx = { rackId, invalidateRack, setSelectedItem };

  const deviceCRUD = useRackItemCRUD(deviceType, crudCtx);
  const patchPanelCRUD = useRackItemCRUD(patchPanelType, crudCtx);
  const cableCRUD = useRackItemCRUD(cableType, crudCtx);

  const crudByKind = {
    device: deviceCRUD,
    patch_panel: patchPanelCRUD,
    cable_management: cableCRUD,
  };

  const {
    createTypeMutation,
    bulkCreatePortsMutation,
    updatePortMutation,
    deletePortMutation,
    assignVlanMutation,
  } = usePortAndTypeMutations({
    selectedItem,
    invalidateRack,
    setNewTypeName,
  });

  const deviceTypeMap = useMemo(() => {
    const map = new Map();
    (deviceTypes ?? []).forEach((type) => map.set(type.id, type.name));
    return map;
  }, [deviceTypes]);

  const selectedPortsQuery = useQuery({
    queryKey: [
      "selected-item-ports",
      selectedItem?.kind,
      selectedItem?.item?.id,
    ],
    queryFn: async () => {
      if (!selectedItem || selectedItem.kind === "cable_management") return [];

      if (selectedItem.kind === "device") {
        const device = await fetchDeviceWithPorts(selectedItem.item.id);
        return device?.ports ?? [];
      }

      const panel = await fetchPatchPanelWithPorts(selectedItem.item.id);
      return panel?.ports ?? [];
    },
    enabled: !!selectedItem && selectedItem.kind !== "cable_management",
  });

  const selectedPorts = selectedPortsQuery.data ?? [];

  const { data: vlans = [] } = useQuery({
    queryKey: ["vlans", klantId],
    queryFn: () => fetchVlans(klantId),
    enabled: !!klantId,
  });

  const elevationRows = rack ? buildElevationRows(rack) : [];

  const allInstalledItems = useMemo(() => {
    if (!rack) return [];
    const items = [];
    (rack.devices ?? []).forEach((d) => items.push({ kind: "device", item: d }));
    (rack.patch_panels ?? []).forEach((p) => items.push({ kind: "patch_panel", item: p }));
    (rack.cable_management ?? []).forEach((c) => items.push({ kind: "cable_management", item: c }));
    items.sort((a, b) => Number(b.item.rack_position) - Number(a.item.rack_position));
    return items;
  }, [rack]);

  // Houd selectedItem synchroon met gewijzigde rack data
  useEffect(() => {
    if (!selectedItem || !rack) return;
    const { kind, item } = selectedItem;
    let fresh = null;
    if (kind === "device") {
      fresh = (rack.devices ?? []).find((d) => d.id === item.id);
    } else if (kind === "patch_panel") {
      fresh = (rack.patch_panels ?? []).find((p) => p.id === item.id);
    } else if (kind === "cable_management") {
      fresh = (rack.cable_management ?? []).find((c) => c.id === item.id);
    }
    if (fresh) {
      if (fresh !== item) {
        setSelectedItem({ kind, item: fresh });
      }
    } else {
      setSelectedItem(null);
    }
  }, [rack, selectedItem]);

  // Vorige / Volgende device navigatie voor "device per device werken"
  const currentIndex = useMemo(() => {
    if (!selectedItem || !allInstalledItems.length) return -1;
    return allInstalledItems.findIndex(
      (it) => it.kind === selectedItem.kind && it.item.id === selectedItem.item.id,
    );
  }, [selectedItem, allInstalledItems]);

  const handlePrevItem = () => {
    if (currentIndex > 0) {
      setSelectedItem(allInstalledItems[currentIndex - 1]);
    } else if (allInstalledItems.length > 0) {
      setSelectedItem(allInstalledItems[allInstalledItems.length - 1]);
    }
  };

  const handleNextItem = () => {
    if (currentIndex >= 0 && currentIndex < allInstalledItems.length - 1) {
      setSelectedItem(allInstalledItems[currentIndex + 1]);
    } else if (allInstalledItems.length > 0) {
      setSelectedItem(allInstalledItems[0]);
    }
  };

  const handleEditSelected = (itemToEdit) => {
    crudByKind[itemToEdit.kind].openEdit(itemToEdit.item);
  };

  const handleDeleteRequestSelected = (itemToDelete) => {
    crudByKind[itemToDelete.kind].setDeleteTarget(itemToDelete.item);
  };

  const handleAddType = (e) => {
    e.preventDefault();
    if (newTypeName.trim()) {
      createTypeMutation.mutate(newTypeName.trim());
    }
  };

  const handleOpenAdd = (kind, suggestedPos = null) => {
    if (!rack) return;
    // Zonder suggestie: eerste vrije U van bovenaf (hoogste vrije U).
    const defaultPos = suggestedPos ?? firstFreeU(rack);

    crudByKind[kind].openNewAt({
      rack_position: defaultPos,
      rack_units: 1,
    });
  };

  const handleBulkPortSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem || selectedItem.kind === "cable_management") {
      return;
    }

    const payload = {
      count: Number(portForm.count) || 1,
      prefix: portForm.prefix || "Port ",
      port_type: portForm.port_type || "RJ45",
      speed: portForm.speed || "",
    };

    if (selectedItem.kind === "device") {
      bulkCreatePortsMutation.mutate({
        ...payload,
        device_id: selectedItem.item.id,
      });
    } else {
      bulkCreatePortsMutation.mutate({
        ...payload,
        patch_panel_id: selectedItem.item.id,
      });
    }
  };

  const patchplanTo = useMemo(() => {
    if (!rack || !selectedItem) return null;
    const { kind, item } = selectedItem;
    if (kind !== "device" && kind !== "patch_panel") return null;
    const params = new URLSearchParams();
    if (rack.site_id) params.set("siteId", String(rack.site_id));
    params.set("rackId", String(rackId));
    if (kind === "patch_panel") params.set("panel", String(item.id));
    if (kind === "device") params.set("device", String(item.id));
    return `/klanten/${klantId}/patchplan?${params.toString()}`;
  }, [rack, selectedItem, klantId, rackId]);

  const deviceFieldExtras = {
    device_type_id: (
      <form
        onSubmit={handleAddType}
        className="flex items-center gap-1.5 mt-1.5"
      >
        <input
          type="text"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          placeholder="Nieuw type..."
          className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs bg-bg-subtle text-fg focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={createTypeMutation.isPending || !newTypeName.trim()}
          className="text-xs font-medium text-fg-subtle hover:text-fg cursor-pointer disabled:opacity-50 shrink-0 px-2 py-1.5"
        >
          {createTypeMutation.isPending ? "..." : "+ Type"}
        </button>
      </form>
    ),
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden select-none">
      <Header />

      <div className="shrink-0 w-full">
        <Breadcrumb
          items={[
            { label: "Dashboard", to: `/klanten/${klantId}` },
            { label: isLoading ? "Laden..." : (rack?.name ?? "Rack") },
          ]}
        />

        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-fg">
              {isLoading ? "Laden..." : (rack?.name ?? "Rack")}
            </h1>
            <p className="text-sm text-fg-subtle mt-1">
              Rack detail
              {rack ? ` · ${usedU(rack)}/${rack.height_u}U bezet` : ""}
            </p>
          </div>

          {rack && (
            <Link
              to={
                rack.site_id
                  ? `/klanten/${klantId}/patchplan?siteId=${rack.site_id}&rackId=${rackId}`
                  : `/klanten/${klantId}/patchplan?rackId=${rackId}`
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-fg hover:bg-bg-subtle transition shrink-0"
            >
              <FiBox className="text-fg-subtle" /> Patchplan
            </Link>
          )}
        </div>
      </div>

      {/* Hoofdwerkgebied: 2 kolommen, vult exact de resterende schermhoogte */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-fg-subtle">
          Rack laden...
        </div>
      ) : !rack ? (
        <div className="flex-1 flex items-center justify-center text-sm text-fg-subtle">
          Rack niet gevonden.
        </div>
      ) : (
        <div className="flex-1 min-h-0 p-3 sm:p-4 flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* LINKER KOLOM: Device per device werkpaneel & beheer */}
          <div className="w-full lg:w-[480px] xl:w-[520px] h-full flex flex-col min-h-0 bg-card rounded-2xl border border-border shadow-[var(--shadow-border)] overflow-hidden shrink-0">
            {selectedItem ? (
              /* --- WEERGAVE WANNEER EEN APPARAAT GESELECTEERD IS (Device-per-device) --- */
              <div className="h-full flex flex-col min-h-0">
                {/* Header met navigatie & acties */}
                <div className="px-4 py-3 border-b border-border bg-bg-subtle/50 shrink-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevItem}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-bg-subtle text-fg-subtle hover:text-fg transition cursor-pointer"
                      title="Vorig apparaat (naar boven)"
                    >
                      <FiChevronLeft className="text-base" />
                    </button>
                    <span className="text-xs font-mono text-fg-subtle px-1">
                      {currentIndex >= 0
                        ? `${currentIndex + 1} / ${allInstalledItems.length}`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextItem}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-bg-subtle text-fg-subtle hover:text-fg transition cursor-pointer"
                      title="Volgend apparaat (naar beneden)"
                    >
                      <FiChevronRight className="text-base" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {patchplanTo && (
                      <Link
                        to={patchplanTo}
                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-bg-subtle text-fg-subtle hover:text-accent transition"
                        title="Open in patchplan"
                      >
                        <FiBox className="text-base" />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEditSelected(selectedItem)}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-bg-subtle text-fg-subtle hover:text-accent transition cursor-pointer"
                      title="Bewerken"
                    >
                      <FiEdit2 className="text-base" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequestSelected(selectedItem)}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-bg-subtle text-fg-subtle hover:text-destructive transition cursor-pointer"
                      title="Verwijderen"
                    >
                      <FiTrash2 className="text-base" />
                    </button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-bg-subtle transition cursor-pointer"
                      title="Sluit apparaat (terug naar overzicht)"
                    >
                      <FiX className="text-base" />
                    </button>
                  </div>
                </div>

                {/* Actieve Apparaat Hero Info */}
                <div className="px-5 py-4 border-b border-border bg-gradient-to-b from-card to-bg-subtle/30 shrink-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                      {selectedItem.kind === "device"
                        ? (deviceTypeMap.get(selectedItem.item.device_type_id) || "Device")
                        : selectedItem.kind === "patch_panel"
                        ? "Patch Panel"
                        : "Cable Management"}
                    </span>
                    <span className="text-[11px] font-mono text-fg-subtle px-2 py-0.5 rounded bg-card border border-border">
                      U{selectedItem.item.rack_position}
                      {Number(selectedItem.item.rack_units) > 1
                        ? `–U${
                            Number(selectedItem.item.rack_position) +
                            Number(selectedItem.item.rack_units) -
                            1
                          }`
                        : ""}{" "}
                      ({selectedItem.item.rack_units || 1}U)
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-fg truncate">
                    {selectedItem.item.label || "Naamloos apparaat"}
                  </h2>

                  {(selectedItem.item.manufacturer || selectedItem.item.model) && (
                    <p className="text-xs text-fg-subtle mt-0.5 truncate">
                      {[selectedItem.item.manufacturer, selectedItem.item.model]
                        .filter(Boolean)
                        .join(" — ")}
                    </p>
                  )}
                </div>

                {/* 19" UniFi Vector Front Panel (Standaard voor elk item) */}
                <div className="px-5 py-3 border-b border-border bg-[#080c14]/50 shrink-0">
                  <div className="flex items-center justify-between text-[11px] text-fg-subtle mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium text-fg">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      UniFi Front Panel (19&quot; {selectedItem.item.rack_units || 1}U)
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
                      {selectedItem.kind === "device"
                        ? (selectedItem.item.model || "UniFi Hardware")
                        : selectedItem.kind === "patch_panel"
                        ? "UniFi Keystone Panel"
                        : "UniFi Brush Panel"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 p-2 bg-[#060910] shadow-inner">
                    <UnifiDeviceFace
                      item={selectedItem.item}
                      kind={selectedItem.kind}
                      ports={selectedPorts}
                      activePortId={activePortNumber}
                      onPortClick={(num) => setActivePortNumber(num)}
                    />
                  </div>
                </div>

                {/* Scrollbare body: Specificaties & Poortenbeheer */}
                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
                  <RackItemDetailPanel
                    selectedItem={selectedItem}
                    deviceTypeMap={deviceTypeMap}
                    selectedPorts={selectedPorts}
                    portForm={portForm}
                    setPortForm={setPortForm}
                    onBulkPortSubmit={handleBulkPortSubmit}
                    updatePortMutation={updatePortMutation}
                    deletePortMutation={deletePortMutation}
                    bulkCreatePortsMutation={bulkCreatePortsMutation}
                    vlans={vlans}
                    klantId={klantId}
                    assignVlanMutation={assignVlanMutation}
                  />
                </div>
              </div>
            ) : (
              /* --- WEERGAVE WANNEER GEEN APPARAAT GESELECTEERD IS (Overzicht & Toevoegen) --- */
              <div className="h-full flex flex-col min-h-0">
                <div className="px-5 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
                  <h2 className="text-base font-semibold text-fg flex items-center gap-2">
                    <FiSliders className="text-accent" /> Rack Beheer & Toevoegen
                  </h2>
                  <p className="text-xs text-fg-subtle mt-0.5">
                    Selecteer een component in het rack of voeg een nieuw item toe.
                  </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
                  {/* Knoppen om direct items toe te voegen */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle block">
                      Item toevoegen aan rack
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {ADD_KIND_OPTIONS.map(
                        ({ kind, label, description, icon: Icon }) => (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => handleOpenAdd(kind)}
                            className="flex items-center gap-3 w-full text-left rounded-xl border border-border bg-bg-subtle hover:bg-card hover:border-accent/50 p-3 transition group cursor-pointer"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-fg-muted group-hover:text-accent group-hover:border-accent/40 transition">
                              <Icon className="text-lg" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-fg group-hover:text-accent transition">
                                  + {label}
                                </span>
                                <FiPlus className="text-fg-subtle text-xs group-hover:text-accent transition" />
                              </div>
                              <span className="text-xs text-fg-subtle block truncate">
                                {description}
                              </span>
                            </div>
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Geïnstalleerde items lijst */}
                  <div className="space-y-2.5 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                        Geïnstalleerd ({allInstalledItems.length})
                      </span>
                      <span className="text-xs text-fg-subtle">
                        Klik om te openen
                      </span>
                    </div>

                    {allInstalledItems.length === 0 ? (
                      <div className="text-center py-8 text-xs text-fg-subtle border border-dashed border-border rounded-xl">
                        Nog geen items in dit rack geplaatst.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {allInstalledItems.map(({ kind, item }) => {
                          const uStart = Number(item.rack_position);
                          const uUnits = Math.max(1, Number(item.rack_units ?? 1));
                          const uEnd = uStart + uUnits - 1;
                          const uLabel =
                            uUnits === 1 ? `U${uStart}` : `U${uStart}–${uEnd}`;

                          return (
                            <button
                              key={`${kind}-${item.id}`}
                              type="button"
                              onClick={() => setSelectedItem({ kind, item })}
                              className="w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer border border-border bg-bg-subtle hover:border-accent/40 hover:bg-card text-fg group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-card border border-border text-fg-muted shrink-0 group-hover:border-accent/30">
                                  {uLabel}
                                </span>
                                <span className="truncate font-medium text-fg group-hover:text-accent transition">
                                  {item.label || item.model || "Naamloos"}
                                </span>
                              </div>
                              <span className="text-[10px] text-fg-subtle shrink-0 ml-2">
                                {kind === "patch_panel"
                                  ? "Patch"
                                  : kind === "cable_management"
                                  ? "Cable"
                                  : (deviceTypeMap.get(item.device_type_id) || "Device")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RECHTER KOLOM: Visueel 19" Rack in 100% hoogte (zonder scrollen) */}
          <div className="flex-1 h-full min-h-0 flex items-center justify-center overflow-hidden">
            <RackElevationView
              elevationRows={elevationRows}
              onSelectItem={setSelectedItem}
              selectedItem={selectedItem}
              rackName={rack.name}
              heightU={rack.height_u}
              onEmptyClick={() => setSelectedItem(null)}
            />
          </div>
        </div>
      )}

      {/* Modals voor item-aanmaak / bewerking / verwijdering */}
      <RackItemFormModal
        config={deviceType}
        crud={deviceCRUD}
        fieldsContext={deviceTypes}
        fieldExtras={deviceFieldExtras}
        rack={rack}
      />
      <RackItemFormModal
        config={patchPanelType}
        crud={patchPanelCRUD}
        rack={rack}
      />
      <RackItemFormModal config={cableType} crud={cableCRUD} rack={rack} />

      <RackItemDeleteModal config={deviceType} crud={deviceCRUD} />
      <RackItemDeleteModal config={patchPanelType} crud={patchPanelCRUD} />
      <RackItemDeleteModal config={cableType} crud={cableCRUD} />
    </div>
  );
}
