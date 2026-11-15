import { Link } from "react-router-dom";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";

/**
 * Herbruikbare breadcrumb-navigatie.
 *
 * @param {Object} props
 * @param {{ label: string, to?: string }[]} props.items
 *   Eerste item met `to` krijgt een terug-pijl. Laatste item zonder `to`
 *   is de huidige pagina (niet-klikbaar). Tussenliggende items met `to`
 *   zijn gewone links.
 * @param {React.ReactNode} [props.trailing]
 *   Optionele actie rechts (bijv. "VLAN beheer"-link).
 * @param {string} [props.className]
 */
export default function Breadcrumb({ items = [], trailing = null, className = "" }) {
  if (!items.length) return null;

  return (
    <nav
      className={`flex items-center gap-2 text-sm text-fg-subtle flex-wrap ${className}`.trim()}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const isCurrent = isLast && !item.to;

        return (
          <span key={`${item.label}-${index}`} className="contents">
            {index > 0 && (
              <FiChevronRight className="text-fg-subtle shrink-0" aria-hidden="true" />
            )}
            {isCurrent ? (
              <span className="text-fg font-medium">{item.label}</span>
            ) : item.to ? (
              <Link
                to={item.to}
                className={
                  isFirst
                    ? "inline-flex items-center gap-1.5 hover:text-fg transition font-medium"
                    : "hover:text-fg font-medium"
                }
              >
                {isFirst && <FiArrowLeft className="text-base" aria-hidden="true" />}
                {item.label}
              </Link>
            ) : (
              <span className="font-medium">{item.label}</span>
            )}
          </span>
        );
      })}
      {trailing}
    </nav>
  );
}
