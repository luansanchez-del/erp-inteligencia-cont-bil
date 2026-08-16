import { lancamentosIntegrados as lancamentosBase } from "./nitaplast-razao-base";
import { fechamentoCpvJunho } from "./nitaplast-cpv-junho";
import { corrigirMapeamentosJunho } from "./nitaplast-correcoes-mapeamento-junho";
import { ajusteEstoqueResultadoJunho } from "./nitaplast-ajuste-estoque-junho";
import { gerarFechamentoEstoqueMatrizJunho } from "./nitaplast-fechamento-estoque-matriz-junho";
import { aplicarFechamentoFinanceiroJunho } from "./nitaplast-fechamento-financeiro-junho";

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
 * 5. fechamento físico final das contas de estoque.
 *
 * Balancete e DRE leem este mesmo conjunto. Portanto nenhuma linha da DRE é
 * alterada manualmente para "bater": o resultado nasce dos lançamentos.
 */
const baseComFechamentoFinanceiro = aplicarFechamentoFinanceiroJunho([
  ...lancamentosBase,
  ...fechamentoCpvJunho,
  ajusteEstoqueResultadoJunho,
]);

const baseCorrigida = corrigirMapeamentosJunho(baseComFechamentoFinanceiro);
const fechamentoEstoqueMatriz = gerarFechamentoEstoqueMatrizJunho(baseCorrigida);

export const lancamentosIntegrados = [
  ...baseCorrigida,
  ...fechamentoEstoqueMatriz,
];

export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;

export const lancamentosPorRastreio = {
  documento: lancamentosIntegrados.filter((linha) => linha.rastreio === "documento").length,
  derivado: lancamentosIntegrados.filter((linha) => linha.rastreio === "derivado").length,
  sugerido: lancamentosIntegrados.filter((linha) => linha.rastreio === "sugerido").length,
};
