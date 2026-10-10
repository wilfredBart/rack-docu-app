import api from "./axios";

export const fetchPatchPanels = async (rackId) => {
  const response = await api.get("/patch-panels", {
    params: rackId ? { rack_id: rackId } : undefined,
  });
  return response.data;
};

export const fetchPatchPanelById = (id) =>
  api.get(`/patch-panels/${id}`).then((res) => res.data);

export const fetchPatchPanelWithPorts = (id) =>
  api.get(`/patch-panels/${id}/ports`).then((res) => res.data);

export const createPatchPanel = async (data) => {
  const response = await api.post("/patch-panels", data);
  return response.data;
};

export const updatePatchPanel = async ({ id, ...data }) => {
  const response = await api.put(`/patch-panels/${id}`, data);
  return response.data;
};

export const deletePatchPanel = async (id) => {
  const response = await api.delete(`/patch-panels/${id}`);
  return response.data;
};

// Patch panels van één site (voor de keuzelijst op de patchplan-pagina).
export const fetchPatchPanelsBySite = (siteId) =>
  api
    .get("/patch-panels", { params: { site_id: siteId } })
    .then((res) => res.data);

// Poorten + connection + VLAN (afgeleid van de andere kant) in één call.
export const fetchPatchPlan = (id) =>
  api.get(`/patch-panels/${id}/patchplan`).then((res) => res.data);

// Verplaatst een patch panel naar een andere U-positie in dezelfde rack.
// Gebruikt het bestaande PUT /patch-panels/:id: de server controleert zelf of het slot vrij is
// (assertValidRackSlot), dus er is geen apart endpoint nodig.
// Accepteert movePatchPanel({ id, rack_position, rack_units? }) én movePatchPanel(id, rack_position).
export const movePatchPanel = async (arg, positionArg) => {
  const input =
    typeof arg === "object" && arg !== null
      ? arg
      : { id: arg, rack_position: positionArg };
  const id = input.id;
  const current = await fetchPatchPanelById(id);

  const position =
    input.rack_position ?? input.rackPosition ?? input.position ?? current.rack_position;
  const units = input.rack_units ?? input.rackUnits ?? current.rack_units;

  const response = await api.put(`/patch-panels/${id}`, {
    label: current.label,
    type: current.type,
    manufacturer: current.manufacturer,
    model: current.model,
    port_count: current.port_count,
    notes: current.notes,
    rack_position: Number(position),
    rack_units: Number(units),
  });
  return response.data;
};