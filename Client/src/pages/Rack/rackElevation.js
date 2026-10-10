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

// Set van alle bezette U's (devices + patch panels + cable management).
// excludeKind/excludeId: negeer één item (handig bij verplaatsen, zodat een item
// zichzelf niet als obstakel ziet).
function takenUnits(rack, { excludeKind, excludeId } = {}) {
  const taken = new Set();
  const add = (kind, item) => {
    if (kind === excludeKind && item.id === excludeId) return;
    const { start, topU } = occupiedUnits(item);
    for (let n = start; n <= topU; n += 1) taken.add(n);
  };
  (rack.devices ?? []).forEach((d) => add("device", d));
  (rack.patch_panels ?? []).forEach((p) => add("patch_panel", p));
  (rack.cable_management ?? []).forEach((c) => add("cable_management", c));
  return taken;
}

// Aantal aaneengesloten vrije U's vanaf positie `u`, omhoog gerekend (U1 = onderaan).
export function maxFitAt(rack, u, exclude) {
  const taken = takenUnits(rack, exclude);
  let free = 0;
  for (let n = u; n <= rack.height_u && !taken.has(n); n += 1) free += 1;
  return free;
}

// Het volledige vrije blok rond U `u`, in beide richtingen: { lo, hi, size } of null
// als `u` zelf bezet is. Zo kan een device van 3U ook geplaatst worden als de
// aangeklikte U net onder een ander item zit.
export function freeBlockAt(rack, u, exclude) {
  const taken = takenUnits(rack, exclude);
  if (taken.has(u)) return null;
  let lo = u;
  while (lo > 1 && !taken.has(lo - 1)) lo -= 1;
  let hi = u;
  while (hi < rack.height_u && !taken.has(hi + 1)) hi += 1;
  return { lo, hi, size: hi - lo + 1 };
}

// Past een item van `units` U met onderste U `start` hier? (binnen de rack en zonder overlap)
export function canPlaceAt(rack, start, units, exclude) {
  if (start < 1 || start + units - 1 > rack.height_u) return false;
  const taken = takenUnits(rack, exclude);
  for (let n = start; n < start + units; n += 1) {
    if (taken.has(n)) return false;
  }
  return true;
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
