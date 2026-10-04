import Modal from "../../components/UI/Modal";

// Bundelt de 3 delete-confirmatie modals voor device, patch panel en cable management.
export default function RackDeleteModals({
  deleteDeviceTarget,
  closeDeleteDevice,
  confirmDeleteDevice,
  deleteDevicePending,

  deletePatchPanelTarget,
  closeDeletePatchPanel,
  confirmDeletePatchPanel,
  deletePatchPanelPending,

  deleteCableTarget,
  closeDeleteCable,
  confirmDeleteCable,
  deleteCablePending,
}) {
  return (
    <>
      <Modal
        isOpen={!!deleteDeviceTarget}
        onClose={closeDeleteDevice}
        title="Device verwijderen"
      >
        <p className="text-sm text-fg-muted">
          Weet je zeker dat je <strong>{deleteDeviceTarget?.label}</strong>{" "}
          wilt verwijderen?
          <span className="text-xs text-destructive mt-2 block font-medium">
            Let op: de poorten van dit device gaan mee weg (CASCADE).
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDeleteDevice}
            className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted hover:bg-bg-subtle cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={confirmDeleteDevice}
            disabled={deleteDevicePending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {deleteDevicePending ? "Verwijderen..." : "Device verwijderen"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletePatchPanelTarget}
        onClose={closeDeletePatchPanel}
        title="Patch panel verwijderen"
      >
        <p className="text-sm text-fg-muted">
          Weet je zeker dat je{" "}
          <strong>{deletePatchPanelTarget?.label}</strong> wilt verwijderen?
          <span className="text-xs text-destructive mt-2 block font-medium">
            Let op: de poorten van dit patch panel gaan mee weg.
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDeletePatchPanel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted hover:bg-bg-subtle cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={confirmDeletePatchPanel}
            disabled={deletePatchPanelPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {deletePatchPanelPending
              ? "Verwijderen..."
              : "Patch panel verwijderen"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteCableTarget}
        onClose={closeDeleteCable}
        title="Cable management item verwijderen"
      >
        <p className="text-sm text-fg-muted">
          Weet je zeker dat je <strong>{deleteCableTarget?.label}</strong>{" "}
          wilt verwijderen?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDeleteCable}
            className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted hover:bg-bg-subtle cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={confirmDeleteCable}
            disabled={deleteCablePending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {deleteCablePending ? "Verwijderen..." : "Item verwijderen"}
          </button>
        </div>
      </Modal>
    </>
  );
}
