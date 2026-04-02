import client from "./client";
import type { NfeSample } from "../types";

export const listNfeSamples = async (params?: Record<string, string>): Promise<NfeSample[]> => {
  const { data } = await client.get<NfeSample[]>("/nfe-samples/", { params });
  return data;
};

export const createNfeSample = async (nfe: Partial<NfeSample>): Promise<NfeSample> => {
  const { data } = await client.post<NfeSample>("/nfe-samples/", nfe);
  return data;
};

export const updateNfeSample = async (id: string, nfe: Partial<NfeSample>): Promise<NfeSample> => {
  const { data } = await client.put<NfeSample>(`/nfe-samples/${id}/`, nfe);
  return data;
};

export const deleteNfeSample = async (id: string): Promise<void> => {
  await client.delete(`/nfe-samples/${id}/`);
};
