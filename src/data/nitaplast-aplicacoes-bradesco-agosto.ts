import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const base = (linha: Omit<LancamentoIntegrado, "debito" | "credito" | "status" | "rastreio">): LancamentoIntegrado => ({
  ...linha,
  debito: nome(linha.debitoCodigo),
  credito: nome(linha.creditoCodigo),
  status: "validado",
  rastreio: "documento",
});

const aplicacoes = [
  ["03/08/2026", 31_124.53], ["04/08/2026", 29_439.43],
  ["06/08/2026", 50_735.12], ["07/08/2026", 37_175.53],
  ["11/08/2026", 53_499.97], ["17/08/2026", 236_995.42],
  ["19/08/2026", 75_362.19], ["21/08/2026", 106_053.34],
  ["24/08/2026", 178_122.32], ["28/08/2026", 133_765.49],
] as const;

const resgates = [
  ["05/08/2026", 21_852.02, 0.91, 0.72, 0.05],
  ["13/08/2026", 54_378.25, 5.66, 2.99, 0.60],
  ["13/08/2026", 31_124.53, 2.58, 1.70, 0.19],
  ["13/08/2026", 29_439.43, 2.13, 1.49, 0.14],
  ["13/08/2026", 2_343.92, 0.11, 0.09, 0],
  ["14/08/2026", 2_427.22, 0.15, 0.10, 0.02],
  ["20/08/2026", 45_963.98, 4.74, 2.51, 0.50],
  ["20/08/2026", 37_175.53, 3.45, 1.93, 0.34],
  ["20/08/2026", 18_365.31, 1.32, 0.92, 0.09],
  ["25/08/2026", 35_134.66, 3.63, 1.92, 0.38],
  ["25/08/2026", 236_995.42, 14.69, 10.72, 0.89],
  ["25/08/2026", 75_362.19, 3.11, 2.48, 0.14],
  ["25/08/2026", 106_053.34, 2.19, 1.88, 0.06],
  ["25/08/2026", 37_412.48, 0.37, 0.36, 0],
] as const;

const posicaoFinal = [
  ["24/08/2026", 140_709.84, 7.26],
  ["28/08/2026", 133_765.49, 1.38],
] as const;

export const lancamentosBradescoInvestFacilAgosto: LancamentoIntegrado[] = [
  ...aplicacoes.map(([data, valor], indice) => base({
    id: `AGO-BRAD6349-APL-${String(indice + 1).padStart(2, "0")}`,
    data, origem: "BRADESCO INVEST FÁCIL 08/2026", debitoCodigo: "62", creditoCodigo: "9",
    historico: "Aplicação em CDB Bradesco Invest Fácil", documento: `APLICAÇÃO ${data}`,
    cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor,
    observacao: "Transferência de principal da conta corrente para a aplicação, individualizada pela data do certificado.",
    fonte: "Nitaplast Bradesco Invest Facil.pdf",
  })),
  ...resgates.flatMap(([data, principal, rendimento, iof, irrf], indice) => {
    const numero = String(indice + 1).padStart(2, "0");
    const comuns = { data, origem: "BRADESCO INVEST FÁCIL 08/2026", documento: `RESGATE ${data}`, cc: "902", centroCusto: "DESPESAS FINANCEIRAS", fonte: "Nitaplast Bradesco Invest Facil.pdf" };
    return [
      base({ ...comuns, id: `AGO-BRAD6349-RESG-PRINC-${numero}`, debitoCodigo: "9", creditoCodigo: "62", historico: "Resgate de principal do CDB Bradesco Invest Fácil", valor: principal, observacao: "Principal resgatado, separado do rendimento e dos tributos." }),
      base({ ...comuns, id: `AGO-BRAD6349-RESG-REND-${numero}`, debitoCodigo: "9", creditoCodigo: "25098", historico: "Rendimento bruto realizado no resgate do CDB Bradesco Invest Fácil", valor: rendimento, observacao: "Receita financeira bruta individualizada por resgate." }),
      ...(iof > 0 ? [base({ ...comuns, id: `AGO-BRAD6349-RESG-IOF-${numero}`, debitoCodigo: "25105", creditoCodigo: "9", historico: "IOF retido no resgate do CDB Bradesco Invest Fácil", valor: iof, observacao: "IOF efetivamente retido no resgate." })] : []),
      ...(irrf > 0 ? [base({ ...comuns, id: `AGO-BRAD6349-RESG-IRRF-${numero}`, debitoCodigo: "25118", creditoCodigo: "9", historico: "IRRF retido no resgate do CDB Bradesco Invest Fácil", valor: irrf, observacao: "IRRF efetivamente retido, reconhecido como tributo a recuperar." })] : []),
    ];
  }),
  ...posicaoFinal.map(([data, principal, rendimento], indice) => base({
    id: `AGO-BRAD6349-REND-ABERTO-${String(indice + 1).padStart(2, "0")}`,
    data: "31/08/2026", origem: "BRADESCO INVEST FÁCIL 08/2026", debitoCodigo: "62", creditoCodigo: "25098",
    historico: `Rendimento apropriado do certificado aplicado em ${data}`,
    documento: `POSIÇÃO FINAL ${data}`, cc: "902", centroCusto: "DESPESAS FINANCEIRAS", valor: rendimento,
    observacao: `Rendimento bruto da posição ainda aberta; principal do certificado R$ ${principal.toFixed(2)}. IOF/IR projetados não foram contabilizados como retenção antes do resgate.`,
    fonte: "Nitaplast Bradesco Invest Facil.pdf",
  })),
];

export const revisaoBradescoFundoAgosto = {
  id: "AGO-REV-BRADESCO-FUNDO",
  status: "revisar",
  motivo: "Extrato do Fundo DI apresenta apenas totais consolidados de R$ 620.000,00 em aplicações e R$ 1.120.000,00 de principal resgatado, sem datas/certificados analíticos. Não contabilizar como partida fechada.",
  rendimentoDoMes: 2_296.88,
  iof: 1_816.68,
  irrf: 284.62,
  contabilizadoNoRazao: false,
} as const;

