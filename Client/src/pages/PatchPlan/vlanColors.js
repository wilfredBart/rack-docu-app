// Vaste VLAN-kleuren. De sleutel wordt opgeslagen in vlans.color (zie Server vlanController).
// De eigenlijke tinten staan als --color-vlan-<sleutel> in index.css.
export const VLAN_COLORS = [
  { key: "indigo", label: "Indigo" },
  { key: "violet", label: "Violet" },
  { key: "orchid", label: "Orchidee" },
  { key: "pink", label: "Roze" },
  { key: "sky", label: "Hemelsblauw" },
  { key: "sand", label: "Zand" },
  { key: "slate", label: "Leisteen" },
  { key: "mauve", label: "Mauve" },
];

export function vlanColor(key) {
  return VLAN_COLORS.some((c) => c.key === key)
    ? `var(--color-vlan-${key})`
    : "var(--color-fg-subtle)";
}

export function vlanLabel(vlan) {
  return `VLAN ${vlan.vlan_number} ${vlan.name}`;
}
