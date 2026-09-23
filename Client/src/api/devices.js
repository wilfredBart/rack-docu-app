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