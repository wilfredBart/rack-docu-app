import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createDeviceType } from "../../api/deviceTypes";
import { bulkCreatePorts, updatePort, deletePort, assignVlan } from "../../api/ports";

// Device-types en poorten volgen niet het device/patch-panel/cable-patroon
// (geen edit, geen rack-positie), dus die horen niet thuis in useRackItemCRUD.
export function usePortAndTypeMutations({ selectedItem, invalidateRack, setNewTypeName }) {
  const queryClient = useQueryClient();

  const invalidateSelectedPorts = () =>
    queryClient.invalidateQueries({
      queryKey: [
        "selected-item-ports",
        selectedItem?.kind,
        selectedItem?.item?.id,
      ],
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

  // VLAN (en modus) van één of meerdere device-poorten instellen of wissen.
  const assignVlanMutation = useMutation({
    mutationFn: assignVlan,
    onSuccess: () => {
      invalidateSelectedPorts();
      queryClient.invalidateQueries({ queryKey: ["vlans"] });
      queryClient.invalidateQueries({ queryKey: ["patchplan"] });
      toast.success("VLAN bijgewerkt");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij instellen van VLAN");
    },
  });

  return {
    createTypeMutation,
    bulkCreatePortsMutation,
    updatePortMutation,
    deletePortMutation,
    assignVlanMutation,
  };
}
