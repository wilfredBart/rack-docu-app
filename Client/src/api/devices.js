import api from "./axios";

export const fetchDevices = async (rackId) => {
  const response = await api.get("/devices", {
    params: rackId ? { rack_id: rackId } : undefined,
  });
  return response.data;
};

export const fetchDeviceById = (id) =>
  api.get(`/devices/${id}`).then((res) => res.data);

export const fetchDeviceWithPorts = (id) =>
  api.get(`/devices/${id}/ports`).then((res) => res.data);

// Poorten + connection + VLAN van één device (engineer patchplan).
export const fetchDevicePatchPlan = (id) =>
  api.get(`/devices/${id}/patchplan`).then((res) => res.data);

export const createDevice = async (data) => {
  const response = await api.post("/devices", data);
  return response.data;
};

export const updateDevice = async ({ id, ...data }) => {
  const response = await api.put(`/devices/${id}`, data);
  return response.data;
};

export const deleteDevice = async (id) => {
  const response = await api.delete(`/devices/${id}`);
  return response.data;
};

// Verplaatst enkel de positie (drag & drop in de rack-view).
export const moveDevice = async ({ id, rack_position }) => {
  const response = await api.patch(`/devices/${id}/position`, { rack_position });
  return response.data;
};
