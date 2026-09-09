import type { ResultadoLeituraDocumento } from "@/types/erp";

const STORAGE_KEY = "erp-previas-importacao-v1";

export interface PreviaArmazenada {
  itemDossieId: string;
  resultado: ResultadoLeituraDocumento;
  geradoEm: string;
}

function carregarTodas(): PreviaArmazenada[] {
  if (typeof window === "undefined") return [];
  try {
    const valor = window.localStorage.getItem(STORAGE_KEY);
    return valor ? (JSON.parse(valor) as PreviaArmazenada[]) : [];
  } catch {
    return [];
  }
}

function salvarTodas(previas: PreviaArmazenada[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(previas));
}

export function carregarPreviaImportacao(itemDossieId: string): PreviaArmazenada | undefined {
  return carregarTodas().find((p) => p.itemDossieId === itemDossieId);
}

export function salvarPreviaImportacao(itemDossieId: string, resultado: ResultadoLeituraDocumento) {
  const proximas = carregarTodas().filter((p) => p.itemDossieId !== itemDossieId);
  proximas.push({ itemDossieId, resultado, geradoEm: new Date().toISOString() });
  salvarTodas(proximas);
}

export function removerPreviaImportacao(itemDossieId: string) {
  salvarTodas(carregarTodas().filter((p) => p.itemDossieId !== itemDossieId));
}
