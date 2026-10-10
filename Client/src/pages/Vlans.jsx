import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FiArrowLeft, FiChevronRight, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import Header from "../components/Header";
import FormModal from "../components/UI/FormModal";
import { fetchVlans, createVlan, updateVlan, deleteVlan } from "../api/vlans";
import { VLAN_COLORS, vlanColor } from "./PatchPlan/vlanColors";

const FIELDS = [
  { name: "vlan_number", label: "VLAN-nummer", type: "number", placeholder: "bijv. 20", required: true },
  { name: "name", label: "Naam", type: "text", placeholder: "bijv. Kantoor", required: true },
  {
    name: "color",
    label: "Kleur",
    type: "select",
    required: true,
    options: VLAN_COLORS.map((c) => ({ value: c.key, label: c.label })),
  },
  { name: "description", label: "Omschrijving", type: "textarea", placeholder: "bijv. 10.20.0.0/24, werkplekken" },
];

// Route: /klanten/:klantId/vlans — VLAN-definities per klant (nummer, naam, kleur).
export default function Vlans() {
  const { klantId } = useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null = dicht, {} = nieuw, vlan = bewerken

  const { data: vlans = [], isLoading } = useQuery({
    queryKey: ["vlans", klantId],
    queryFn: () => fetchVlans(klantId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["vlans"] });
    queryClient.invalidateQueries({ queryKey: ["patchplan"] });
    queryClient.invalidateQueries({ queryKey: ["selected-item-ports"] });
  };
  const onError = (err) =>
    toast.error(err.response?.data?.message || "Er is een fout opgetreden");

  const saveMutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        vlan_number: Number(values.vlan_number),
        name: values.name,
        color: values.color,
        description: values.description,
      };
      return values.id
        ? updateVlan({ id: values.id, ...payload })
        : createVlan({ customer_id: Number(klantId), ...payload });
    },
    onSuccess: () => {
      refresh();
      setEditing(null);
      toast.success("VLAN opgeslagen");
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVlan,
    onSuccess: () => {
      refresh();
      toast.success("VLAN verwijderd");
    },
    onError,
  });

  // Stabiel object: FormModal reset zijn velden telkens initialValues van identiteit wisselt.
  const initialValues = useMemo(
    () =>
      editing?.id
        ? { ...editing, description: editing.description ?? "" }
        : { vlan_number: "", name: "", color: "indigo", description: "" },
    [editing],
  );

  const handleDelete = (vlan) => {
    const used = Number(vlan.port_count) > 0
      ? `\n${vlan.port_count} poort(en) gebruiken deze VLAN en worden "zonder VLAN".`
      : "";
    if (window.confirm(`VLAN ${vlan.vlan_number} (${vlan.name}) verwijderen?${used}`)) {
      deleteMutation.mutate(vlan.id);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-12">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-fg-subtle mb-4 pt-2">
          <Link
            to={`/klanten/${klantId}`}
            className="inline-flex items-center gap-1.5 hover:text-fg transition font-medium"
          >
            <FiArrowLeft className="text-base" />
            Terug
          </Link>
          <FiChevronRight className="text-fg-subtle" />
          <span className="text-fg font-medium">VLAN&apos;s</span>
        </nav>

        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-fg">VLAN&apos;s</h1>
            <p className="text-sm text-fg-subtle mt-1">
              Eén definitie per klant. De VLAN stel je in per poort van een
              device; patch panels erven ze via de verbinding.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing({})}
            className="flex shrink-0 items-center gap-2 bg-accent text-accent-fg hover:opacity-90 px-4 py-2.5 rounded-xl font-medium text-sm cursor-pointer"
          >
            <FiPlus /> Nieuwe VLAN
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-fg-subtle">
            Laden...
          </div>
        ) : vlans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-fg-subtle">
            Nog geen VLAN&apos;s voor deze klant.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-border)]">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-fg-subtle">
                <tr>
                  <th className="p-3 font-medium">Kleur</th>
                  <th className="p-3 font-medium">VLAN</th>
                  <th className="p-3 font-medium">Naam</th>
                  <th className="p-3 font-medium hidden sm:table-cell">Omschrijving</th>
                  <th className="p-3 font-medium text-right">Poorten</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {vlans.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="p-3">
                      <span
                        className="block h-1.5 w-8 rounded-full"
                        style={{ background: vlanColor(v.color) }}
                      />
                    </td>
                    <td className="p-3 font-mono text-fg">{v.vlan_number}</td>
                    <td className="p-3 font-medium text-fg">{v.name}</td>
                    <td className="p-3 text-fg-muted hidden sm:table-cell">{v.description}</td>
                    <td className="p-3 text-right font-mono text-fg-muted">{v.port_count}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(v)}
                          className="p-2 rounded-lg text-fg-subtle hover:text-accent hover:bg-bg-subtle cursor-pointer"
                          title="Bewerken"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v)}
                          className="p-2 rounded-lg text-fg-subtle hover:text-destructive hover:bg-bg-subtle cursor-pointer"
                          title="Verwijderen"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "VLAN bewerken" : "Nieuwe VLAN"}
        fields={FIELDS}
        initialValues={initialValues}
        onSubmit={(values) => saveMutation.mutate({ ...values, id: editing?.id })}
        isSubmitting={saveMutation.isPending}
      />
    </div>
  );
}
