import type { LancamentoIntegrado } from "./nitaplast-razao-base";

/**
 * Pagamento, em 31/08/2026, dos DARFs de estimativa de IRPJ/CSLL da competência
 * 07/2026 — mesmo padrão de julho (JUL-BAN-OP-036/037: débito na antecipação,
 * crédito no Itaú na data do pagamento).
 *
 * Extrato Itaú 04114 (NITA - ITAU.pdf): 31/08/2026 "SISPAG TRIBUTOS DARF"
 * −41.023,21 = 29.487,70 + 11.535,51. Relação de Pagamentos Efetuados 08/2026:
 * I00011 PROV. IMPOSTO DE RENDA 29.487,70 e I00010 PROV. CONTRIB. SOCIAL
 * 11.535,51, ambos pagos em 31/08/2026 pelo banco B34100 (Itaú).
 */
export const darfIrpjCsllPagoAgosto = { irpj: 29_487.7, csll: 11_535.51 } as const;

export const lancamentosDarfIrpjCsllAgosto: LancamentoIntegrado[] = [
  {
    id: "AGO-DARF-IRPJ-072026",
    data: "31/08/2026",
    origem: "PAGAMENTOS EFETUADOS 08/2026",
    debitoCodigo: "25119",
    debito: "25119 - ANTECIPAÇÃO IMPOSTO DE RENDA RECOLHIDO POR ESTIM",
    creditoCodigo: "11",
    credito: "11 - Banco Itaú 1656 02182-9",
    historico: "IRPJ estimativa 07/2026 — DARF pago em 31/08/2026",
    documento: "Relação de Pagamentos I00011 / Extrato Itaú 31/08/2026 SISPAG TRIBUTOS DARF",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: darfIrpjCsllPagoAgosto.irpj,
    status: "validado",
    observacao: "Parte do débito de R$ 41.023,21 no extrato Itaú de 31/08 (IRPJ 29.487,70 + CSLL 11.535,51).",
    rastreio: "documento",
    fonte: "RELAÇÃO DE PAGAMENTOS EFETUADOS 082026.pdf + EXTRATOS 082026/08 - AGOSTO - 2026/NITA - ITAU.pdf",
  },
  {
    id: "AGO-DARF-CSLL-072026",
    data: "31/08/2026",
    origem: "PAGAMENTOS EFETUADOS 08/2026",
    debitoCodigo: "25120",
    debito: "25120 - ANTECIPAÇÃO CONTRIBUIÇÃO SOCIAL RECOLHIDA POR EST",
    creditoCodigo: "11",
    credito: "11 - Banco Itaú 1656 02182-9",
    historico: "CSLL estimativa 07/2026 — DARF pago em 31/08/2026",
    documento: "Relação de Pagamentos I00010 / Extrato Itaú 31/08/2026 SISPAG TRIBUTOS DARF",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: darfIrpjCsllPagoAgosto.csll,
    status: "validado",
    observacao: "Parte do débito de R$ 41.023,21 no extrato Itaú de 31/08 (IRPJ 29.487,70 + CSLL 11.535,51).",
    rastreio: "documento",
    fonte: "RELAÇÃO DE PAGAMENTOS EFETUADOS 082026.pdf + EXTRATOS 082026/08 - AGOSTO - 2026/NITA - ITAU.pdf",
  },
];
