import { IoCloseCircleOutline } from "react-icons/io5";

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>

          {/* Sluitknop met React Icon */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Sluiten"
          >
            <IoCloseCircleOutline className="text-inherit hover:text-red-700 w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default Modal;
