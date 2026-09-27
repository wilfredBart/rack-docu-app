import FormModal from "../../../components/UI/FormModal";

// Eén generieke FormModal voor elk item-type. `fieldsContext` is optioneel extra data
// die config.getFields nodig kan hebben (bv. deviceTypes voor het device-type-dropdown).
export default function RackItemFormModal({ config, crud, fieldsContext }) {
  return (
    <FormModal
      key={crud.editing?.id ?? `new-${config.kind}`}
      isOpen={crud.modalOpen}
      onClose={crud.closeModal}
      title={crud.editing ? config.title.edit : config.title.new}
      fields={config.getFields(fieldsContext)}
      initialValues={config.toInitialValues(crud.editing)}
      onSubmit={crud.submit}
      isSubmitting={crud.isSubmitting}
    />
  );
}
