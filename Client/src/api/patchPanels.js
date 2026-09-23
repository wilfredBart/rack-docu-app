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
