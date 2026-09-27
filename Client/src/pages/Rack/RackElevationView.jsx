import { ROW_HEIGHT } from "./rackElevation";

const KIND_STYLES = {
  device: "bg-blue-50/80 border-blue-200 text-blue-900",
  patch_panel: "bg-amber-50/80 border-amber-200 text-amber-900",
  cable_management: "bg-violet-50/80 border-violet-200 text-violet-900",
};

const KIND_LABELS = {
  device: "Device",
  patch_panel: "Patchpanel",
  cable_management: "Cable",
};

// Rendert de visuele rack als verticale lijst van U-rijen.
// `onSelectItem` wordt aangeroepen met { kind, item } wanneer een rij aangeklikt wordt.
export default function RackElevationView({ elevationRows, onSelectItem }) {
  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
      {elevationRows.map((row) => {
        if (row.type === "empty") {
          return (
            <div
              key={`u-${row.u}`}
              className={`h-7 flex items-center border-b border-gray-100 last:border-b-0 ${
                row.u % 2 === 0 ? "bg-gray-50/50" : "bg-white"
              }`}
            >
              <span className="w-9 shrink-0 text-right pr-2 text-[10px] font-medium text-gray-400 tabular-nums">
                {row.u}U
              </span>
              <span className="flex-1 h-full border-l border-gray-100" />
            </div>
          );
        }

        const item = row.item;
        const units = Number(item.rack_units ?? 1);
        const topU = Number(item.rack_position) + units - 1;
        const itemKind = row.kind;

        return (
          <div
            key={`${itemKind}-${item.id}`}
            style={{ height: `${units * ROW_HEIGHT}px` }}
            className={`flex items-center border-b border-gray-100 last:border-b-0 ${KIND_STYLES[itemKind]}`}
          >
            <span className="w-9 shrink-0 text-right pr-2 text-[10px] font-medium tabular-nums">
              {topU}U
            </span>
            <button
              type="button"
              onClick={() => onSelectItem({ kind: itemKind, item })}
              className="flex-1 h-full border-l border-current/25 px-2 flex items-center justify-between gap-2 min-w-0 text-left cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{item.label}</p>
                <p className="text-[10px] truncate opacity-75">
                  {KIND_LABELS[itemKind]} · {units}U
                  {itemKind === "patch_panel" && item.port_count
                    ? ` · ${item.port_count} poorten`
                    : ""}
                </p>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
