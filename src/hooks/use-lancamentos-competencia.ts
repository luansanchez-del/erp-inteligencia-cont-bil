import { useEffect, useMemo, useState } from "react";
import { lancamentosIntegradosAgosto } from "@/data/nitaplast-razao-agosto";
import { temBaseContabilCarregada } from "@/lib/bases-contabeis";

const STORAGE_KEY = "erp-lancamentos-competencia-v1";

export type OrigemLancamentoCompetencia = "manual" | "importado";

export type LancamentoCompetencia = {
  id: string;
  empresaId: string;
  competenciaId: string;
  data: string;
  debitoCodigo: string;
  creditoCodigo: string;
  historico: string;
  documento: string;
  cc: string;
  centroCusto: string;
  valor: number;
  criadoEm: string;
  origem: OrigemLancamentoCompetencia;
  /** Quando origem = "importado": id do item em `ItemDossieImportacao` que gerou este lançamento. */
  origemDossieId?: string | undefined;
  estornadoDeId?: string | undefined;
  status?: "validado" | "revisar" | undefined;
  observacao?: string | undefined;
  fonte?: string | undefined;
};

export type DadosLancamentoCompetencia = Omit<LancamentoCompetencia, "id" | "empresaId" | "competenciaId" | "criadoEm" | "origem" | "origemDossieId">;

function carregarTodos(): LancamentoCompetencia[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LancamentoCompetencia[];
  } catch {
    return [];
  }
}

/**
 * Ledger genérico para qualquer competência sem motor contábil dedicado (ver
 * `@/lib/competencia`). Cada competência começa vazia — nada é herdado ou
 * presumido de outro mês. Isolado por empresa + competência.
 */
export function useLancamentosCompetencia(empresaId: string, competenciaId: string) {
  const [todos, setTodos] = useState<LancamentoCompetencia[]>([]);

  useEffect(() => {
    setTodos(carregarTodos());
  }, []);

  function persistir(proximos: LancamentoCompetencia[]) {
    setTodos(proximos);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proximos));
    } catch {
      /* ignora */
    }
  }

  const lancamentosBase = useMemo<LancamentoCompetencia[]>(() => {
    if (!temBaseContabilCarregada(empresaId, competenciaId)) return [];
    return lancamentosIntegradosAgosto.map((linha) => ({
      id: linha.id,
      empresaId,
      competenciaId,
      data: linha.data.split("/").reverse().join("-"),
      debitoCodigo: linha.debitoCodigo,
      creditoCodigo: linha.creditoCodigo,
      historico: linha.historico,
      documento: linha.documento,
      cc: linha.cc,
      centroCusto: linha.centroCusto,
      valor: linha.valor,
      criadoEm: "2026-08-31T23:59:59.000Z",
      origem: "importado",
      status: linha.status,
      observacao: linha.observacao,
      fonte: linha.fonte,
    }));
  }, [competenciaId, empresaId]);

  const lancamentos = useMemo(
    () => [
      ...lancamentosBase,
      ...todos.filter((item) => item.empresaId === empresaId && item.competenciaId === competenciaId),
    ],
    [todos, empresaId, competenciaId, lancamentosBase],
  );

  function registrar(dados: DadosLancamentoCompetencia, origem: OrigemLancamentoCompetencia = "manual", origemDossieId?: string): LancamentoCompetencia {
    const registro: LancamentoCompetencia = {
      ...dados,
      id: `${origem === "importado" ? "IMP" : "MAN"}-${competenciaId}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      empresaId,
      competenciaId,
      criadoEm: new Date().toISOString(),
      origem,
      origemDossieId,
    };
    persistir([...todos, registro]);
    return registro;
  }

  function remover(id: string) {
    const original = lancamentos.find((item) => item.id === id);
    if (!original) return;
    const estorno: LancamentoCompetencia = {
      ...original,
      id: `EST-${competenciaId}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      empresaId,
      competenciaId,
      debitoCodigo: original.creditoCodigo,
      creditoCodigo: original.debitoCodigo,
      historico: `Estorno de ${original.id} — ${original.historico}`,
      documento: original.documento || original.id,
      criadoEm: new Date().toISOString(),
      origem: "manual",
      origemDossieId: original.origemDossieId,
      estornadoDeId: original.id,
      status: "validado",
      observacao: `Exclusão contábil por estorno. O lançamento original ${original.id} permanece preservado.`,
      fonte: `Ação manual; origem preservada: ${original.fonte ?? original.origemDossieId ?? original.id}`,
    };
    persistir([...todos, estorno]);
  }

  return { lancamentos, registrar, remover };
}
