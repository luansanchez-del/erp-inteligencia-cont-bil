import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Recebimentos de clientes de 08/2026.
 *
 * REGRA (definida pelo cliente em 24/09/2026): o documento oficial do
 * recebimento é o EXTRATO BANCÁRIO. Cada crédito de cobrança/PIX é lançado
 * direto em D Banco / C Duplicatas a Receber (25111), linha a linha, no
 * arquivo do extrato de cada banco (ex.: `nitaplast-bradesco-6349-agosto.ts`).
 * O relatório "Títulos Liquidados" e o EXTRATO MOVIMENTO SOFTDIB só apoiam a
 * identificação do cliente/título — não são base de valor.
 *
 * Por isso foi retirada em 24/09/2026 a baixa global AGO-REC-CLI-PRINCIPAL
 * (D 4859 Transitória / C 25111, R$ 3.287.059,82, pelo total do relatório):
 * ela baixava as duplicatas sem o lado do banco, deixando a transitória com
 * R$ 3,29 mi e o Bradesco 6349 negativo. Enquanto os extratos Itaú, BB e
 * Uniprime de agosto não forem lançados, os recebimentos desses bancos ainda
 * não baixam Duplicatas a Receber.
 *
 * Totais do relatório Títulos Liquidados (CONSOLIDADO, RCR450, 01/08 a
 * 31/08/2026, 1308 títulos), mantidos só como referência de conferência:
 *   Vlr.Duplicata  3.433.840,21
 *   Vlr.Saldo         2.216,42
 *   Vlr.Juros         1.010,10
 *   Desc            140.063,90  (desconto interno do Softdib — não é despesa financeira, ver abaixo)
 *   Vlr.Rec       3.287.059,82
 *
 * - AGO-REC-CLI-JUROS-ATIVOS reclassifica os juros de mora recebidos
 *   (R$ 1.010,10) de Duplicatas a Receber para Juros Ativos (25095), seguindo
 *   o mesmo padrão já usado em junho/2026 (`nitaplast-juros-ativos-junho.ts`:
 *   D 25111 / C 25095). Não mexe no banco, só reclassifica dentro do Razão.
 * - NÃO desmembra o desconto (R$ 140.063,90) em despesa financeira: o cliente
 *   esclareceu em 23/09/2026 que é desconto INTERNO do Softdib (mecânica de
 *   baixa do sistema comercial), não desconto financeiro real.
 */
export const resumoRecebimentosClientesAgosto = {
  vlrDuplicata: 3_433_840.21,
  vlrSaldoAberto: 2_216.42,
  vlrJurosRecebidos: 1_010.10,
  vlrDescontoConcedido: 140_063.90,
  vlrRecebidoLiquido: 3_287_059.82,
  quantidadeTitulos: 1308,
} as const;

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
    id: "AGO-REC-CLI-JUROS-ATIVOS",
    data: "31/08/2026",
    origem: "RECLASSIFICAÇÃO RECEBIMENTOS COM JUROS 08/2026",
    debitoCodigo: CONTA_DUPLICATAS_A_RECEBER,
    creditoCodigo: "25095",
    historico: "Reclassificação da parcela de juros ativa contida nos recebimentos de duplicatas de agosto/2026",
    documento: "TÍTULOS LIQUIDADOS 08/2026 - Total Geral",
    cc: "901",
    centroCusto: "RECEITAS FINANCEIRAS",
    valor: resumoRecebimentosClientesAgosto.vlrJurosRecebidos,
    observacao: "Não altera banco. Reclassifica da conta de Duplicatas a Receber a parcela de juros de mora recebidos (Vlr.Juros do relatório Títulos Liquidados), seguindo o mesmo padrão usado em junho/2026 (nitaplast-juros-ativos-junho.ts, conta 25095 — Juros Ativos).",
    fonte: "Títulos Liquidados 08/2026 (CONSOLIDADO), RCR450, 38 páginas.",
  }),
];
