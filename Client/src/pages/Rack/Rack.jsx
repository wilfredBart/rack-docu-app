import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRackWithContents } from "../../api/racks";
import { fetchDeviceWithPorts } from "../../api/devices";
import { fetchDeviceTypes } from "../../api/deviceTypes";
import { fetchPatchPanelWithPorts } from "../../api/patchPanels";
import Header from "../../components/Header";
import { FiArrowLeft, FiChevronRight, FiPlus } from "react-icons/fi";

import { buildElevationRows } from "./rackElevation";
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
    <div className="min-h-screen bg-slate-50 pb-12">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 pt-2">
          <Link
            to={`/klanten/${klantId}`}
            className="inline-flex items-center gap-1.5 hover:text-gray-800 transition font-medium"
          >
            <FiArrowLeft className="text-base" />
            Terug
          </Link>
          <FiChevronRight className="text-gray-300" />
          <span className="text-gray-800 font-medium">
            {isLoading ? "Laden..." : (rack?.name ?? "Rack")}
          </span>
        </nav>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            Laden...
          </div>
        ) : !rack ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            Rack niet gevonden.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {rack.name}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {rack.height_u}U{rack.notes ? ` — ${rack.notes}` : ""}
              </p>
            </div>

            <div className="w-full max-w-sm flex items-center justify-between mb-2 gap-2">
              <form
                onSubmit={handleAddType}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Nieuw type..."
                  className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={createTypeMutation.isPending}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer disabled:opacity-50"
                >
                  + Type
                </button>
              </form>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={deviceCRUD.openNew}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                >
                  <FiPlus /> Device
                </button>
                <button
                  type="button"
                  onClick={patchPanelCRUD.openNew}
                  className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-sm font-medium cursor-pointer"
                >
                  <FiPlus /> Patch
                </button>
                <button
                  type="button"
                  onClick={cableCRUD.openNew}
                  className="flex items-center gap-1.5 text-violet-600 hover:text-violet-700 text-sm font-medium cursor-pointer"
                >
                  <FiPlus /> Cable
                </button>
              </div>
            </div>

            <RackElevationView
              elevationRows={elevationRows}
              onSelectItem={setSelectedItem}
            />

            {selectedItem && (
              <RackItemDetailPanel
                selectedItem={selectedItem}
                deviceTypeMap={deviceTypeMap}
                onEdit={handleEditSelected}
                onDeleteRequest={handleDeleteRequestSelected}
                selectedPorts={selectedPorts}
                portForm={portForm}
                setPortForm={setPortForm}
                onBulkPortSubmit={handleBulkPortSubmit}
                updatePortMutation={updatePortMutation}
                deletePortMutation={deletePortMutation}
                bulkCreatePortsMutation={bulkCreatePortsMutation}
              />
            )}
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
