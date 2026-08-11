import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { empresas, competenciasDisponiveis } from "@/data/mock";
import type { Empresa } from "@/types/erp";

type Competencia = (typeof competenciasDisponiveis)[number];

interface ErpContextValue {
  empresa: Empresa;
  competencia: Competencia;
  empresas: Empresa[];
  competencias: Competencia[];
  setEmpresaId: (id: string) => void;
  setCompetenciaId: (id: string) => void;
}

const ErpContext = createContext<ErpContextValue | null>(null);

const STORAGE_KEY = "erp-contexto";

export function ErpProvider({ children }: { children: ReactNode }) {
  const [empresaId, setEmpresaId] = useState(empresas[0]!.id);
  const [competenciaId, setCompetenciaId] = useState(competenciasDisponiveis[0]!.id);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { empresaId?: string; competenciaId?: string };
      if (saved.empresaId && empresas.some((e) => e.id === saved.empresaId))
        setEmpresaId(saved.empresaId);
      if (saved.competenciaId && competenciasDisponiveis.some((c) => c.id === saved.competenciaId))
        setCompetenciaId(saved.competenciaId);
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ empresaId, competenciaId }));
    } catch {
      /* ignora */
    }
  }, [empresaId, competenciaId]);

  const value = useMemo<ErpContextValue>(
    () => ({
      empresa: empresas.find((e) => e.id === empresaId) ?? empresas[0]!,
      competencia:
        competenciasDisponiveis.find((c) => c.id === competenciaId) ?? competenciasDisponiveis[0]!,
      empresas,
      competencias: competenciasDisponiveis,
      setEmpresaId,
      setCompetenciaId,
    }),
    [empresaId, competenciaId],
  );

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error("useErp precisa estar dentro de ErpProvider");
  return ctx;
}
