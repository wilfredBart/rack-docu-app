import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FiBox,
  FiHardDrive,
  FiPlus,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import Header from "../../components/Header";
import Modal from "../../components/UI/Modal";
import PageHeader from "../../components/UI/PageHeader";
import { fetchCustomerPatchPlans } from "../../api/customers";
import { fetchPatchPlan } from "../../api/patchPanels";
import { fetchDevicePatchPlan } from "../../api/devices";
import {
  createConnection,
  updateConnection,
  deleteConnection,
} from "../../api/connections";
import { assignVlan } from "../../api/ports";
import { fetchVlans } from "../../api/vlans";
import { vlanColor, vlanLabel } from "./vlanColors";

const STATUS_MAP = { actief: "Actief", niet_getest: "Niet getest", defect: "Defect" };
const STATUS_DOT = {
  actief: "bg-led-power",
  niet_getest: "bg-led-activity",
  defect: "bg-led-fault",
  free: "bg-fg-subtle/40",
};

const naturalSort = (a, b) =>
  String(a).localeCompare(String(b), undefined, { numeric: true });

/**
 * /klanten/:klantId/patchplan
 *   (geen params)  → overzicht alle plannen
 *   ?device=9      → tabel voor device
 *   ?panel=5       → tabel voor panel
 */
export default function PatchPlan() {
  const { klantId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const deviceId = searchParams.get("device");
  const panelId = searchParams.get("panel");
  const rackId = searchParams.get("rackId");
  const siteId = searchParams.get("siteId");

  const detailKind = deviceId ? "device" : panelId ? "patch_panel" : null;
  const detailId = deviceId || panelId;

  const backTo =
    rackId && klantId
      ? `/klanten/${klantId}/racks/${rackId}`
      : `/klanten/${klantId}`;
  const backLabel = rackId ? "Terug naar rack" : "Terug";

  const breadcrumb = detailKind
    ? [
        { label: backLabel, to: backTo },
        { label: "Patchplannen", to: `/klanten/${klantId}/patchplan` },
        { label: "Detail" },
      ]
    : [
        { label: backLabel, to: backTo },
        { label: "Patchplannen - Overzicht" },
      ];

  const breadcrumbTrailing = (
    <Link
      to={
        rackId
          ? `/klanten/${klantId}/vlans?rackId=${rackId}`
          : `/klanten/${klantId}/vlans`
      }
      className="ml-auto text-fg-muted hover:text-accent font-medium"
    >
      VLAN beheer
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg pb-12">
      <Header
        breadcrumb={breadcrumb}
        breadcrumbTrailing={breadcrumbTrailing}
      />
      <div className="w-full">
        {detailKind ? (
          <PlanDetail
            klantId={klantId}
            kind={detailKind}
            id={detailId}
            onBack={() => {
              const next = new URLSearchParams();
              if (rackId) next.set("rackId", rackId);
              if (siteId) next.set("siteId", siteId);
              setSearchParams(next);
            }}
          />
        ) : (
          <PlanOverview
            klantId={klantId}
            onOpen={(plan) => {
              const next = new URLSearchParams();
              if (plan.kind === "device") next.set("device", String(plan.id));
              else next.set("panel", String(plan.id));
              if (rackId) next.set("rackId", rackId);
              if (siteId || plan.site_id)
                next.set("siteId", String(siteId || plan.site_id));
              setSearchParams(next);
            }}
          />
        )}
      </div>
    </div>
  );
}

function PlanOverview({ klantId, onOpen }) {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["patchplans-index", klantId],
    queryFn: () => fetchCustomerPatchPlans(klantId),
    enabled: !!klantId,
  });

  return (
    <>
      <PageHeader
        title="Patchplannen - Overzicht"
        subtitle="Elk device en patch panel met poorten heeft een plan (ook als er nog niets gepatcht is). Titel = label."
      />

      {isLoading ? (
        <Empty>Laden...</Empty>
      ) : plans.length === 0 ? (
        <Empty>
          Nog geen patchplannen. Voeg een device of patch panel toe in een rack
          (met aantal poorten).
        </Empty>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-border)] overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-border text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                <th className="p-3">Plan</th>
                <th className="p-3">Type</th>
                <th className="p-3">Site / rack</th>
                <th className="p-3 text-right">Poorten</th>
                <th className="p-3 text-right">Gepatcht</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans.map((plan) => (
                <tr
                  key={`${plan.kind}-${plan.id}`}
                  className="hover:bg-bg-subtle transition cursor-pointer"
                  onClick={() => onOpen(plan)}
                >
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-fg">
                      {plan.kind === "device" ? (
                        <FiHardDrive className="text-fg-subtle shrink-0" />
                      ) : (
                        <FiBox className="text-fg-subtle shrink-0" />
                      )}
                      {plan.label}
                    </span>
                  </td>
                  <td className="p-3 text-fg-muted">
                    {plan.kind === "device" ? "Device" : "Patch panel"}
                  </td>
                  <td className="p-3 text-fg-subtle">
                    {[plan.site_name, plan.rack_name].filter(Boolean).join(" · ")}
                  </td>
                  <td className="p-3 text-right tabular-nums text-fg">
                    {plan.port_count}
                  </td>
                  <td className="p-3 text-right tabular-nums text-fg">
                    {plan.connected_count}
                    <span className="text-fg-subtle">/{plan.port_count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PlanDetail({ klantId, kind, id, onBack }) {
  const queryClient = useQueryClient();
  const [connectPort, setConnectPort] = useState(null);
  const [editConnection, setEditConnection] = useState(null);

  const planQuery = useQuery({
    queryKey: ["patchplan", kind, id],
    queryFn: () =>
      kind === "device" ? fetchDevicePatchPlan(id) : fetchPatchPlan(id),
    enabled: !!id,
  });

  const { data: vlans = [] } = useQuery({
    queryKey: ["vlans", klantId],
    queryFn: () => fetchVlans(klantId),
    enabled: !!klantId && kind === "device",
  });

  const indexQuery = useQuery({
    queryKey: ["patchplans-index", klantId],
    queryFn: () => fetchCustomerPatchPlans(klantId),
    enabled: !!klantId,
  });

  const assignVlanMutation = useMutation({
    mutationFn: assignVlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patchplan", kind, id] });
      queryClient.invalidateQueries({ queryKey: ["vlans", klantId] });
      queryClient.invalidateQueries({ queryKey: ["selected-item-ports"] });
      toast.success("VLAN bijgewerkt");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Fout bij instellen van VLAN"),
  });

  const plan = planQuery.data;
  const rows = useMemo(() => {
    if (!plan?.ports) return [];
    return [...plan.ports]
      .sort((a, b) => naturalSort(a.name, b.name))
      .map((port) => {
        const c = port.connection;
        const vlan =
          kind === "device" ? port.vlan ?? c?.vlan ?? null : c?.vlan ?? null;
        const statusKey = c ? c.status || "niet_getest" : "free";
        return {
          port,
          connection: c,
          vlan,
          statusKey,
          statusLabel: c ? STATUS_MAP[c.status] || c.status : "Vrij",
          otherLabel: c?.other_endpoint_label || null,
          otherPort: c?.other_port_name || null,
          cable: c
            ? [c.cable_type, c.cable_label].filter(Boolean).join(", ") || "—"
            : null,
        };
      });
  }, [plan, kind]);

  const deleteMutation = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patchplan", kind, id] });
      queryClient.invalidateQueries({ queryKey: ["patchplans-index", klantId] });
      toast.success("Verbinding verwijderd");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Verwijderen mislukt"),
  });

  const createMutation = useMutation({
    mutationFn: createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patchplan"] });
      queryClient.invalidateQueries({ queryKey: ["patchplans-index", klantId] });
      setConnectPort(null);
      toast.success("Verbinding aangemaakt (zichtbaar op beide plannen)");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Aanmaken mislukt"),
  });

  const updateMutation = useMutation({
    mutationFn: updateConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patchplan"] });
      queryClient.invalidateQueries({ queryKey: ["patchplans-index", klantId] });
      setEditConnection(null);
      toast.success("Verbinding bijgewerkt");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Bijwerken mislukt"),
  });

  const targetOptions = useMemo(() => {
    return (indexQuery.data ?? []).filter(
      (p) => !(p.kind === kind && String(p.id) === String(id)),
    );
  }, [indexQuery.data, kind, id]);

  if (planQuery.isLoading || !plan) {
    return (
      <>
        <PageHeader title="Patchplan" />
        <Empty>
          {planQuery.isLoading ? "Patchplan laden..." : "Plan niet gevonden."}
        </Empty>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={kind === "device" ? "Device" : "Patch panel"}
        title={plan.label}
        subtitle={`${rows.filter((r) => r.connection).length}/${rows.length} gepatcht`}
        actions={
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-fg-muted hover:text-fg cursor-pointer"
          >
            Alle plannen
          </button>
        }
      />

      {rows.length === 0 ? (
        <Empty>
          Dit plan heeft nog geen poorten. Voeg poorten toe via de rack (aantal
          poorten bij device/panel).
        </Empty>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-border)] overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[40rem]">
            <thead>
              <tr className="bg-bg-subtle border-b border-border text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                <th className="p-3">Van</th>
                <th className="p-3">Poort</th>
                <th className="p-3">Naar</th>
                <th className="p-3">Poort</th>
                <th className="p-3">VLAN</th>
                <th className="p-3">Kabel</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr
                  key={row.port.id}
                  className={
                    row.statusKey === "defect"
                      ? "bg-destructive/5"
                      : row.statusKey === "free"
                        ? "opacity-80"
                        : ""
                  }
                >
                  <td className="p-3 font-medium text-fg">{plan.label}</td>
                  <td className="p-3 font-mono text-xs text-fg-muted">
                    {row.port.name}
                  </td>
                  <td className="p-3 text-fg">
                    {row.otherLabel || (
                      <span className="text-fg-subtle italic">—</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-fg-muted">
                    {row.otherPort || "—"}
                  </td>
                  <td className="p-3">
                    {kind === "device" ? (
                      <select
                        value={row.port.vlan_id ?? row.vlan?.id ?? ""}
                        disabled={assignVlanMutation.isPending}
                        onChange={(e) => {
                          const val = e.target.value;
                          assignVlanMutation.mutate({
                            portIds: [row.port.id],
                            vlanId: val ? Number(val) : null,
                            portMode: row.port.port_mode ?? "access",
                          });
                        }}
                        className="max-w-[11rem] rounded-md border border-border bg-bg-subtle px-2 py-1 text-xs text-fg"
                        aria-label={`VLAN van ${row.port.name}`}
                      >
                        <option value="">Geen VLAN</option>
                        {vlans.map((v) => (
                          <option key={v.id} value={v.id}>
                            VLAN {v.vlan_number} · {v.name}
                          </option>
                        ))}
                      </select>
                    ) : row.vlan ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: vlanColor(row.vlan.color) }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: vlanColor(row.vlan.color) }}
                        />
                        {vlanLabel(row.vlan)}
                      </span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className="p-3 text-fg-subtle text-xs">
                    {row.cable || "—"}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                      <span
                        className={`w-2 h-2 rounded-full ${STATUS_DOT[row.statusKey] || STATUS_DOT.free}`}
                      />
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {row.connection ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setEditConnection({
                                connection: row.connection,
                                portName: row.port.name,
                              })
                            }
                            className="p-2 rounded-lg text-fg-subtle hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                            title="Bewerken"
                          >
                            <FiEdit2 className="text-base" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Verbinding verwijderen? Dit verdwijnt op beide plannen.",
                                )
                              ) {
                                deleteMutation.mutate(row.connection.id);
                              }
                            }}
                            className="p-2 rounded-lg text-fg-subtle hover:text-destructive hover:bg-bg-subtle transition cursor-pointer"
                            title="Verwijderen"
                          >
                            <FiTrash2 className="text-base" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConnectPort(row.port)}
                          className="p-2 rounded-lg text-fg-subtle hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                          title="Verbinden"
                        >
                          <FiPlus className="text-base" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConnectModal
        isOpen={!!connectPort}
        onClose={() => setConnectPort(null)}
        fromPort={connectPort}
        fromLabel={plan.label}
        targets={targetOptions}
        isSubmitting={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      <EditConnectionModal
        isOpen={!!editConnection}
        onClose={() => setEditConnection(null)}
        data={editConnection}
        fromLabel={plan.label}
        isSubmitting={updateMutation.isPending}
        onSubmit={(payload) => updateMutation.mutate(payload)}
      />
    </>
  );
}

function ConnectModal({
  isOpen,
  onClose,
  fromPort,
  fromLabel,
  targets,
  onSubmit,
  isSubmitting,
}) {
  const [targetKind, setTargetKind] = useState("");
  const [targetId, setTargetId] = useState("");
  const [toPortId, setToPortId] = useState("");
  const [cableType, setCableType] = useState("Cat6");
  const [cableLabel, setCableLabel] = useState("");
  const [status, setStatus] = useState("niet_getest");

  const targetPlan = targets.find(
    (t) => t.kind === targetKind && String(t.id) === String(targetId),
  );

  const targetPlanQuery = useQuery({
    queryKey: ["patchplan", targetKind, targetId],
    queryFn: () =>
      targetKind === "device"
        ? fetchDevicePatchPlan(targetId)
        : fetchPatchPlan(targetId),
    enabled: isOpen && !!targetKind && !!targetId,
  });

  const freeTargetPorts = useMemo(() => {
    const ports = targetPlanQuery.data?.ports ?? [];
    return ports
      .filter((p) => !p.connection)
      .sort((a, b) => naturalSort(a.name, b.name));
  }, [targetPlanQuery.data]);

  const devices = targets.filter((t) => t.kind === "device");
  const panels = targets.filter((t) => t.kind === "patch_panel");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fromPort?.id || !toPortId) {
      toast.error("Kies een doelpoort");
      return;
    }
    onSubmit({
      from_port_id: Number(fromPort.id),
      to_port_id: Number(toPortId),
      cable_type: cableType || null,
      cable_label: cableLabel || null,
      status,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fromPort ? `Verbind ${fromLabel} · ${fromPort.name}` : "Verbinden"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-fg-subtle font-medium">Doel-type</span>
          <select
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
            value={targetKind}
            onChange={(e) => {
              setTargetKind(e.target.value);
              setTargetId("");
              setToPortId("");
            }}
          >
            <option value="">Kies…</option>
            <option value="device">Device</option>
            <option value="patch_panel">Patch panel</option>
          </select>
        </label>

        {targetKind ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-fg-subtle font-medium">Doel-plan</span>
            <select
              className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setToPortId("");
              }}
            >
              <option value="">Kies…</option>
              {(targetKind === "device" ? devices : panels).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                  {t.rack_name ? ` (${t.rack_name})` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {targetId ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-fg-subtle font-medium">
              Vrije poort op {targetPlan?.label || "doel"}
            </span>
            <select
              className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
              value={toPortId}
              onChange={(e) => setToPortId(e.target.value)}
              required
            >
              <option value="">Kies…</option>
              {freeTargetPorts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {targetPlanQuery.isLoading ? (
              <span className="text-xs text-fg-subtle">Poorten laden…</span>
            ) : freeTargetPorts.length === 0 ? (
              <span className="text-xs text-fg-subtle">
                Geen vrije poorten op dit plan.
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-fg-subtle font-medium">Kabeltype</span>
            <input
              className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
              value={cableType}
              onChange={(e) => setCableType(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-fg-subtle font-medium">Kabellabel</span>
            <input
              className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
              value={cableLabel}
              onChange={(e) => setCableLabel(e.target.value)}
              placeholder="KB-001"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-fg-subtle font-medium">Status</span>
          <select
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="niet_getest">Niet getest</option>
            <option value="actief">Actief</option>
            <option value="defect">Defect</option>
          </select>
        </label>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted hover:bg-bg-subtle cursor-pointer"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !toPortId}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-fg hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Bezig…" : "Verbinding opslaan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


function EditConnectionModal({
  isOpen,
  onClose,
  data,
  fromLabel,
  onSubmit,
  isSubmitting,
}) {
  const c = data?.connection;
  if (!isOpen || !c) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bewerken · ${fromLabel} · ${data?.portName || ""}`}
    >
      <EditConnectionForm
        key={c.id}
        connection={c}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}

function EditConnectionForm({ connection: c, onClose, onSubmit, isSubmitting }) {
  const [cableType, setCableType] = useState(c.cable_type || "");
  const [cableLabel, setCableLabel] = useState(c.cable_label || "");
  const [status, setStatus] = useState(c.status || "niet_getest");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      id: c.id,
      cable_type: cableType || null,
      cable_label: cableLabel || null,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
      <p className="text-xs text-fg-subtle">
        Naar: {c.other_endpoint_label || "—"} · {c.other_port_name || "—"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-fg-subtle font-medium">Kabeltype</span>
          <input
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
            value={cableType}
            onChange={(e) => setCableType(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-fg-subtle font-medium">Kabellabel</span>
          <input
            className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
            value={cableLabel}
            onChange={(e) => setCableLabel(e.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-fg-subtle font-medium">Status</span>
        <select
          className="rounded-lg border border-border bg-bg-subtle px-3 py-2 text-fg"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="niet_getest">Niet getest</option>
          <option value="actief">Actief</option>
          <option value="defect">Defect</option>
        </select>
      </label>
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted hover:bg-bg-subtle cursor-pointer"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-fg hover:opacity-90 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Bezig…" : "Opslaan"}
        </button>
      </div>
    </form>
  );
}

function Empty({ children }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-fg-subtle">
      {children}
    </div>
  );
}
