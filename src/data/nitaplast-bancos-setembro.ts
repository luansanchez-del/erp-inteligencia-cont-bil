import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

type Linha = readonly [id: string, data: string, valor: number, conta: string, contrapartida: string, historico: string, observacao: string, cc?: string];

/**
 * Banco do Brasil, Bradesco 895 (energia), Itaú Trust DI e Greencred — setembro/2026.
 * Valor = efeito na conta do banco/aplicação (positivo entra, negativo sai). As transferências entre
 * contas próprias já estão no Itaú (SET-ITAU-EXT-*) e no Bradesco (SET-BRAD6349-EXT-*) e não se repetem aqui.
 */
const linhas: Linha[] = [
  // Banco do Brasil 3275-1/30807-2 — extrato 01 a 30/09/2026: 7.283,15 → 3.983,18.
  ["BB-01", "03/09/2026", 3_218.31, "10", "1712", "Isolution Soluções Termo — adiantamento de cliente", "Softdib: ADIANTAMENTO DE CLIENTES."],
  ...([["412", "001"], ["415", "002"], ["423", "003"], ["437", "004"], ["439", "005"], ["443", "006"]] as const).map(([cc, parcela], i): Linha =>
    [`BB-02-${i + 1}`, "04/09/2026", -94.61, "10", "4663", `Detran PR — licenciamento de veículo (título 4092026/${parcela})`, "Licenciamento sem documento de entrada — despesa no pagamento.", cc]),
  ["BB-03", "04/09/2026", -722.5, "10", "288", "Darci Francisco dos Reis (Vidraçaria Reis) — adiantamento de OC 17091", "Softdib: TRANSFERENCIA FORNECEDOR com observação ADTO OC."],
  ["BB-04", "10/09/2026", -211.3, "10", "25104", "Tarifa pacote de serviços BB", "Tarifa bancária."],
  ["BB-05", "11/09/2026", -4.6, "10", "25104", "Tarifa pacote de serviços BB (parcela)", "Tarifa bancária."],
  ["BB-06", "23/09/2026", 3_790.76, "10", "25111", "So Nylon Comercial — duplicata NF 94838/01 (3.777,26 + 13,50)", "Recebimento de duplicata."],
  ["BB-07", "23/09/2026", -202.98, "10", "1496", "Campinense Transporte — frete CT-e 329314 (devolução de cliente)", "Pagamento de título de frete."],
  // Bradesco 895/27418-6 (energia) — conta corrente + Invest Fácil; movimento do Softdib (B23702).
  ["895-01", "09/09/2026", 600.31, "25001", "3494", "Crédito do Mercado de Energia (CCEE) na conta 895", "Recuperação de custo de energia.", "102"],
  ["895-02", "15/09/2026", -48.21, "25001", "25104", "Tarifa SERV DEP QUALIF da conta 895", "Tarifa bancária."],
  ["895-03", "18/09/2026", 5.59, "25001", "25098", "Rendimento do Invest Fácil da conta 895", "Rendimento creditado."],
  ["895-04", "21/09/2026", -2_927.52, "25001", "3494", "Encargo CCEE — energia de reserva", "Débito automático da CCEE na conta 895.", "102"],
  ["895-05", "23/09/2026", -1_828.36, "25001", "3494", "Encargo CCEE — reserva de capacidade", "Débito automático da CCEE na conta 895.", "102"],
  ["895-06", "25/09/2026", 0.39, "25001", "25098", "Rendimento do Invest Fácil da conta 895", "Rendimento creditado."],
  ["895-07", "30/09/2026", -2_448.2, "25001", "62", "Aplicação líquida no Invest Fácil da conta 895 no mês", "A conta corrente da 895 fica em R$ 1,00 e o restante aplicado no Invest Fácil (automático), como no extrato de agosto."],
  // Itaú Trust DI — posição do Softdib (B34101): 266.681,63 + aplicações 1.847.390,00 − resgates 738.800,00 = 1.375.271,63; posição final 1.380.599,55.
  ["TRUST-REND", "30/09/2026", 5_327.92, "25002", "25098", "Rendimento do Itaú Trust DI em setembro/2026", "Diferença entre a posição final do Softdib (1.380.599,55) e o saldo após aplicações e resgates."],
  // Greencred (Uniprime) — rendimentos diários do Softdib (B00003), 21 créditos.
  ["GREEN-REND", "30/09/2026", 13_152.73, "25110", "25098", "Rendimentos da aplicação Greencred em setembro/2026 (21 créditos diários)", "Mesmo critério de agosto (AGO-BAN-GREENCRED-REND). O saldo da Greencred continua com a diferença de 31/08 em conferência."],
];

export const lancamentosBancosSetembro: LancamentoIntegrado[] = linhas.map(([id, data, valor, conta, contrapartida, historico, observacao, cc]) => {
  const entrada = valor > 0;
  const debitoCodigo = entrada ? conta : contrapartida;
  const creditoCodigo = entrada ? contrapartida : conta;
  return {
    id: `SET-BAN-${id}`,
    data,
    origem: conta === "10" ? "EXTRATO BANCO DO BRASIL 09/2026" : conta === "25001" ? "BRADESCO 895 ENERGIA 09/2026" : "APLICAÇÕES FINANCEIRAS 09/2026",
    debitoCodigo,
    debito: nome(debitoCodigo),
    creditoCodigo,
    credito: nome(creditoCodigo),
    historico,
    documento: conta === "10" ? "Extrato BB 3275-1/30807-2 09/2026" : "Movimento financeiro Softdib 09/2026",
    cc: cc ?? "0",
    centroCusto: cc === "102" ? "PRODUÇÃO" : cc ? `CC ${cc}` : "SEM CENTRO DE CUSTO",
    valor: Math.abs(valor),
    status: id.startsWith("GREEN") ? "revisar" : "validado",
    observacao,
    rastreio: "documento",
    fonte: conta === "10" ? "NITA - BB.pdf (09/2026) + RELATORIO MOVIMENTO FINANCEIRO NITAPLAST 092026.csv" : "RELATORIO MOVIMENTO FINANCEIRO NITAPLAST 092026.csv",
  };
});
