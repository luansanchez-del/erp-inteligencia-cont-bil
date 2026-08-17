import type { LancamentoIntegrado } from "./nitaplast-razao-base";

/**
 * Juros Ativos de 06/2026.
 *
 * O Razão de maio mostra o padrão contábil dos recebimentos com juros:
 * D Banco pelo total recebido / C Duplicatas pelo principal / C Juros Ativos pela diferença.
 *
 * Em junho, o movimento bancário já foi importado pelo valor total dos recebimentos.
 * Para não duplicar o banco, a correção necessária é somente reclassificar a parcela
 * de juros que ficou integralmente creditada em Duplicatas a Receber:
 *
 * D 25111 - Duplicatas a Receber
 * C 25095 - Juros Ativos
 * R$ 25.294,70
 *
 * Efeito final: Banco permanece pelo total efetivamente recebido, Duplicatas fica
 * somente pelo principal e a receita financeira nasce no Razão antes do Balancete/DRE.
 */
export const JUROS_ATIVOS_JUNHO = 25294.70;

const lancamentoJurosAtivosJunho: LancamentoIntegrado = {
  id: "FIN-JUROS-ATIVOS-RECLASS-062026",
  data: "30/06/2026",
  origem: "RECLASSIFICAÇÃO RECEBIMENTOS COM JUROS 06/2026",
  debitoCodigo: "25111",
  debito: "25111 - Duplicatas a Receber",
  creditoCodigo: "25095",
  credito: "25095 - Juros Ativos",
  historico: "Reclassificação da parcela de juros ativa contida nos recebimentos de duplicatas de junho/2026",
  documento: "JUROS ATIVOS 06/2026",
  cc: "901",
  centroCusto: "RECEITAS FINANCEIRAS",
  valor: JUROS_ATIVOS_JUNHO,
  status: "validado",
  observacao: "Não altera banco. Reclassifica da conta de Duplicatas a Receber a parcela de juros, seguindo o padrão contábil observado no Razão de maio/2026.",
  rastreio: "derivado",
  fonte: "Padrão do Razão 05/2026 + fechamento financeiro 06/2026",
};

export function aplicarJurosAtivosJunho(lancamentos: LancamentoIntegrado[]): LancamentoIntegrado[] {
  const baseSemDuplicidade = lancamentos.filter((linha) => linha.id !== lancamentoJurosAtivosJunho.id);
  return [...baseSemDuplicidade, lancamentoJurosAtivosJunho];
}
