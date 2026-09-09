import type { AchadoImportacao, LinhaPreviaImportacao } from "@/types/erp";

export const CONTA_TRANSITORIA = "4859";
export const TOLERANCIA_FECHAMENTO = 0.01;

export function parseValorBR(valor: string): number {
  return Number(valor.trim().replace(/\./g, "").replace(",", "."));
}

export function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

let seq = 0;
export function novaLinhaPrevia(dados: Omit<LinhaPreviaImportacao, "id" | "achados"> & { achados?: AchadoImportacao[] }): LinhaPreviaImportacao {
  seq += 1;
  return { id: `PREVIA-${Date.now()}-${seq}`, achados: [], ...dados };
}
