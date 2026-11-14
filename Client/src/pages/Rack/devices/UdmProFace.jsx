import React from "react";

/**
 * Pixel-perfect vector component van de UniFi Dream Machine Pro (UDM Pro) front face.
 * Gebaseerd op de 19" 1U rack-mount specificaties (aspect ratio ~ 10.87 : 1).
 *
 * Props:
 *  - activePortId: ID of nummer van de momenteel geselecteerde poort (optioneel)
 *  - ports: array van poort-objecten uit de database (optioneel)
 *  - onPortClick: callback(portNumber) bij klikken op een poort (optioneel)
 */
export default function UdmProFace({
  activePortId = null,
  ports = [],
  onPortClick,
  className = "",
}) {
  // Snelle lookup voor poort-status (bijv. heeft VLAN of verbinding)
  const portMap = React.useMemo(() => {
    const map = new Map();
    (ports || []).forEach((p, idx) => {
      // Zoek op nummer in naam (bv. "Port 1" -> 1) of volgorde
      const numMatch = p.name?.match(/\d+/);
      const portNum = numMatch ? parseInt(numMatch[0], 10) : idx + 1;
      map.set(portNum, p);
    });
    return map;
  }, [ports]);

  const renderRj45Port = (num, x, y, isWan = false) => {
    const portData = portMap.get(num);
    const isSelected = activePortId === num || activePortId === portData?.id;
    const isConnected = Boolean(portData?.vlan_id || portData?.connected_to);

    return (
      <g
        key={`port-${num}`}
        onClick={() => onPortClick?.(num, portData)}
        className="cursor-pointer group select-none"
      >
        {/* Poortnummer tekst */}
        <text
          x={x + 13}
          y={y < 40 ? y - 3 : y + 26}
          textAnchor="middle"
          fontSize="7"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
          fill="#64748b"
          className="group-hover:fill-zinc-200 transition-colors"
        >
          {num}
        </text>

        {/* Poort omhulsel (metalen kooi) */}
        <rect
          x={x}
          y={y}
          width="26"
          height="19"
          rx="1.5"
          fill="#1b212c"
          stroke={isSelected ? "#38bdf8" : "#475569"}
          strokeWidth={isSelected ? "1.5" : "0.8"}
          className="group-hover:stroke-cyan-400 transition-colors"
        />

        {/* Binnenzijde RJ45 jack */}
        <path
          d={`M ${x + 4} ${y + 3} h 18 v 10 h -4 v 3 h -10 v -3 h -4 z`}
          fill="#0c1017"
        />

        {/* Koperen pinnetjes binnenin */}
        <line x1={x + 7} y1={y + 5} x2={x + 7} y2={y + 8} stroke="#d97706" strokeWidth="0.8" />
        <line x1={x + 9} y1={y + 5} x2={x + 9} y2={y + 8} stroke="#d97706" strokeWidth="0.8" />
        <line x1={x + 11} y1={y + 5} x2={x + 11} y2={y + 8} stroke="#d97706" strokeWidth="0.8" />
        <line x1={x + 13} y1={y + 5} x2={x + 13} y2={y + 8} stroke="#d97706" strokeWidth="0.8" />
        <line x1={x + 15} y1={y + 5} x2={x + 15} y2={y + 8} stroke="#d97706" strokeWidth="0.8" />
        <line x1={x + 17} y1={y + 5} x2={x + 17} y2={y + 8} stroke="#d97706" strokeWidth="0.8" />
        <line x1={x + 19} y1={y + 5} x2={x + 19} y2={y + 8} stroke="#d97706" strokeWidth="0.8" />

        {/* Link / Activity LEDs (groen en oranje) */}
        <circle
          cx={x + 3.5}
          cy={y + 16.5}
          r="1.2"
          fill={isConnected ? "#22c55e" : "#1e3a2f"}
          filter={isConnected ? "url(#led-glow)" : undefined}
        />
        <circle
          cx={x + 22.5}
          cy={y + 16.5}
          r="1.2"
          fill={isConnected ? "#f59e0b" : "#452d11"}
        />

        {/* WAN indicator badge voor poort 9 */}
        {isWan && (
          <g>
            <circle cx={x + 13} cy={y + 33} r="3.5" fill="#0284c7" />
            <circle cx={x + 13} cy={y + 33} r="1.5" fill="#ffffff" />
          </g>
        )}
      </g>
    );
  };

  const renderSfpPort = (num, x, y, isWan = false) => {
    const portData = portMap.get(num);
    const isSelected = activePortId === num || activePortId === portData?.id;
    const isConnected = Boolean(portData?.vlan_id || portData?.connected_to);

    return (
      <g
        key={`sfp-${num}`}
        onClick={() => onPortClick?.(num, portData)}
        className="cursor-pointer group select-none"
      >
        {/* SFP kooi body */}
        <rect
          x={x}
          y={y}
          width="28"
          height="24"
          rx="1"
          fill="#1e2633"
          stroke={isSelected ? "#38bdf8" : "#475569"}
          strokeWidth={isSelected ? "1.5" : "0.9"}
          className="group-hover:stroke-cyan-400 transition-colors"
        />

        {/* Binnenzijde kooi met ontgrendelingsclips */}
        <rect x={x + 3} y={y + 3} width="22" height="18" fill="#0c1017" rx="0.5" />
        <rect x={x + 7} y={y + 6} width="14" height="12" fill="#2d3748" stroke="#4a5568" strokeWidth="0.5" />
        <path d={`M ${x + 11} ${y + 8} h 6 v 8 h -6 z`} fill="#1a202c" />

        {/* Status LED */}
        <circle
          cx={x + 2}
          cy={y + 4}
          r="1.2"
          fill={isConnected ? "#22c55e" : "#1e3a2f"}
          filter={isConnected ? "url(#led-glow)" : undefined}
        />

        {/* WAN Cirkel Badge voor poort 10 */}
        {isWan && (
          <g>
            <circle cx={x + 14} cy={y - 6} r="3.5" fill="#0284c7" />
            <circle cx={x + 14} cy={y - 6} r="1.5" fill="#ffffff" />
            <text
              x={x + 21}
              y={y - 3}
              fontSize="6"
              fontFamily="ui-monospace, monospace"
              fontWeight="600"
              fill="#0284c7"
            >
              10
            </text>
          </g>
        )}

        {/* 10G Label voor poort 11 */}
        {!isWan && (
          <g>
            <text
              x={x + 14}
              y={y + 31}
              textAnchor="middle"
              fontSize="6.5"
              fontFamily="ui-monospace, monospace"
              fontWeight="600"
              fill="#64748b"
            >
              11
            </text>
            <rect x={x + 5} y={y + 33} width="18" height="3" rx="1.5" fill="#94a3b8" />
            <text
              x={x + 14}
              y={y + 35.5}
              textAnchor="middle"
              fontSize="4"
              fontFamily="sans-serif"
              fontWeight="bold"
              fill="#0f172a"
            >
              10G
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none drop-shadow-md ${className}`}
      style={{ aspectRatio: "1000 / 92" }}
    >
      <svg
        viewBox="0 0 1000 92"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
      >
        <defs>
          {/* Geborsteld zilver aluminium verloop */}
          <linearGradient id="udm-metal" x1="0" y1="0" x2="0" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e9ecef" />
            <stop offset="6%" stopColor="#dfe3e7" />
            <stop offset="50%" stopColor="#d5d9de" />
            <stop offset="94%" stopColor="#c5cad1" />
            <stop offset="100%" stopColor="#b4b9c1" />
          </linearGradient>

          {/* Aluminium glans highlight rand */}
          <linearGradient id="udm-bevel" x1="0" y1="0" x2="0" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="3%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="97%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>

          {/* HDD Sled metaal verloop */}
          <linearGradient id="hdd-sled" x1="416" y1="13" x2="416" y2="79" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e3e6ea" />
            <stop offset="50%" stopColor="#cfd4da" />
            <stop offset="100%" stopColor="#bfc4cb" />
          </linearGradient>

          {/* Scherm gloed */}
          <filter id="screen-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* LED gloed */}
          <filter id="led-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── 1. Chassis basis (Aluminium 1U front body) ── */}
        <rect x="0" y="0" width="1000" height="92" fill="url(#udm-metal)" />
        <rect x="0" y="0" width="1000" height="92" fill="url(#udm-bevel)" />

        {/* ── 2. Linker Montage-oor ── */}
        <g id="left-ear">
          <line x1="48" y1="0" x2="48" y2="92" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
          {/* Schroefgat boven */}
          <rect x="12" y="16" width="22" height="13" rx="6.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
          <rect x="13.5" y="17.5" width="19" height="10" rx="5" fill="#475569" opacity="0.6" />
          {/* Schroefgat onder */}
          <rect x="12" y="63" width="22" height="13" rx="6.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
          <rect x="13.5" y="64.5" width="19" height="10" rx="5" fill="#475569" opacity="0.6" />
        </g>

        {/* ── 3. Rechter Montage-oor ── */}
        <g id="right-ear">
          <line x1="952" y1="0" x2="952" y2="92" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
          {/* Schroefgat boven */}
          <rect x="966" y="16" width="22" height="13" rx="6.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
          <rect x="967.5" y="17.5" width="19" height="10" rx="5" fill="#475569" opacity="0.6" />
          {/* Schroefgat onder */}
          <rect x="966" y="63" width="22" height="13" rx="6.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
          <rect x="967.5" y="64.5" width="19" height="10" rx="5" fill="#475569" opacity="0.6" />
        </g>

        {/* ── 4. Bovenste ventilatiesleuf (karakteristiek voor UniFi) ── */}
        <path
          d="M 115 8 H 360 M 365 8 H 595 M 600 8 H 780 M 785 8 H 920"
          stroke="#1e293b"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* ── 5. LCM Touchscreen Display (Links) ── */}
        <g id="lcm-screen">
          {/* Zwarte display bezel */}
          <rect
            x="64"
            y="22"
            width="48"
            height="48"
            rx="5"
            fill="#05070a"
            stroke="#0284c7"
            strokeWidth="1.8"
            filter="url(#screen-glow)"
          />
          {/* Zachte display achtergrond */}
          <rect x="66" y="24" width="44" height="44" rx="4" fill="#080c14" />

          {/* UniFi "U" Logo in het scherm */}
          <g transform="translate(80, 36) scale(0.68)">
            {/* Gestileerde Ubiquiti U-icon */}
            <path
              d="M 12 0 C 13.5 3 15 6 15 10 C 15 16 11 20 6 20 C 2.5 20 0 17.5 0 14 C 0 9 5 4 12 0 Z"
              fill="#ffffff"
              opacity="0.95"
            />
            <path
              d="M 12 0 C 10.5 3 9 6 9 10 C 9 16 13 20 18 20 C 21.5 20 24 17.5 24 14 C 24 9 19 4 12 0 Z"
              fill="#38bdf8"
              opacity="0.85"
            />
            <circle cx="12" cy="11" r="2.2" fill="#080c14" />
          </g>

          {/* Model opdruk: UDM Pro */}
          <text
            x="88"
            y="81"
            textAnchor="middle"
            fontSize="7"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="bold"
            fill="#334155"
            letterSpacing="0.4"
          >
            UDM <tspan fontWeight="normal">Pro</tspan>
          </text>
        </g>

        {/* ── 6. 3.5" Hard Drive Bay (Midden) ── */}
        <g id="hdd-bay">
          {/* Uitsparing in chassis */}
          <rect x="415" y="14" width="200" height="64" rx="2" fill="#0f172a" opacity="0.9" />
          {/* Sled front paneel */}
          <rect
            x="417"
            y="16"
            width="196"
            height="60"
            rx="1.5"
            fill="url(#hdd-sled)"
            stroke="#94a3b8"
            strokeWidth="0.6"
          />

          {/* Hendel naad / slot links */}
          <rect
            x="423"
            y="19"
            width="82"
            height="54"
            rx="1.5"
            fill="#cfd4da"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          <line x1="423" y1="19" x2="423" y2="73" stroke="#64748b" strokeWidth="1" />

          {/* HDD status LED / pinhole rechts */}
          <circle cx="598" cy="46" r="1.2" fill="#475569" stroke="#334155" strokeWidth="0.4" />
          <circle cx="598" cy="46" r="0.6" fill="#38bdf8" opacity="0.75" />
        </g>

        {/* ── 7. 8x RJ45 GbE LAN Switch Poorten (1 t/m 8) ── */}
        <g id="lan-ports">
          {/* Bovenste rij: 1, 3, 5, 7 */}
          {renderRj45Port(1, 655, 23)}
          {renderRj45Port(3, 688, 23)}
          {renderRj45Port(5, 721, 23)}
          {renderRj45Port(7, 754, 23)}

          {/* Onderste rij: 2, 4, 6, 8 */}
          {renderRj45Port(2, 655, 49)}
          {renderRj45Port(4, 688, 49)}
          {renderRj45Port(6, 721, 49)}
          {renderRj45Port(8, 754, 49)}
        </g>

        {/* ── 8. Poort 9: 1G RJ45 WAN Poort ── */}
        <g id="wan-rj45">
          {renderRj45Port(9, 810, 37, true)}
        </g>

        {/* ── 9. Poorten 10 & 11: 10G SFP+ Kooien ── */}
        <g id="sfp-ports">
          {/* Poort 10: 10G SFP+ WAN (boven) */}
          {renderSfpPort(10, 860, 18, true)}

          {/* Poort 11: 10G SFP+ LAN (onder) */}
          {renderSfpPort(11, 860, 48, false)}
        </g>

        {/* ── 10. Reset Knop ── */}
        <g id="reset-button">
          <circle cx="915" cy="58" r="1.5" fill="#0f172a" />
          <text
            x="921"
            y="60"
            fontSize="5.5"
            fontFamily="sans-serif"
            fontWeight="600"
            fill="#64748b"
          >
            RESET
          </text>
        </g>

        {/* ── 11. Subtiele onderkant reflectie/schaduw ── */}
        <rect x="48" y="90.5" width="904" height="1.5" fill="#000000" opacity="0.25" />
      </svg>
    </div>
  );
}
