import {
  calcularIrpjCsllBalancoSuspensaoReducao,
  type ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado,
} from "@/lib/apuracao-irpj-csll";
import {
  adicoesExclusoesAcumuladasJaneiroAJunho,
  type AjustesLalurJulho,
  type ApuracaoIrpjCsllJulho,
} from "./nitaplast-irpj-csll-julho";
import { darfIrpjCsllPagoAgosto } from "./nitaplast-darf-irpj-csll-agosto";

export type AjustesLalurAgosto = AjustesLalurJulho;

// DARFs de estimativa de 07/2026 efetivamente recolhidos em 31/08/2026 — mesmos
// valores lançados no Razão de agosto (nitaplast-darf-irpj-csll-agosto.ts).
const darfPagoJulho = darfIrpjCsllPagoAgosto;

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
 *   - pagamentos anteriores = pagos até junho + DARF de julho efetivamente
 *     recolhido (`darfPagoJulho`);
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
    pagamentosEstimativaIrpjAnteriores: apuracaoJulho.pagamentosEstimativaIrpjAnteriores + darfPagoJulho.irpj,
    pagamentosEstimativaCsllAnteriores: apuracaoJulho.pagamentosEstimativaCsllAnteriores + darfPagoJulho.csll,
    irrfAcumuladoCompensavel: apuracaoJulho.irrfAcumuladoCompensavel + irrfAplicacoesFinanceirasAgosto,
  });

  return {
    ...resultado,
    lucroContabilAcumuladoJaneiroAAgosto,
    lucroContabilDoMes: resultadoAgosto,
    darfIrpjJulho: darfPagoJulho.irpj,
    darfCsllJulho: darfPagoJulho.csll,
    irrfAplicacoesFinanceirasAgosto,
  };
}
