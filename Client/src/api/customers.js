import api from "./axios"; // Pas aan naar jouw axios-bestand indien nodig (bijv. import axios from "axios")

// GET alle klanten
export const fetchCustomers = async () => {
  const response = await api.get("/customers");
  return response.data;
};

// POST nieuwe klant
export const createCustomer = async (data) => {
  const response = await api.post("/customers", data);
  return response.data;
};

// PUT klant bijwerken
export const updateCustomer = async ({ id, ...data }) => {
  const response = await api.put(`/customers/${id}`, data);
  return response.data;
};

// DELETE klant verwijderen
export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

// GET klant met ID
export const fetchCustomerById = (id) =>
  api.get(`/customers/${id}`).then((res) => res.data);