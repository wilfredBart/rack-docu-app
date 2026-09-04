import api from "./axios";

export const fetchSites = async (customerId) => {
  const response = await api.get("/sites", {
    params: customerId ? { customer_id: customerId } : undefined,
  });
  return response.data;
};

export const fetchSiteById = (id) =>
  api.get(`/sites/${id}`).then((res) => res.data);

export const fetchSiteWithLocations = (id) =>
  api.get(`/sites/${id}/locations`).then((res) => res.data);

export const createSite = async (data) => {
  const response = await api.post("/sites", data);
  return response.data;
};

export const updateSite = async ({ id, ...data }) => {
  const response = await api.put(`/sites/${id}`, data);
  return response.data;
};

export const deleteSite = async (id) => {
  const response = await api.delete(`/sites/${id}`);
  return response.data;
};
