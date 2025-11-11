import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { findMostRecentCareer } from "@/services/AvanceService";

export function useCareerSelection() {
  const { user } = useAuth();
  const [selectedCareer, setSelectedCareer] = useState<{ codigo: string; nombre: string; catalogo: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Inicializar con la carrera más reciente
    const mostRecentCareer = findMostRecentCareer(user.carreras);
    if (mostRecentCareer) {
      setSelectedCareer(mostRecentCareer);
    }
  }, [user]);

  const handleCareerChange = (career: { codigo: string; nombre: string; catalogo: string } | null) => {
    setSelectedCareer(career);
  };

  return {
    selectedCareer,
    handleCareerChange,
  };
}

