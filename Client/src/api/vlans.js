import api from "./axios";

export const fetchVlans = (customerId) =>
  api
    .get("/vlans", { params: { customer_id: customerId } })
    .then((res) => res.data);

export const createVlan = async (data) => {
  const response = await api.post("/vlans", data);
  return response.data;
};

export const updateVlan = async ({ id, ...data }) => {
  const response = await api.put(`/vlans/${id}`, data);
  return response.data;
};

export const deleteVlan = async (id) => {
  const response = await api.delete(`/vlans/${id}`);
  return response.data;
};
