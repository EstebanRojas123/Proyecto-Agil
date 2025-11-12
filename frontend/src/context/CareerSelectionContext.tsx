"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { findMostRecentCareer } from "@/services/AvanceService";

interface Career {
  codigo: string;
  nombre: string;
  catalogo: string;
}

interface CareerSelectionContextType {
  selectedCareer: Career | null;
  handleCareerChange: (career: Career | null) => void;
}

const CareerSelectionContext = createContext<CareerSelectionContextType | undefined>(undefined);

const STORAGE_KEY = "selectedCareer";

export function CareerSelectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  // Cargar desde localStorage al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSelectedCareer(parsed);
        } catch (e) {
          console.error("Error parsing stored career:", e);
        }
      }
    }
  }, []);

  // Inicializar con la carrera más reciente si no hay selección guardada
  useEffect(() => {
    if (!user) return;
    
    // Verificar si la carrera seleccionada actual aún existe en las carreras del usuario
    if (selectedCareer) {
      const careerExists = user.carreras.some(
        c => c.codigo === selectedCareer.codigo && c.catalogo === selectedCareer.catalogo
      );
      if (careerExists) {
        return; // La carrera seleccionada aún es válida
      }
    }

    // Si no hay selección o la carrera seleccionada ya no existe, usar la más reciente
    const mostRecentCareer = findMostRecentCareer(user.carreras);
    if (mostRecentCareer) {
      setSelectedCareer(mostRecentCareer);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mostRecentCareer));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // selectedCareer se verifica dentro pero no se incluye en deps para evitar loops

  const handleCareerChange = (career: Career | null) => {
    setSelectedCareer(career);
    if (typeof window !== "undefined") {
      if (career) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(career));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  return (
    <CareerSelectionContext.Provider value={{ selectedCareer, handleCareerChange }}>
      {children}
    </CareerSelectionContext.Provider>
  );
}

export function useCareerSelection() {
  const context = useContext(CareerSelectionContext);
  if (context === undefined) {
    throw new Error("useCareerSelection must be used within a CareerSelectionProvider");
  }
  return context;
}

