import {
  calcularIrpjCsllBalancoSuspensaoReducao,
  type ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado,
} from "@/lib/apuracao-irpj-csll";
import {
  adicoesExclusoesAcumuladasJaneiroAJunho,
  type AjustesLalurJulho,
  type ApuracaoIrpjCsllJulho,
} from "./nitaplast-irpj-csll-julho";

export type AjustesLalurAgosto = AjustesLalurJulho;

export type ApuracaoIrpjCsllAgosto = ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado & {
  lucroContabilAcumuladoJaneiroAAgosto: number;
  lucroContabilDoMes: number;
  darfIrpjJulho: number;
  darfCsllJulho: number;
  irrfAplicacoesFinanceirasAgosto: number;
};

/**
 * Balanço de Suspensão/Redução de 08/2026 (mesmo método de janeiro-julho),
 * encadeado na apuração de julho:
 *   - lucro contábil acumulado = acumulado Jan-Jul + resultado da DRE de agosto;
 *   - adições/exclusões acumuladas = base Jan-Jun (planilha do escritório) +
 *     ajustes do LALUR de julho + ajustes do LALUR de agosto;
 *   - pagamentos anteriores = pagos até junho + DARF de julho, este tomado da
 *     própria apuração de julho (IRPJ/CSLL a pagar). Se o DARF efetivamente
 *     recolhido em julho for diferente, a base de pagamentos precisa ser
 *     corrigida aqui — a Relação de Pagamentos de agosto ainda não foi conferida
 *     contra o LALUR de julho;
 *   - IRRF compensável = acumulado Jan-Jul + IRRF sobre aplicações retido em
 *     agosto (débitos da conta 25118 no Razão de agosto).
 */
export function calcularApuracaoIrpjCsllAgosto(
  apuracaoJulho: ApuracaoIrpjCsllJulho,
  ajustesLalurJulho: AjustesLalurJulho,
  resultadoAgosto: number,
  irrfAplicacoesFinanceirasAgosto: number,
  ajustesLalurAgosto?: AjustesLalurAgosto,
): ApuracaoIrpjCsllAgosto {
  const { adicoes, exclusoes } = adicoesExclusoesAcumuladasJaneiroAJunho;
  const lucroContabilAcumuladoJaneiroAAgosto = apuracaoJulho.lucroContabilAcumuladoJaneiroAJulho + resultadoAgosto;

  const resultado = calcularIrpjCsllBalancoSuspensaoReducao({
    lucroContabilAcumulado: lucroContabilAcumuladoJaneiroAAgosto,
    mesesAcumulados: 8,
    adicoesAcumuladasIrpj: adicoes + ajustesLalurJulho.adicoesIrpj + (ajustesLalurAgosto?.adicoesIrpj ?? 0),
    exclusoesAcumuladasIrpj: exclusoes + ajustesLalurJulho.exclusoesIrpj + (ajustesLalurAgosto?.exclusoesIrpj ?? 0),
    adicoesAcumuladasCsll: adicoes + ajustesLalurJulho.adicoesCsll + (ajustesLalurAgosto?.adicoesCsll ?? 0),
    exclusoesAcumuladasCsll: exclusoes + ajustesLalurJulho.exclusoesCsll + (ajustesLalurAgosto?.exclusoesCsll ?? 0),
    pagamentosEstimativaIrpjAnteriores: apuracaoJulho.pagamentosEstimativaIrpjAnteriores + apuracaoJulho.irpjAPagar,
    pagamentosEstimativaCsllAnteriores: apuracaoJulho.pagamentosEstimativaCsllAnteriores + apuracaoJulho.csllAPagar,
    irrfAcumuladoCompensavel: apuracaoJulho.irrfAcumuladoCompensavel + irrfAplicacoesFinanceirasAgosto,
  });

  return {
    ...resultado,
    lucroContabilAcumuladoJaneiroAAgosto,
    lucroContabilDoMes: resultadoAgosto,
    darfIrpjJulho: apuracaoJulho.irpjAPagar,
    darfCsllJulho: apuracaoJulho.csllAPagar,
    irrfAplicacoesFinanceirasAgosto,
  };
}
