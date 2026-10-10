import { FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import RackPortsSection from "./RackPortsSection";
import { EquipmentFace } from "./equipment-face";
import { faceKind } from "./rackElevation";

const KIND_TITLES = {
  device: "Device",
  patch_panel: "Patch panel",
  cable_management: "Cable management",
};

// Detailkaart voor het geselecteerde item: kleine visuele face + eigenschappen + poorten.
export default function RackItemDetailPanel({
  selectedItem,
  deviceTypeMap,
  onEdit,
  onDeleteRequest,
  onClose,
  selectedPorts,
  portForm,
  setPortForm,
  onBulkPortSubmit,
  updatePortMutation,
  deletePortMutation,
  bulkCreatePortsMutation,
  vlans,
  klantId,
  assignVlanMutation,
}) {
  const { kind, item } = selectedItem;
  const typeName =
    kind === "device" ? deviceTypeMap.get(item.device_type_id) : undefined;
  const face = faceKind(kind, item, typeName);

  return (
    <div
      id="rack-item-detail"
      className="w-full mt-0 scroll-mt-4 bg-card rounded-2xl border border-border p-5 shadow-[var(--shadow-border)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-fg-subtle font-semibold">
            {KIND_TITLES[kind]}
          </p>
          <h2 className="text-lg font-semibold text-fg truncate">{item.label}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(selectedItem)}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-fg cursor-pointer"
          >
            <FiEdit2 className="text-xs" /> Bewerken
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(selectedItem)}
            className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:text-destructive cursor-pointer"
          >
            <FiTrash2 className="text-xs" /> Verwijderen
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-fg-subtle hover:text-fg hover:bg-bg-subtle cursor-pointer"
              aria-label="Sluiten"
            >
              <FiX className="text-base" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Zelfde face als in de rack, compact */}
      <div className="detail-face-preview mt-4" aria-hidden="true">
        <EquipmentFace
          kind={kind}
          item={item}
          face={face}
          selected
          interactive={false}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-fg-muted">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
            Positie
          </span>
          <span className="font-medium text-fg">
            {item.rack_position}U — {item.rack_units || 1}U
          </span>
        </div>

        {kind === "device" && (
          <>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Type
              </span>
              <span className="font-medium text-fg">
                {deviceTypeMap.get(item.device_type_id) || "Onbekend"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Fabrikant
              </span>
              <span className="font-medium text-fg">{item.manufacturer || "-"}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Model
              </span>
              <span className="font-medium text-fg">{item.model || "-"}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Serienummer
              </span>
              <span className="font-medium text-fg">
                {item.serial_number || "-"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                MAC-adres
              </span>
              <span className="font-medium text-fg">{item.mac_address || "-"}</span>
            </div>
          </>
        )}

        {kind === "patch_panel" && (
          <>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Type
              </span>
              <span className="font-medium text-fg">{item.type || "-"}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Aantal poorten
              </span>
              <span className="font-medium text-fg">{item.port_count || 0}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Fabrikant
              </span>
              <span className="font-medium text-fg">{item.manufacturer || "-"}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Model
              </span>
              <span className="font-medium text-fg">{item.model || "-"}</span>
            </div>
          </>
        )}

        {kind === "cable_management" && (
          <>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Type
              </span>
              <span className="font-medium text-fg">{item.type || "-"}</span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Fabrikant
              </span>
              <span className="font-medium text-fg">{item.manufacturer || "-"}</span>
            </div>
          </>
        )}

        {item.notes ? (
          <div className="sm:col-span-2">
            <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
              Notities
            </span>
            <span className="font-medium text-fg whitespace-pre-wrap">
              {item.notes}
            </span>
          </div>
        ) : null}
      </div>

      {kind !== "cable_management" && (
        <RackPortsSection
          selectedPorts={selectedPorts}
          portForm={portForm}
          setPortForm={setPortForm}
          onBulkPortSubmit={onBulkPortSubmit}
          updatePortMutation={updatePortMutation}
          deletePortMutation={deletePortMutation}
          bulkCreatePortsMutation={bulkCreatePortsMutation}
          vlans={vlans}
          klantId={klantId}
          assignVlanMutation={assignVlanMutation}
        />
      )}
    </div>
  );
}
