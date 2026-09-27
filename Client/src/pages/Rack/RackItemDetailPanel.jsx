import { FiEdit2, FiTrash2 } from "react-icons/fi";
import RackPortsSection from "./RackPortsSection";

const KIND_TITLES = {
  device: "Device",
  patch_panel: "Patch panel",
  cable_management: "Cable management",
};

// Detailkaart voor het geselecteerde item in de rack: kop, bewerken/verwijderen-knoppen,
// eigenschappen (afhankelijk van kind), en — voor device/patch_panel — de poorten-sectie.
export default function RackItemDetailPanel({
  selectedItem,
  deviceTypeMap,
  onEdit,
  onDeleteRequest,
  selectedPorts,
  portForm,
  setPortForm,
  onBulkPortSubmit,
  updatePortMutation,
  deletePortMutation,
  bulkCreatePortsMutation,
}) {
  const { kind, item } = selectedItem;

  return (
    <div className="w-full max-w-3xl mt-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400 font-semibold">
            {KIND_TITLES[kind]}
          </p>
          <h2 className="text-lg font-semibold text-slate-800">
            {item.label}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(selectedItem)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <FiEdit2 className="text-xs" /> Bewerken
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(selectedItem)}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
          >
            <FiTrash2 className="text-xs" /> Verwijderen
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
            Positie
          </span>
          <span className="font-medium text-slate-800">
            {item.rack_position}U — {item.rack_units || 1}U
          </span>
        </div>

        {kind === "device" && (
          <>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Type
              </span>
              <span className="font-medium text-slate-800">
                {deviceTypeMap.get(item.device_type_id) || "Onbekend"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Fabrikant
              </span>
              <span className="font-medium text-slate-800">
                {item.manufacturer || "-"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Model
              </span>
              <span className="font-medium text-slate-800">
                {item.model || "-"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Serienummer
              </span>
              <span className="font-medium text-slate-800">
                {item.serial_number || "-"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                MAC-adres
              </span>
              <span className="font-medium text-slate-800">
                {item.mac_address || "-"}
              </span>
            </div>
          </>
        )}

        {kind === "patch_panel" && (
          <>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Type
              </span>
              <span className="font-medium text-slate-800">
                {item.type || "-"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Aantal poorten
              </span>
              <span className="font-medium text-slate-800">
                {item.port_count || 0}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Fabrikant
              </span>
              <span className="font-medium text-slate-800">
                {item.manufacturer || "-"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
                Model
              </span>
              <span className="font-medium text-slate-800">
                {item.model || "-"}
              </span>
            </div>
          </>
        )}

        {kind === "cable_management" && (
          <div className="sm:col-span-2">
            <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
              Type
            </span>
            <span className="font-medium text-slate-800">
              {item.type || "-"}
            </span>
          </div>
        )}

        {(item.notes || "") && (
          <div className="sm:col-span-2">
            <span className="block text-[11px] uppercase tracking-[0.12em] text-slate-400 mb-1">
              Opmerking
            </span>
            <span className="font-medium text-slate-800 whitespace-pre-wrap">
              {item.notes}
            </span>
          </div>
        )}
      </div>

      {kind !== "cable_management" && (
        <RackPortsSection
          selectedPorts={selectedPorts}
          portForm={portForm}
          setPortForm={setPortForm}
          onBulkSubmit={onBulkPortSubmit}
          updatePortMutation={updatePortMutation}
          deletePortMutation={deletePortMutation}
          bulkCreatePortsMutation={bulkCreatePortsMutation}
        />
      )}
    </div>
  );
}
