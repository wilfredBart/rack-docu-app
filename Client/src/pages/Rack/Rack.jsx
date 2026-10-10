import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRackWithContents } from "../../api/racks";
import { fetchDeviceWithPorts } from "../../api/devices";
import { fetchDeviceTypes } from "../../api/deviceTypes";
import { fetchPatchPanelWithPorts } from "../../api/patchPanels";
import { fetchVlans } from "../../api/vlans";
import Header from "../../components/Header";
import Modal from "../../components/UI/Modal";
import {
  FiArrowLeft,
  FiChevronRight,
  FiBox,
  FiHardDrive,
  FiGrid,
  FiLayers,
} from "react-icons/fi";

import { buildElevationRows, freeBlockAt, usedU } from "./rackElevation";
import { usePortAndTypeMutations } from "./usePortAndTypeMutations";
import { deviceType, patchPanelType, cableType } from "./itemTypes/itemTypeConfig";
import { useRackItemCRUD } from "./itemTypes/useRackItemCRUD";
import RackItemFormModal from "./itemTypes/RackItemFormModal";
import RackItemDeleteModal from "./itemTypes/RackItemDeleteModal";
import RackElevationView from "./RackElevationView";
import RackItemDetailPanel, {
  RackItemDetailHeader,
  RackItemDetailActions,
} from "./RackItemDetailPanel";

const ADD_KIND_OPTIONS = [
  {
    kind: "device",
    label: "Device",
    description: "Switch, firewall, server, …",
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
    description: "Brush / fingers / organizer",
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
  // null = dicht; number = U waarop gebruiker wil toevoegen (keuze-modal open)
  const [addAtU, setAddAtU] = useState(null);
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

  const handleEmptyClick = (u) => {
    setAddAtU(u);
  };

  const handleChooseKind = (kind) => {
    if (addAtU == null || !rack) return;
    const block = freeBlockAt(rack, addAtU);
    if (!block) {
      setAddAtU(null);
      return;
    }
    crudByKind[kind].openNewAt({
      rack_position: addAtU,
      rack_units: 1,
      maxUnits: block.size,
      blockLo: block.lo,
      blockHi: block.hi,
    });
    setAddAtU(null);
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

              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={
                    rack?.site_id
                      ? `/klanten/${klantId}/patchplan?siteId=${rack.site_id}&rackId=${rackId}`
                      : `/klanten/${klantId}/patchplan?rackId=${rackId}`
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-subtle px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-card"
                >
                  <FiBox /> Patchplan
                </Link>
              </div>
            </div>

            <div className="w-full px-0 sm:px-2 flex justify-center">
              <RackElevationView
                elevationRows={elevationRows}
                onSelectItem={setSelectedItem}
                selectedItem={selectedItem}
                deviceTypeMap={deviceTypeMap}
                rackName={rack.name}
                rack={rack}
                onEmptyClick={handleEmptyClick}
                onMoveItem={(kind, item, newStart) => {
                  crudByKind[kind].move(item.id, newStart);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        size="full"
        title={
          selectedItem ? (
            <RackItemDetailHeader selectedItem={selectedItem} />
          ) : (
            "Details"
          )
        }
        headerExtra={
          selectedItem ? (
            <RackItemDetailActions
              selectedItem={selectedItem}
              onEdit={handleEditSelected}
              onDeleteRequest={handleDeleteRequestSelected}
              klantId={klantId}
              siteId={rack?.site_id}
              rackId={rackId}
            />
          ) : null
        }
      >
        {selectedItem ? (
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
        ) : null}
      </Modal>

      <Modal
        isOpen={addAtU != null}
        onClose={() => setAddAtU(null)}
        title={addAtU != null ? `Toevoegen op U${addAtU}` : "Toevoegen"}
      >
        <p className="text-sm text-fg-subtle mb-4">
          Kies wat je op deze lege unit wilt plaatsen. Daarna vul je de details
          in.
        </p>
        <div className="flex flex-col gap-2">
          {ADD_KIND_OPTIONS.map(({ kind, label, description, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => handleChooseKind(kind)}
              className="flex items-start gap-3 w-full text-left rounded-xl border border-border bg-bg-subtle hover:bg-card hover:border-accent/40 px-4 py-3 transition cursor-pointer"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-fg-muted">
                <Icon className="text-lg" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">
                  {label}
                </span>
                <span className="block text-xs text-fg-subtle mt-0.5">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Modal>

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
