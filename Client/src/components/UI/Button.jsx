import { UserRoundPlus } from "lucide-react";

const Button = ({ setCreateOpen, BTNtext, icon: Icon = UserRoundPlus, disabled = false }) => {
  return (
    <div className="flex justify-start mb-4">
      <button
        onClick={() => setCreateOpen(true)}
        disabled={disabled}
        className="group h-11 border border-brand cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-all duration-300 ease-out flex items-stretch overflow-hidden"
      >
        <span className="relative bg-brand bg-gradient-to-tr from-black/10 via-transparent to-white/20 shadow-inner flex items-center justify-center px-3.5 text-white shrink-0 z-10">
          <span className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent h-1/2 pointer-events-none" />
          <Icon className="relative z-10 w-5 h-5" />
        </span>

        <span className="relative max-w-0 group-hover:max-w-xs bg-white bg-gradient-to-tr from-black/5 via-transparent to-white/30 shadow-inner flex items-center transition-all duration-300 ease-out overflow-hidden">
          <span className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent h-1/2 pointer-events-none" />

          <span className="relative z-10 text-slate-800 whitespace-nowrap pl-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">
            {BTNtext}
          </span>
        </span>
      </button>
    </div>
  );
};

export default Button;
