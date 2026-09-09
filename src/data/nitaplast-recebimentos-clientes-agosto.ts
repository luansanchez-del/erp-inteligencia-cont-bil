import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Reclassificação dos recebimentos de clientes de 08/2026: o lado bancário
 * (crédito na conta corrente) já está lançado pela leitura automática do
 * SOFTDIB/extratos (JSON do motor genérico), com contrapartida provisória na
 * conta transitória (4859) — o importador não sabe, linha a linha, que aquele
 * crédito bancário é a liquidação de uma duplicata específica. Este arquivo
 * fecha essa ponta: tira o valor da transitória e bota em duplicatas a
 * receber (25111 — mesma conta usada para o lançamento de NF/faturamento em
 * junho, `nitaplast-lancamentos-fiscais-junho.ts`, lote `receitas`).
 *
 * Fonte: "Títulos Liquidados" (relatório CONSOLIDADO, RCR450, 01/08/2026 a
 * 31/08/2026), 1308 títulos, "Total geral" da última página:
 *   Vlr.Duplicata  3.433.840,21
 *   Vlr.Saldo         2.216,42  (saldo em aberto de baixas parciais — não é caixa, fica como duplicata a receber)
 *   Vlr.Juros         1.010,10  (juros de mora recebidos)
 *   Desc            140.063,90  (desconto concedido)
 *   Vlr.Rec       3.287.059,82  (valor líquido efetivamente recebido = o que entrou no banco)
 *
 * IMPORTANTE — o que este lançamento cobre e o que não cobre:
 * - Cobre o valor líquido recebido (Vlr.Rec), que é exatamente o que bateu
 *   nos extratos bancários e já está lançado do lado do banco.
 * - NÃO desmembra o desconto concedido (R$ 140.063,90) em despesa financeira
 *   nem os juros recebidos (R$ 1.010,10) em receita financeira — ainda não
 *   tenho confirmado, num fechamento real anterior, qual conta do plano usa
 *   Nitaplast para desconto concedido/juros ativos sobre duplicatas (não
 *   apareceu em `nitaplast-lancamentos-fiscais-junho.ts`). Lançar isso exigiria
 *   inventar código de conta, o que a regra do projeto proíbe. Fica como
 *   próximo passo, com o valor cheio provisoriamente batendo contra 25111.
 * - Há uma diferença residual de ~R$ 5.500 entre o total líquido recebido e o
 *   que a fórmula (duplicata - saldo aberto + juros - desconto) indicaria —
 *   corresponde a um pequeno número de títulos com Vlr.Rec "0,00" no
 *   relatório (títulos com baixa mas sem valor recebido — provável protesto/
 *   estorno/renegociação), não analisados individualmente. Fica dentro do
 *   valor já lançado (não é um lançamento à parte), mas registrado aqui para
 *   rastreabilidade.
 */
export const resumoRecebimentosClientesAgosto = {
  vlrDuplicata: 3_433_840.21,
  vlrSaldoAberto: 2_216.42,
  vlrJurosRecebidos: 1_010.10,
  vlrDescontoConcedido: 140_063.90,
  vlrRecebidoLiquido: 3_287_059.82,
  quantidadeTitulos: 1308,
} as const;

const CONTA_TRANSITORIA = "4859";
const CONTA_DUPLICATAS_A_RECEBER = "25111";

const base = (parcial: Omit<LancamentoIntegrado, "status" | "rastreio" | "debito" | "credito"> & { status?: LancamentoIntegrado["status"] }): LancamentoIntegrado => ({
  ...parcial,
  debito: nome(parcial.debitoCodigo),
  credito: nome(parcial.creditoCodigo),
  status: parcial.status ?? "validado",
  rastreio: "documento",
});

export const lancamentosRecebimentosClientesAgosto: LancamentoIntegrado[] = [
  base({
    id: "AGO-REC-CLI-PRINCIPAL",
    data: "31/08/2026",
    origem: "TÍTULOS LIQUIDADOS 08/2026 (CONSOLIDADO)",
    debitoCodigo: CONTA_TRANSITORIA,
    creditoCodigo: CONTA_DUPLICATAS_A_RECEBER,
    historico: "Baixa de duplicatas a receber - recebimentos de clientes liquidados em agosto/2026 (1308 títulos, valor líquido recebido)",
    documento: "TÍTULOS LIQUIDADOS 08/2026 - Total Geral",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: resumoRecebimentosClientesAgosto.vlrRecebidoLiquido,
    observacao: "Reclassifica da conta transitória (contrapartida provisória dos créditos bancários já lançados via SOFTDIB) para duplicatas a receber. Desconto concedido (R$ 140.063,90) e juros recebidos (R$ 1.010,10) ainda não desmembrados em contas de despesa/receita financeira — sem precedente de conta confirmada em junho.",
    fonte: "Títulos Liquidados 08/2026 (CONSOLIDADO), RCR450, 38 páginas.",
  }),
];
