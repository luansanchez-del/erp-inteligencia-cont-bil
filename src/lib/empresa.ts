import type { Empresa } from "@/types/erp";

const regimeLabel: Record<string, string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
  imune: "Imune / Isenta",
};

/** Nunca presume regime: sem confirmação cadastral, exibe "A confirmar". */
export function regimeTexto(e: Empresa) {
  if (!e.regime || e.regimeConfirmado === false) return "A confirmar";
  return regimeLabel[e.regime] ?? "A confirmar";
}

export function tipoLabel(e: Empresa) {
  return e.tipo === "matriz" ? "Matriz" : "Filial";
}
