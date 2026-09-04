import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerOverview } from "../api/customers";
import Header from "../components/Header";
import { FiArrowLeft, FiChevronRight, FiMapPin } from "react-icons/fi";

export default function Dashboard() {
  const { klantId } = useParams();

  const {
    data: overview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-overview", klantId],
    queryFn: () => fetchCustomerOverview(klantId),
    enabled: !!klantId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-12">
        <Header />
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Laden van klantgegevens...
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-12">
        <Header />
        <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-center">
          Er is een fout opgetreden bij het laden van de klantgegevens.
        </div>
      </div>
    );
  }

  const sites = overview.sites ?? [];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <Header />

      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 hover:text-gray-800 transition font-medium"
        >
          <FiArrowLeft className="text-base" />
          Klanten
        </Link>
        <FiChevronRight className="text-gray-300" />
        <span className="text-gray-800 font-medium">{overview.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{overview.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Infrastructuur-overzicht</p>
      </div>

      {sites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
            <FiMapPin className="text-xl" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            Nog geen sites
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Er zijn nog geen vestigingen gekoppeld aan {overview.name}. Een site
            toevoegen kan in de volgende stappen.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          {sites.length} {sites.length === 1 ? "site" : "sites"} geladen.
          Cijfers en sitelijst volgen in de volgende stappen.
        </p>
      )}
    </div>
  );
}
