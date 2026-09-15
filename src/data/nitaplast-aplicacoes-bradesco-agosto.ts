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

/**
 * Bradesco Maxi DI / Fundo DI (BRADESCO FIC FI RF REFERENCIADO DI, conta
 * 06349-5 | 0003035-0) — mesma posição que ficou em revisão em julho
 * (`nitaplast-bancos-julho.ts`, `controlesBancariosJulho.maxiDi`, saldo bruto
 * final R$ 500.784,95). O extrato "Nitaplast Bradesco Fundo.pdf" (emitido
 * 02/09/2026) só traz totais consolidados do mês (sem certificado a
 * certificado), mas a posição fechou em zero em 31/08/2026, o que permite
 * reconciliar e lançar sem inventar detalhe diário:
 *
 *   Saldo anterior (31/07, já lançado em julho)     500.784,95
 * + Aplicações do mês                               620.000,00
 * + Rendimento NOVO de agosto (ainda não reconhecido)  2.296,88
 * - Resgate bruto (principal + rendimento acumulado
 *   nas cotas resgatadas)                         1.123.081,83
 * = Saldo final (31/08)                                   0,00
 *
 * O rendimento novo de agosto (R$ 2.296,88) é a diferença entre a Renda Total
 * do resgate (R$ 3.081,83) e o que já havia sido reconhecido em julho
 * (R$ 784,95, ver JUL-APL-MAXI-002 em nitaplast-bancos-julho-completo.ts) —
 * evita reconhecer de novo receita já lançada no mês anterior. Mesmas contas
 * usadas em julho para este fundo (62 aplicação, 9 conta corrente, 25098
 * receita financeira, 25105 IOF, 25118 IRRF).
 */
export const lancamentosBradescoFundoAgosto: LancamentoIntegrado[] = [
  base({
    id: "AGO-BRADFUNDO-APL",
    data: "31/08/2026",
    origem: "BRADESCO FIC FI RF REFERENCIADO DI 08/2026",
    debitoCodigo: "62",
    creditoCodigo: "9",
    historico: "Aplicação no Fundo Bradesco Maxi DI (FIC FI RF Referenciado DI) - total do mês",
    documento: "APLICAÇÕES 08/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 620_000.00,
    observacao: "Total de aplicações do mês, conforme extrato consolidado do fundo (sem detalhamento diário; a posição fecha em zero em 31/08, o que permite conciliar pelo total).",
    fonte: "Nitaplast Bradesco Fundo.pdf",
  }),
  base({
    id: "AGO-BRADFUNDO-REND",
    data: "31/08/2026",
    origem: "BRADESCO FIC FI RF REFERENCIADO DI 08/2026",
    debitoCodigo: "62",
    creditoCodigo: "25098",
    historico: "Rendimento bruto do mês do Fundo Bradesco Maxi DI - parcela ainda não reconhecida",
    documento: "APLICAÇÕES 08/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 2_296.88,
    observacao: "Rendimento do mês (cota 31/07 1,9394477 → 31/08 1,9609798), líquido do que já foi reconhecido em julho.",
    fonte: "Nitaplast Bradesco Fundo.pdf",
  }),
  base({
    id: "AGO-BRADFUNDO-RESG",
    data: "31/08/2026",
    origem: "BRADESCO FIC FI RF REFERENCIADO DI 08/2026",
    debitoCodigo: "9",
    creditoCodigo: "62",
    historico: "Resgate total do Fundo Bradesco Maxi DI - baixa de principal e rendimento acumulado",
    documento: "RESGATES 08/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 1_123_081.83,
    observacao: "Baixa bruta da posição: principal R$ 1.120.000,00 + renda total R$ 3.081,83 das cotas resgatadas (já coberta pelo saldo anterior de julho + rendimento de agosto acima). Zera a conta 62 para este fundo em 31/08/2026, conforme extrato.",
    fonte: "Nitaplast Bradesco Fundo.pdf",
  }),
  base({
    id: "AGO-BRADFUNDO-IOF",
    data: "31/08/2026",
    origem: "BRADESCO FIC FI RF REFERENCIADO DI 08/2026",
    debitoCodigo: "25105",
    creditoCodigo: "9",
    historico: "IOF retido no resgate do Fundo Bradesco Maxi DI",
    documento: "RESGATES 08/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 1_816.68,
    observacao: "IOF efetivamente retido no resgate, conforme extrato.",
    fonte: "Nitaplast Bradesco Fundo.pdf",
  }),
  base({
    id: "AGO-BRADFUNDO-IRRF",
    data: "31/08/2026",
    origem: "BRADESCO FIC FI RF REFERENCIADO DI 08/2026",
    debitoCodigo: "25118",
    creditoCodigo: "9",
    historico: "IRRF retido no resgate do Fundo Bradesco Maxi DI",
    documento: "RESGATES 08/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 284.62,
    observacao: "IRRF efetivamente retido no resgate; base de cálculo R$ 1.265,15 conforme extrato.",
    fonte: "Nitaplast Bradesco Fundo.pdf",
  }),
];

export const revisaoBradescoFundoAgosto = {
  id: "AGO-REV-BRADESCO-FUNDO",
  status: "validado",
  motivo: "Resolvido: extrato do Fundo DI reconciliado pelo total do mês (posição fechou em zero em 31/08), lançado em lancamentosBradescoFundoAgosto seguindo o mesmo padrão de contas usado em julho para este fundo.",
  rendimentoDoMes: 2_296.88,
  iof: 1_816.68,
  irrf: 284.62,
  contabilizadoNoRazao: true,
} as const;

