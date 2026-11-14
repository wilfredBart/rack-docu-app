import React from "react";

/**
 * High-Clarity UniFi Front Face Component.
 * Gebouwd in responsieve HTML/CSS met scherpe vector iconen.
 * Daardoor zijn poorten, leds, schermen en teksten ALTIJD groot en haarscherp leesbaar!
 */
export default function UnifiDeviceFace({
  item,
  kind = "device",
  ports = [],
  activePortId = null,
  onPortClick,
  showEars = true,
  className = "",
}) {
  const portCount = Number(item?.port_count) || (ports && ports.length) || 24;
  const label = item?.label || "UniFi Device";
  const model = item?.model || "";

  // Lookup voor poortgegevens
  const portMap = React.useMemo(() => {
    const map = new Map();
    (ports || []).forEach((p, idx) => {
      const numMatch = p.name?.match(/\d+/);
      const portNum = numMatch ? parseInt(numMatch[0], 10) : idx + 1;
      map.set(portNum, p);
    });
    return map;
  }, [ports]);

  // Is dit apparaat een gateway/router met HDD (zoals UDM Pro of UNVR)?
  const hasHddBay =
    kind === "device" &&
    (portCount <= 11 || /udm|dream|gateway|nvr|nas|server/i.test(`${label} ${model}`));

  // ── Render enkele RJ45 poort ──
  const renderRj45Port = (num, isWan = false) => {
    const portData = portMap.get(num);
    const isSelected = activePortId === num || activePortId === portData?.id;
    const isConnected = Boolean(portData?.vlan_id || portData?.connected_to);

    return (
      <button
        key={`rj45-${num}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPortClick?.(num, portData);
        }}
        title={`Poort ${num}${isWan ? " (WAN)" : ""}${portData?.vlan_id ? ` - VLAN ${portData.vlan_id}` : ""}`}
        className={`w-5 h-3.5 sm:w-5.5 sm:h-4 bg-[#141b24] border rounded-[1.5px] flex flex-col justify-between p-[1px] relative transition cursor-pointer shrink-0 ${
          isSelected
            ? "border-cyan-400 ring-1 ring-cyan-400 bg-cyan-950/40"
            : "border-slate-600 hover:border-cyan-400/80"
        }`}
      >
        {/* Top bar met socket opening */}
        <div className="w-full h-1.5 bg-[#080d14] rounded-t-[1px] flex items-center justify-center">
          <div className="w-2.5 h-[1.5px] bg-[#d97706]/80 rounded-[0.5px]" />
        </div>

        {/* Bottom bar met LEDs */}
        <div className="w-full flex items-center justify-between px-0.5">
          <span
            className={`w-1 h-1 rounded-full ${
              isConnected ? "bg-emerald-400 shadow-[0_0_3px_#34d399]" : "bg-emerald-950"
            }`}
          />
          <span
            className={`w-1 h-1 rounded-full ${
              isConnected ? "bg-amber-400" : "bg-amber-950"
            }`}
          />
        </div>
      </button>
    );
  };

  // ── Render SFP kooi ──
  const renderSfpPort = (num, isWan = false) => {
    const portData = portMap.get(num);
    const isSelected = activePortId === num || activePortId === portData?.id;
    const isConnected = Boolean(portData?.vlan_id || portData?.connected_to);

    return (
      <button
        key={`sfp-${num}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPortClick?.(num, portData);
        }}
        title={`SFP+ Poort ${num} (10G)`}
        className={`w-6 h-4 bg-[#1c2430] border rounded-[1.5px] flex items-center justify-between px-1 relative transition cursor-pointer shrink-0 ${
          isSelected
            ? "border-cyan-400 ring-1 ring-cyan-400"
            : "border-slate-600 hover:border-cyan-400"
        }`}
      >
        <span
          className={`w-1 h-1 rounded-full ${
            isConnected ? "bg-emerald-400 shadow-[0_0_3px_#34d399]" : "bg-emerald-950"
          }`}
        />
        <span className="text-[7.5px] font-mono font-bold text-cyan-300 leading-none">
          {isWan ? "W10" : "10G"}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`relative w-full h-full flex items-stretch select-none overflow-hidden bg-gradient-to-b from-[#edf0f3] via-[#d6dbe1] to-[#b7bdc6] border border-[#94a3b8] rounded-[2px] shadow-sm ${className}`}
    >
      {/* Subtiele bovenste ventilatiegroef */}
      <div className="absolute top-[3px] inset-x-12 h-[1.5px] bg-slate-700/60 rounded-full pointer-events-none" />

      {/* ── Linker Montage-oor ── */}
      {showEars && (
        <div className="w-8 shrink-0 bg-gradient-to-b from-[#e2e6eb] to-[#bec4cc] border-r border-slate-400/80 flex flex-col justify-between py-1.5 items-center">
          <span className="w-3.5 h-2 rounded-full bg-slate-500/80 border border-slate-600 shadow-inner" />
          <span className="w-3.5 h-2 rounded-full bg-slate-500/80 border border-slate-600 shadow-inner" />
        </div>
      )}

      {/* ── Midden: Chassis Front Body ── */}
      <div className="flex-1 min-w-0 flex items-center justify-between px-3 gap-3">
        {/* LCM Touchscreen Display (Links) */}
        {kind !== "cable_management" && (
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-[#070b12] border-2 border-[#00b0ff] shadow-[0_0_8px_rgba(0,176,255,0.7)] flex items-center justify-center shrink-0 relative overflow-hidden">
              {/* UniFi Logo */}
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path
                  d="M 12 2 C 13.5 5 15 8 15 12 C 15 17 11.5 21 7 21 C 3.5 21 1 18.5 1 15 C 1 10 5.5 5 12 2 Z"
                  fill="#ffffff"
                />
                <path
                  d="M 12 2 C 10.5 5 9 8 9 12 C 9 17 12.5 21 17 21 C 20.5 21 23 18.5 23 15 C 23 10 18.5 5 12 2 Z"
                  fill="#00b0ff"
                />
                <circle cx="12" cy="13" r="2.2" fill="#070b12" />
              </svg>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-slate-900 leading-tight truncate">
                {label}
              </span>
              <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider leading-tight truncate">
                {model || (kind === "patch_panel" ? "Keystone Panel" : "UniFi 1U")}
              </span>
            </div>
          </div>
        )}

        {/* ── 3.5" HDD Bay (voor Gateways / UDM Pro / UNVR / Servers) ── */}
        {kind === "device" && hasHddBay && (
          <div className="hidden md:flex items-center h-7 sm:h-8 px-2.5 bg-gradient-to-b from-[#e1e5ea] to-[#c1c7cf] border border-slate-400 rounded-[2px] shadow-inner gap-2 shrink-0">
            <div className="w-8 h-5 border-r border-slate-400 bg-slate-300/80 rounded-l-[1px] flex items-center justify-center">
              <div className="w-1.5 h-3 border-r border-slate-500/80" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 tracking-wider">
              3.5&quot; HDD
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#00b0ff]" />
          </div>
        )}

        {/* ── Cable Management: UniFi Brush Panel ── */}
        {kind === "cable_management" && (
          <div className="flex-1 mx-2 h-7 sm:h-8 bg-[#0a0e14] rounded border border-slate-600/80 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-x-0 h-0.5 bg-black" />
            <span className="text-[10px] font-sans font-bold text-slate-400 tracking-widest relative z-10 px-2 bg-[#0a0e14]/80 rounded">
              UNIFI CABLE BRUSH MANAGEMENT
            </span>
          </div>
        )}

        {/* ── Patch Panel: UniFi 24-Port Keystone Matrix ── */}
        {kind === "patch_panel" && (
          <div className="flex-1 flex items-center justify-end gap-1 overflow-x-auto py-1">
            <div className="grid grid-rows-2 grid-flow-col gap-1">
              {Array.from({ length: Math.min(24, portCount) }, (_, i) => {
                const portNum = i + 1;
                return renderRj45Port(portNum);
              })}
            </div>
          </div>
        )}

        {/* ── Switch & Gateway Poortenblok (Rechts) ── */}
        {kind === "device" && (
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {/* RJ45 Poorten Matrix */}
            <div className="flex items-center gap-1">
              {hasHddBay ? (
                /* UDM Pro stijl: 8 LAN poorten (2x4) + 1 WAN poort */
                <div className="flex items-center gap-1.5">
                  <div className="grid grid-rows-2 grid-flow-col gap-1">
                    {Array.from({ length: 8 }, (_, i) => renderRj45Port(i + 1))}
                  </div>
                  {/* WAN Poort (Poort 9) */}
                  <div className="flex flex-col items-center">
                    {renderRj45Port(9, true)}
                    <span className="text-[7px] font-mono font-bold text-cyan-600 mt-0.5">WAN</span>
                  </div>
                </div>
              ) : (
                /* Switch stijl: matrix van poorten (2 rijen) */
                <div className="grid grid-rows-2 grid-flow-col gap-1">
                  {Array.from({ length: Math.min(24, portCount) }, (_, i) => renderRj45Port(i + 1))}
                </div>
              )}
            </div>

            {/* SFP+ 10G Poorten */}
            <div className="flex flex-col gap-1">
              {renderSfpPort(hasHddBay ? 10 : portCount - 1, hasHddBay)}
              {renderSfpPort(hasHddBay ? 11 : portCount, false)}
            </div>
          </div>
        )}
      </div>

      {/* ── Rechter Montage-oor ── */}
      {showEars && (
        <div className="w-8 shrink-0 bg-gradient-to-b from-[#e2e6eb] to-[#bec4cc] border-l border-slate-400/80 flex flex-col justify-between py-1.5 items-center">
          <span className="w-3.5 h-2 rounded-full bg-slate-500/80 border border-slate-600 shadow-inner" />
          <span className="w-3.5 h-2 rounded-full bg-slate-500/80 border border-slate-600 shadow-inner" />
        </div>
      )}
    </div>
  );
}
