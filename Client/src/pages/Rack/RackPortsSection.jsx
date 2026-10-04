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
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-fg">Poorten</h3>
        <span className="text-xs text-fg-subtle">
          {selectedPorts.length} totaal
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {selectedPorts.length === 0 ? (
          <span className="text-xs text-fg-subtle">
            Geen poorten aangemaakt.
          </span>
        ) : (
          selectedPorts.map((port) => (
            <div
              key={port.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-subtle px-2.5 py-1.5 text-xs text-fg-muted"
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
                className="text-accent hover:text-fg cursor-pointer"
              >
                Hernoem
              </button>
              <button
                type="button"
                onClick={() => deletePortMutation.mutate(port.id)}
                className="text-destructive hover:text-destructive cursor-pointer"
              >
                Verwijder
              </button>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={onBulkSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-border bg-bg-subtle p-3"
      >
        <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
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
            className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
          Prefix
          <input
            type="text"
            value={portForm.prefix}
            onChange={(e) =>
              setPortForm((prev) => ({ ...prev, prefix: e.target.value }))
            }
            className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
          Type
          <input
            type="text"
            value={portForm.port_type}
            onChange={(e) =>
              setPortForm((prev) => ({ ...prev, port_type: e.target.value }))
            }
            className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
          Snelheid
          <input
            type="text"
            value={portForm.speed}
            onChange={(e) =>
              setPortForm((prev) => ({ ...prev, speed: e.target.value }))
            }
            className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
          />
        </label>

        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={bulkCreatePortsMutation.isPending}
            className="rounded-lg bg-accent text-accent-fg hover:opacity-90 px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
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
