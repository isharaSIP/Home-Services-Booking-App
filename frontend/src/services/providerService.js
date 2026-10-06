import api from "./api";
export async function getProviders(signal) {
  const {
    data
  } = await api.get("/providers", {
    signal
  });
  if (!Array.isArray(data.providers)) throw new Error("Invalid provider response");
  return data.providers;
}
export async function getProvider(id, signal) {
  const {
    data
  } = await api.get(`/providers/${encodeURIComponent(id)}`, {
    signal
  });
  if (!data.provider) throw new Error("Invalid provider profile");
  return data.provider;
}
