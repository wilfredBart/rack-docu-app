import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { IoIosLogOut } from "react-icons/io";
import { FaUserCircle } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";

// Nieuwe pagina's: gewoon een regel bijvoegen.
const NAV_LINKS = [{ to: "/", label: "Klanten", end: true }];

// Instellingen van het netwerk-effect
const LINK_DIST = 150; // max. afstand (px) waarop twee nodes verbonden zijn
const DENSITY = 2500; // px² per node: lager = meer bolletjes
const MAX_NODES = 80;
const PULSE_COLOR = "#f5a524"; // amber: "activiteit" langs een verbinding
const PING_COLOR = "#34d399"; // groen: "link up" ring rond een node
// Bolletjes en lijnen nemen de accentkleur van je thema (--color-accent).

function readAccent(el) {
  return getComputedStyle(el).getPropertyValue("--color-accent").trim() || "#3b82f6";
}

/*
 * Geanimeerd netwerk: nodes drijven traag rond, lijnen verschijnen en
 * verdwijnen op basis van afstand, amberkleurige lichtpuntjes reizen langs
 * verbindingen, en af en toe pingt een node met een groene ring.
 * De muis fungeert als extra node. Pauzeert buiten beeld of in een
 * verborgen tab; bij "reduce motion" blijft het een stilstaand beeld.
 * Volgt het thema: kleur wordt opnieuw gelezen bij licht/donker-wissel.
 */
function NetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas.parentElement;
    const root = host.parentElement; // de header, voor pointer-events
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let nodes = [];
    let pulses = [];
    let rings = [];
    let accent = readAccent(canvas);
    let raf = 0;
    let last = 0;
    let spawn = 0;
    let ping = 1;
    let visible = true;
    const pointer = { x: -9999, y: -9999 };

    function seed() {
      const rect = host.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(MAX_NODES, Math.max(16, Math.round((w * h) / DENSITY)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 14, // px per seconde
        vy: (Math.random() - 0.5) * 14,
        r: 1.2 + Math.random() * 1.8,
      }));
      pulses = [];
      rings = [];
    }

    function step(dt) {
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      spawn -= dt;
      if (spawn <= 0) {
        spawn = 0.5 + Math.random() * 1.2;
        if (pulses.length < 4) {
          const a = Math.floor(Math.random() * nodes.length);
          const near = [];
          nodes.forEach((n, i) => {
            if (i !== a && Math.hypot(n.x - nodes[a].x, n.y - nodes[a].y) < LINK_DIST) near.push(i);
          });
          if (near.length) pulses.push({ a, b: near[Math.floor(Math.random() * near.length)], t: 0 });
        }
      }

      pulses = pulses.filter((p) => {
        p.t += dt / 1.1;
        const a = nodes[p.a];
        const b = nodes[p.b];
        return p.t < 1 && Math.hypot(a.x - b.x, a.y - b.y) < LINK_DIST;
      });

      ping -= dt;
      if (ping <= 0) {
        ping = 1.5 + Math.random() * 1.8;
        if (rings.length < 3) rings.push({ n: Math.floor(Math.random() * nodes.length), t: 0 });
      }
      rings = rings.filter((r) => (r.t += dt / 1.6) < 1);
    }

    function line(x1, y1, x2, y2, alpha) {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function dot(x, y, r, alpha) {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) line(a.x, a.y, b.x, b.y, (1 - d / LINK_DIST) * 0.4);
        }
        const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (pd < LINK_DIST) line(a.x, a.y, pointer.x, pointer.y, (1 - pd / LINK_DIST) * 0.8);
      }

      ctx.strokeStyle = PING_COLOR;
      for (const r of rings) {
        const n = nodes[r.n];
        ctx.globalAlpha = (1 - r.t) * 0.7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 2 + r.t * 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = PULSE_COLOR;
      for (const p of pulses) {
        const a = nodes[p.a];
        const b = nodes[p.b];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        dot(x, y, 5, 0.25);
        dot(x, y, 2, 0.95);
      }

      ctx.fillStyle = accent;
      for (const n of nodes) {
        dot(n.x, n.y, n.r * 3.2, 0.15); // gloed
        dot(n.x, n.y, n.r, 0.9);
      }
      ctx.globalAlpha = 1;
    }

    function frame(ts) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduced || !visible || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    function onLeave() {
      pointer.x = pointer.y = -9999;
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }
    function onTheme() {
      accent = readAccent(canvas);
      draw();
    }

    seed();
    draw();
    start();

    const ro = new ResizeObserver(() => {
      seed();
      draw();
    });
    ro.observe(host);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(host);

    // thema-wissel (class/data-theme op <html>, of OS-voorkeur)
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onTheme);

    document.addEventListener("visibilitychange", onVisibility);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", onTheme);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      {/* houdt de titel leesbaar boven het netwerk */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, color-mix(in oklab, var(--color-card) 85%, transparent), color-mix(in oklab, var(--color-card) 30%, transparent) 55%, transparent)",
        }}
      />
    </div>
  );
}

// Drie U-slots; één slot heeft een LED die rustig pulseert.
function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0 text-fg-subtle" aria-hidden="true">
      {[4, 12, 20].map((y) => (
        <rect key={y} x="3" y={y} width="26" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      ))}
      <rect x="7" y="14.5" width="9" height="3" fill="currentColor" opacity=".45" />
      <rect x="22" y="14" width="4" height="4" fill={PING_COLOR} className="motion-safe:animate-pulse" />
    </svg>
  );
}

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  // Haal het user object op uit de Redux store
  const user = useSelector((state) => state.auth.user);

  // Sluit de dropdown automatisch als je er buiten klikt
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout()); // Wist de Redux state & localStorage
  };

  const linkStyle = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
      isActive ? "bg-accent text-accent-fg shadow-xs" : "text-fg-muted hover:bg-card hover:text-fg"
    }`;

  return (
    <header className="relative mb-8 border border-border bg-card shadow-xs">
      <NetworkBackground />

      <div className="relative flex flex-col gap-4 px-5 py-4 sm:px-6 sm:py-5">
        {/* Titel + gebruikersmenu */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <h1 className="truncate text-xl font-bold tracking-tight text-fg sm:text-2xl">
              Connect!
            </h1>
          </div>

          {/* Dropdown Menu Container */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              className="flex cursor-pointer items-center gap-2.5 border border-border bg-bg-subtle px-3 py-2 font-medium text-fg-muted transition hover:bg-card"
            >
              <FaUserCircle className="text-xl text-fg-subtle" />
              <span className="hidden text-sm sm:inline">
                Welcome, <strong className="font-semibold text-fg">{user?.name || "User"}</strong>!
              </span>
              <IoChevronDown
                className={`text-sm text-fg-subtle transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Menu Card */}
            {isOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 animate-in fade-in slide-in-from-top-1 border border-border bg-card py-1.5 shadow-[var(--shadow-border)] duration-150">
                <div className="border-b border-border px-4 py-2">
                  <p className="text-xs text-fg-subtle">Ingelogd als</p>
                  <p className="truncate text-xs font-medium text-fg-muted">{user?.email || ""}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                >
                  <IoIosLogOut className="text-lg" />
                  Uitloggen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigatie onder de titel */}
        <nav className="flex w-fit items-center gap-1 border border-border bg-bg-subtle p-1" aria-label="Hoofdnavigatie">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkStyle}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="size-1.5 bg-accent-fg motion-safe:animate-pulse" aria-hidden="true" />}
                  {l.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* subtiele accentlijn onderaan */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5"
        style={{ background: "linear-gradient(to right, var(--color-accent), transparent 70%)" }}
        aria-hidden="true"
      />
    </header>
  );
}

export default Header;
