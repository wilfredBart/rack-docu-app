import FormModal from "../../../components/UI/FormModal";

// Eén generieke FormModal voor elk item-type. `fieldsContext` is optioneel extra data
// die config.getFields nodig kan hebben (bv. deviceTypes voor het device-type-dropdown).
//
// crud.prefill (optioneel) bevat voorgevulde waarden bij een klik op een lege U, bv.
// { rack_position: 12, rack_units: 1, maxUnits: 3 }. maxUnits wordt als max op het
// "Aantal U"-veld gezet; toPayload() pikt enkel expliciete velden, dus maxUnits
// belandt nooit in de API-call.
export default function RackItemFormModal({ config, crud, fieldsContext }) {
  const maxUnits = crud.prefill?.maxUnits;
  const { blockLo, blockHi } = crud.prefill ?? {};

  const fields = config.getFields(fieldsContext).map((field) =>
    field.name === "rack_units" && maxUnits
      ? {
          ...field,
          min: 1,
          max: maxUnits,
          hint: `Vrij blok: U${blockLo}–U${blockHi} (max ${maxUnits}U). Past het niet boven de gekozen U, dan schuift het item automatisch naar beneden.`,
        }
      : field,
  );

  return (
    <FormModal
      key={
        crud.editing?.id ??
        `new-${config.kind}-${crud.prefill?.rack_position ?? ""}`
      }
      isOpen={crud.modalOpen}
      onClose={crud.closeModal}
      title={crud.editing ? config.title.edit : config.title.new}
      fields={fields}
      initialValues={{
        ...config.toInitialValues(crud.editing),
        ...crud.prefill,
      }}
      onSubmit={crud.submit}
      isSubmitting={crud.isSubmitting}
    />
  );
}
