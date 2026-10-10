import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Generieke create/update/delete-hook voor één item-type (device, patch panel of cable).
// `config` komt uit itemTypeConfig.js; `ctx` bevat de gedeelde afhankelijkheden die
// elke instantie nodig heeft: rackId (voor nieuwe items), invalidateRack (na elke
// mutatie) en setSelectedItem (om de selectie te resetten na een delete).
export function useRackItemCRUD(config, ctx) {
  const { rackId, invalidateRack, setSelectedItem } = ctx;
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Voorgevulde waarden voor een nieuw item (bv. { rack_position: 12, maxUnits: 3 }).
  const [prefill, setPrefill] = useState(null);

  const labelLower = config.label.toLowerCase();

  const createMutation = useMutation({
    mutationFn: config.api.create,
    onSuccess: () => {
      invalidateRack();
      toast.success(`${config.label} aangemaakt`);
      setModalOpen(false);
      setEditing(null);
      setPrefill(null);
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
      setPrefill(null);
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

  // Verplaatsen via drag & drop: positie meteen in de cache aanpassen (geen
  // terugspringen), bij een fout terugdraaien en de servermelding tonen.
  const moveMutation = useMutation({
    mutationFn: config.api.move,
    onMutate: async ({ id, rack_position }) => {
      const queryKey = ["rack-contents", rackId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        old
          ? {
              ...old,
              [config.contentsKey]: (old[config.contentsKey] ?? []).map((item) =>
                item.id === id ? { ...item, rack_position } : item,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["rack-contents", rackId], context.previous);
      }
      toast.error(
        err.response?.data?.message || `Fout bij verplaatsen van ${labelLower}`,
      );
    },
    onSettled: () => invalidateRack(),
  });

  const openNew = () => {
    setEditing(null);
    setPrefill(null);
    setModalOpen(true);
  };

  // Nieuw item openen met voorgevulde waarden (klik op een lege U in de rack).
  // Bewust een aparte functie: openNew wordt als onClick={...openNew} gebruikt en
  // zou dan het click-event als argument krijgen.
  const openNewAt = (values) => {
    setEditing(null);
    setPrefill(values);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setPrefill(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setPrefill(null);
  };

  const submit = (values) => {
    const payload = config.toPayload(values);

    // Nieuw item vanuit een klik op een lege U: als het item vanaf de aangeklikte U
    // niet naar boven past, schuif het naar beneden binnen het vrije blok.
    // De gebruiker hoeft zelf niets uit te rekenen.
    if (!editing && prefill?.blockHi) {
      const units = payload.rack_units;
      const topU = payload.rack_position + units - 1;
      if (topU > prefill.blockHi) {
        payload.rack_position = Math.max(prefill.blockLo, prefill.blockHi - units + 1);
      }
    }

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
    prefill,
    deleteTarget,
    setDeleteTarget,
    openNew,
    openNewAt,
    openEdit,
    closeModal,
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    deleteMutation,
    move: (id, rack_position) => moveMutation.mutate({ id, rack_position }),
  };
}
