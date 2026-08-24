import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { empresas as empresasBase, competenciasDisponiveis } from "@/data/mock";
import type { Empresa } from "@/types/erp";

type Competencia = (typeof competenciasDisponiveis)[number];

interface ErpContextValue {
  empresa: Empresa;
  competencia: Competencia;
  empresas: Empresa[];
  competencias: Competencia[];
  setEmpresaId: (id: string) => void;
  setCompetenciaId: (id: string) => void;
  registrarEmpresa: (empresa: Omit<Empresa, "id" | "ativa">) => Empresa;
}

const ErpContext = createContext<ErpContextValue | null>(null);

const STORAGE_KEY = "erp-contexto";
const EMPRESAS_STORAGE_KEY = "erp-empresas-cadastradas-v1";

export function ErpProvider({ children }: { children: ReactNode }) {
  const [empresasAdicionais, setEmpresasAdicionais] = useState<Empresa[]>([]);
  const empresas = useMemo(() => [...empresasBase, ...empresasAdicionais], [empresasAdicionais]);
  const [empresaId, setEmpresaId] = useState(empresasBase[0]!.id);
  const [competenciaId, setCompetenciaId] = useState(competenciasDisponiveis[0]!.id);

  useEffect(() => {
    try {
      const empresasRaw = window.localStorage.getItem(EMPRESAS_STORAGE_KEY);
      const adicionais = empresasRaw ? JSON.parse(empresasRaw) as Empresa[] : [];
      if (adicionais.length) setEmpresasAdicionais(adicionais);
      const empresasDisponiveis = [...empresasBase, ...adicionais];
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { empresaId?: string; competenciaId?: string };
      if (saved.empresaId && empresasDisponiveis.some((e) => e.id === saved.empresaId))
        setEmpresaId(saved.empresaId);
      if (saved.competenciaId && competenciasDisponiveis.some((c) => c.id === saved.competenciaId))
        setCompetenciaId(saved.competenciaId);
    } catch {
      /* ignora */
    }
  }, []);

  function registrarEmpresa(dados: Omit<Empresa, "id" | "ativa">) {
    const cnpjNormalizado = dados.cnpj.replace(/\D/g, "");
    const existente = empresas.find((item) => item.cnpj.replace(/\D/g, "") === cnpjNormalizado);
    if (existente) return existente;
    const empresa: Empresa = { ...dados, id: `empresa-${cnpjNormalizado || Date.now()}`, ativa: true };
    const proximas = [...empresasAdicionais, empresa];
    setEmpresasAdicionais(proximas);
    window.localStorage.setItem(EMPRESAS_STORAGE_KEY, JSON.stringify(proximas));
    return empresa;
  }

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
      registrarEmpresa,
    }),
    [empresaId, competenciaId, empresas],
  );

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error("useErp precisa estar dentro de ErpProvider");
  return ctx;
}
