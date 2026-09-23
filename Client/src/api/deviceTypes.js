import api from "./axios";

export const fetchDeviceTypes = async () => {
  const response = await api.get("/device-types");
  return response.data;
};

export const createDeviceType = async (name) => {
  const response = await api.post("/device-types", { name });
  return response.data;
};