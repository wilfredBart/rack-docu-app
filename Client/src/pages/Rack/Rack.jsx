import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRackWithContents } from "../../api/racks";
import { fetchDeviceWithPorts } from "../../api/devices";
import { fetchDeviceTypes } from "../../api/deviceTypes";
import { fetchPatchPanelWithPorts } from "../../api/patchPanels";
import { fetchVlans } from "../../api/vlans";
import Header from "../../components/Header";
import { FiArrowLeft, FiChevronRight, FiPlus } from "react-icons/fi";

import { buildElevationRows, usedU } from "./rackElevation";
import { usePortAndTypeMutations } from "./usePortAndTypeMutations";
import { deviceType, patchPanelType, cableType } from "./itemTypes/itemTypeConfig";
import { useRackItemCRUD } from "./itemTypes/useRackItemCRUD";
import RackItemFormModal from "./itemTypes/RackItemFormModal";
import RackItemDeleteModal from "./itemTypes/RackItemDeleteModal";
import RackElevationView from "./RackElevationView";
import RackItemDetailPanel from "./RackItemDetailPanel";

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
  const [newTypeName, setNewTypeName] = useState("");
  const [portForm, setPortForm] = useState({
    count: 24,
    prefix: "Port ",
    port_type: "RJ45",
    speed: "1G",
  });

  const invalidateRack = () =>
    queryClient.invalidateQueries({ queryKey: ["rack-contents", rackId] });

  // Gedeelde afhankelijkheden voor de 3 item-type-CRUD-hooks hieronder.
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

  // VLAN's van deze klant, voor de VLAN-keuze per poort.
  const { data: vlans = [] } = useQuery({
    queryKey: ["vlans", klantId],
    queryFn: () => fetchVlans(klantId),
    enabled: !!klantId,
  });

  // Op small screens: detailpanel in beeld na selectie
  useEffect(() => {
    if (!selectedItem || typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const el = document.getElementById("rack-item-detail");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedItem?.kind, selectedItem?.item?.id]);

  const handleEditSelected = (item) => {
    crudByKind[item.kind].openEdit(item.item);
  };

  const handleDeleteRequestSelected = (item) => {
    crudByKind[item.kind].setDeleteTarget(item.item);
  };

  const handleAddType = (e) => {
    e.preventDefault();
    if (newTypeName.trim()) {
      createTypeMutation.mutate(newTypeName.trim());
    }
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

  const elevationRows = rack ? buildElevationRows(rack) : [];

  return (
    <div className="min-h-screen bg-bg pb-12">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-fg-subtle mb-4 pt-2">
          <Link
            to={`/klanten/${klantId}`}
            className="inline-flex items-center gap-1.5 hover:text-fg transition font-medium"
          >
            <FiArrowLeft className="text-base" />
            Terug
          </Link>
          <FiChevronRight className="text-fg-subtle" />
          <span className="text-fg font-medium">
            {isLoading ? "Laden..." : (rack?.name ?? "Rack")}
          </span>
        </nav>

        {isLoading ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-fg-subtle">
            Laden...
          </div>
        ) : !rack ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-sm text-fg-subtle">
            Rack niet gevonden.
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="mb-4 text-center w-full">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-fg-subtle">
                {rack.height_u}U
              </p>
              <h1 className="text-lg font-semibold text-fg tracking-tight">
                {rack.name}
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                {rack.notes || "—"}
              </p>
              {(() => {
                const used = usedU(rack);
                const pct = Math.min(100, (used / rack.height_u) * 100);
                return (
                  <div className="mx-auto mt-3 flex max-w-xs items-center gap-2">
                    <div className="occ-track flex-1">
                      <div className="occ-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-xs text-fg-subtle tabular-nums">
                      {used}/{rack.height_u}U
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <form
                onSubmit={handleAddType}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Nieuw type..."
                  className="w-32 px-2 py-1.5 border border-border rounded-lg text-xs bg-bg-subtle text-fg focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={createTypeMutation.isPending}
                  className="text-xs font-medium text-fg-subtle hover:text-fg cursor-pointer disabled:opacity-50"
                >
                  + Type
                </button>
              </form>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={deviceCRUD.openNew}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-card cursor-pointer"
                >
                  <FiPlus /> Device
                </button>
                <button
                  type="button"
                  onClick={patchPanelCRUD.openNew}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-card cursor-pointer"
                >
                  <FiPlus /> Patch
                </button>
                <button
                  type="button"
                  onClick={cableCRUD.openNew}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-card cursor-pointer"
                >
                  <FiPlus /> Cable
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] gap-6 items-start">
              <div className="min-w-0 w-full px-0 sm:px-2">
                <RackElevationView
                  elevationRows={elevationRows}
                  onSelectItem={setSelectedItem}
                  selectedItem={selectedItem}
                  deviceTypeMap={deviceTypeMap}
                  rackName={rack.name}
                  onAddAt={(kind) => crudByKind[kind].openNew()}
                />
              </div>

              <aside className="min-w-0 w-full lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                {selectedItem ? (
                  <RackItemDetailPanel
                    selectedItem={selectedItem}
                    deviceTypeMap={deviceTypeMap}
                    onEdit={handleEditSelected}
                    onDeleteRequest={handleDeleteRequestSelected}
                    onClose={() => setSelectedItem(null)}
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
                ) : (
                  <div className="hidden lg:block rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
                    <p className="text-sm font-medium text-fg-muted">
                      Selecteer een device in de rack
                    </p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      Details en poorten verschijnen hier.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>

      <RackItemFormModal
        config={deviceType}
        crud={deviceCRUD}
        fieldsContext={deviceTypes}
      />
      <RackItemFormModal config={patchPanelType} crud={patchPanelCRUD} />
      <RackItemFormModal config={cableType} crud={cableCRUD} />

      <RackItemDeleteModal config={deviceType} crud={deviceCRUD} />
      <RackItemDeleteModal config={patchPanelType} crud={patchPanelCRUD} />
      <RackItemDeleteModal config={cableType} crud={cableCRUD} />
    </div>
  );
}
