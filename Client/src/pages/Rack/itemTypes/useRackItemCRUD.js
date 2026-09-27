import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Generieke create/update/delete-hook voor één item-type (device, patch panel of cable).
// `config` komt uit itemTypeConfig.js; `ctx` bevat de gedeelde afhankelijkheden die
// elke instantie nodig heeft: rackId (voor nieuwe items), invalidateRack (na elke
// mutatie) en setSelectedItem (om de selectie te resetten na een delete).
export function useRackItemCRUD(config, ctx) {
  const { rackId, invalidateRack, setSelectedItem } = ctx;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const labelLower = config.label.toLowerCase();

  const createMutation = useMutation({
    mutationFn: config.api.create,
    onSuccess: () => {
      invalidateRack();
      toast.success(`${config.label} aangemaakt`);
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || `Fout bij aanmaken van ${labelLower}`,
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: config.api.update,
    onSuccess: () => {
      invalidateRack();
      toast.success(`${config.label} bijgewerkt`);
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || `Fout bij bijwerken van ${labelLower}`,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: config.api.delete,
    onSuccess: (data) => {
      invalidateRack();
      toast.success(data?.message || `${config.label} verwijderd`);
      setDeleteTarget(null);
      setSelectedItem(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message ||
          `Fout bij verwijderen van ${labelLower}`,
      );
    },
  });

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const submit = (values) => {
    const payload = config.toPayload(values);
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate({ rack_id: rackId, ...payload });
    }
  };

  return {
    kind: config.kind,
    modalOpen,
    editing,
    deleteTarget,
    setDeleteTarget,
    openNew,
    openEdit,
    closeModal,
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    deleteMutation,
  };
}
