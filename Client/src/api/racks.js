import api from "./axios";

export const fetchRacks = async (locationId) => {
  const response = await api.get("/racks", {
    params: locationId ? { location_id: locationId } : undefined,
  });
  return response.data;
};

export const fetchRackById = (id) =>
  api.get(`/racks/${id}`).then((res) => res.data);

export const fetchRackWithContents = (id) =>
  api.get(`/racks/${id}/contents`).then((res) => res.data);

export const createRack = async (data) => {
  const response = await api.post("/racks", data);
  return response.data;
};

export const updateRack = async ({ id, ...data }) => {
  const response = await api.put(`/racks/${id}`, data);
  return response.data;
};

export const deleteRack = async (id) => {
  const response = await api.delete(`/racks/${id}`);
  return response.data;
};
