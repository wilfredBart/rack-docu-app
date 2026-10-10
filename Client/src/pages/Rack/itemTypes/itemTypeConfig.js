import { createDevice, updateDevice, deleteDevice, moveDevice } from "../../../api/devices";
import {
  createPatchPanel,
  updatePatchPanel,
  deletePatchPanel,
  movePatchPanel,
} from "../../../api/patchPanels";
import {
  createCableManagementItem,
  updateCableManagementItem,
  deleteCableManagementItem,
  moveCableManagementItem,
} from "../../../api/cableManagement";
import { getDeviceFields, patchPanelFields, cableFields } from "../rackFormFields";

// Eén config-object per item-type bundelt alles wat device/patch-panel/cable
// van elkaar onderscheidt. useRackItemCRUD + RackItemFormModal + RackItemDeleteModal
// zijn generiek en werken met welke config je er ook aan meegeeft.

export const deviceType = {
  kind: "device",
  label: "Device",
  title: { new: "Nieuw device", edit: "Device bewerken" },
  contentsKey: "devices",
  api: {
    create: createDevice,
    update: updateDevice,
    delete: deleteDevice,
    move: moveDevice,
  },
  getFields: (deviceTypes) => getDeviceFields(deviceTypes),
  toInitialValues: (item) =>
    item
      ? {
          label: item.label || "",
          device_type_id: String(item.device_type_id ?? ""),
          rack_position: item.rack_position ?? "",
          rack_units: item.rack_units ?? 1,
          port_count: item.ports?.length ?? item.port_count ?? 24,
          manufacturer: item.manufacturer || "",
          model: item.model || "",
          serial_number: item.serial_number || "",
          mac_address: item.mac_address || "",
          notes: item.notes || "",
        }
      : {
          label: "",
          device_type_id: "",
          rack_position: "",
          rack_units: 1,
          port_count: 24,
          manufacturer: "",
          model: "",
          serial_number: "",
          mac_address: "",
          notes: "",
        },
  toPayload: (values) => ({
    label: values.label,
    device_type_id: Number(values.device_type_id),
    manufacturer: values.manufacturer || "",
    model: values.model || "",
    serial_number: values.serial_number || "",
    mac_address: values.mac_address || "",
    rack_position: Number(values.rack_position),
    rack_units: Number(values.rack_units) || 1,
    port_count: Number(values.port_count) || 0,
    notes: values.notes || "",
  }),
  deleteWarning: "Let op: de poorten van dit device gaan mee weg (CASCADE).",
};

export const patchPanelType = {
  kind: "patch_panel",
  contentsKey: "patch_panels",
  label: "Patch panel",
  title: { new: "Nieuw patch panel", edit: "Patch panel bewerken" },
  api: {
    create: createPatchPanel,
    update: updatePatchPanel,
    delete: deletePatchPanel,
    move: movePatchPanel,
  },
  getFields: () => patchPanelFields,
  toInitialValues: (item) =>
    item
      ? {
          label: item.label || "",
          type: item.type || "",
          manufacturer: item.manufacturer || "",
          model: item.model || "",
          port_count: item.port_count ?? 24,
          rack_position: item.rack_position ?? "",
          rack_units: item.rack_units ?? 1,
          notes: item.notes || "",
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
        },
  toPayload: (values) => ({
    label: values.label,
    type: values.type || "",
    manufacturer: values.manufacturer || "",
    model: values.model || "",
    port_count: Number(values.port_count) || 1,
    rack_position: Number(values.rack_position),
    rack_units: Number(values.rack_units) || 1,
    notes: values.notes || "",
  }),
  deleteWarning: "Let op: de poorten van dit patch panel gaan mee weg.",
};

export const cableType = {
  kind: "cable_management",
  contentsKey: "cable_management",
  label: "Cable management item",
  title: {
    new: "Nieuw cable management item",
    edit: "Cable management bewerken",
  },
  api: {
    create: createCableManagementItem,
    update: updateCableManagementItem,
    delete: deleteCableManagementItem,
    move: moveCableManagementItem,
  },
  // Kortere knoptekst dan het volle label — bewust zo in de originele UI.
  deleteButtonLabel: "Item verwijderen",
  getFields: () => cableFields,
  toInitialValues: (item) =>
    item
      ? {
          label: item.label || "",
          type: item.type || "",
          rack_position: item.rack_position ?? "",
          rack_units: item.rack_units ?? 1,
          notes: item.notes || "",
        }
      : {
          label: "",
          type: "",
          rack_position: "",
          rack_units: 1,
          notes: "",
        },
  toPayload: (values) => ({
    label: values.label,
    type: values.type || "",
    rack_position: Number(values.rack_position),
    rack_units: Number(values.rack_units) || 1,
    notes: values.notes || "",
  }),
  deleteWarning: null,
};
