import { vlanColor, vlanLabel } from "./vlanColors";

// Visueel patchpaneel (poorten + LED's + VLAN-onderlijn) met de legende er als strook onder.
// Poort-LED = status van de patch, onderlijn = VLAN (afgeleid van de andere kant van de connection).
export default function PatchPanelFace({ panel, items, counts, vlans }) {
  return (
    <section
      className="pp-unit mt-5"
      aria-label={`${panel.label}, ${items.length} poorten`}
    >
      <div className="pp-panel">
        <div className="pp-ph">
          <b>{panel.label}</b>
          <span>
            {items.length} poorten
            {panel.rack_units ? `, ${panel.rack_units}U` : ""}
          </span>
        </div>

        <div className="pp-ports">
          {items.map(({ port, status, vlan }) => (
            <i
              key={port.id}
              className="pp-port"
              data-s={status}
              style={vlan ? { "--v": vlanColor(vlan.color) } : undefined}
              title={port.name}
            />
          ))}
        </div>
      </div>

      <div className="pp-legend">
        <div className="pp-lrow">
          <span data-s="on">{counts.on} actief</span>
          {counts.warn > 0 && <span data-s="warn">{counts.warn} niet getest</span>}
          {counts.bad > 0 && <span data-s="bad">{counts.bad} defect</span>}
          <span>{counts.free} vrij</span>
        </div>

        {vlans.length > 0 && (
          <div className="pp-lrow pp-vl">
            {vlans.map(({ vlan }) => (
              <span key={vlan.id} style={{ "--v": vlanColor(vlan.color) }}>
                {vlanLabel(vlan)}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
