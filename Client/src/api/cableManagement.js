import api from "./axios";

export const fetchCableManagementItems = async (rackId) => {
  const response = await api.get("/cable-management", {
    params: rackId ? { rack_id: rackId } : undefined,
  });
  return response.data;
};

export const fetchCableManagementItemById = (id) =>
  api.get(`/cable-management/${id}`).then((res) => res.data);

export const createCableManagementItem = async (data) => {
  const response = await api.post("/cable-management", data);
  return response.data;
};

export const updateCableManagementItem = async ({ id, ...data }) => {
  const response = await api.put(`/cable-management/${id}`, data);
  return response.data;
};

export const deleteCableManagementItem = async (id) => {
  const response = await api.delete(`/cable-management/${id}`);
  return response.data;
};
