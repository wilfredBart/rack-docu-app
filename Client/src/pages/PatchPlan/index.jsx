import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";
import Header from "../../components/Header";
import { fetchPatchPanelsBySite, fetchPatchPlan } from "../../api/patchPanels";
import PatchPanelFace from "./PatchPanelFace";
import PatchCard from "./PatchCard";
import { vlanColor } from "./vlanColors";
import "./patchplan.css";

// connections.status → LED-kleur van het patchpaneel
const STATUS_MAP = { actief: "on", niet_getest: "warn", defect: "bad" };

const naturalSort = (a, b) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

// Route: /klanten/:klantId/patchplan?siteId=1[&panel=5]
export default function PatchPlan() {
  const { klantId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const siteId = searchParams.get("siteId");
  const [filter, setFilter] = useState("all");

  const panelsQuery = useQuery({
    queryKey: ["patch-panels", "site", siteId],
    queryFn: () => fetchPatchPanelsBySite(siteId),
    enabled: !!siteId,
  });
  const panels = panelsQuery.data ?? [];
  const panelId = searchParams.get("panel") ?? panels[0]?.id;

  const planQuery = useQuery({
    queryKey: ["patchplan", panelId],
    queryFn: () => fetchPatchPlan(panelId),
    enabled: !!panelId,
  });
  const plan = planQuery.data;

  const items = useMemo(
    () =>
      [...(plan?.ports ?? [])].sort(naturalSort).map((port) => {
        const connection = port.connection;
        return {
          port,
          connection,
          status: connection ? (STATUS_MAP[connection.status] ?? "warn") : "free",
          vlan: connection?.vlan ?? null,
          trunk: connection?.other_port_mode === "trunk",
        };
      }),
    [plan],
  );

  const counts = useMemo(() => {
    const c = { on: 0, warn: 0, bad: 0, free: 0, trunk: 0 };
    items.forEach((i) => {
      c[i.status] += 1;
      if (i.trunk) c.trunk += 1;
    });
    return c;
  }, [items]);

  // Unieke VLAN's op dit paneel (zonder trunk-poorten), op nummer, met aantal poorten.
  const vlans = useMemo(() => {
    const map = new Map();
    items.forEach(({ vlan, trunk }) => {
      if (!vlan || trunk) return;
      const entry = map.get(vlan.id) ?? { vlan, count: 0 };
      entry.count += 1;
      map.set(vlan.id, entry);
    });
    return [...map.values()].sort((a, b) => a.vlan.vlan_number - b.vlan.vlan_number);
  }, [items]);

  const visible = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "trunk") return i.trunk;
    if (filter.startsWith("vlan:")) return !i.trunk && i.vlan?.id === Number(filter.slice(5));
    return i.status === filter;
  });

  const chips = [
    { key: "all", label: "Alles", count: items.length },
    { key: "bad", label: "Defect", count: counts.bad },
    { key: "warn", label: "Niet getest", count: counts.warn },
    { key: "free", label: "Vrij", count: counts.free },
    ...vlans.map(({ vlan, count }) => ({
      key: `vlan:${vlan.id}`,
      label: `VLAN ${vlan.vlan_number}`,
      count,
      color: vlanColor(vlan.color),
    })),
    { key: "trunk", label: "Trunk", count: counts.trunk },
  ].filter((c) => c.key === "all" || c.count > 0);

  return (
    <div className="min-h-screen bg-bg pb-12">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-fg-subtle mb-4 pt-2">
          <Link
            to={`/klanten/${klantId}`}
            className="inline-flex items-center gap-1.5 hover:text-fg transition font-medium"
          >
            <FiArrowLeft className="text-base" />
            Terug
          </Link>
          <FiChevronRight className="text-fg-subtle" />
          <span className="text-fg font-medium">Patchplan</span>
          <Link
            to={`/klanten/${klantId}/vlans`}
            className="ml-auto text-fg-muted hover:text-accent font-medium"
          >
            VLAN&apos;s beheren
          </Link>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-fg">
          Patch Plan
        </h1>

        {!siteId ? (
          <Empty>Open het patchplan via de site op het klant-dashboard.</Empty>
        ) : panelsQuery.isLoading ? (
          <Empty>Laden...</Empty>
        ) : panels.length === 0 ? (
          <Empty>Deze site heeft nog geen patch panels.</Empty>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
              {panels.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="pp-chip"
                  aria-pressed={String(p.id) === String(panelId)}
                  onClick={() => {
                    setFilter("all");
                    setSearchParams({ siteId, panel: p.id });
                  }}
                >
                  {p.label}
                  {p.rack_name ? <em>{p.rack_name}</em> : null}
                </button>
              ))}
            </div>

            {planQuery.isLoading || !plan ? (
              <Empty>Patchplan laden...</Empty>
            ) : items.length === 0 ? (
              <Empty>
                {plan.label} heeft nog geen poorten. Maak ze aan via de rack.
              </Empty>
            ) : (
              <>
                <PatchPanelFace
                  panel={plan}
                  items={items}
                  counts={counts}
                  vlans={vlans}
                />

                <div className="pp-chips">
                  {chips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      className="pp-chip"
                      aria-pressed={filter === c.key}
                      data-v={c.color ? "" : undefined}
                      style={c.color ? { "--v": c.color } : undefined}
                      onClick={() => setFilter(c.key)}
                    >
                      {c.label}
                      <em>{c.count}</em>
                    </button>
                  ))}
                </div>

                <div className="pp-colhead">
                  <span>Van device</span>
                  <span>VLAN en kabel</span>
                  <span>Naar device</span>
                  <span>Status</span>
                </div>

                <main className="pp-list">
                  {visible.map((item) => (
                    <PatchCard
                      key={item.port.id}
                      item={item}
                      panelLabel={plan.label}
                    />
                  ))}
                </main>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ children }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-fg-subtle">
      {children}
    </div>
  );
}
