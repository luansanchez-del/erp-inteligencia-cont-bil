import { lancamentosIntegrados as lancamentosBase } from "./nitaplast-razao-base";
import { fechamentoCpvJunho } from "./nitaplast-cpv-junho";

export type { LancamentoIntegrado } from "./nitaplast-razao-base";
export { contaPorBanco, depreciacoes } from "./nitaplast-razao-base";

/**
 * Reclassificação solicitada no fechamento de junho/2026:
 * 25053 - Despesas com Engenharia -> 25052 - Serviços de Terceiros PJ.
 *
 * A troca é feita sobre os próprios lançamentos de junho para preservar documento,
 * histórico, centro de custo, rastreio e fonte originais. Dessa forma Razão,
 * Balancete e DRE passam a consumir a mesma classificação, sem lançamento-plug.
 */
const lancamentosBaseReclassificados = lancamentosBase.map((linha) => {
  const reclassificaDebito = linha.debitoCodigo === "25053";
  const reclassificaCredito = linha.creditoCodigo === "25053";

  if (!reclassificaDebito && !reclassificaCredito) return linha;

  return {
    ...linha,
    debitoCodigo: reclassificaDebito ? "25052" : linha.debitoCodigo,
    debito: reclassificaDebito ? "25052 - Serviços de Terceiros PJ" : linha.debito,
    creditoCodigo: reclassificaCredito ? "25052" : linha.creditoCodigo,
    credito: reclassificaCredito ? "25052 - Serviços de Terceiros PJ" : linha.credito,
    observacao: `${linha.observacao} Reclassificado da conta 25053 - Despesas com Engenharia para 25052 - Serviços de Terceiros PJ no fechamento de 06/2026.`,
  };
});

/**
 * Razão definitivo de junho/2026.
 * A base contém documentos, bancos, folha, provisões, fiscal e filial já reconciliados.
 * O fechamento de CPV é acrescentado uma única vez aqui, depois dos fatos de junho,
 * para que Razão, Balancete e DRE leiam exatamente o mesmo conjunto de lançamentos.
 */
export const lancamentosIntegrados = [...lancamentosBaseReclassificados, ...fechamentoCpvJunho];

export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;

export const lancamentosPorRastreio = {
  documento: lancamentosIntegrados.filter((linha) => linha.rastreio === "documento").length,
  derivado: lancamentosIntegrados.filter((linha) => linha.rastreio === "derivado").length,
  sugerido: lancamentosIntegrados.filter((linha) => linha.rastreio === "sugerido").length,
};
