import { useCallback, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { canPlaceAt, faceKind, occupiedUnits } from "./rackElevation";
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

// Lege U: klik opent een modal (in Rack.jsx) om type te kiezen — geen inline menu
// in de 1U-rij (dat liep visueel mis door overflow / portal-styling).
function EmptyRow({ u, onEmptyClick }) {
  return (
    <div className="rack-row">
      <UStack from={u} to={u} />
      <div className="rack-rail" />
      <div className="rack-bay">
        {onEmptyClick ? (
          <button
            type="button"
            className="rack-empty"
            aria-label={`Lege U${u}, item toevoegen`}
            onClick={() => onEmptyClick(u)}
          >
            <span className="rack-empty-hint">
              <FiPlus style={{ width: 12, height: 12 }} />
            </span>
          </button>
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

// Aantal U's (negatief = omhoog) waarmee het item verschuift, geklemd binnen de rack.
function snapUnits(ctx, rawY) {
  if (!ctx) return 0;
  return Math.max(ctx.minDu, Math.min(ctx.maxDu, Math.round(rawY / ctx.unitH)));
}

function ItemRow({ row, selected, typeName, onSelectItem, preview, draggable }) {
  const { topU, start, units } = occupiedUnits(row.item);
  const face = faceKind(row.kind, row.item, typeName);
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({
    id: `${row.kind}-${row.item.id}`,
    data: { kind: row.kind, item: row.item },
    disabled: !draggable,
  });

  // Tijdens het slepen tonen de U-nummers van het item de doelpositie.
  const shift = isDragging ? (preview?.du ?? 0) : 0;
  const style = { ["--units"]: String(units) };
  if (isDragging) {
    style.transform = `translate3d(0, ${transform?.y ?? 0}px, 0)`;
    style.position = "relative";
    style.zIndex = 30;
    style.outline = `2px solid ${preview?.valid === false ? "#d26565" : "#5ee0a0"}`;
    style.outlineOffset = "-2px";
    style.boxShadow = "0 10px 24px -8px rgb(0 0 0 / 0.7)";
    style.cursor = "grabbing";
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className="rack-row is-item"
      style={style}
    >
      <UStack from={topU - shift} to={start - shift} />
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
      <UStack from={topU - shift} to={start - shift} />
      <div className="rack-pdu" />
    </div>
  );
}

/**
 * Visuele 19" rack. Bestaande props blijven werken:
 *   elevationRows, onSelectItem
 * Optioneel (aanbevolen):
 *   rackName, selectedItem, deviceTypeMap, onEmptyClick(u)
 * Drag & drop (verticaal verplaatsen binnen de rack), alle drie nodig:
 *   rack            - rack-object met height_u + devices/patch_panels/cable_management
 *   onMoveItem(kind, item, newStart)  - wordt enkel aangeroepen bij een geldige drop
 *   onInvalidDrop() - optioneel, bij een drop op bezette/ongeldige U's
 */
export default function RackElevationView({
  elevationRows,
  onSelectItem,
  selectedItem = null,
  deviceTypeMap,
  rackName,
  onEmptyClick,
  rack,
  onMoveItem,
  onInvalidDrop,
}) {
  const elevationRef = useRef(null);
  const dragCtx = useRef(null);
  const [preview, setPreview] = useState(null); // { id, valid } tijdens het slepen
  const canDrag = Boolean(rack && onMoveItem);

  // Muis: pas slepen na 6px (zo blijft klikken om te selecteren werken).
  // Touch: lang indrukken (250ms), anders blokkeert slepen het scrollen.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  // Alleen verticaal bewegen, en snappen op hele U's binnen de rack.
  const snapModifier = useCallback(({ transform }) => {
    const ctx = dragCtx.current;
    return { ...transform, x: 0, y: ctx ? snapUnits(ctx, transform.y) * ctx.unitH : 0 };
  }, []);

  const typeNameOf = (row) => {
    if (row.kind !== "device" || !deviceTypeMap) return undefined;
    return deviceTypeMap.get(row.item.device_type_id);
  };

  const isSelected = (row) =>
    selectedItem?.kind === row.kind && selectedItem?.item?.id === row.item.id;

  const handleDragStart = ({ active }) => {
    const { kind, item } = active.data.current;
    const { start, topU, units } = occupiedUnits(item);
    const unitH =
      elevationRef.current.getBoundingClientRect().height / rack.height_u;
    dragCtx.current = {
      kind,
      item,
      start,
      units,
      unitH,
      minDu: -(rack.height_u - topU), // hoogstens tot de bovenkant van de rack
      maxDu: start - 1, // hoogstens tot U1
    };
    setPreview({ id: active.id, valid: true, du: 0 });
  };

  const newStartFor = (rawY) => {
    const ctx = dragCtx.current;
    const du = snapUnits(ctx, rawY);
    return { du, newStart: ctx.start - du };
  };

  const handleDragMove = ({ delta }) => {
    const ctx = dragCtx.current;
    if (!ctx) return;
    const { du, newStart } = newStartFor(delta.y);
    const valid =
      du === 0 ||
      canPlaceAt(rack, newStart, ctx.units, {
        excludeKind: ctx.kind,
        excludeId: ctx.item.id,
      });
    setPreview((p) =>
      p && p.valid === valid && p.du === du ? p : p && { ...p, valid, du },
    );
  };

  const handleDragEnd = ({ delta }) => {
    const ctx = dragCtx.current;
    dragCtx.current = null;
    setPreview(null);
    if (!ctx) return;
    const du = snapUnits(ctx, delta.y);
    if (du === 0) return;
    const newStart = ctx.start - du;
    if (
      canPlaceAt(rack, newStart, ctx.units, {
        excludeKind: ctx.kind,
        excludeId: ctx.item.id,
      })
    ) {
      onMoveItem(ctx.kind, ctx.item, newStart);
    } else {
      onInvalidDrop?.();
    }
  };

  const handleDragCancel = () => {
    dragCtx.current = null;
    setPreview(null);
  };

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
          <DndContext
            sensors={sensors}
            modifiers={[snapModifier]}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="rack-elevation" ref={elevationRef}>
              {elevationRows.map((row) =>
                row.type === "empty" ? (
                  <EmptyRow
                    key={`u-${row.u}`}
                    u={row.u}
                    onEmptyClick={onEmptyClick}
                  />
                ) : (
                  <ItemRow
                    key={`${row.kind}-${row.item.id}`}
                    row={row}
                    selected={isSelected(row)}
                    typeName={typeNameOf(row)}
                    onSelectItem={onSelectItem}
                    preview={preview}
                    draggable={canDrag}
                  />
                ),
              )}
            </div>
          </DndContext>
        </div>
        <div className="rack-plinth">
          <span className="rack-foot" />
          <span className="rack-foot" />
        </div>
      </div>
    </div>
  );
}
