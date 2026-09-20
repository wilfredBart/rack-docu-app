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

        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            {isLoading ? "Laden..." : rack?.name ?? "Rack niet gevonden"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Elevation-view, devices, patch panels en cable management volgen
            in Fase 2.
          </p>
          {rack && (
            <p className="text-xs text-gray-400 mt-4">
              {rack.height_u}U — {rack.devices?.length ?? 0} devices,{" "}
              {rack.patch_panels?.length ?? 0} patch panels,{" "}
              {rack.cable_management?.length ?? 0} cable management
            </p>
          )}
        </div>
      </div>
    </div>
  );
}