import api from "./axios";

export const fetchConnections = (params) =>
  api.get("/connections", { params }).then((res) => res.data);

export const fetchConnection = (id) =>
  api.get(`/connections/${id}`).then((res) => res.data);

export const createConnection = async (data) => {
  const response = await api.post("/connections", data);
  return response.data;
};

export const updateConnection = async ({ id, ...data }) => {
  const response = await api.put(`/connections/${id}`, data);
  return response.data;
};

export const deleteConnection = async (id) => {
  const response = await api.delete(`/connections/${id}`);
  return response.data;
};
