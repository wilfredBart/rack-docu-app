import { Link } from "react-router-dom";
import { FiEdit2, FiTrash2, FiBox } from "react-icons/fi";
import RackPortsSection from "./RackPortsSection";

const KIND_TITLES = {
  device: "Device",
  patch_panel: "Patch panel",
  cable_management: "Cable management",
};

// Inhoud van de detail-modal: eigenschappen + poorten (geen face-preview).
// Header/titel + acties zitten in de Modal (via title / headerExtra).
export default function RackItemDetailPanel({
  selectedItem,
  deviceTypeMap,
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

  return (
    <div id="rack-item-detail" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-fg-muted">
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
              <span className="font-medium text-fg">
                {item.manufacturer || "-"}
              </span>
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
              <span className="font-medium text-fg">
                {item.mac_address || "-"}
              </span>
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
              <span className="font-medium text-fg">
                {item.port_count || 0}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Fabrikant
              </span>
              <span className="font-medium text-fg">
                {item.manufacturer || "-"}
              </span>
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
              <span className="font-medium text-fg">
                {item.manufacturer || "-"}
              </span>
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

/** Titelblok voor in de Modal-header. */
export function RackItemDetailHeader({ selectedItem }) {
  const { kind, item } = selectedItem;
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.12em] text-fg-subtle font-semibold">
        {KIND_TITLES[kind]}
      </p>
      <h2 className="text-lg font-bold text-fg truncate leading-tight">
        {item.label}
      </h2>
    </div>
  );
}

export function RackItemDetailActions({
  selectedItem,
  onEdit,
  onDeleteRequest,
  klantId,
  siteId,
  rackId,
}) {
  const { kind, item } = selectedItem;

  const patchplanTo = (() => {
    if (!klantId || (kind !== "device" && kind !== "patch_panel")) return null;
    const params = new URLSearchParams();
    if (siteId) params.set("siteId", String(siteId));
    if (rackId) params.set("rackId", String(rackId));
    if (kind === "patch_panel") params.set("panel", String(item.id));
    if (kind === "device") params.set("device", String(item.id));
    return `/klanten/${klantId}/patchplan?${params.toString()}`;
  })();

  return (
    <>
      {patchplanTo ? (
        <Link
          to={patchplanTo}
          className="p-2 rounded-lg text-fg-subtle hover:text-accent hover:bg-bg-subtle"
          title="Patchplan"
        >
          <FiBox />
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => onEdit(selectedItem)}
        className="p-2 rounded-lg text-fg-subtle hover:text-accent hover:bg-bg-subtle cursor-pointer"
        title="Bewerken"
      >
        <FiEdit2 />
      </button>
      <button
        type="button"
        onClick={() => onDeleteRequest(selectedItem)}
        className="p-2 rounded-lg text-fg-subtle hover:text-destructive hover:bg-bg-subtle cursor-pointer"
        title="Verwijderen"
      >
        <FiTrash2 />
      </button>
    </>
  );
}
