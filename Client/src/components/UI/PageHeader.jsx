/**
 * Vaste titelkaart van een pagina: h1 + ondertitel (+ acties rechts), in
 * dezelfde kaartvorm als de secties eronder. De breadcrumb zit hier bewust
 * NIET in: die hoort bij de navigatie en staat als strook onder de <Header />.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.eyebrow]  klein label boven de titel
 * @param {React.ReactNode} props.title  tekst van de h1
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.actions]  knoppen rechts naast de titel
 * @param {boolean} [props.compact]  minder padding/marge (pagina's met vaste schermhoogte, zoals Rack)
 * @param {string} [props.className]
 */
export default function PageHeader({
  eyebrow = null,
  title,
  subtitle = null,
  actions = null,
  compact = false,
  className = "",
}) {
  return (
    <div
      className={`${compact ? "mb-4" : "mb-8"} overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-border)] ${className}`.trim()}
    >
      <div
        className={`flex flex-col gap-3 px-6 sm:flex-row sm:items-start sm:justify-between ${
          compact ? "py-3" : "py-5"
        }`}
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
          {subtitle && (
            <div className="mt-1 text-sm text-fg-subtle">{subtitle}</div>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
