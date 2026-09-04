import api from "./axios";

export const fetchLocations = async (siteId) => {
  const response = await api.get("/locations", {
    params: siteId ? { site_id: siteId } : undefined,
  });
  return response.data;
};

export const fetchLocationById = (id) =>
  api.get(`/locations/${id}`).then((res) => res.data);

export const fetchLocationWithRacks = (id) =>
  api.get(`/locations/${id}/racks`).then((res) => res.data);

export const createLocation = async (data) => {
  const response = await api.post("/locations", data);
  return response.data;
};

export const updateLocation = async ({ id, ...data }) => {
  const response = await api.put(`/locations/${id}`, data);
  return response.data;
};

export const deleteLocation = async (id) => {
  const response = await api.delete(`/locations/${id}`);
  return response.data;
};
