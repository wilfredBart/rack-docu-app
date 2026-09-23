import api from "./axios";

export const fetchPortsByDevice = (deviceId) =>
  api
    .get("/ports", { params: { device_id: deviceId } })
    .then((res) => res.data);

export const fetchPortsByPatchPanel = (patchPanelId) =>
  api
    .get("/ports", { params: { patch_panel_id: patchPanelId } })
    .then((res) => res.data);

export const createPort = async (data) => {
  const response = await api.post("/ports", data);
  return response.data;
};

export const bulkCreatePorts = async (data) => {
  const response = await api.post("/ports/bulk", data);
  return response.data;
};

export const updatePort = async ({ id, ...data }) => {
  const response = await api.put(`/ports/${id}`, data);
  return response.data;
};

export const deletePort = async (id) => {
  const response = await api.delete(`/ports/${id}`);
  return response.data;
};
