import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createDevice, updateDevice, deleteDevice } from "../../api/devices";
import { createDeviceType } from "../../api/deviceTypes";
import {
  createPatchPanel,
  updatePatchPanel,
  deletePatchPanel,
} from "../../api/patchPanels";
import {
  createCableManagementItem,
  updateCableManagementItem,
  deleteCableManagementItem,
} from "../../api/cableManagement";
import { bulkCreatePorts, updatePort, deletePort } from "../../api/ports";

// Bundelt alle create/update/delete-mutations voor een Rack-pagina.
// Elke mutation volgt hetzelfde patroon: invalidate → toast → modal/target resetten.
//
// `setters` bevat alle state-setters die de mutations nodig hebben om modals
// te sluiten en editing/delete-targets te resetten (komen uit Rack.jsx).
export function useRackMutations({ rackId, selectedItem, setters }) {
  const queryClient = useQueryClient();

  const {
    setDeviceModalOpen,
    setEditingDevice,
    setDeleteDeviceTarget,
    setPatchPanelModalOpen,
    setEditingPatchPanel,
    setDeletePatchPanelTarget,
    setCableModalOpen,
    setEditingCable,
    setDeleteCableTarget,
    setSelectedItem,
    setNewTypeName,
  } = setters;

  const invalidateRack = () =>
    queryClient.invalidateQueries({ queryKey: ["rack-contents", rackId] });

  const invalidateSelectedPorts = () =>
    queryClient.invalidateQueries({
      queryKey: [
        "selected-item-ports",
        selectedItem?.kind,
        selectedItem?.item?.id,
      ],
    });

  // ---- Device ----
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

  // ---- Patch panel ----
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

  // ---- Cable management ----
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

  // ---- Device type ----
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

  // ---- Ports ----
  const bulkCreatePortsMutation = useMutation({
    mutationFn: bulkCreatePorts,
    onSuccess: (data) => {
      invalidateSelectedPorts();
      invalidateRack();
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
      invalidateSelectedPorts();
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
      invalidateSelectedPorts();
      toast.success("Poort verwijderd");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Fout bij verwijderen van poort",
      );
    },
  });

  return {
    invalidateRack,
    createDeviceMutation,
    updateDeviceMutation,
    deleteDeviceMutation,
    createPatchPanelMutation,
    updatePatchPanelMutation,
    deletePatchPanelMutation,
    createCableMutation,
    updateCableMutation,
    deleteCableMutation,
    createTypeMutation,
    bulkCreatePortsMutation,
    updatePortMutation,
    deletePortMutation,
  };
}
