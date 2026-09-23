import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta não encontrada no plano"}`;

/**
 * Tarifas bancárias de agosto/2026 — achado em 24/09/2026 ao varrer os
 * extratos reais (Bradesco 6349/3035-0 e BB) atrás das pendências apontadas
 * pelo cliente ("Não constam despesas bancárias"). Conta 25104 (Despesas
 * Bancárias, classificação 5.8.01.002) tinha ZERO lançamentos em agosto —
 * essas tarifas nunca tinham sido importadas, mesmo buraco já identificado
 * no restante do extrato Bradesco (conta 9).
 *
 * Agregado por tipo (85 lançamentos individuais do Bradesco, cada um abaixo
 * de R$ 25,00, mais 1 tarifa do BB) em vez de lançar nota a nota — mesmo
 * padrão já usado noutras varreduras deste mês.
 *
 * Variações Cambiais Passivas (25109), Juros Passivo (25103) e Descontos
 * Obtidos (4927) — outras pendências do cliente — NÃO aparecem em nenhum
 * extrato disponível (Bradesco, Itaú, BB; Unipreme não tem camada de texto
 * legível), nem na coluna "Acr/Desc" das duas relações de pagamentos
 * efetuados varridas em 23/09/2026 (RELAÇÃO DE PAGAMENTOS EFETUADOS
 * 082026.pdf e PAGAMENTOS EFETUADOS.pdf, todos os meses) — os únicos valores
 * não-zero nessa coluna em agosto são acerto de câmbio de importação
 * (BASF/Greatland, já lançados) e arredondamento de centavos (TICONA,
 * imaterial). Ficam como pendência real sem lançamento, documentada aqui,
 * até aparecer fonte.
 *
 * Desconto Concedido (25106, campo "Desc" de Títulos Liquidados, R$
 * 140.063,90): tentativa de lançar revertida em 23/09/2026 — cliente
 * esclareceu que é desconto interno do Softdib (mecânica do sistema
 * comercial), não desconto financeiro real. Ver
 * `nitaplast-recebimentos-clientes-agosto.ts`.
 */
const base = (parcial: Omit<LancamentoIntegrado, "status" | "rastreio" | "debito" | "credito">): LancamentoIntegrado => ({
  ...parcial,
  debito: nomeConta(parcial.debitoCodigo),
  credito: nomeConta(parcial.creditoCodigo),
  status: "validado",
  rastreio: "documento",
});

const FONTE_BRADESCO = "extrato Bradesco 6349/3035-0 (08/2026)";

export const lancamentosTarifasBancariasAgosto: LancamentoIntegrado[] = [
  base({ id: "AGO-TARIFA-BRAD-REGCOBRANCA", data: "31/08/2026", origem: "TARIFAS BANCÁRIAS 08/2026", debitoCodigo: "25104", creditoCodigo: "9", historico: "Tarifas de registro de cobrança (boletos) — Bradesco 6349/3035-0, agosto/2026 (51 lançamentos)", documento: "Consolidado do mês", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 1_173.15, observacao: "Somatório de 51 tarifas individuais (todas abaixo de R$ 25,00) de registro de boleto de cobrança emitido, conforme extrato.", fonte: FONTE_BRADESCO }),
  base({ id: "AGO-TARIFA-BRAD-PIX", data: "31/08/2026", origem: "TARIFAS BANCÁRIAS 08/2026", debitoCodigo: "25104", creditoCodigo: "9", historico: "Tarifas de transferência via PIX — Bradesco 6349/3035-0, agosto/2026 (21 lançamentos)", documento: "Consolidado do mês", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 200.35, observacao: "Somatório de 21 tarifas de PIX (R$ 9,80 cada, na maioria).", fonte: FONTE_BRADESCO }),
  base({ id: "AGO-TARIFA-BRAD-OUTRAS", data: "31/08/2026", origem: "TARIFAS BANCÁRIAS 08/2026", debitoCodigo: "25104", creditoCodigo: "9", historico: "Outras tarifas bancárias — Bradesco 6349/3035-0, agosto/2026 (8 lançamentos)", documento: "Consolidado do mês", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 117.80, observacao: "Tarifas diversas não recorrentes identificadas no extrato.", fonte: FONTE_BRADESCO }),
  base({ id: "AGO-TARIFA-BRAD-PGTOFUNC", data: "31/08/2026", origem: "TARIFAS BANCÁRIAS 08/2026", debitoCodigo: "25104", creditoCodigo: "9", historico: "Tarifas de pagamento de funcionários via Net Empresa — Bradesco 6349/3035-0, agosto/2026 (3 lançamentos)", documento: "Consolidado do mês", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 20.00, observacao: "3 tarifas de R$ 8,00/R$ 9,80 cada, ligadas a pagamento de salários via sistema.", fonte: FONTE_BRADESCO }),
  base({ id: "AGO-TARIFA-BRAD-AUTORIZ", data: "31/08/2026", origem: "TARIFAS BANCÁRIAS 08/2026", debitoCodigo: "25104", creditoCodigo: "9", historico: "Tarifa de autorização de cobrança — Bradesco 6349/3035-0, agosto/2026", documento: "Título pago em cartório", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 11.00, observacao: "Tarifa única de autorização de cobrança de título pago em cartório.", fonte: FONTE_BRADESCO }),
  base({ id: "AGO-TARIFA-BRAD-PROTESTO", data: "03/08/2026", origem: "TARIFAS BANCÁRIAS 08/2026", debitoCodigo: "25104", creditoCodigo: "9", historico: "Despesas de protesto — Bradesco 6349/3035-0, agosto/2026", documento: "Consolidado do mês", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 9.19, observacao: "Despesa de protesto de título, conforme extrato.", fonte: FONTE_BRADESCO }),
  base({ id: "AGO-TARIFA-BB-PACOTE", data: "10/08/2026", origem: "TARIFAS BANCÁRIAS 08/2026", debitoCodigo: "25104", creditoCodigo: "10", historico: "Tarifa Pacote de Serviços — Banco do Brasil, agosto/2026", documento: "832.221.203.057.954", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 215.90, observacao: "Tarifa mensal do pacote de serviços, conforme extrato BB.", fonte: "extrato Banco do Brasil (08/2026)" }),
];
