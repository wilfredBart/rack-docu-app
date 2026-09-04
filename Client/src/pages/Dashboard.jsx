import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerOverview } from "../api/customers";
import Header from "../components/Header";
import {
  FiArrowLeft,
  FiChevronRight,
  FiMapPin,
  FiHome,
  FiServer,
  FiCpu,
  FiLayers,
} from "react-icons/fi";

const KPI_ITEMS = [
  { key: "sites", label: "Sites", icon: FiHome },
  { key: "locations", label: "Locaties", icon: FiMapPin },
  { key: "racks", label: "Racks", icon: FiServer },
  { key: "devices", label: "Devices", icon: FiCpu },
  { key: "patch_panels", label: "Patch panels", icon: FiLayers },
];

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
  const stats = overview.stats ?? {};

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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{overview.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Infrastructuur-overzicht</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {KPI_ITEMS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4"
          >
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Icon className="text-base text-blue-600" />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Number(stats[key]) || 0}
            </p>
          </div>
        ))}
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
      ) : null}
    </div>
  );
}
