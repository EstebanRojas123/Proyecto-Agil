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

  useEffect(() => {
    if (!user) return;
    
    if (selectedCareer) {
      const careerExists = user.carreras.some(
        c => c.codigo === selectedCareer.codigo && c.catalogo === selectedCareer.catalogo
      );
      if (careerExists) {
        return;
      }
    }

    const mostRecentCareer = findMostRecentCareer(user.carreras);
    if (mostRecentCareer) {
      setSelectedCareer(mostRecentCareer);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mostRecentCareer));
      }
    }
  }, [user]);

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

