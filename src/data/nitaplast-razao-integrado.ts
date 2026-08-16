import { lancamentosIntegrados as lancamentosBase } from "./nitaplast-razao-base";
import { fechamentoCpvJunho } from "./nitaplast-cpv-junho";
import { corrigirMapeamentosJunho } from "./nitaplast-correcoes-mapeamento-junho";
import { gerarFechamentoEstoqueMatrizJunho } from "./nitaplast-fechamento-estoque-matriz-junho";

export type { LancamentoIntegrado } from "./nitaplast-razao-base";
export { contaPorBanco, depreciacoes } from "./nitaplast-razao-base";

/**
 * Razão definitivo de junho/2026.
 * A base contém documentos, bancos, folha, provisões, fiscal e filial já reconciliados.
 * O fechamento de CPV é acrescentado uma única vez aqui, depois dos fatos de junho.
 * Antes da exposição aos relatórios, aplicamos somente correções de mapeamento comprovadas,
 * preservando IDs, documentos e fontes para auditoria.
 * Por fim, as contas de estoque da matriz são ajustadas ao inventário físico de 30/06,
 * considerando os movimentos já contabilizados para evitar dupla contagem.
 * Razão, Balancete e DRE passam a ler exatamente o mesmo conjunto corrigido.
 */
const baseCorrigida = corrigirMapeamentosJunho([
  ...lancamentosBase,
  ...fechamentoCpvJunho,
]);

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
