import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Modal from "../components/UI/Modal";
import FormModal from "../components/UI/FormModal";
import PageHeader from "../components/UI/PageHeader";
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
  FiUserPlus,
  FiAlertCircle,
  FiUsers,
  FiBarChart2,
} from "react-icons/fi";

// Sluit direct aan op de MySQL `customers` tabel
const customerFields = [
  {
    name: "name",
    label: "Klantnaam",
    type: "text",
    required: true,
    placeholder: "bijv. Janssen Logistics",
    hint: (
      <span className="flex items-start gap-2 text-fg-muted">
        <FiAlertCircle className="w-[18px] h-[18px] mt-px shrink-0 text-fg" />
        <span>
          Enkel de naam van de klant (organisatie). Geen filialen of vestigingen
          in de naam zetten, die voeg je nadien toe als site.
        </span>
      </span>
    ),
  },
];

function Klanten() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      // Nieuwe klant → meteen door naar de setup-wizard (site → locaties → racks)
      createMutation.mutate(values, {
        onSuccess: (created) => {
          if (created?.id) navigate(`/klanten/${created.id}/setup`);
        },
      });
    }
  };

  // Client-side zoekfilter op klantnaam
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="flex justify-center items-center h-64 text-fg-subtle font-medium">
          Klanten inladen...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="p-4 bg-destructive/10 border border-destructive/40 rounded-xl text-destructive font-medium">
          Er ging iets mis bij het ophalen van de klanten. Controleer de
          API-verbinding.
        </div>
      </div>
    );
  }

  // Kerncijfers: totaal en wat het zoekfilter momenteel toont
  const kpiItems = [
    { key: "total", label: "Klanten", icon: FiUsers, value: customers.length },
    {
      key: "shown",
      label: "Weergegeven",
      icon: FiUserCheck,
      value: filteredCustomers.length,
    },
  ];

  return (
    <div className="min-h-screen bg-bg pb-12">
      <Header />

      <div className="w-full">
        <PageHeader
          title="Klantenportaal"
          subtitle="Beheer hier je organisaties"
        />

        {/* Kerncijfers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 bg-card rounded-2xl border border-border shadow-[var(--shadow-border)] overflow-hidden mb-8">
          <div className="sm:col-span-2 flex items-center gap-3 border-b border-border bg-bg-subtle px-6 py-4">
            <FiBarChart2 className="text-lg text-fg-subtle shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg">
                Kerncijfers
              </h2>
              <p className="mt-0.5 text-xs text-fg-subtle">
                Totaal aantal klanten en huidige zoekresultaten
              </p>
            </div>
          </div>
          {kpiItems.map(({ key, label, icon: Icon, value }) => (
            <div
              key={key}
              className="px-6 py-4 flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-border last:border-b-0 sm:last:border-r-0"
            >
              <div className="flex items-center gap-2 text-fg-subtle">
                <Icon className="text-base" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <div className="text-2xl font-bold text-fg tabular-nums">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Klanten: kop + toolbox + tabel in één kaart */}
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-border)] overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border bg-bg-subtle px-6 py-4">
            <FiUsers className="text-lg text-fg-subtle shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg">
                Klanten
              </h2>
              <p className="mt-0.5 text-xs text-fg-subtle">
                Klik op de naam van een klant om naar hun specifieke
                infrastructuur te gaan
              </p>
            </div>
          </div>

          {/* Toolbox */}
          <div className="flex flex-col sm:flex-row gap-4 items-center border-b border-border p-6">
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle text-lg" />
              <input
                type="text"
                placeholder="Zoek op klantnaam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-subtle border border-border rounded-xl text-sm text-fg focus:outline-none focus:border-accent transition"
              />
            </div>

            <button
              type="button"
              onClick={openNewModal}
              className="flex items-center gap-2 px-4 py-2 bg-bg-subtle border border-border text-white rounded-xl text-sm font-medium hover:opacity-90 transition cursor-pointer"
              title="Nieuwe klant"
            >
              <FiUserPlus />
              <span className="ml-1 text-sm font-medium">Nieuwe klant</span>
            </button>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-fg-subtle">
              Geen klanten gevonden.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-subtle border-b border-border text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  <th className="p-4">Klantnaam</th>
                  <th className="p-4">Aangemaakt op</th>
                  <th className="p-4 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-bg-subtle transition group">
                    <td className="p-4">
                      {/* Het oogje staat vast aan de linkerkant, is altijd zichtbaar en kleurt mee bij hover */}
                      <Link
                        to={`/klanten/${c.id}`}
                        className="inline-flex items-center gap-2.5 font-semibold text-fg hover:text-accent transition group/link"
                      >
                        <FiEye className="text-fg-subtle group-hover/link:text-accent text-base shrink-0 transition-colors" />
                        <span>{c.name}</span>
                      </Link>
                    </td>
                    <td className="p-4 text-fg-subtle">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-fg-subtle shrink-0" />
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
                          className="p-2 rounded-lg text-fg-subtle hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                          title="Bewerken"
                        >
                          <FiEdit2 className="text-base" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-2 rounded-lg text-fg-subtle hover:text-destructive hover:bg-bg-subtle transition cursor-pointer"
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
        <p className="text-sm text-fg-muted">
          Weet je zeker dat je <strong>{deleteTarget?.name}</strong> wilt
          verwijderen?
          <br />
          <span className="text-xs text-destructive mt-1 block font-medium">
            Let op: Alle bijbehorende sites, locaties en racks worden ook gewist
            (CASCADE).
          </span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted hover:bg-bg-subtle transition cursor-pointer"
          >
            Annuleren
          </button>
          <button
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Verwijderen..." : "Klant Verwijderen"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Klanten;
