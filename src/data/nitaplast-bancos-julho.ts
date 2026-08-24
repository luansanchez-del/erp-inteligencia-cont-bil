import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Bancos 07/2026 — fontes efetivamente recebidas e lidas.
 *
 * IMPORTANTE:
 * - estes controles não significam "fonte pendente"; os extratos foram recebidos;
 * - lançamentos automáticos abaixo ficam restritos a movimentos entre contas/aplicações
 *   cuja origem e contrapartida estão documentadas e já possuem mapeamento contábil;
 * - rendimentos, IOF/IRRF e demais efeitos financeiros só entram quando efetivamente
 *   documentados; variação cambial é tratada no módulo financeiro contrato a contrato,
 *   comparando o valor contábil do título com o valor efetivamente liquidado;
 * - nenhum saldo é forçado por conta transitória para fazer o banco fechar.
 */
export const controlesBancariosJulho = {
  bradesco6349: {
    contaContabil: "9",
    agenciaConta: "6349 / 3035-0",
    saldoAnteriorDisponivel: 286_600.88,
    creditosExtrato: 2_332_009.07,
    debitosExtrato: 2_542_378.68,
    saldoDisponivelFinal: 76_231.27,
    observacao: "Extrato mensal 01/07 a 31/07. O disponível inclui a liquidez automática do Invest Fácil; Maxi DI é controlado separadamente.",
  },
  itau04114: {
    contaContabil: "11",
    agenciaConta: "1656 / 04114-0",
    saldoPrincipalAnterior: 59_897.01,
    aplicacoesAutomaticas: 556_879.45,
    resgatesAutomaticosPrincipal: 492_786.76,
    saldoPrincipalFinal: 123_989.70,
    saldoLiquidoFinal: 123_989.75,
    observacao: "Resumo Itaú Julho/2026. O plano/razão legado identifica B34100 na conta 11; a numeração bancária do extrato atual é 04114-0.",
  },
  itauTrustDi: {
    contaContabil: "25002",
    saldoBrutoAnterior: 456_764.42,
    aplicacoes: 140_500.00,
    resgatesBrutos: 598_287.33,
    rendimentoBrutoMes: 1_022.91,
    iofPeriodo: 1_291.70,
    irrfPeriodo: 551.11,
    saldoBrutoFinal: 0,
    observacao: "Extrato do fundo TRUST DI. Aplicações, resgates, rendimento e retenções são reconhecidos conforme documentação disponível nas camadas finais do fechamento.",
  },
  bancoBrasil: {
    contaContabil: "10",
    agenciaConta: "3275-1 / 30807-2",
    saldoAnterior: 1_889.26,
    saldoFinal: 1_082.17,
    observacao: "Extrato Banco do Brasil de 01/07 a 31/07 recebido e lido.",
  },
  bradescoEnergia: {
    contaCorrenteContabil: "25001",
    aplicacaoContabil: "62",
    agenciaConta: "895 / 27418-6",
    saldoContaCorrenteFinal: 1.00,
    saldoAplicacaoPrincipalFinal: 5_167.32,
    saldoAplicacaoLiquidoFinal: 5_167.53,
    observacao: "Invest Fácil da conta de energia, conciliado pelas aplicações/resgates documentados do mês.",
  },
  greencred: {
    contaCorrenteContabil: "21",
    aplicacaoContabil: "25110",
    conta: "70233-1 / agência 5001",
    resgateContaCorrenteJulho: 200_000.00,
    saldoContaCorrenteFinal: 0,
    posicaoAplicacoesLiquidaFinal: 1_821_082.55,
    observacao: "Uniprime/Greencred: resgate RDC de R$ 200 mil e TED de mesma titularidade em 15/07; posição de aplicações em 31/07 também recebida.",
  },
  maxiDi: {
    principalAplicado: 500_000.00,
    saldoBrutoFinal: 500_784.95,
    saldoLiquidoFinal: 500_058.13,
    observacao: "Bradesco Maxi DI recebido. Principal e posição ficam em controle; conta analítica específica ainda deve ser confirmada no plano antes de gerar partida.",
  },
} as const;

const base = (parcial: Omit<LancamentoIntegrado, "status" | "rastreio"> & { status?: LancamentoIntegrado["status"] }): LancamentoIntegrado => ({
  ...parcial,
  status: parcial.status ?? "validado",
  rastreio: "documento",
});

/**
 * Movimentos bancários que podem ser escriturados sem inventar contrapartida.
 * Não inclui recebimentos/pagamentos de clientes/fornecedores ainda não casados
 * analiticamente, nem resultado financeiro sem documentação suficiente.
 */
export const lancamentosBancariosSegurosJulho: LancamentoIntegrado[] = [
  // Itaú — aplicação automática (principal) conforme resumo mensal.
  base({ id: "JUL-BAN-ITAU-AUTO-APL", data: "31/07/2026", origem: "ITAÚ APLICAÇÃO AUTOMÁTICA 07/2026", debitoCodigo: "54", debito: nomeConta("54"), creditoCodigo: "11", credito: nomeConta("11"), historico: "Aplicações automáticas Itaú - principal acumulado julho/2026", documento: "ITAÚ RESUMO 07/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 556_879.45, observacao: "Movimento patrimonial entre conta corrente e aplicação; sem rendimento financeiro.", fonte: "Nitaplast Itau resumo.pdf" }),
  base({ id: "JUL-BAN-ITAU-AUTO-RESG", data: "31/07/2026", origem: "ITAÚ APLICAÇÃO AUTOMÁTICA 07/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "54", credito: nomeConta("54"), historico: "Resgates automáticos Itaú - principal acumulado julho/2026", documento: "ITAÚ RESUMO 07/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 492_786.76, observacao: "Movimento patrimonial entre aplicação e conta corrente; sem rendimento financeiro.", fonte: "Nitaplast Itau resumo.pdf" }),

  // Itaú TRUST DI — somente caixa líquido efetivamente transitado, sem lançar o rendimento/tributos nesta camada.
  base({ id: "JUL-BAN-TRUST-RESG-0101", data: "01/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "25002", credito: nomeConta("25002"), historico: "Resgate líquido TRUST DI", documento: "RESG 01/07 A", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 98_000.00, observacao: "Crédito líquido no extrato bancário; rendimento e retenções são tratados na camada financeira final.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),
  base({ id: "JUL-BAN-TRUST-RESG-0102", data: "01/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "25002", credito: nomeConta("25002"), historico: "Resgate líquido TRUST DI", documento: "RESG 01/07 B", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 92_000.00, observacao: "Crédito líquido no extrato bancário; rendimento e retenções são tratados na camada financeira final.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),
  base({ id: "JUL-BAN-TRUST-APL-0207", data: "02/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "25002", debito: nomeConta("25002"), creditoCodigo: "11", credito: nomeConta("11"), historico: "Aplicação TRUST DI", documento: "APL 02/07", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 58_500.00, observacao: "Aplicação principal conforme extrato bancário/fundo.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),
  base({ id: "JUL-BAN-TRUST-RESG-0607", data: "06/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "25002", credito: nomeConta("25002"), historico: "Resgate líquido TRUST DI", documento: "RESG 06/07", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 272_000.00, observacao: "Crédito líquido no banco; rendimento e retenções são tratados na camada financeira final.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),
  base({ id: "JUL-BAN-TRUST-APL-0807", data: "08/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "25002", debito: nomeConta("25002"), creditoCodigo: "11", credito: nomeConta("11"), historico: "Aplicação TRUST DI", documento: "APL 08/07", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 82_000.00, observacao: "Aplicação principal conforme extrato bancário/fundo.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),
  base({ id: "JUL-BAN-TRUST-RESG-1007", data: "10/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "25002", credito: nomeConta("25002"), historico: "Resgate líquido TRUST DI", documento: "RESG 10/07", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 30_000.00, observacao: "Crédito líquido no banco; rendimento e retenções são tratados na camada financeira final.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),
  base({ id: "JUL-BAN-TRUST-RESG-1307", data: "13/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "25002", credito: nomeConta("25002"), historico: "Resgate líquido TRUST DI", documento: "RESG 13/07", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 93_000.00, observacao: "Crédito líquido no banco; rendimento e retenções são tratados na camada financeira final.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),
  base({ id: "JUL-BAN-TRUST-RESG-2007", data: "20/07/2026", origem: "ITAÚ TRUST DI 07/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "25002", credito: nomeConta("25002"), historico: "Resgate líquido TRUST DI", documento: "RESG 20/07", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 11_444.52, observacao: "Crédito líquido no banco; rendimento e retenções são tratados na camada financeira final.", fonte: "NITA - ITAU(1).pdf + Nitaplast Itau fundo.pdf" }),

  // Bradesco 895 energia — aplicação/resgate Invest Fácil com contrapartidas já usadas em junho.
  base({ id: "JUL-BAN-BRAD895-APL-0807", data: "08/07/2026", origem: "BRADESCO 895 INVEST FÁCIL 07/2026", debitoCodigo: "62", debito: nomeConta("62"), creditoCodigo: "25001", credito: nomeConta("25001"), historico: "Aplicação Invest Fácil Bradesco 895", documento: "1262746149226", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 249.52, observacao: "Principal transferido da conta corrente para aplicação.", fonte: "Bradesco energia.pdf" }),
  base({ id: "JUL-BAN-BRAD895-APL-1607", data: "16/07/2026", origem: "BRADESCO 895 INVEST FÁCIL 07/2026", debitoCodigo: "62", debito: nomeConta("62"), creditoCodigo: "25001", credito: nomeConta("25001"), historico: "Aplicação Invest Fácil Bradesco 895", documento: "1262754626461", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 2_878.70, observacao: "Principal transferido da conta corrente para aplicação.", fonte: "Bradesco energia.pdf" }),
  base({ id: "JUL-BAN-BRAD895-APL-2107", data: "21/07/2026", origem: "BRADESCO 895 INVEST FÁCIL 07/2026", debitoCodigo: "62", debito: nomeConta("62"), creditoCodigo: "25001", credito: nomeConta("25001"), historico: "Aplicação Invest Fácil Bradesco 895", documento: "1262759030555", cc: "0", centroCusto:"SEM CENTRO DE CUSTO", valor: 2_225.27, observacao: "Principal transferido da conta corrente para aplicação.", fonte: "Bradesco energia.pdf" }),
  ...([
    ["1507", "15/07/2026", "48.21"],
    ["2007", "20/07/2026", "2878.70"],
    ["2307", "23/07/2026", "523.36"],
    ["2707A", "27/07/2026", "1023.46"],
    ["2707B", "27/07/2026", "492.27"],
    ["2707C", "27/07/2026", "186.18"],
  ] as const).map(([sufixo, data, valor]) => base({ id: `JUL-BAN-BRAD895-RESG-${sufixo}`, data, origem: "BRADESCO 895 INVEST FÁCIL 07/2026", debitoCodigo: "25001", debito: nomeConta("25001"), creditoCodigo: "62", credito: nomeConta("62"), historico: "Resgate líquido Invest Fácil Bradesco 895", documento: `RESG ${data}`, cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: Number(valor), observacao: "Crédito líquido na conta corrente; rendimento/tributos não reconhecidos nesta etapa.", fonte: "Bradesco energia.pdf" })),

  // Greencred/Uniprime — resgate e transferência de mesma titularidade identificados no mesmo dia.
  base({ id: "JUL-BAN-GREEN-RESG-1507", data: "15/07/2026", origem: "UNIPRIME/GREENCRED 07/2026", debitoCodigo: "21", debito: nomeConta("21"), creditoCodigo: "25110", credito: nomeConta("25110"), historico: "Resgate RDC Greencred para conta corrente", documento: "500021899", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 200_000.00, status: "revisar", observacao: "Caixa do resgate é documental; composição entre principal e rendimento permanece em revisão para respeitar a exclusão do resultado financeiro.", fonte: "UNIPRIME - NITA(3).pdf + Aplic Nitaplast Greencred.pdf" }),
  base({ id: "JUL-BAN-GREEN-TED-1507", data: "15/07/2026", origem: "TRANSFERÊNCIA ENTRE BANCOS 07/2026", debitoCodigo: "9", debito: nomeConta("9"), creditoCodigo: "21", credito: nomeConta("21"), historico: "TED mesma titularidade Greencred para Bradesco", documento: "30350 / REMET NITAPLAST 15/07", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 200_000.00, observacao: "Saída de R$ 200 mil no Uniprime e crédito de R$ 200 mil no Bradesco em 15/07.", fonte: "UNIPRIME - NITA(3).pdf + NITA - BRADESCO(1).pdf" }),
];

export const resumoIntegracaoBancariaJulho = {
  fontesRecebidas: [
    "NITA - BRADESCO(1).pdf",
    "NITA - ITAU(1).pdf",
    "NITA - BB(1).pdf",
    "UNIPRIME - NITA(3).pdf",
    "Bradesco Invest fácil.pdf",
    "Bradesco Maxi DI.pdf",
    "Bradesco Maxi DI posição consolidada mensal.pdf",
    "Bradesco energia.pdf",
    "Bradesco energia 1(1).pdf",
    "Bradesco energia 2(1).pdf",
    "Aplic Nitaplast Greencred.pdf",
    "Nitaplast Itau consolidado.pdf",
    "Nitaplast Itau detalhado.pdf",
    "Nitaplast Itau fundo.pdf",
    "Nitaplast Itau resumo.pdf",
  ],
  movimentosPatrimoniaisIntegrados: lancamentosBancariosSegurosJulho.length,
  situacao: "extratos recebidos e lidos; movimentos patrimoniais seguros já integrados; recebimentos/pagamentos seguem casamento analítico com clientes e fornecedores",
} as const;