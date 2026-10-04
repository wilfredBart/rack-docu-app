import Modal from "../../../components/UI/Modal";

// Eén generieke delete-confirmatie modal voor elk item-type.
export default function RackItemDeleteModal({ config, crud }) {
  const target = crud.deleteTarget;
  const buttonLabel = config.deleteButtonLabel ?? `${config.label} verwijderen`;

  return (
    <Modal
      isOpen={!!target}
      onClose={() => crud.setDeleteTarget(null)}
      title={`${config.label} verwijderen`}
    >
      <p className="text-sm text-fg-muted">
        Weet je zeker dat je <strong>{target?.label}</strong> wilt
        verwijderen?
        {config.deleteWarning && (
          <span className="text-xs text-destructive mt-2 block font-medium">
            {config.deleteWarning}
          </span>
        )}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => crud.setDeleteTarget(null)}
          className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted hover:bg-bg-subtle cursor-pointer"
        >
          Annuleren
        </button>
        <button
          type="button"
          onClick={() => crud.deleteMutation.mutate(target.id)}
          disabled={crud.deleteMutation.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
        >
          {crud.deleteMutation.isPending ? "Verwijderen..." : buttonLabel}
        </button>
      </div>
    </Modal>
  );
}
