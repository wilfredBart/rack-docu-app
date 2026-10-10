import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { vlanColor } from "../PatchPlan/vlanColors";

// Poortenlijst + bulk-aanmaak-formulier voor het geselecteerde device/patch panel.
// Wordt alleen gerenderd wanneer selectedItem.kind !== "cable_management"
// (cable management items hebben geen poorten) — die check gebeurt in RackItemDetailPanel.
export default function RackPortsSection({
  selectedPorts,
  portForm,
  setPortForm,
  onBulkPortSubmit,
  updatePortMutation,
  deletePortMutation,
  bulkCreatePortsMutation,
  vlans = [],
  klantId,
  assignVlanMutation,
}) {
  const [range, setRange] = useState({ from: "1", to: "", vlanId: "", mode: "access" });

  // Natuurlijke volgorde (Gi0/2 vóór Gi0/10), ook nodig voor "poort 1 t/m 12".
  const ports = useMemo(
    () =>
      [...selectedPorts].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      ),
    [selectedPorts],
  );
  const vlanById = useMemo(() => new Map(vlans.map((v) => [v.id, v])), [vlans]);

  // VLAN's hangen aan device-poorten; een patch panel erft ze via de connection.
  const isDevice = ports.length > 0 && ports.every((p) => p.device_id);
  const isPatchPanel = ports.length > 0 && !isDevice;

  const assign = (portIds, vlanId, portMode) =>
    assignVlanMutation.mutate({ portIds, vlanId, portMode });

  const handleRangeSubmit = (e) => {
    e.preventDefault();
    const from = Math.max(1, Number(range.from) || 1);
    const to = Math.min(ports.length, Number(range.to) || ports.length);
    const ids = ports.slice(from - 1, to).map((p) => p.id);
    if (ids.length === 0) return;
    assign(ids, range.vlanId ? Number(range.vlanId) : null, range.mode);
  };

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
          ports.map((port) => (
            <div
              key={port.id}
              className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-bg-subtle px-2.5 py-1.5 text-xs text-fg-muted"
            >
              {isDevice && (
                <span
                  className="h-1 w-3 rounded-full"
                  style={{
                    background: port.vlan_id
                      ? vlanColor(vlanById.get(port.vlan_id)?.color)
                      : "var(--color-border-strong)",
                  }}
                />
              )}
              <span>{port.name}</span>
              {isDevice && (
                <>
                  <select
                    value={port.vlan_id ?? ""}
                    onChange={(e) =>
                      assign(
                        [port.id],
                        e.target.value ? Number(e.target.value) : null,
                        port.port_mode ?? "access",
                      )
                    }
                    className="rounded-md border border-border bg-card px-1.5 py-0.5 text-xs text-fg"
                    aria-label={`VLAN van ${port.name}`}
                  >
                    <option value="">Geen VLAN</option>
                    {vlans.map((v) => (
                      <option key={v.id} value={v.id}>
                        VLAN {v.vlan_number} {v.name}
                      </option>
                    ))}
                  </select>
                  {port.vlan_id && (
                    <select
                      value={port.port_mode ?? "access"}
                      onChange={(e) => assign([port.id], port.vlan_id, e.target.value)}
                      className="rounded-md border border-border bg-card px-1.5 py-0.5 text-xs text-fg"
                      aria-label={`Modus van ${port.name}`}
                    >
                      <option value="access">Access</option>
                      <option value="trunk">Trunk</option>
                    </select>
                  )}
                </>
              )}
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

      {isPatchPanel && (
        <p className="mb-4 text-xs text-fg-subtle">
          Een patch panel heeft zelf geen VLAN: het erft de VLAN van de poort
          waarmee het verbonden is (zichtbaar in het patchplan).
        </p>
      )}

      {isDevice && (
        <div className="mb-4 rounded-xl border border-border bg-bg-subtle p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold text-fg-muted">
              VLAN toewijzen aan reeks
            </h4>
            <Link
              to={`/klanten/${klantId}/vlans`}
              className="text-xs text-accent hover:text-fg"
            >
              VLAN&apos;s beheren
            </Link>
          </div>

          {vlans.length === 0 ? (
            <p className="text-xs text-fg-subtle">
              Deze klant heeft nog geen VLAN&apos;s. Maak ze eerst aan.
            </p>
          ) : (
            <form
              onSubmit={handleRangeSubmit}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end"
            >
              <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
                Van poort (positie)
                <input
                  type="number"
                  min="1"
                  value={range.from}
                  onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                  className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
                Tot en met
                <input
                  type="number"
                  min="1"
                  placeholder={`${ports.length}`}
                  value={range.to}
                  onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                  className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
                VLAN
                <select
                  value={range.vlanId}
                  onChange={(e) => setRange((r) => ({ ...r, vlanId: e.target.value }))}
                  className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
                >
                  <option value="">Geen VLAN (wissen)</option>
                  {vlans.map((v) => (
                    <option key={v.id} value={v.id}>
                      VLAN {v.vlan_number} {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
                Modus
                <select
                  value={range.mode}
                  onChange={(e) => setRange((r) => ({ ...r, mode: e.target.value }))}
                  className="rounded-lg border border-border px-2.5 py-2 text-sm text-fg bg-card"
                >
                  <option value="access">Access</option>
                  <option value="trunk">Trunk</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={assignVlanMutation.isPending}
                className="col-span-2 md:col-span-1 rounded-lg bg-accent text-accent-fg hover:opacity-90 px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                Toewijzen
              </button>
            </form>
          )}
        </div>
      )}

      <form
        onSubmit={onBulkPortSubmit}
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
