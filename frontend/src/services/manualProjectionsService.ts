import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Este shape es el que espera tu backend (según el ejemplo que mandaste)
export interface ManualProjectionPayload {
  estudiante: string; // rut
  proyeccionActivaId: string;
  semestresProyectados: {
    id: string;
    periodo: string;
    cursos: {
      codigo: string;
      asignatura: string;
      creditos: number;
      nivel: number;
      prereq: string;
    }[];
  }[];
}

// POST /manual-projections
export const saveManualProjection = async (
  payload: ManualProjectionPayload
) => {
  const { data } = await api.post("/manual-projections", payload);
  return data;
};

// GET /manual-projections/user/:rut
export const getUserManualProjections = async (rut: string) => {
  const { data } = await api.get(`/manual-projections/user/${rut}`);
  return data;
};

// GET /manual-projections/:id
export const getManualProjectionById = async (id: string) => {
  const { data } = await api.get(`/manual-projections/${id}`);
  return data;
};

// DELETE /manual-projections/:id
export const deleteManualProjectionById = async (id: string) => {
  const { data } = await api.delete(`/manual-projections/${id}`);
  return data;
};
