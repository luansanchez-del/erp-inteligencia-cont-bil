import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { empresas as empresasBase, competenciasDisponiveis } from "@/data/mock";
import type { Empresa, StatusCompetencia } from "@/types/erp";

export type Competencia = { id: string; label: string; status: StatusCompetencia };

interface ErpContextValue {
  empresa: Empresa;
  competencia: Competencia;
  empresas: Empresa[];
  competencias: Competencia[];
  setEmpresaId: (id: string) => void;
  setCompetenciaId: (id: string) => void;
  registrarEmpresa: (empresa: Omit<Empresa, "id" | "ativa">) => Empresa;
  registrarCompetencia: (label: string) => Competencia;
  fecharCompetencia: (id: string) => void;
}

const ErpContext = createContext<ErpContextValue | null>(null);

const STORAGE_KEY = "erp-contexto";
const EMPRESAS_STORAGE_KEY = "erp-empresas-cadastradas-v1";
const COMPETENCIAS_STORAGE_KEY = "erp-competencias-cadastradas-v1";
const COMPETENCIAS_STATUS_STORAGE_KEY = "erp-competencias-status-v1";

function competenciaIdDoLabel(label: string) {
  const partes = label.trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!partes) throw new Error('Informe a competência no formato MM/AAAA, por exemplo "09/2026".');
  const mes = Number(partes[1]);
  const ano = Number(partes[2]);
  if (mes < 1 || mes > 12) throw new Error("Mês inválido — use de 01 a 12.");
  return { id: `${ano}-${String(mes).padStart(2, "0")}`, labelNormalizado: `${String(mes).padStart(2, "0")}/${ano}` };
}

export function ErpProvider({ children }: { children: ReactNode }) {
  const [empresasAdicionais, setEmpresasAdicionais] = useState<Empresa[]>([]);
  const empresas = useMemo(() => [...empresasBase, ...empresasAdicionais], [empresasAdicionais]);
  const [empresaId, setEmpresaId] = useState(empresasBase[0]!.id);
  const [competenciaId, setCompetenciaId] = useState(
    (competenciasDisponiveis.find((c) => c.id === "2026-07") ?? competenciasDisponiveis[0]!).id,
  );
  const [competenciasAdicionais, setCompetenciasAdicionais] = useState<Competencia[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StatusCompetencia>>({});

  const competencias = useMemo(() => {
    const base: Competencia[] = [...competenciasDisponiveis, ...competenciasAdicionais];
    const combinadas = base.map((c) => (statusOverrides[c.id] ? { ...c, status: statusOverrides[c.id]! } : c));
    return combinadas.sort((a, b) => b.id.localeCompare(a.id));
  }, [competenciasAdicionais, statusOverrides]);

  useEffect(() => {
    try {
      const empresasRaw = window.localStorage.getItem(EMPRESAS_STORAGE_KEY);
      const adicionais = empresasRaw ? JSON.parse(empresasRaw) as Empresa[] : [];
      if (adicionais.length) setEmpresasAdicionais(adicionais);

      const competenciasRaw = window.localStorage.getItem(COMPETENCIAS_STORAGE_KEY);
      const competenciasSalvas = competenciasRaw ? JSON.parse(competenciasRaw) as Competencia[] : [];
      if (competenciasSalvas.length) setCompetenciasAdicionais(competenciasSalvas);

      const statusRaw = window.localStorage.getItem(COMPETENCIAS_STATUS_STORAGE_KEY);
      const statusSalvos = statusRaw ? JSON.parse(statusRaw) as Record<string, StatusCompetencia> : {};
      if (Object.keys(statusSalvos).length) setStatusOverrides(statusSalvos);

      const empresasDisponiveis = [...empresasBase, ...adicionais];
      const competenciasDisponiveisTotais = [...competenciasDisponiveis, ...competenciasSalvas];
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { empresaId?: string; competenciaId?: string };
      if (saved.empresaId && empresasDisponiveis.some((e) => e.id === saved.empresaId))
        setEmpresaId(saved.empresaId);
      if (saved.competenciaId && competenciasDisponiveisTotais.some((c) => c.id === saved.competenciaId))
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

  function registrarCompetencia(label: string) {
    const { id, labelNormalizado } = competenciaIdDoLabel(label);
    if (competencias.some((c) => c.id === id)) {
      throw new Error(`A competência ${labelNormalizado} já está cadastrada.`);
    }
    const nova: Competencia = { id, label: labelNormalizado, status: "aberta" };
    const proximas = [...competenciasAdicionais, nova];
    setCompetenciasAdicionais(proximas);
    window.localStorage.setItem(COMPETENCIAS_STORAGE_KEY, JSON.stringify(proximas));
    setCompetenciaId(id);
    return nova;
  }

  function fecharCompetencia(id: string) {
    const proximos = { ...statusOverrides, [id]: "fechada" as StatusCompetencia };
    setStatusOverrides(proximos);
    window.localStorage.setItem(COMPETENCIAS_STATUS_STORAGE_KEY, JSON.stringify(proximos));
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
      competencia: competencias.find((c) => c.id === competenciaId) ?? competencias[0]!,
      empresas,
      competencias,
      setEmpresaId,
      setCompetenciaId,
      registrarEmpresa,
      registrarCompetencia,
      fecharCompetencia,
    }),
    [empresaId, competenciaId, empresas, competencias],
  );

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error("useErp precisa estar dentro de ErpProvider");
  return ctx;
}
