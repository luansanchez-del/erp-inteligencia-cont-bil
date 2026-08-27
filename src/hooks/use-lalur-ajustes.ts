import { useCallback, useEffect, useMemo, useState } from "react";

export type ImpostoLalur = "irpj" | "csll" | "ambos";
export type TipoAjusteLalur = "adicao" | "exclusao";

export type AjusteLalur = {
  id: string;
  competencia: string;
  tipo: TipoAjusteLalur;
  imposto: ImpostoLalur;
  descricao: string;
  valor: number;
  criadoEm: string;
};

const STORAGE_KEY = "erp-lalur-ajustes-v1";
const EVENTO = "erp-lalur-ajustes-atualizados";

function carregarTodos(): AjusteLalur[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistir(itens: AjusteLalur[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  window.dispatchEvent(new Event(EVENTO));
}

function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useLalurAjustes(competencia: string) {
  const [todos, setTodos] = useState<AjusteLalur[]>(() => carregarTodos());

  useEffect(() => {
    const atualizar = () => setTodos(carregarTodos());
    window.addEventListener("storage", atualizar);
    window.addEventListener(EVENTO, atualizar);
    return () => {
      window.removeEventListener("storage", atualizar);
      window.removeEventListener(EVENTO, atualizar);
    };
  }, []);

  const ajustes = useMemo(
    () => todos.filter((item) => item.competencia === competencia),
    [competencia, todos],
  );

  const adicionar = useCallback(
    (entrada: { tipo: TipoAjusteLalur; imposto: ImpostoLalur; descricao: string; valor: number }) => {
      if (!entrada.descricao.trim()) throw new Error("Informe a descrição do ajuste.");
      if (!Number.isFinite(entrada.valor) || entrada.valor <= 0) throw new Error("O valor precisa ser maior que zero.");
      const novo: AjusteLalur = {
        id: novoId(),
        competencia,
        tipo: entrada.tipo,
        imposto: entrada.imposto,
        descricao: entrada.descricao.trim(),
        valor: Math.round(entrada.valor * 100) / 100,
        criadoEm: new Date().toISOString(),
      };
      const proxima = [...carregarTodos(), novo];
      persistir(proxima);
      setTodos(proxima);
      return novo;
    },
    [competencia],
  );

  const remover = useCallback((id: string) => {
    const proxima = carregarTodos().filter((item) => item.id !== id);
    persistir(proxima);
    setTodos(proxima);
  }, []);

  const totais = useMemo(() => {
    let adicoesIrpj = 0;
    let exclusoesIrpj = 0;
    let adicoesCsll = 0;
    let exclusoesCsll = 0;
    for (const ajuste of ajustes) {
      const aplicaIrpj = ajuste.imposto === "irpj" || ajuste.imposto === "ambos";
      const aplicaCsll = ajuste.imposto === "csll" || ajuste.imposto === "ambos";
      if (ajuste.tipo === "adicao") {
        if (aplicaIrpj) adicoesIrpj += ajuste.valor;
        if (aplicaCsll) adicoesCsll += ajuste.valor;
      } else {
        if (aplicaIrpj) exclusoesIrpj += ajuste.valor;
        if (aplicaCsll) exclusoesCsll += ajuste.valor;
      }
    }
    return {
      adicoesIrpj: Math.round(adicoesIrpj * 100) / 100,
      exclusoesIrpj: Math.round(exclusoesIrpj * 100) / 100,
      adicoesCsll: Math.round(adicoesCsll * 100) / 100,
      exclusoesCsll: Math.round(exclusoesCsll * 100) / 100,
    };
  }, [ajustes]);

  return { ajustes, adicionar, remover, totais };
}
