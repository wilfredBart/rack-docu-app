import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { fetchRackWithContents } from "../api/racks";
import {
  createDevice,
  updateDevice,
  deleteDevice,
  fetchDeviceWithPorts,
} from "../api/devices";
import { fetchDeviceTypes, createDeviceType } from "../api/deviceTypes";
import {
  createPatchPanel,
  updatePatchPanel,
  deletePatchPanel,
  fetchPatchPanelWithPorts,
} from "../api/patchPanels";
import {
  createCableManagementItem,
  updateCableManagementItem,
  deleteCableManagementItem,
} from "../api/cableManagement";
import { bulkCreatePorts, updatePort, deletePort } from "../api/ports";
import Header from "../components/Header";
import Modal from "../components/UI/Modal";
import FormModal from "../components/UI/FormModal";
import {
  FiArrowLeft,
  FiChevronRight,
  FiPlus,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

const ROW_HEIGHT = 28;

function buildElevationRows(rack) {
  const height = rack.height_u;
  const occupiedBy = new Map();

  const register = (kind, item) => {
    const start = Number(item.rack_position);
    const units = Number(item.rack_units ?? 1);
    const topU = start + units - 1;
    for (let u = start; u <= topU; u += 1) {
      occupiedBy.set(u, { kind, item, topU });
    }
  };

  (rack.devices ?? []).forEach((device) => register("device", device));
  (rack.patch_panels ?? []).forEach((panel) => register("patch_panel", panel));
  (rack.cable_management ?? []).forEach((item) =>
    register("cable_management", item),
  );

  const rows = [];
  for (let u = height; u >= 1; u -= 1) {
    const occ = occupiedBy.get(u);
    if (occ) {
      if (u === occ.topU) {
        rows.push({ type: "item", kind: occ.kind, item: occ.item });
      }
    } else {
      rows.push({ type: "empty", u });
    }
  }
  return rows;
}

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

  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deleteDeviceTarget, setDeleteDeviceTarget] = useState(null);

  const [patchPanelModalOpen, setPatchPanelModalOpen] = useState(false);
  const [editingPatchPanel, setEditingPatchPanel] = useState(null);
  const [deletePatchPanelTarget, setDeletePatchPanelTarget] = useState(null);

  const [cableModalOpen, setCableModalOpen] = useState(false);
  const [editingCable, setEditingCable] = useState(null);
  const [deleteCableTarget, setDeleteCableTarget] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [portForm, setPortForm] = useState({
    count: 24,
    prefix: "Port ",
    port_type: "RJ45",
    speed: "1G",
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

  const deviceFields = useMemo(
    () => [
      { name: "label", label: "Label", type: "text", required: true },
      {
        name: "device_type_id",
        label: "Type",
        type: "select",
        required: true,
        options: (deviceTypes ?? []).map((type) => ({
          value: String(type.id),
          label: type.name,
        })),
      },
      {
        name: "rack_position",
        label: "Start-U",
        type: "number",
        required: true,
      },
      {
        name: "rack_units",
        label: "Aantal U",
        type: "number",
        required: true,
      },
      { name: "manufacturer", label: "Fabrikant", type: "text" },
      { name: "model", label: "Model", type: "text" },
      { name: "serial_number", label: "Serienummer", type: "text" },
      { name: "mac_address", label: "MAC-adres", type: "text" },
      { name: "notes", label: "Opmerking", type: "textarea" },
    ],
    [deviceTypes],
  );

  const patchPanelFields = useMemo(
    () => [
      { name: "label", label: "Label", type: "text", required: true },
      { name: "type", label: "Type", type: "text" },
      { name: "manufacturer", label: "Fabrikant", type: "text" },
      { name: "model", label: "Model", type: "text" },
      {
        name: "port_count",
        label: "Aantal poorten",
        type: "number",
        required: true,
      },
      {
        name: "rack_position",
        label: "Start-U",
        type: "number",
        required: true,
      },
      { name: "rack_units", label: "Aantal U", type: "number", required: true },
      { name: "notes", label: "Opmerking", type: "textarea" },
    ],
    [],
  );

  const cableFields = useMemo(
    () => [
      { name: "label", label: "Label", type: "text", required: true },
      { name: "type", label: "Type", type: "text" },
      {
        name: "rack_position",
        label: "Start-U",
        type: "number",
        required: true,
      },
      { name: "rack_units", label: "Aantal U", type: "number", required: true },
      { name: "notes", label: "Opmerking", type: "textarea" },
    ],
    [],
  );

  const invalidateRack = () =>
    queryClient.invalidateQueries({ queryKey: ["rack-contents", rackId] });

  const createDeviceMutation = useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      invalidateRack();
      toast.success("Device aangemaakt");
      setDeviceModalOpen(false);
      setEditingDevice(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij aanmaken van device",
      );
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: updateDevice,
    onSuccess: () => {
      invalidateRack();
      toast.success("Device bijgewerkt");
      setDeviceModalOpen(false);
      setEditingDevice(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij bijwerken van device",
      );
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: (data) => {
      invalidateRack();
      toast.success(data?.message || "Device verwijderd");
      setDeleteDeviceTarget(null);
      setSelectedItem(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij verwijderen van device",
      );
    },
  });

  const createPatchPanelMutation = useMutation({
    mutationFn: createPatchPanel,
    onSuccess: () => {
      invalidateRack();
      toast.success("Patch panel aangemaakt");
      setPatchPanelModalOpen(false);
      setEditingPatchPanel(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij aanmaken van patch panel",
      );
    },
  });

  const updatePatchPanelMutation = useMutation({
    mutationFn: updatePatchPanel,
    onSuccess: () => {
      invalidateRack();
      toast.success("Patch panel bijgewerkt");
      setPatchPanelModalOpen(false);
      setEditingPatchPanel(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij bijwerken van patch panel",
      );
    },
  });

  const deletePatchPanelMutation = useMutation({
    mutationFn: deletePatchPanel,
    onSuccess: (data) => {
      invalidateRack();
      toast.success(data?.message || "Patch panel verwijderd");
      setDeletePatchPanelTarget(null);
      setSelectedItem(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij verwijderen van patch panel",
      );
    },
  });

  const createCableMutation = useMutation({
    mutationFn: createCableManagementItem,
    onSuccess: () => {
      invalidateRack();
      toast.success("Cable management item aangemaakt");
      setCableModalOpen(false);
      setEditingCable(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          "Fout bij aanmaken van cable management item",
      );
    },
  });

  const updateCableMutation = useMutation({
    mutationFn: updateCableManagementItem,
    onSuccess: () => {
      invalidateRack();
      toast.success("Cable management item bijgewerkt");
      setCableModalOpen(false);
      setEditingCable(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          "Fout bij bijwerken van cable management item",
      );
    },
  });

  const deleteCableMutation = useMutation({
    mutationFn: deleteCableManagementItem,
    onSuccess: (data) => {
      invalidateRack();
      toast.success(data?.message || "Cable management item verwijderd");
      setDeleteCableTarget(null);
      setSelectedItem(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          "Fout bij verwijderen van cable management item",
      );
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: createDeviceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-types"] });
      setNewTypeName("");
      toast.success("Type aangemaakt");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij aanmaken van type");
    },
  });

  const bulkCreatePortsMutation = useMutation({
    mutationFn: bulkCreatePorts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [
          "selected-item-ports",
          selectedItem?.kind,
          selectedItem?.item?.id,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["rack-contents", rackId] });
      toast.success(
        data?.length
          ? `${data.length} poorten aangemaakt`
          : "Poorten aangemaakt",
      );
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij aanmaken van poorten",
      );
    },
  });

  const updatePortMutation = useMutation({
    mutationFn: updatePort,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "selected-item-ports",
          selectedItem?.kind,
          selectedItem?.item?.id,
        ],
      });
      toast.success("Poort hernoemd");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij hernoemen van poort",
      );
    },
  });

  const deletePortMutation = useMutation({
    mutationFn: deletePort,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "selected-item-ports",
          selectedItem?.kind,
          selectedItem?.item?.id,
        ],
      });
      toast.success("Poort verwijderd");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij verwijderen van poort",
      );
    },
  });

  const openNewDevice = () => {
    setEditingDevice(null);
    setDeviceModalOpen(true);
  };

  const handleDeviceSubmit = (values) => {
    const payload = {
      label: values.label,
      device_type_id: Number(values.device_type_id),
      manufacturer: values.manufacturer || "",
      model: values.model || "",
      serial_number: values.serial_number || "",
      mac_address: values.mac_address || "",
      rack_position: Number(values.rack_position),
      rack_units: Number(values.rack_units) || 1,
      notes: values.notes || "",
    };

    if (editingDevice) {
      updateDeviceMutation.mutate({ id: editingDevice.id, ...payload });
    } else {
      createDeviceMutation.mutate({ rack_id: rack.id, ...payload });
    }
  };

  const handlePatchPanelSubmit = (values) => {
    const payload = {
      label: values.label,
      type: values.type || "",
      manufacturer: values.manufacturer || "",
      model: values.model || "",
      port_count: Number(values.port_count) || 1,
      rack_position: Number(values.rack_position),
      rack_units: Number(values.rack_units) || 1,
      notes: values.notes || "",
    };

    if (editingPatchPanel) {
      updatePatchPanelMutation.mutate({ id: editingPatchPanel.id, ...payload });
    } else {
      createPatchPanelMutation.mutate({ rack_id: rack.id, ...payload });
    }
  };

  const handleCableSubmit = (values) => {
    const payload = {
      label: values.label,
      type: values.type || "",
      rack_position: Number(values.rack_position),
      rack_units: Number(values.rack_units) || 1,
      notes: values.notes || "",
    };

    if (editingCable) {
      updateCableMutation.mutate({ id: editingCable.id, ...payload });
    } else {
      createCableMutation.mutate({ rack_id: rack.id, ...payload });
    }
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
    <div className="min-h-screen bg-gray-50/50 pb-12">
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
                  onClick={openNewDevice}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                >
                  <FiPlus /> Device
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPatchPanel(null);
                    setPatchPanelModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-sm font-medium cursor-pointer"
                >
                  <FiPlus /> Patch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCable(null);
                    setCableModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-violet-600 hover:text-violet-700 text-sm font-medium cursor-pointer"
                >
                  <FiPlus /> Cable
                </button>
              </div>
            </div>

            <div className="w-full max-w-sm bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
              {elevationRows.map((row) => {
                if (row.type === "empty") {
                  return (
                    <div
                      key={`u-${row.u}`}
                      className={`h-7 flex items-center border-b border-gray-100 last:border-b-0 ${
                        row.u % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                      }`}
                    >
                      <span className="w-9 shrink-0 text-right pr-2 text-[10px] font-medium text-gray-400 tabular-nums">
                        {row.u}U
                      </span>
                      <span className="flex-1 h-full border-l border-gray-100" />
                    </div>
                  );
                }

                const item = row.item;
                const units = Number(item.rack_units ?? 1);
                const topU = Number(item.rack_position) + units - 1;
                const itemKind = row.kind;

                const kindStyles = {
                  device: "bg-blue-50/80 border-blue-200 text-blue-900",
                  patch_panel: "bg-amber-50/80 border-amber-200 text-amber-900",
                  cable_management:
                    "bg-violet-50/80 border-violet-200 text-violet-900",
                };

                const kindLabels = {
                  device: "Device",
                  patch_panel: "Patchpanel",
                  cable_management: "Cable",
                };

                return (
                  <div
                    key={`${itemKind}-${item.id}`}
                    style={{ height: `${units * ROW_HEIGHT}px` }}
                    className={`flex items-center border-b border-gray-100 last:border-b-0 ${kindStyles[itemKind]}`}
                  >
                    <span className="w-9 shrink-0 text-right pr-2 text-[10px] font-medium tabular-nums">
                      {topU}U
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedItem({ kind: itemKind, item })}
                      className="flex-1 h-full border-l border-current/25 px-2 flex items-center justify-between gap-2 min-w-0 text-left cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {item.label}
                        </p>
                        <p className="text-[10px] truncate opacity-75">
                          {kindLabels[itemKind]} · {units}U
                          {itemKind === "patch_panel" && item.port_count
                            ? ` · ${item.port_count} poorten`
                            : ""}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {selectedItem && (
              <div className="w-full max-w-3xl mt-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400 font-semibold">
                      {selectedItem.kind === "device"
                        ? "Device"
                        : selectedItem.kind === "patch_panel"
                          ? "Patch panel"
                          : "Cable management"}
                    </p>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {selectedItem.item.label}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedItem.kind === "device") {
                          setEditingDevice(selectedItem.item);
                          setDeviceModalOpen(true);
                        } else if (selectedItem.kind === "patch_panel") {
                          setEditingPatchPanel(selectedItem.item);
                          setPatchPanelModalOpen(true);
                        } else {
                          setEditingCable(selectedItem.item);
                          setCableModalOpen(true);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <FiEdit2 className="text-xs" /> Bewerken
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedItem.kind === "device") {
                          setDeleteDeviceTarget(selectedItem.item);
                        } else if (selectedItem.kind === "patch_panel") {
                          setDeletePatchPanelTarget(selectedItem.item);
                        } else {
                          setDeleteCableTarget(selectedItem.item);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <FiTrash2 className="text-xs" /> Verwijderen
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                      Positie
                    </span>
                    <span className="font-medium text-slate-800">
                      {selectedItem.item.rack_position}U —{" "}
                      {selectedItem.item.rack_units || 1}U
                    </span>
                  </div>

                  {selectedItem.kind === "device" && (
                    <>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Type
                        </span>
                        <span className="font-medium text-slate-800">
                          {deviceTypeMap.get(
                            selectedItem.item.device_type_id,
                          ) || "Onbekend"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Fabrikant
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.manufacturer || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Model
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.model || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Serienummer
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.serial_number || "-"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          MAC-adres
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.mac_address || "-"}
                        </span>
                      </div>
                    </>
                  )}

                  {selectedItem.kind === "patch_panel" && (
                    <>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Type
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.type || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Aantal poorten
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.port_count || 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Fabrikant
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.manufacturer || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                          Model
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedItem.item.model || "-"}
                        </span>
                      </div>
                    </>
                  )}

                  {selectedItem.kind === "cable_management" && (
                    <div className="sm:col-span-2">
                      <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                        Type
                      </span>
                      <span className="font-medium text-slate-800">
                        {selectedItem.item.type || "-"}
                      </span>
                    </div>
                  )}

                  {(selectedItem.item.notes || "") && (
                    <div className="sm:col-span-2">
                      <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                        Opmerking
                      </span>
                      <span className="font-medium text-slate-800 whitespace-pre-wrap">
                        {selectedItem.item.notes}
                      </span>
                    </div>
                  )}
                </div>

                {selectedItem.kind !== "cable_management" && (
                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Poorten
                      </h3>
                      <span className="text-xs text-slate-400">
                        {selectedPorts.length} totaal
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedPorts.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          Geen poorten aangemaakt.
                        </span>
                      ) : (
                        selectedPorts.map((port) => (
                          <div
                            key={port.id}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                          >
                            <span>{port.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextName = window.prompt(
                                  "Nieuwe poortnaam",
                                  port.name,
                                );
                                if (!nextName || !nextName.trim()) {
                                  return;
                                }
                                updatePortMutation.mutate({
                                  id: port.id,
                                  name: nextName.trim(),
                                  port_type: port.port_type || "RJ45",
                                  speed: port.speed || "",
                                });
                              }}
                              className="text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              Hernoem
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePortMutation.mutate(port.id)}
                              className="text-red-600 hover:text-red-700 cursor-pointer"
                            >
                              Verwijder
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={handleBulkPortSubmit}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                        Aantal
                        <input
                          type="number"
                          min="1"
                          value={portForm.count}
                          onChange={(e) =>
                            setPortForm((prev) => ({
                              ...prev,
                              count: Number(e.target.value) || 1,
                            }))
                          }
                          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                        Prefix
                        <input
                          type="text"
                          value={portForm.prefix}
                          onChange={(e) =>
                            setPortForm((prev) => ({
                              ...prev,
                              prefix: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                        Type
                        <input
                          type="text"
                          value={portForm.port_type}
                          onChange={(e) =>
                            setPortForm((prev) => ({
                              ...prev,
                              port_type: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                        Snelheid
                        <input
                          type="text"
                          value={portForm.speed}
                          onChange={(e) =>
                            setPortForm((prev) => ({
                              ...prev,
                              speed: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
                        />
                      </label>

                      <div className="md:col-span-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={bulkCreatePortsMutation.isPending}
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
                        >
                          {bulkCreatePortsMutation.isPending
                            ? "Aanmaken..."
                            : "Poorten aanmaken"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <FormModal
        key={editingDevice?.id ?? "new-device"}
        isOpen={deviceModalOpen}
        onClose={() => {
          setDeviceModalOpen(false);
          setEditingDevice(null);
        }}
        title={editingDevice ? "Device bewerken" : "Nieuw device"}
        fields={deviceFields}
        initialValues={
          editingDevice
            ? {
                label: editingDevice.label || "",
                device_type_id: String(editingDevice.device_type_id ?? ""),
                rack_position: editingDevice.rack_position ?? "",
                rack_units: editingDevice.rack_units ?? 1,
                manufacturer: editingDevice.manufacturer || "",
                model: editingDevice.model || "",
                serial_number: editingDevice.serial_number || "",
                mac_address: editingDevice.mac_address || "",
                notes: editingDevice.notes || "",
              }
            : {
                label: "",
                device_type_id: "",
                rack_position: "",
                rack_units: 1,
                manufacturer: "",
                model: "",
                serial_number: "",
                mac_address: "",
                notes: "",
              }
        }
        onSubmit={handleDeviceSubmit}
        isSubmitting={
          createDeviceMutation.isPending || updateDeviceMutation.isPending
        }
      />

      <FormModal
        key={editingPatchPanel?.id ?? "new-patch-panel"}
        isOpen={patchPanelModalOpen}
        onClose={() => {
          setPatchPanelModalOpen(false);
          setEditingPatchPanel(null);
        }}
        title={editingPatchPanel ? "Patch panel bewerken" : "Nieuw patch panel"}
        fields={patchPanelFields}
        initialValues={
          editingPatchPanel
            ? {
                label: editingPatchPanel.label || "",
                type: editingPatchPanel.type || "",
                manufacturer: editingPatchPanel.manufacturer || "",
                model: editingPatchPanel.model || "",
                port_count: editingPatchPanel.port_count ?? 24,
                rack_position: editingPatchPanel.rack_position ?? "",
                rack_units: editingPatchPanel.rack_units ?? 1,
                notes: editingPatchPanel.notes || "",
              }
            : {
                label: "",
                type: "",
                manufacturer: "",
                model: "",
                port_count: 24,
                rack_position: "",
                rack_units: 1,
                notes: "",
              }
        }
        onSubmit={handlePatchPanelSubmit}
        isSubmitting={
          createPatchPanelMutation.isPending ||
          updatePatchPanelMutation.isPending
        }
      />

      <FormModal
        key={editingCable?.id ?? "new-cable"}
        isOpen={cableModalOpen}
        onClose={() => {
          setCableModalOpen(false);
          setEditingCable(null);
        }}
        title={
          editingCable
            ? "Cable management bewerken"
            : "Nieuw cable management item"
        }
        fields={cableFields}
        initialValues={
          editingCable
            ? {
                label: editingCable.label || "",
                type: editingCable.type || "",
                rack_position: editingCable.rack_position ?? "",
                rack_units: editingCable.rack_units ?? 1,
                notes: editingCable.notes || "",
              }
            : {
                label: "",
                type: "",
                rack_position: "",
                rack_units: 1,
                notes: "",
              }
        }
        onSubmit={handleCableSubmit}
        isSubmitting={
          createCableMutation.isPending || updateCableMutation.isPending
        }
      />

      <Modal
        isOpen={!!deleteDeviceTarget}
        onClose={() => setDeleteDeviceTarget(null)}
        title="Device verwijderen"
      >
        <p className="text-sm text-gray-600">
          Weet je zeker dat je <strong>{deleteDeviceTarget?.label}</strong> wilt
          verwijderen?
          <span className="text-xs text-red-500 mt-2 block font-medium">
            Let op: de poorten van dit device gaan mee weg (CASCADE).
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteDeviceTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => deleteDeviceMutation.mutate(deleteDeviceTarget.id)}
            disabled={deleteDeviceMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
          >
            {deleteDeviceMutation.isPending
              ? "Verwijderen..."
              : "Device verwijderen"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletePatchPanelTarget}
        onClose={() => setDeletePatchPanelTarget(null)}
        title="Patch panel verwijderen"
      >
        <p className="text-sm text-gray-600">
          Weet je zeker dat je <strong>{deletePatchPanelTarget?.label}</strong>{" "}
          wilt verwijderen?
          <span className="text-xs text-red-500 mt-2 block font-medium">
            Let op: de poorten van dit patch panel gaan mee weg.
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeletePatchPanelTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() =>
              deletePatchPanelMutation.mutate(deletePatchPanelTarget.id)
            }
            disabled={deletePatchPanelMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
          >
            {deletePatchPanelMutation.isPending
              ? "Verwijderen..."
              : "Patch panel verwijderen"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteCableTarget}
        onClose={() => setDeleteCableTarget(null)}
        title="Cable management item verwijderen"
      >
        <p className="text-sm text-gray-600">
          Weet je zeker dat je <strong>{deleteCableTarget?.label}</strong> wilt
          verwijderen?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteCableTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => deleteCableMutation.mutate(deleteCableTarget.id)}
            disabled={deleteCableMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
          >
            {deleteCableMutation.isPending
              ? "Verwijderen..."
              : "Item verwijderen"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
