import { useState, useEffect } from "react";
import Modal from "./Modal";

/**
 * fields voorbeeld:
 * [
 *   { name: 'name', label: 'Naam', type: 'text', placeholder: 'bijv. Jan Peeters', required: true },
 *   { name: 'email', label: 'E-mailadres', type: 'email' },
 *   { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ACTIEF', label: 'Actief' }] }
 * ]
 */
function FormModal({
  isOpen,
  onClose,
  title,
  fields = [],
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  submitText = "Opslaan",
}) {
  const [values, setValues] = useState(initialValues);

  // 🔄 Synchroniseer/reset de form waarden telkens wanneer de modal opent of initialValues veranderen
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
    }
  }, [isOpen, initialValues]);

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1">
            <label htmlFor={field.name} className="text-xs font-semibold text-slate-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>

            {field.type === "select" ? (
              <select
                id={field.name}
                value={values[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
                id={field.name}
                rows={3}
                value={values[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder || ""}
                required={field.required}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            ) : (
              <input
                id={field.name}
                type={field.type || "text"}
                value={values[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder || ""}
                required={field.required}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            )}
          </div>
        ))}

        {/* Knoppen onderaan */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none transition-colors cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined text-sm animate-spin">
                progress_activity
              </span>
            )}
            {isSubmitting ? "Bezig met opslaan..." : submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default FormModal;