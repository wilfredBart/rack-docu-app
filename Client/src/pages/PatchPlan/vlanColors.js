// VLAN-kleur: vrije hex (color picker). Oude palette-sleutels blijven leesbaar.
const LEGACY = {
  indigo: "#7c8cf8",
  violet: "#b48cf2",
  orchid: "#cf7fe0",
  pink: "#e07ab8",
  sky: "#5aa0f0",
  sand: "#cbb98f",
  slate: "#8fa3b8",
  mauve: "#b98aa6",
};

/** Resolves opgeslagen kleur naar een CSS-kleur (hex of legacy key). */
export function vlanColor(color) {
  if (!color) return "var(--color-fg-subtle)";
  if (typeof color === "string" && color.startsWith("#")) return color;
  if (typeof color === "string" && color.startsWith("rgb")) return color;
  return LEGACY[color] || "var(--color-fg-subtle)";
}

export function vlanLabel(vlan) {
  return `VLAN ${vlan.vlan_number} ${vlan.name}`;
}
