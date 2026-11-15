import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { listFreeUs, occupiedUnits } from "./rackElevation";

/**
 * Volledige pagina-view voor nieuw rack-item (vervangt de add-modal).
 * Zelfde velden als de FormModal; bij Opslaan → parent sluit deze view.
 */
export default function RackItemFormView({
  config,
  fieldsContext,
  fieldExtras = {},
  rack,
  prefill = null,
  editing = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const maxUnits = prefill?.maxUnits;
  const { blockLo, blockHi } = prefill ?? {};

  const exclude =
    editing && rack
      ? { excludeKind: config.kind, excludeId: editing.id }
      : undefined;

  let positionOptions = [];
  if (rack) {
    const free = listFreeUs(rack, exclude);
    const positions = new Set(free);
    if (editing) {
      const { start, topU } = occupiedUnits(editing);
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
    ...config.toInitialValues(editing),
    ...prefill,
  };
  if (baseInitial.rack_position != null && baseInitial.rack_position !== "") {
    baseInitial.rack_position = String(baseInitial.rack_position);
  }

  const [values, setValues] = useState(baseInitial);

  useEffect(() => {
    setValues(baseInitial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when kind / prefill position changes
  }, [config.kind, prefill?.rack_position, editing?.id]);

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  const title = editing ? config.title.edit : config.title.new;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-fg">{title}</h2>
          <p className="text-sm text-fg-subtle mt-0.5">
            Vul de gegevens in en sla op om terug te keren naar het rack-overzicht.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-fg hover:bg-bg-subtle transition cursor-pointer shrink-0"
        >
          <FiArrowLeft className="text-fg-subtle" />
          Annuleren
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-border)] overflow-hidden"
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            {fields.map((field) => (
              <div
                key={field.name}
                className={`flex flex-col gap-1 ${
                  field.type === "textarea" ? "sm:col-span-2" : ""
                }`}
              >
                <label
                  htmlFor={`add-${field.name}`}
                  className="text-xs font-semibold text-fg-muted"
                >
                  {field.label}{" "}
                  {field.required && (
                    <span className="text-destructive">*</span>
                  )}
                </label>

                {field.type === "select" ? (
                  <select
                    id={`add-${field.name}`}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-subtle text-fg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  >
                    <option value="" disabled>
                      Selecteer {field.label.toLowerCase()}...
                    </option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={`add-${field.name}`}
                    rows={3}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-subtle text-fg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  />
                ) : (
                  <input
                    id={`add-${field.name}`}
                    type={field.type || "text"}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-subtle text-fg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  />
                )}

                {field.hint && (
                  <p className="text-xs text-fg-subtle">{field.hint}</p>
                )}
                {fieldExtras[field.name]}
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-5 py-3 bg-bg-subtle/40">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-fg-muted hover:text-fg transition cursor-pointer disabled:opacity-50"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </form>
    </div>
  );
}
