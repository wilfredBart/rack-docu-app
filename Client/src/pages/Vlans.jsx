import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import Header from "../components/Header";
import FormModal from "../components/UI/FormModal";
import PageHeader from "../components/UI/PageHeader";
import { fetchVlans, createVlan, updateVlan, deleteVlan } from "../api/vlans";
import { vlanColor } from "./PatchPlan/vlanColors";

const FIELDS = [
  {
    name: "vlan_number",
    label: "VLAN-nummer",
    type: "number",
    placeholder: "bijv. 20",
    required: true,
  },
  {
    name: "name",
    label: "Naam",
    type: "text",
    placeholder: "bijv. Kantoor",
    required: true,
  },
  {
    name: "color",
    label: "Kleur",
    type: "color",
    required: true,
    hint: "Kies een kleur; die verschijnt in overzichten en op het patchplan.",
  },
  {
    name: "description",
    label: "Omschrijving",
    type: "textarea",
    placeholder: "bijv. 10.20.0.0/24, werkplekken",
  },
];

// Route: /klanten/:klantId/vlans
// Optioneel ?rackId= — breadcrumb terug naar dat rack (vanuit rack-toolbar).
export default function Vlans() {
  const { klantId } = useParams();
  const [searchParams] = useSearchParams();
  const rackId = searchParams.get("rackId");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

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

  const initialValues = useMemo(
    () =>
      editing?.id
        ? {
            ...editing,
            color: vlanColor(editing.color).startsWith("#")
              ? vlanColor(editing.color)
              : "#6366f1",
            description: editing.description ?? "",
          }
        : {
            vlan_number: "",
            name: "",
            color: "#6366f1",
            description: "",
          },
    [editing],
  );

  const handleDelete = (vlan) => {
    const used =
      Number(vlan.port_count) > 0
        ? `\n${vlan.port_count} poort(en) gebruiken deze VLAN en worden "zonder VLAN".`
        : "";
    if (
      window.confirm(
        `VLAN ${vlan.vlan_number} (${vlan.name}) verwijderen?${used}`,
      )
    ) {
      deleteMutation.mutate(vlan.id);
    }
  };

  // Vanuit rack-toolbar: altijd terug naar dat rack, nergens anders.
  const breadcrumbItems = rackId
    ? [
        { label: "Terug naar rack", to: `/klanten/${klantId}/racks/${rackId}` },
        { label: "VLAN beheer" },
      ]
    : [
        { label: "Dashboard", to: `/klanten/${klantId}` },
        { label: "VLAN beheer" },
      ];

  return (
    <div className="min-h-screen bg-bg pb-12">
      <Header breadcrumb={breadcrumbItems} />

      <div className="w-full">
        <PageHeader
          title="VLAN beheer"
          subtitle={
            <>
              Definieer VLAN&apos;s per klant. Kleur kies je zelf; die zie je
              terug in dit overzicht en op het patchplan. Toewijzing aan
              device-poorten gebeurt op het{" "}
              <span className="font-medium text-fg-muted">patchplan</span>.
            </>
          }
          actions={
            <button
              type="button"
              onClick={() => setEditing({})}
              className="flex items-center gap-2 px-4 py-2 bg-bg-subtle border border-border text-white rounded-xl text-sm font-medium hover:opacity-90 transition cursor-pointer"
              title="Nieuwe VLAN"
            >
              <FiPlus />
              <span className="ml-1 text-sm font-medium">Nieuwe VLAN</span>
            </button>
          }
        />

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-fg-subtle">
            Laden...
          </div>
        ) : vlans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-fg-subtle">
            <p>Nog geen VLAN&apos;s voor deze klant.</p>
            <button
              type="button"
              onClick={() => setEditing({})}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-bg-subtle border border-border text-white rounded-xl text-sm font-medium hover:opacity-90 transition cursor-pointer"
            >
              <FiPlus />
              <span className="ml-1 text-sm font-medium">Nieuwe VLAN</span>
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-border)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-subtle text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  <th className="p-3 w-10">Kleur</th>
                  <th className="p-3">VLAN</th>
                  <th className="p-3">Naam</th>
                  <th className="p-3 hidden sm:table-cell">Omschrijving</th>
                  <th className="p-3 text-right">Poorten</th>
                  <th className="p-3 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vlans.map((vlan) => (
                  <tr key={vlan.id} className="hover:bg-bg-subtle/50">
                    <td className="p-3">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-border"
                        style={{ background: vlanColor(vlan.color) }}
                        title={vlanColor(vlan.color)}
                      />
                    </td>
                    <td className="p-3 font-mono text-fg-muted">
                      {vlan.vlan_number}
                    </td>
                    <td className="p-3 font-medium text-fg">{vlan.name}</td>
                    <td className="p-3 hidden sm:table-cell text-fg-subtle max-w-xs truncate">
                      {vlan.description || "—"}
                    </td>
                    <td className="p-3 text-right text-fg-muted">
                      {vlan.port_count ?? 0}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(vlan)}
                          className="p-2 rounded-lg text-fg-subtle hover:text-accent hover:bg-bg-subtle cursor-pointer"
                          title="Bewerken"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vlan)}
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
        onSubmit={(values) =>
          saveMutation.mutate(
            editing?.id ? { ...values, id: editing.id } : values,
          )
        }
        isSubmitting={saveMutation.isPending}
      />
    </div>
  );
}
