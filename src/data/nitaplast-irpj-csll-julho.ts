import {
  calcularIrpjCsllBalancoSuspensaoReducao,
  type ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado,
} from "@/lib/apuracao-irpj-csll";
import type { calcularDreJulhoFinal } from "./nitaplast-dre-julho-final";

type DreJulhoFinal = ReturnType<typeof calcularDreJulhoFinal>["dre"];

export const contaIrrfAplicacoesFinanceirasNitaplast = "25118";

// Base acumulada Jan-Jun/2026, conforme planilha "CÁLCULO IRPJ E CSLL — LUCRO REAL POR
// ESTIMATIVA MENSAL — Competência JUNHO/2026" enviada pelo contador em 27/08/2026.
// Fonte externa (planilha do escritório) — não recalculada aqui, só transcrita.
const lucroContabilAcumuladoJaneiroAJunho = 707_721.59;
const adicoesAcumuladasJaneiroAJunho = 13_072.59;
const exclusoesAcumuladasJaneiroAJunho = 23_650.14;
// "Pagamentos de estimativa efetuados até maio/2026" (110.973,72 / 50.778,95) + o DARF de
// junho apurado pela própria planilha (IRPJ 30.564,35 / CSLL 11.964,01) = pago até junho.
const pagamentosEstimativaIrpjAteJunho = 110_973.72 + 30_564.35;
const pagamentosEstimativaCsllAteJunho = 50_778.95 + 11_964.01;
const irrfAplicacoesFinanceirasAcumuladoJaneiroAJunho = 20_747.94;
const mesesAcumuladosJaneiroAJunho = 6;

export type ApuracaoIrpjCsllJulho = ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado & {
  lucroContabilAcumuladoJaneiroAJulho: number;
  lucroContabilDoMes: number;
};

export type AjustesLalurJulho = {
  adicoesIrpj: number;
  exclusoesIrpj: number;
  adicoesCsll: number;
  exclusoesCsll: number;
};

// Nitaplast apura pelo Balanço de Suspensão/Redução (art. 35 da Lei 8.981/1995): o mesmo
// método usado em janeiro-junho/2026, confirmado pelo contador em 27/08/2026 (planilha de
// junho acumula desde janeiro e abate os DARFs de estimativa já pagos nos meses anteriores).
// A parte de julho (lucro contábil do mês e ajustes do LALUR) é dinâmica; o acumulado
// Jan-Jun acima é a base fixa transcrita da planilha do escritório.
export function calcularApuracaoIrpjCsllJulho(
  dre: DreJulhoFinal,
  irrfAplicacoesFinanceirasJulho: number,
  ajustesLalurJulho?: AjustesLalurJulho,
): ApuracaoIrpjCsllJulho {
  const lucroContabilAcumuladoJaneiroAJulho = lucroContabilAcumuladoJaneiroAJunho + dre.resultado;

  const resultado = calcularIrpjCsllBalancoSuspensaoReducao({
    lucroContabilAcumulado: lucroContabilAcumuladoJaneiroAJulho,
    mesesAcumulados: mesesAcumuladosJaneiroAJunho + 1,
    adicoesAcumuladasIrpj: adicoesAcumuladasJaneiroAJunho + (ajustesLalurJulho?.adicoesIrpj ?? 0),
    exclusoesAcumuladasIrpj: exclusoesAcumuladasJaneiroAJunho + (ajustesLalurJulho?.exclusoesIrpj ?? 0),
    adicoesAcumuladasCsll: adicoesAcumuladasJaneiroAJunho + (ajustesLalurJulho?.adicoesCsll ?? 0),
    exclusoesAcumuladasCsll: exclusoesAcumuladasJaneiroAJunho + (ajustesLalurJulho?.exclusoesCsll ?? 0),
    pagamentosEstimativaIrpjAnteriores: pagamentosEstimativaIrpjAteJunho,
    pagamentosEstimativaCsllAnteriores: pagamentosEstimativaCsllAteJunho,
    irrfAcumuladoCompensavel: irrfAplicacoesFinanceirasAcumuladoJaneiroAJunho + irrfAplicacoesFinanceirasJulho,
  });

  return {
    ...resultado,
    lucroContabilAcumuladoJaneiroAJulho,
    lucroContabilDoMes: dre.resultado,
  };
}
