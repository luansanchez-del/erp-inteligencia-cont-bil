import { useEffect, useMemo, useState } from "react";

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

  const lancamentos = useMemo(
    () => todos.filter((item) => item.empresaId === empresaId && item.competenciaId === competenciaId),
    [todos, empresaId, competenciaId],
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
    persistir(todos.filter((item) => item.id !== id));
  }

  return { lancamentos, registrar, remover };
}
