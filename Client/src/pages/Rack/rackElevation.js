// Bouwt de lijst van elevatie-rijen (van boven naar onder) voor de visuele rack-weergave.
// Puur functioneel — geen React. API blijft: buildElevationRows(rack).

export const ROW_HEIGHT = 34;

export function occupiedUnits(item) {
  const start = Number(item.rack_position);
  const units = Math.max(1, Number(item.rack_units ?? 1));
  return { start, units, topU: start + units - 1 };
}

export function buildElevationRows(rack) {
  const height = rack.height_u;
  const occupiedBy = new Map();

  const register = (kind, item) => {
    const { start, topU } = occupiedUnits(item);
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

export function usedU(rack) {
  let used = 0;
  const add = (item) => {
    used += Math.max(1, Number(item.rack_units ?? 1));
  };
  (rack.devices ?? []).forEach(add);
  (rack.patch_panels ?? []).forEach(add);
  (rack.cable_management ?? []).forEach(add);
  return used;
}

export function faceKind(kind, item, deviceTypeName) {
  if (kind === "patch_panel") return "patch";
  if (kind === "cable_management") {
    const t = item?.type ? String(item.type) : "";
    if (/brush/i.test(t)) return "brush";
    return "fingers";
  }
  const extra = [
    deviceTypeName ?? "",
    item?.manufacturer ?? "",
    item?.model ?? "",
    item?.label ?? "",
  ].join(" ");
  if (/ups|battery|smart-ups/i.test(extra)) return "ups";
  if (/firewall|forti|palo|asa/i.test(extra)) return "firewall";
  if (/switch|catalyst|nexus|unifi|procurve/i.test(extra)) return "switch";
  if (/router|isr|mx\d/i.test(extra)) return "router";
  if (/nas|synology|qnap|storage/i.test(extra)) return "nas";
  if (/server|poweredge|proliant|esxi|r7\d0|dl\d/i.test(extra)) return "server";
  return "appliance";
}
