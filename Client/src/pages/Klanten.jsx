import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Modal from "../components/UI/Modal";
import FormModal from "../components/UI/FormModal";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../api/customers";

// React Icons imports
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiUserCheck,
  FiCalendar,
} from "react-icons/fi";

// Sluit direct aan op de MySQL `customers` tabel
const customerFields = [
  { name: "name", label: "Klantnaam", type: "text", required: true },
];

function Klanten() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Klant succesvol aangemaakt");
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij aanmaken");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Klant bijgewerkt");
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij bijwerken");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(data?.message || "Klant verwijderd");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Fout bij verwijderen");
    },
  });

  const openNewModal = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  // Client-side zoekfilter op klantnaam
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header />
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Klanten inladen...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header />
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium">
          Er ging iets mis bij het ophalen van de klanten. Controleer de
          API-verbinding.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <Header />

      {/* Pagina Header met zoekbalk en actieknop */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Klantenbeheer</h1>
          <p className="text-sm text-gray-500">
            Beheer alle organisaties en klik door naar hun specifieke
            infrastructuur.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs cursor-pointer"
        >
          <FiPlus className="text-lg" /> Nieuwe klant
        </button>
      </div>

      {/* Zoekbalk & Stats Card */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Zoek op klantnaam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <FiUserCheck className="text-blue-600" />
          Totaal:{" "}
          <span className="text-gray-900 font-bold">
            {filteredCustomers.length}
          </span>{" "}
          klanten
        </div>
      </div>

      {/* Klanten Tabel Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Geen klanten gevonden.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="p-4">Klantnaam</th>
                <th className="p-4">Aangemaakt op</th>
                <th className="p-4 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4">
                    {/* Het oogje staat nu vast aan de linkerkant, is altijd zichtbaar en kleurt mee bij hover */}
                    <Link
                      to={`/klanten/${c.id}`}
                      className="inline-flex items-center gap-2.5 font-semibold text-gray-900 hover:text-blue-600 transition group/link"
                    >
                      <FiEye className="text-gray-400 group-hover/link:text-blue-600 text-base shrink-0 transition-colors" />
                      <span>{c.name}</span>
                    </Link>
                  </td>
                  <td className="p-4 text-gray-500">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-400 shrink-0" />
                      {new Date(c.created_at).toLocaleDateString("nl-BE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition cursor-pointer"
                        title="Bewerken"
                      >
                        <FiEdit2 className="text-base" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 transition cursor-pointer"
                        title="Verwijderen"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal (Aanmaken/Bewerken) */}
      <FormModal
        key={editingCustomer?.id ?? "new"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCustomer ? "Klantnaam bewerken" : "Nieuwe klant toevoegen"
        }
        fields={customerFields}
        initialValues={editingCustomer || { name: "" }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Verwijder Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Klant Verwijderen"
      >
        <p className="text-sm text-gray-600">
          Weet je zeker dat je <strong>{deleteTarget?.name}</strong> wilt
          verwijderen?
          <br />
          <span className="text-xs text-red-500 mt-1 block font-medium">
            Let op: Alle bijbehorende sites, locaties en racks worden ook gewist
            (CASCADE).
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            Annuleren
          </button>
          <button
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition cursor-pointer disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Verwijderen..." : "Klant Verwijderen"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Klanten;
