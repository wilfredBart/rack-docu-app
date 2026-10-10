import { vlanColor, vlanLabel } from "./vlanColors";

const STATUS_LABEL = {
  on: "Actief",
  warn: "Niet getest",
  bad: "Defect",
  free: "Vrij",
};

// Eén patch: Van (patch panel-poort) → kabel met VLAN-tag → Naar (device-poort).
export default function PatchCard({ item, panelLabel }) {
  const { port, connection, status, vlan, trunk } = item;
  const spec = [connection?.cable_type, connection?.cable_label]
    .filter(Boolean)
    .join(", ");

  let tag = null;
  if (trunk) {
    tag = vlan ? `Trunk, native ${vlanLabel(vlan)}` : "Trunk";
  } else if (vlan) {
    tag = vlanLabel(vlan);
  } else if (connection) {
    tag = "Geen VLAN";
  }

  return (
    <article
      className="pp-card"
      data-s={status}
      style={vlan && !trunk ? { "--v": vlanColor(vlan.color) } : undefined}
    >
      <div className="pp-end">
        <span className="pp-n">
          <b>{panelLabel}</b>
          <code>{port.name}</code>
        </span>
      </div>

      <div className="pp-cable">
        <div className="pp-cl">
          {tag && <b className="pp-vt">{tag}</b>}
          <span>{spec || (connection ? "kabel onbekend" : "geen kabel")}</span>
        </div>
      </div>

      <div className="pp-end">
        <span className="pp-n">
          <b>{connection ? connection.other_endpoint_label || "Onbekend" : "leeg"}</b>
          <code>{connection ? connection.other_port_name : "niet gepatcht"}</code>
        </span>
      </div>

      <div className="pp-st">{STATUS_LABEL[status]}</div>
    </article>
  );
}
