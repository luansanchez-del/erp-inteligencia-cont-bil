import { lancamentosIntegrados as lancamentosBase } from "./nitaplast-razao-base";
import { fechamentoCpvJunho } from "./nitaplast-cpv-junho";
import { corrigirMapeamentosJunho } from "./nitaplast-correcoes-mapeamento-junho";
import { ajusteEstoqueResultadoJunho } from "./nitaplast-ajuste-estoque-junho";
import { gerarFechamentoEstoqueMatrizJunho } from "./nitaplast-fechamento-estoque-matriz-junho";
import { aplicarFechamentoFinanceiroJunho } from "./nitaplast-fechamento-financeiro-junho";
import { aplicarFechamentoCpvFinalJunho } from "./nitaplast-fechamento-cpv-final-junho";

export type { LancamentoIntegrado } from "./nitaplast-razao-base";
export { contaPorBanco, depreciacoes } from "./nitaplast-razao-base";

/**
 * Razão definitivo de junho/2026.
 *
 * Ordem contábil obrigatória:
 * 1. fatos/documentos de junho;
 * 2. fechamento de CPV e ajuste de estoque já validado;
 * 3. fechamento financeiro validado no próprio Razão;
 * 4. correções de mapeamento comprovadas;
 * 5. fechamento físico final das contas de estoque;
 * 6. reconciliação final do CPV ao Razão real Questor + ajuste autorizado.
 *
 * Balancete e DRE leem este mesmo conjunto. Portanto nenhuma linha da DRE é
 * alterada manualmente para "bater": o resultado nasce dos lançamentos.
 */

/**
 * A apuração de ICMS da matriz anteriormente carregada com créditos de
 * R$ 151.322,32 foi invalidada no fechamento. O registro atualizado confirmou
 * o débito de ICMS das SAÍDAS em R$ 239.206,46, mas os créditos daquela versão
 * antiga não podem permanecer gerando lançamentos no Razão/Balancete.
 *
 * Mantemos exclusivamente TAX-SAI-ICMS (débito das saídas). Todos os demais
 * lançamentos cuja origem seja a apuração ICMS antiga são descartados desta
 * base definitiva até serem reconstruídos pelo registro atualizado/documentos.
 */
const lancamentosBaseSemApuracaoIcmsObsoleta = lancamentosBase.filter((linha) =>
  linha.origem !== "APURAÇÃO ICMS 06/2026" || linha.id === "TAX-SAI-ICMS",
);

const baseComFechamentoFinanceiro = aplicarFechamentoFinanceiroJunho([
  ...lancamentosBaseSemApuracaoIcmsObsoleta,
  ...fechamentoCpvJunho,
  ajusteEstoqueResultadoJunho,
]);

const baseCorrigida = corrigirMapeamentosJunho(baseComFechamentoFinanceiro);
const fechamentoEstoqueMatriz = gerarFechamentoEstoqueMatrizJunho(baseCorrigida);

// Primeiro fechamos o patrimônio ao inventário físico oficial. Só depois
// reconciliamos o movimento das contas de CPV com o Razão real do Questor e
// registramos o ajuste autorizado de R$ 150 mil. Assim o estoque oficial não é
// usado como contrapartida artificial para forçar a DRE.
const baseComEstoqueFechado = [
  ...baseCorrigida,
  ...fechamentoEstoqueMatriz,
];

export const lancamentosIntegrados = aplicarFechamentoCpvFinalJunho(baseComEstoqueFechado);

export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;

export const lancamentosPorRastreio = {
  documento: lancamentosIntegrados.filter((linha) => linha.rastreio === "documento").length,
  derivado: lancamentosIntegrados.filter((linha) => linha.rastreio === "derivado").length,
  sugerido: lancamentosIntegrados.filter((linha) => linha.rastreio === "sugerido").length,
};
