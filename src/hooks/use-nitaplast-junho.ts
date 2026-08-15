import { useEffect } from "react";
import { useErp } from "@/context/erp-context";

const EMPRESA_ID = "nitaplast-matriz";
const COMPETENCIA_ID = "2026-06";

export function useNitaplastJunho() {
  const contexto = useErp();

  useEffect(() => {
    if (contexto.empresa.id !== EMPRESA_ID) contexto.setEmpresaId(EMPRESA_ID);
    if (contexto.competencia.id !== COMPETENCIA_ID) contexto.setCompetenciaId(COMPETENCIA_ID);
  }, [
    contexto.competencia.id,
    contexto.empresa.id,
    contexto.setCompetenciaId,
    contexto.setEmpresaId,
  ]);

  return {
    ...contexto,
    contextoCorreto:
      contexto.empresa.id === EMPRESA_ID && contexto.competencia.id === COMPETENCIA_ID,
  };
}
