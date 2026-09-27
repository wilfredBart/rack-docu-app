import FormModal from "../../components/UI/FormModal";

// Bundelt de 3 create/edit FormModals voor device, patch panel en cable management.
// Elke modal krijgt zijn eigen open/editing-state en submit-handler van Rack.jsx door.
export default function RackFormModals({
  deviceFields,
  deviceModalOpen,
  editingDevice,
  closeDeviceModal,
  onDeviceSubmit,
  deviceSubmitting,

  patchPanelFields,
  patchPanelModalOpen,
  editingPatchPanel,
  closePatchPanelModal,
  onPatchPanelSubmit,
  patchPanelSubmitting,

  cableFields,
  cableModalOpen,
  editingCable,
  closeCableModal,
  onCableSubmit,
  cableSubmitting,
}) {
  return (
    <>
      <FormModal
        key={editingDevice?.id ?? "new-device"}
        isOpen={deviceModalOpen}
        onClose={closeDeviceModal}
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
        onSubmit={onDeviceSubmit}
        isSubmitting={deviceSubmitting}
      />

      <FormModal
        key={editingPatchPanel?.id ?? "new-patch-panel"}
        isOpen={patchPanelModalOpen}
        onClose={closePatchPanelModal}
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
        onSubmit={onPatchPanelSubmit}
        isSubmitting={patchPanelSubmitting}
      />

      <FormModal
        key={editingCable?.id ?? "new-cable"}
        isOpen={cableModalOpen}
        onClose={closeCableModal}
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
        onSubmit={onCableSubmit}
        isSubmitting={cableSubmitting}
      />
    </>
  );
}
