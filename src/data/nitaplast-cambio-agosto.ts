import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/** Contratos de câmbio vinculados documentalmente à NF 93.361 da BASF. */
export const vinculosCambioAgosto = [
  { contratoBacen: "621680690", contratoBradesco: "4925166", data: "10/08/2026", invoice: "3209714898", parcela: "001", usd: 41_000, taxa: 5.105, reais: 209_305.00 },
  { contratoBacen: "622836291", contratoBradesco: "4930818", data: "13/08/2026", invoice: "3209714889", parcela: "002", usd: 41_000, taxa: 5.2175, reais: 213_917.50 },
] as const;

export const lancamentosCambioAgosto: LancamentoIntegrado[] = vinculosCambioAgosto.map((vinculo) => ({
  id: `AGO-CAMBIO-${vinculo.contratoBacen}`,
  data: vinculo.data,
  origem: "CONTRATO DE CÂMBIO IMPORTAÇÃO 08/2026",
  debitoCodigo: "5501438",
  debito: nome("5501438"),
  creditoCodigo: "9",
  credito: nome("9"),
  historico: `Liquidação de importação BASF SE — invoice ${vinculo.invoice}`,
  documento: `NF 93361/${vinculo.parcela} — contrato ${vinculo.contratoBacen}`,
  cc: "102",
  centroCusto: "PRODUÇÃO",
  valor: vinculo.reais,
  status: "validado",
  observacao: `Pagamento posterior de importação: USD ${vinculo.usd.toFixed(2)}, taxa ${vinculo.taxa.toFixed(4)}. Baixa o fornecedor; não duplica a compra nem reconhece novamente matéria-prima.`,
  rastreio: "documento",
  fonte: `${vinculo.contratoBacen}.pdf + EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv + NF 93361`,
}));

/**
 * Contratos de câmbio da Greatland Valve, achados em 16/09/2026, cujo débito
 * bancário foi confirmado nos extratos Bradesco 6349/3035-0 de abril e julho
 * (linha "CAMBIO IMPORTACAO / CAMBIO IMP CTR <contrato>"). Não há conta de
 * fornecedor dedicada à Greatland no plano de contas (diferente da BASF, que
 * tem a 5501438); por isso a baixa é feita contra a 25116 (Importações em
 * andamento), a mesma conta creditada pela entrada da NF 94222 em
 * `nitaplast-cpv-depreciacao-agosto.ts` (AGO-CUSTO-MP-IMP).
 *
 * Os dois contratos (R$ 385.701,27) cobrem 85% da NF 94222 (R$ 454.046,67).
 * O restante, R$ 68.345,40, está em confirmação com o cliente — pode ser
 * IOF/despesas aduaneiras/variação cambial, ou um terceiro contrato ainda não
 * localizado. Enquanto isso, a NF 94222 permanece com saldo em aberto na 25116.
 */
export const vinculosCambioGreatlandAgosto = [
  { contrato: "583972479", data: "08/04/2026", usd: 19_455.03, taxa: 5.045, reais: 98_150.63 },
  { contrato: "611879451", data: "10/07/2026", usd: 55_863.94, taxa: 5.1473390, reais: 287_550.64 },
] as const;

export const lancamentosCambioGreatlandAgosto: LancamentoIntegrado[] = vinculosCambioGreatlandAgosto.map((vinculo) => ({
  id: `AGO-CAMBIO-GREATLAND-${vinculo.contrato}`,
  data: "01/08/2026",
  origem: "CONTRATO DE CÂMBIO IMPORTAÇÃO — GREATLAND VALVE",
  debitoCodigo: "25116",
  debito: nome("25116"),
  creditoCodigo: "9",
  credito: nome("9"),
  historico: "Adiantamento de importação Greatland Valve — pago antes da emissão da NF 94222",
  documento: `Contrato de câmbio ${vinculo.contrato}, pago em ${vinculo.data}`,
  cc: "209",
  centroCusto: "IMPORTAÇÃO",
  valor: vinculo.reais,
  status: "revisar",
  observacao: `Pagamento antecipado (adiantamento), não baixa de título: USD ${vinculo.usd.toFixed(2)}, taxa ${vinculo.taxa.toFixed(4)}, debitado do Bradesco 6349/3035-0 em ${vinculo.data} — contrato só localizado em 16/09/2026, por isso lançado em agosto na competência da NF 94222 (emitida 18/08/2026), não no mês real do pagamento. Baixa parcial da 25116 aberta pela entrada da matéria-prima (AGO-CUSTO-MP-IMP); resta R$ 68.345,40 em aberto até confirmação do cliente sobre a diferença.`,
  rastreio: "documento",
  fonte: `${vinculo.contrato}.pdf + extrato Bradesco 6349/3035-0 (${vinculo.data.slice(3)}) + EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv`,
}));

export const resumoCambioAgosto = {
  contratos: 2,
  fornecedor: "BASF SE",
  notaFiscal: "93361",
  usd: 82_000,
  reais: 423_222.50,
  notaGreatland94222: {
    notaFiscal: "94222",
    valorNota: 454_046.67,
    contratosVinculados: 385_701.27,
    diferencaEmConfirmacao: 68_345.40,
    observacao: "Dois contratos de câmbio (abril + julho) confirmados nos extratos Bradesco, cobrindo R$ 385.701,27 dos R$ 454.046,67 da NF 94222. Diferença de R$ 68.345,40 em confirmação com o cliente (IOF/despesas aduaneiras/variação cambial, ou terceiro contrato ainda não localizado).",
  },
} as const;

