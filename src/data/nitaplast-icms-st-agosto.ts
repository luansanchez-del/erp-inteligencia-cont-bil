import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

type DocumentoIcmsSt = {
  data: string;
  cfop: "5401" | "6401";
  base: number;
  valor: number;
};

/**
 * Documentos efetivamente datados em agosto no Registro de Apuração do ICMS-ST.
 * O relatório foi parametrizado incorretamente até 31/08/2029 e trouxe também
 * 01/09/2026 (R$ 267,72), que foi expressamente excluído desta competência.
 */
export const documentosIcmsStAgosto: DocumentoIcmsSt[] = [
  { data: "03/08/2026", cfop: "6401", base: 1_117.67, valor: 160.94 },
  { data: "07/08/2026", cfop: "6401", base: 421.57, valor: 65.21 },
  { data: "14/08/2026", cfop: "6401", base: 1_636.02, valor: 253.07 },
  { data: "18/08/2026", cfop: "5401", base: 543.32, valor: 62.24 },
  { data: "21/08/2026", cfop: "6401", base: 654.24, valor: 101.21 },
  { data: "25/08/2026", cfop: "6401", base: 14_658.34, valor: 2_267.51 },
  { data: "28/08/2026", cfop: "6401", base: 3_502.22, valor: 504.32 },
];

export const lancamentosIcmsStAgosto: LancamentoIntegrado[] = documentosIcmsStAgosto.map((documento, indice) => ({
  id: `AGO-ICMSST-${String(indice + 1).padStart(2, "0")}`,
  data: documento.data,
  origem: "APURAÇÃO ICMS-ST 08/2026",
  debitoCodigo: "2832",
  debito: nome("2832"),
  creditoCodigo: "1542",
  credito: nome("1542"),
  historico: `ICMS-ST sobre venda de produção — CFOP ${documento.cfop}`,
  documento: `REGISTRO ICMS-ST ${documento.data}`,
  cc: "201",
  centroCusto: "VENDAS",
  valor: documento.valor,
  status: "validado",
  observacao: `Partida analítica do documento fiscal; base de cálculo R$ ${documento.base.toFixed(2)}. Operação de 01/09/2026 excluída da competência de agosto.`,
  rastreio: "documento",
  fonte: "REGISTRO APURAÇÃO ICMS ST.pdf; conferência complementar RESUMO ICMS ST MG.pdf e RESUMO ICMS ST PR.pdf",
}));

export const resumoIcmsStAgosto = {
  documentos: documentosIcmsStAgosto.length,
  impostoAgosto: 3_414.50,
  valorIndevidoSetembroExcluido: 267.72,
  totalImpressoRelatorioParametrizadoErrado: 3_682.22,
} as const;
