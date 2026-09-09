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

export const resumoCambioAgosto = {
  contratos: 2,
  fornecedor: "BASF SE",
  notaFiscal: "93361",
  usd: 82_000,
  reais: 423_222.50,
  notaGreatland94222Vinculada: false,
  observacaoGreatland: "A NF 94.222, de R$ 454.046,67, não corresponde aos contratos recebidos e permanece em revisão até apresentação do contrato/DI próprio.",
} as const;

