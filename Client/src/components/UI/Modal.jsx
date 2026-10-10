import { IoCloseCircleOutline } from "react-icons/io5";

/**
 * @param {"md"|"full"} [size="md"]
 *   md   — compact dialoog (formulieren)
 *   full — (bijna) fullscreen, handig op gsm/iPad voor detailviews
 */
function Modal({ isOpen, onClose, title, children, size = "md", headerExtra }) {
  if (!isOpen) return null;

  const panelClass =
    size === "full"
      ? "bg-card shadow-[var(--shadow-border)] w-full h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[min(92vh,56rem)] sm:max-w-2xl sm:rounded-xl flex flex-col transform transition-all"
      : "bg-card rounded-xl shadow-[var(--shadow-border)] w-full max-w-md p-6 transform transition-all";

  const bodyClass =
    size === "full"
      ? "flex-1 overflow-y-auto px-4 sm:px-6 pb-6 pt-1"
      : "";

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity ${
        size === "full"
          ? "flex items-stretch sm:items-center justify-center sm:p-4"
          : "flex items-center justify-center p-4"
      }`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`flex justify-between items-center gap-3 shrink-0 ${
            size === "full"
              ? "px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border"
              : "mb-5 pb-3 border-b border-border"
          }`}
        >
          <div className="min-w-0 flex-1">
            {typeof title === "string" ? (
              <h2 className="text-lg font-bold text-fg truncate">{title}</h2>
            ) : (
              title
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-bg-subtle transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Sluiten"
            >
              <IoCloseCircleOutline className="text-inherit hover:text-destructive w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={bodyClass}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
