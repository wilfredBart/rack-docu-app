import { occupiedUnits } from "./rackElevation";

const KIND_META = {
  device: "Device",
  patch_panel: "Patch",
  cable_management: "Cable",
};

function Drives({ units }) {
  const rows = units >= 2 ? 2 : 1;
  const cols = units >= 2 ? 8 : 4;
  return (
    <div
      className="face-drives"
      style={{ ["--rows"]: String(rows), ["--cols"]: String(cols) }}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <span key={i} className="drive" />
      ))}
    </div>
  );
}

function Jacks({ count, rows }) {
  const n = Math.min(48, Math.max(8, count));
  const liveEvery = n > 24 ? 4 : 3;
  return (
    <div
      className="face-ports"
      style={{
        ["--pc"]: String(Math.ceil(n / rows)),
        ["--pr"]: String(rows),
      }}
    >
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={i % liveEvery === 0 ? "jack is-live" : "jack"}
        />
      ))}
    </div>
  );
}

function FaceHardware({ face, item, units }) {
  if (face === "server" || face === "nas") {
    return (
      <>
        <span className="face-handle" />
        <Drives units={units} />
        <span className="face-handle right" />
        <span className="face-leds">
          <i className="led on" />
          <i className="led live on" />
          <i className="led warn" />
        </span>
      </>
    );
  }

  if (face === "switch" || face === "router" || face === "firewall") {
    const count = item.port_count
      ? Number(item.port_count)
      : face === "switch"
        ? 24
        : 8;
    return (
      <>
        <Jacks count={count} rows={count >= 36 ? 2 : 1} />
        {face === "switch" ? (
          <div className="face-sfp">
            <span className="sfp" />
            <span className="sfp" />
            <span className="sfp" />
            <span className="sfp" />
          </div>
        ) : null}
        <span className="face-leds">
          <i className="led on" />
          <i className="led live on" />
        </span>
      </>
    );
  }

  if (face === "patch") {
    const count = item.port_count ? Number(item.port_count) : 24;
    return <Jacks count={count} rows={2} />;
  }

  if (face === "brush") {
    return <div className="face-brush" />;
  }

  if (face === "fingers") {
    return (
      <div className="face-fingers">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="finger" />
        ))}
      </div>
    );
  }

  if (face === "ups") {
    return (
      <>
        <div className="face-lcd">
          <span>ONLINE</span>
          <span>230V 12m</span>
        </div>
        <div className="face-battery">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="cell" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="face-vents" />
      <span className="face-leds">
        <i className="led on" />
      </span>
    </>
  );
}

export function EquipmentFace({ kind, item, face, selected, onSelect, interactive = true }) {
  const { units } = occupiedUnits(item);
  const screws = Math.min(4, Math.max(2, units + 1));

  const body = (
    <>
      <span className="equip-ear" aria-hidden="true">
        {Array.from({ length: screws }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <span className="equip-face" data-kind={face}>
        <FaceHardware face={face} item={item} units={units} />
        <span className="equip-tag">{item.label}</span>
        <span className="equip-meta">
          {KIND_META[kind]} · {units}U
        </span>
      </span>
      <span className="equip-ear" aria-hidden="true">
        {Array.from({ length: screws }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </>
  );

  if (!interactive) {
    return (
      <div
        className={selected ? "equip is-selected is-preview" : "equip is-preview"}
        aria-hidden="true"
      >
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={selected ? "equip is-selected" : "equip"}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${item.label}, ${KIND_META[kind]}, ${units}U`}
    >
      {body}
    </button>
  );
}
