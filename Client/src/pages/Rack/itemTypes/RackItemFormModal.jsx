import FormModal from "../../../components/UI/FormModal";
import { listFreeUs, occupiedUnits } from "../rackElevation";

// Eén generieke FormModal voor elk item-type. `fieldsContext` is optioneel extra data
// die config.getFields nodig kan hebben (bv. deviceTypes voor het device-type-dropdown).
//
// crud.prefill (optioneel) bevat voorgevulde waarden bij een klik op een lege U, bv.
// { rack_position: 12, rack_units: 1, maxUnits: 3 }. maxUnits wordt als max op het
// "Aantal U"-veld gezet; toPayload() pikt enkel expliciete velden, dus maxUnits
// belandt nooit in de API-call.
//
// fieldExtras (optioneel): { [fieldName]: ReactNode } — extra UI onder een veld
//
// `rack` is nodig om Start-U als dropdown van vrije posities te tonen (hoog → laag).
export default function RackItemFormModal({
  config,
  crud,
  fieldsContext,
  fieldExtras,
  rack,
}) {
  const maxUnits = crud.prefill?.maxUnits;
  const { blockLo, blockHi } = crud.prefill ?? {};

  const exclude =
    crud.editing && rack
      ? { excludeKind: config.kind, excludeId: crud.editing.id }
      : undefined;

  // Vrije U's (al hoog → laag) + bij bewerken de U's die dit item nu inneemt.
  let positionOptions = [];
  if (rack) {
    const free = listFreeUs(rack, exclude);
    const positions = new Set(free);
    if (crud.editing) {
      const { start, topU } = occupiedUnits(crud.editing);
      for (let u = start; u <= topU; u += 1) positions.add(u);
    }
    positionOptions = [...positions]
      .sort((a, b) => b - a)
      .map((u) => ({ value: String(u), label: `U${u}` }));
  }

  const fields = config.getFields(fieldsContext).map((field) => {
    if (field.name === "rack_position") {
      return {
        ...field,
        type: "select",
        options: positionOptions,
        hint: positionOptions.length
          ? "Volgorde zoals de rack: hoog → laag. Standaard de eerste vrije van boven."
          : "Geen vrije U meer in deze rack.",
      };
    }
    if (field.name === "rack_units" && maxUnits) {
      return {
        ...field,
        min: 1,
        max: maxUnits,
        hint: `Vrij blok: U${blockLo}–U${blockHi} (max ${maxUnits}U). Past het niet boven de gekozen U, dan schuift het item automatisch naar beneden.`,
      };
    }
    return field;
  });

  const baseInitial = {
    ...config.toInitialValues(crud.editing),
    ...crud.prefill,
  };
  if (baseInitial.rack_position != null && baseInitial.rack_position !== "") {
    baseInitial.rack_position = String(baseInitial.rack_position);
  }

  // Alleen nog voor bewerken; nieuw item gaat via RackItemFormView.
  const isOpen = crud.modalOpen && !!crud.editing;

  return (
    <FormModal
      key={crud.editing?.id ?? "edit-closed"}
      isOpen={isOpen}
      onClose={crud.closeModal}
      title={config.title.edit}
      fields={fields}
      initialValues={baseInitial}
      onSubmit={crud.submit}
      isSubmitting={crud.isSubmitting}
      fieldExtras={fieldExtras}
    />
  );
}
