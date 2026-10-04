import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { faceKind, occupiedUnits } from "./rackElevation";
import { EquipmentFace } from "./equipment-face";

function UStack({ from, to }) {
  const nums = [];
  for (let u = from; u >= to; u -= 1) nums.push(u);
  return (
    <div className="rack-u" aria-hidden="true">
      {nums.map((n) => (
        <span key={n}>{n}</span>
      ))}
    </div>
  );
}

function EmptyRow({ u, onAddAt }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="rack-row">
      <UStack from={u} to={u} />
      <div className="rack-rail" />
      <div className="rack-bay">
        {onAddAt ? (
          <div style={{ position: "relative", height: "100%" }}>
            <button
              type="button"
              className="rack-empty"
              aria-label={`Lege U${u}, item toevoegen`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
            >
              <span className="rack-empty-hint">
                <FiPlus style={{ width: 12, height: 12 }} />
              </span>
            </button>
            {open ? (
              <div
                className="rack-empty-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onAddAt("device", u);
                    setOpen(false);
                  }}
                >
                  Device op U{u}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddAt("patch_panel", u);
                    setOpen(false);
                  }}
                >
                  Patch panel op U{u}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddAt("cable_management", u);
                    setOpen(false);
                  }}
                >
                  Cable mgmt op U{u}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rack-empty" />
        )}
      </div>
      <div className="rack-rail" />
      <UStack from={u} to={u} />
      <div className="rack-pdu" />
    </div>
  );
}

function ItemRow({ row, selected, typeName, onSelectItem }) {
  const { start, topU, units } = occupiedUnits(row.item);
  const face = faceKind(row.kind, row.item, typeName);
  return (
    <div
      className="rack-row is-item"
      style={{ ["--units"]: String(units) }}
    >
      <UStack from={topU} to={start} />
      <div className="rack-rail" />
      <div className="rack-bay">
        <EquipmentFace
          kind={row.kind}
          item={row.item}
          face={face}
          selected={selected}
          onSelect={() => onSelectItem({ kind: row.kind, item: row.item })}
        />
      </div>
      <div className="rack-rail" />
      <UStack from={topU} to={start} />
      <div className="rack-pdu" />
    </div>
  );
}

/**
 * Visuele 19" rack. Bestaande props blijven werken:
 *   elevationRows, onSelectItem
 * Optioneel (aanbevolen):
 *   rackName, selectedItem, deviceTypeMap, onAddAt(kind, u)
 */
export default function RackElevationView({
  elevationRows,
  onSelectItem,
  selectedItem = null,
  deviceTypeMap,
  rackName,
  onAddAt,
}) {
  const typeNameOf = (row) => {
    if (row.kind !== "device" || !deviceTypeMap) return undefined;
    return deviceTypeMap.get(row.item.device_type_id);
  };

  const isSelected = (row) =>
    selectedItem?.kind === row.kind && selectedItem?.item?.id === row.item.id;

  return (
    <div
      className="rack-stage"
      style={{
        width: "min(100%, 42rem)",
        maxWidth: "100%",
        flexShrink: 0,
        alignSelf: "center",
      }}
    >
      <div className="rack-cabinet">
        <div className="rack-crown">
          <div className="rack-nameplate">{rackName || "RACK"}</div>
        </div>
        <div className="rack-body">
          <div className="rack-elevation">
            {elevationRows.map((row) =>
              row.type === "empty" ? (
                <EmptyRow key={`u-${row.u}`} u={row.u} onAddAt={onAddAt} />
              ) : (
                <ItemRow
                  key={`${row.kind}-${row.item.id}`}
                  row={row}
                  selected={isSelected(row)}
                  typeName={typeNameOf(row)}
                  onSelectItem={onSelectItem}
                />
              ),
            )}
          </div>
        </div>
        <div className="rack-plinth">
          <span className="rack-foot" />
          <span className="rack-foot" />
        </div>
      </div>
    </div>
  );
}
