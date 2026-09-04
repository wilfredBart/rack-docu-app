import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import Header from "../components/Header";

// React Icons imports
import {
  FiHome,
  FiServer,
  FiLayers,
  FiPlus,
  FiArrowLeft,
  FiChevronRight,
  FiMapPin,
} from "react-icons/fi";

export default function Dashboard() {
  const { klantId } = useParams();

  // Haal de complete geneste structuur op van de klant
  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-details", klantId],
    queryFn: () =>
      api.get(`/customers/${klantId}/sites`).then((res) => res.data),
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

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-12">
        <Header />
        <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-center">
          Er is een fout opgetreden bij het laden van de klantgegevens.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <Header />

      {/* Navigatie terug & Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3 transition font-medium"
        >
          <FiArrowLeft /> Terug naar klantenoverzicht
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.name}
            </h1>
            <p className="text-sm text-gray-500">
              Beheer hier alle sites, locaties, racks en patchplannen.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs cursor-pointer">
            <FiPlus className="text-lg" /> Nieuwe Site Toevoegen
          </button>
        </div>
      </div>

      {/* Overzicht van Sites */}
      {customer.sites && customer.sites.length > 0 ? (
        <div className="space-y-6">
          {customer.sites.map((site) => (
            <div
              key={site.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden"
            >
              {/* Site Header */}
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <FiHome className="text-xl" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-gray-900">
                      SITE: {site.name}
                    </h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <FiMapPin className="text-gray-400" />
                      {site.street ? (
                        `${site.street} ${site.house_number || ""}, ${site.postal_code || ""} ${site.city || ""}`
                      ) : (
                        <span className="italic">Geen adres opgegeven</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Site Content (2 Kolommen) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Kolom 1: Locaties & Racks */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200/80">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                      <FiServer className="text-blue-600" /> Locaties & Racks
                    </h3>
                  </div>

                  {site.locations && site.locations.length > 0 ? (
                    <div className="space-y-3">
                      {site.locations.map((loc) => (
                        <div
                          key={loc.id}
                          className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs"
                        >
                          <p className="font-semibold text-sm text-gray-900 mb-2">
                            • {loc.name}
                          </p>

                          {/* Racks binnen deze locatie */}
                          {loc.racks && loc.racks.length > 0 ? (
                            <div className="space-y-2 pl-3 border-l-2 border-blue-200 ml-1">
                              {loc.racks.map((rack) => (
                                <div
                                  key={rack.id}
                                  className="flex justify-between items-center text-xs bg-gray-50/60 p-2 rounded-lg"
                                >
                                  <span className="text-gray-700 font-mono font-medium">
                                    {rack.name} ({rack.height_u} U)
                                  </span>
                                  <span
                                    className="inline-flex items-center gap-1 text-gray-400 font-semibold cursor-not-allowed"
                                    title="Rack-pagina volgt in fase 2"
                                  >
                                    Openen <FiChevronRight />
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic pl-3">
                              Geen racks gekoppeld.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic py-2">
                      Nog geen locaties aangemaakt voor deze site.
                    </p>
                  )}

                  <button className="mt-3 w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-white hover:border-blue-400 transition flex items-center justify-center gap-1">
                    <FiPlus /> Locatie Toevoegen
                  </button>
                </div>

                {/* Kolom 2: Patchplannen & Verbindingen */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <FiLayers className="text-blue-600" /> Patchplannen &
                        Verbindingen
                      </h3>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-2xs">
                      <p className="text-xs text-gray-500 mb-4">
                        Bekijk of beheer de actieve patchverbindingen en
                        infrastructuur visualisaties voor{" "}
                        <strong>{site.name}</strong>.
                      </p>
                      <Link
                        to={`/klanten/${klantId}/patchplan?siteId=${site.id}`}
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs px-4 py-2.5 rounded-xl font-medium transition shadow-xs"
                      >
                        <FiLayers /> Open Patchplan Visualizer
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          Nog geen sites gekoppeld aan {customer.name}. Klik op "Nieuwe Site
          Toevoegen" om te beginnen.
        </div>
      )}
    </div>
  );
}
