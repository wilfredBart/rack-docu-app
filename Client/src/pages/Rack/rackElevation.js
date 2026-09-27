// Bouwt de lijst van elevatie-rijen (van boven naar onder) voor de visuele rack-weergave.
// Puur functioneel — geen React, geen hooks. Makkelijk te unit-testen los van de UI.

export const ROW_HEIGHT = 28;

export function buildElevationRows(rack) {
  const height = rack.height_u;
  const occupiedBy = new Map();

  const register = (kind, item) => {
    const start = Number(item.rack_position);
    const units = Number(item.rack_units ?? 1);
    const topU = start + units - 1;
    for (let u = start; u <= topU; u += 1) {
      occupiedBy.set(u, { kind, item, topU });
    }
  };

  (rack.devices ?? []).forEach((device) => register("device", device));
  (rack.patch_panels ?? []).forEach((panel) => register("patch_panel", panel));
  (rack.cable_management ?? []).forEach((item) =>
    register("cable_management", item),
  );

  const rows = [];
  for (let u = height; u >= 1; u -= 1) {
    const occ = occupiedBy.get(u);
    if (occ) {
      if (u === occ.topU) {
        rows.push({ type: "item", kind: occ.kind, item: occ.item });
      }
    } else {
      rows.push({ type: "empty", u });
    }
  }
  return rows;
}
