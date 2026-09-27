// Poortenlijst + bulk-aanmaak-formulier voor het geselecteerde device/patch panel.
// Wordt alleen gerenderd wanneer selectedItem.kind !== "cable_management"
// (cable management items hebben geen poorten) — die check gebeurt in RackItemDetailPanel.
export default function RackPortsSection({
  selectedPorts,
  portForm,
  setPortForm,
  onBulkSubmit,
  updatePortMutation,
  deletePortMutation,
  bulkCreatePortsMutation,
}) {
  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Poorten</h3>
        <span className="text-xs text-slate-400">
          {selectedPorts.length} totaal
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {selectedPorts.length === 0 ? (
          <span className="text-xs text-slate-400">
            Geen poorten aangemaakt.
          </span>
        ) : (
          selectedPorts.map((port) => (
            <div
              key={port.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
            >
              <span>{port.name}</span>
              <button
                type="button"
                onClick={() => {
                  const nextName = window.prompt("Nieuwe poortnaam", port.name);
                  if (!nextName || !nextName.trim()) {
                    return;
                  }
                  updatePortMutation.mutate({
                    id: port.id,
                    name: nextName.trim(),
                    port_type: port.port_type || "RJ45",
                    speed: port.speed || "",
                  });
                }}
                className="text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Hernoem
              </button>
              <button
                type="button"
                onClick={() => deletePortMutation.mutate(port.id)}
                className="text-red-600 hover:text-red-700 cursor-pointer"
              >
                Verwijder
              </button>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={onBulkSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
          Aantal
          <input
            type="number"
            min="1"
            value={portForm.count}
            onChange={(e) =>
              setPortForm((prev) => ({
                ...prev,
                count: Number(e.target.value) || 1,
              }))
            }
            className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
          Prefix
          <input
            type="text"
            value={portForm.prefix}
            onChange={(e) =>
              setPortForm((prev) => ({ ...prev, prefix: e.target.value }))
            }
            className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
          Type
          <input
            type="text"
            value={portForm.port_type}
            onChange={(e) =>
              setPortForm((prev) => ({ ...prev, port_type: e.target.value }))
            }
            className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
          Snelheid
          <input
            type="text"
            value={portForm.speed}
            onChange={(e) =>
              setPortForm((prev) => ({ ...prev, speed: e.target.value }))
            }
            className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-800 bg-white"
          />
        </label>

        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={bulkCreatePortsMutation.isPending}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
          >
            {bulkCreatePortsMutation.isPending
              ? "Aanmaken..."
              : "Poorten aanmaken"}
          </button>
        </div>
      </form>
    </div>
  );
}
