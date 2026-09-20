import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRackWithContents } from "../api/racks";
import Header from "../components/Header";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";

export default function Rack() {
  const { klantId, rackId } = useParams();

  const { data: rack, isLoading } = useQuery({
    queryKey: ["rack-contents", rackId],
    queryFn: () => fetchRackWithContents(rackId),
    enabled: !!rackId,
  });

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 pt-2">
          <Link
            to={`/klanten/${klantId}`}
            className="inline-flex items-center gap-1.5 hover:text-gray-800 transition font-medium"
          >
            <FiArrowLeft className="text-base" />
            Terug
          </Link>
          <FiChevronRight className="text-gray-300" />
          <span className="text-gray-800 font-medium">
            {isLoading ? "Laden..." : rack?.name ?? "Rack"}
          </span>
        </nav>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            Laden...
          </div>
        ) : !rack ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            Rack niet gevonden.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {rack.name}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {rack.height_u}U
                {rack.notes ? ` — ${rack.notes}` : ""}
              </p>
            </div>

            <div className="w-full max-w-sm bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
              {Array.from({ length: rack.height_u }, (_, i) => {
                const u = rack.height_u - i;
                return (
                  <div
                    key={u}
                    className={`h-7 flex items-center border-b border-gray-100 last:border-b-0 ${
                      u % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                    }`}
                  >
                    <span className="w-9 shrink-0 text-right pr-2 text-[10px] font-medium text-gray-400 tabular-nums">
                      {u}U
                    </span>
                    <span className="flex-1 h-full border-l border-gray-100" />
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Devices, patch panels en cable management in deze slots volgen
              in 2.2–2.4.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}