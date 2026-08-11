import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  empresas as empresasIniciais,
  grupos as gruposIniciais,
  competenciasDisponiveis,
} from "@/data/mock";
import type { Empresa, GrupoEmpresa } from "@/types/erp";

type Competencia = (typeof competenciasDisponiveis)[number];
export type NovaEmpresa = Omit<Empresa, "id">;
export type NovoGrupo = Omit<GrupoEmpresa, "id" | "empresasIds">;

interface ErpContextValue {
  empresa: Empresa;
  competencia: Competencia;
  empresas: Empresa[];
  grupos: GrupoEmpresa[];
  competencias: Competencia[];
  setEmpresaId: (id: string) => void;
  setCompetenciaId: (id: string) => void;
  adicionarEmpresa: (dados: NovaEmpresa) => Empresa;
  atualizarEmpresa: (id: string, dados: NovaEmpresa) => void;
  adicionarGrupo: (dados: NovoGrupo) => GrupoEmpresa;
}

const ErpContext = createContext<ErpContextValue | null>(null);

const CONTEXTO_KEY = "erp-contexto";
const CADASTROS_KEY = "erp-cadastros-v1";

function novoId(prefixo: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefixo}-${crypto.randomUUID()}`;
  }
  return `${prefixo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ErpProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>(empresasIniciais);
  const [grupos, setGrupos] = useState<GrupoEmpresa[]>(gruposIniciais);
  const [empresaId, setEmpresaId] = useState(empresasIniciais[0]!.id);
  const [competenciaId, setCompetenciaId] = useState(competenciasDisponiveis[0]!.id);
  const [cadastrosCarregados, setCadastrosCarregados] = useState(false);

  useEffect(() => {
    try {
      const rawCadastros = window.localStorage.getItem(CADASTROS_KEY);
      if (rawCadastros) {
        const saved = JSON.parse(rawCadastros) as {
          empresas?: Empresa[];
          grupos?: GrupoEmpresa[];
        };
        if (saved.empresas?.length) setEmpresas(saved.empresas);
        if (saved.grupos) setGrupos(saved.grupos);
      }

      const rawContexto = window.localStorage.getItem(CONTEXTO_KEY);
      if (rawContexto) {
        const saved = JSON.parse(rawContexto) as {
          empresaId?: string;
          competenciaId?: string;
        };
        if (saved.empresaId) setEmpresaId(saved.empresaId);
        if (
          saved.competenciaId &&
          competenciasDisponiveis.some((c) => c.id === saved.competenciaId)
        ) {
          setCompetenciaId(saved.competenciaId);
        }
      }
    } catch {
      // Mantém os dados iniciais se o armazenamento do navegador estiver indisponível.
    } finally {
      setCadastrosCarregados(true);
    }
  }, []);

  useEffect(() => {
    if (!cadastrosCarregados) return;
    try {
      window.localStorage.setItem(CADASTROS_KEY, JSON.stringify({ empresas, grupos }));
    } catch {
      // A interface continua operando em memória.
    }
  }, [cadastrosCarregados, empresas, grupos]);

  useEffect(() => {
    if (!cadastrosCarregados) return;
    try {
      window.localStorage.setItem(CONTEXTO_KEY, JSON.stringify({ empresaId, competenciaId }));
    } catch {
      // A interface continua operando em memória.
    }
  }, [cadastrosCarregados, empresaId, competenciaId]);

  useEffect(() => {
    if (!empresas.some((e) => e.id === empresaId)) {
      setEmpresaId(empresas[0]?.id ?? "");
    }
  }, [empresaId, empresas]);

  const value = useMemo<ErpContextValue>(
    () => ({
      empresa: empresas.find((e) => e.id === empresaId) ?? empresas[0]!,
      competencia:
        competenciasDisponiveis.find((c) => c.id === competenciaId) ??
        competenciasDisponiveis[0]!,
      empresas,
      grupos,
      competencias: competenciasDisponiveis,
      setEmpresaId,
      setCompetenciaId,
      adicionarEmpresa: (dados) => {
        const empresa = { ...dados, id: novoId("empresa") };
        setEmpresas((atuais) => [...atuais, empresa]);
        return empresa;
      },
      atualizarEmpresa: (id, dados) => {
        setEmpresas((atuais) => atuais.map((empresa) => (empresa.id === id ? { ...dados, id } : empresa)));
      },
      adicionarGrupo: (dados) => {
        const grupo = { ...dados, id: novoId("grupo"), empresasIds: [] };
        setGrupos((atuais) => [...atuais, grupo]);
        return grupo;
      },
    }),
    [empresaId, competenciaId, empresas, grupos],
  );

  if (!value.empresa) return null;

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error("useErp precisa estar dentro de ErpProvider");
  return ctx;
}
