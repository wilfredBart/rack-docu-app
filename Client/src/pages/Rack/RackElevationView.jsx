import React, { useState } from "react";
import UnifiDeviceFace from "./devices/UnifiDeviceFace";

function EmptyRow({ u, onEmptyClick, heightClass = "h-[42px]" }) {
  return (
    <div
      className={`w-full flex items-stretch border-b border-zinc-800/40 ${heightClass}`}
    >
      <div className="w-8 shrink-0 bg-[#0c1017] border-r border-zinc-800/80 flex items-center justify-center">
        <span className="text-[10px] font-mono text-zinc-500 leading-none">{u}</span>
      </div>
      <div
        onClick={() => onEmptyClick?.(u)}
        className="flex-1 min-w-0 bg-[#070a0f] hover:bg-zinc-800/25 transition cursor-pointer flex items-center justify-center group"
        title={`Lege U${u}`}
      >
        <span className="text-[9px] font-mono text-zinc-700 opacity-0 group-hover:opacity-100 transition">
          Leeg U{u}
        </span>
      </div>
      <div className="w-8 shrink-0 bg-[#0c1017] border-l border-zinc-800/80 flex items-center justify-center">
        <span className="text-[10px] font-mono text-zinc-500 leading-none">{u}</span>
      </div>
    </div>
  );
}

function ItemRow({ row, selected, onSelectItem, viewMode }) {
  const { kind, item } = row;
  const units = Math.max(1, Number(item.rack_units ?? 1));
  const start = Number(item.rack_position);
  const topU = start + units - 1;

  // In "detail" mode is 1U = 42px hoog. In "fit" mode vult hij via grid-row: span.
  const rowStyle =
    viewMode === "detail"
      ? { height: `${units * 42}px` }
      : { gridRow: `span ${units}` };

  return (
    <div
      className={`w-full flex items-stretch ${
        viewMode === "detail" ? "border-b border-zinc-800/40" : ""
      }`}
      style={rowStyle}
    >
      {/* Linker rail met U-nummers */}
      <div
        className={`w-8 shrink-0 flex flex-col justify-between items-center py-1 border-r border-zinc-800/80 ${
          selected ? "bg-cyan-500/20 text-cyan-400 font-bold" : "bg-[#0c1017] text-zinc-400"
        }`}
      >
        <span className="text-[10px] font-mono leading-none">{topU}</span>
        {units > 1 && (
          <span className="text-[10px] font-mono leading-none">{start}</span>
        )}
      </div>

      {/* Het authentieke UniFi Frontpaneel direct in de rack gemonteerd */}
      <button
        type="button"
        onClick={() => onSelectItem({ kind, item })}
        className={`flex-1 min-w-0 h-full p-0 relative cursor-pointer overflow-hidden transition border ${
          selected
            ? "border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_14px_rgba(0,176,255,0.7)] z-10 brightness-105"
            : "border-slate-400/80 hover:brightness-105"
        }`}
      >
        <UnifiDeviceFace
          item={item}
          kind={kind}
          showEars={false}
          className="w-full h-full"
        />
      </button>

      {/* Rechter rail met U-nummers */}
      <div
        className={`w-8 shrink-0 flex flex-col justify-between items-center py-1 border-l border-zinc-800/80 ${
          selected ? "bg-cyan-500/20 text-cyan-400 font-bold" : "bg-[#0c1017] text-zinc-400"
        }`}
      >
        <span className="text-[10px] font-mono leading-none">{topU}</span>
        {units > 1 && (
          <span className="text-[10px] font-mono leading-none">{start}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Visuele 19" rack voorstelling in UniFi Aluminium styling.
 * Bevat een handige toggle:
 * - "Groot" (standaard): 42px per 1U, apparaten zijn groot, duidelijk en direct te beoordelen.
 * - "Passend": schaalt alles op het scherm zonder scrollen.
 */
export default function RackElevationView({
  elevationRows,
  onSelectItem,
  selectedItem = null,
  rackName,
  heightU = 42,
  onEmptyClick,
}) {
  const [viewMode, setViewMode] = useState("detail"); // "detail" (groot & duidelijk) | "fit" (compact)

  return (
    <div className="h-full w-full max-w-3xl flex flex-col min-h-0 select-none">
      <div className="h-full flex flex-col bg-[#0b0f17] border-2 border-[#1e293b] rounded-2xl p-2.5 shadow-2xl overflow-hidden">
        {/* Top frame / Crown met Weergave Switcher */}
        <div className="h-9 shrink-0 flex items-center justify-between px-3 border-b border-zinc-800 text-zinc-400 font-mono bg-[#0e131d] rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-zinc-200">{rackName || "UNIFI RACK"}</span>
            <span className="text-[11px] text-zinc-500 font-mono">({heightU}U)</span>
          </div>

          {/* Weergave zoom toggle */}
          <div className="flex items-center gap-1 bg-[#080b12] p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("detail")}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "detail"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Groot en goed leesbaar (scrollbaar rack)"
            >
              <span>🔍</span> Groot
            </button>
            <button
              type="button"
              onClick={() => setViewMode("fit")}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "fit"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Volledige hoogte zonder scrollen"
            >
              <span>📐</span> Passend
            </button>
          </div>
        </div>

        {/* Elevation Body: Groot (scrollbaar) of Passend (grid) */}
        <div
          className={`flex-1 min-h-0 w-full my-1 bg-[#06080d] border border-zinc-800/80 rounded ${
            viewMode === "detail" ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          {viewMode === "detail" ? (
            /* ── DETAIL MODUS: Comfortabele leeshoogte (42px per 1U) ── */
            <div className="flex flex-col w-full">
              {elevationRows.map((row) =>
                row.type === "empty" ? (
                  <EmptyRow
                    key={`u-${row.u}`}
                    u={row.u}
                    onEmptyClick={onEmptyClick}
                    heightClass="h-[42px]"
                  />
                ) : (
                  <ItemRow
                    key={`${row.kind}-${row.item.id}`}
                    row={row}
                    selected={
                      selectedItem?.kind === row.kind &&
                      selectedItem?.item?.id === row.item.id
                    }
                    onSelectItem={onSelectItem}
                    viewMode="detail"
                  />
                ),
              )}
            </div>
          ) : (
            /* ── FIT MODUS: Alles op 1 scherm zonder scrollen ── */
            <div
              className="h-full w-full grid grid-cols-1"
              style={{
                gridTemplateRows: `repeat(${heightU}, minmax(0, 1fr))`,
              }}
            >
              {elevationRows.map((row) =>
                row.type === "empty" ? (
                  <EmptyRow
                    key={`u-${row.u}`}
                    u={row.u}
                    onEmptyClick={onEmptyClick}
                    heightClass="h-full"
                  />
                ) : (
                  <ItemRow
                    key={`${row.kind}-${row.item.id}`}
                    row={row}
                    selected={
                      selectedItem?.kind === row.kind &&
                      selectedItem?.item?.id === row.item.id
                    }
                    onSelectItem={onSelectItem}
                    viewMode="fit"
                  />
                ),
              )}
            </div>
          )}
        </div>

        {/* Bottom Plinth */}
        <div className="h-3 shrink-0 flex items-center justify-center gap-8 bg-[#0e131d] rounded-b-lg border-t border-zinc-800/90">
          <span className="w-12 h-1 bg-zinc-700/80 rounded-full" />
          <span className="w-12 h-1 bg-zinc-700/80 rounded-full" />
        </div>
      </div>
    </div>
  );
}
