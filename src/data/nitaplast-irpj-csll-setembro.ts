import {
  calcularIrpjCsllBalancoSuspensaoReducao,
  type ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado,
} from "@/lib/apuracao-irpj-csll";
import { adicoesExclusoesAcumuladasJaneiroAJunho, type AjustesLalurJulho } from "./nitaplast-irpj-csll-julho";
import { lalurAgostoFechado, type ApuracaoIrpjCsllAgosto } from "./nitaplast-irpj-csll-agosto";

export type AjustesLalurSetembro = AjustesLalurJulho;

/**
 * DARF de estimativa de 08/2026 pago em 30/09/2026 pelo Itaú (SET-ITAU-EXT-822/823:
 * I00010 CSLL 10.020,45 e I00011 IRPJ 25.546,56) — mesmo valor do LALUR de agosto fechado.
 */
const darfPagoAgosto = { irpj: lalurAgostoFechado.irpj, csll: lalurAgostoFechado.csll };

export type ApuracaoIrpjCsllSetembro = ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado & {
  lucroContabilAcumuladoJaneiroASetembro: number;
  lucroContabilDoMes: number;
  darfIrpjAgosto: number;
  darfCsllAgosto: number;
  irrfAplicacoesFinanceirasSetembro: number;
};

/**
 * Balanço de Suspensão/Redução de 09/2026, encadeado na apuração de agosto:
 *   - lucro contábil acumulado = acumulado Jan-Ago + resultado da DRE de setembro;
 *   - adições/exclusões acumuladas = Jan-Jun + ajustes dos LALUR de julho, agosto e setembro;
 *   - pagamentos anteriores = pagos até agosto + DARF de agosto pago em 30/09;
 *   - IRRF compensável = acumulado Jan-Ago + IRRF retido em setembro (débitos da 25118,
 *     sem o IR provisionado da Greencred, que não foi retido).
 */
export function calcularApuracaoIrpjCsllSetembro(
  apuracaoAgosto: ApuracaoIrpjCsllAgosto,
  ajustesLalurJulho: AjustesLalurJulho,
  ajustesLalurAgosto: AjustesLalurJulho,
  resultadoSetembro: number,
  irrfAplicacoesFinanceirasSetembro: number,
  ajustesLalurSetembro?: AjustesLalurSetembro,
): ApuracaoIrpjCsllSetembro {
  const { adicoes, exclusoes } = adicoesExclusoesAcumuladasJaneiroAJunho;
  const lucroContabilAcumuladoJaneiroASetembro = apuracaoAgosto.lucroContabilAcumuladoJaneiroAAgosto + resultadoSetembro;
  const soma = (campo: keyof AjustesLalurJulho) =>
    ajustesLalurJulho[campo] + ajustesLalurAgosto[campo] + (ajustesLalurSetembro?.[campo] ?? 0);

  const resultado = calcularIrpjCsllBalancoSuspensaoReducao({
    lucroContabilAcumulado: lucroContabilAcumuladoJaneiroASetembro,
    mesesAcumulados: 9,
    adicoesAcumuladasIrpj: adicoes + soma("adicoesIrpj"),
    exclusoesAcumuladasIrpj: exclusoes + soma("exclusoesIrpj"),
    adicoesAcumuladasCsll: adicoes + soma("adicoesCsll"),
    exclusoesAcumuladasCsll: exclusoes + soma("exclusoesCsll"),
    pagamentosEstimativaIrpjAnteriores: apuracaoAgosto.pagamentosEstimativaIrpjAnteriores + darfPagoAgosto.irpj,
    pagamentosEstimativaCsllAnteriores: apuracaoAgosto.pagamentosEstimativaCsllAnteriores + darfPagoAgosto.csll,
    irrfAcumuladoCompensavel: apuracaoAgosto.irrfAcumuladoCompensavel + irrfAplicacoesFinanceirasSetembro,
  });

  return {
    ...resultado,
    lucroContabilAcumuladoJaneiroASetembro,
    lucroContabilDoMes: resultadoSetembro,
    darfIrpjAgosto: darfPagoAgosto.irpj,
    darfCsllAgosto: darfPagoAgosto.csll,
    irrfAplicacoesFinanceirasSetembro,
  };
}
