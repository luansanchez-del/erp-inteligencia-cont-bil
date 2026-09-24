import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Bancos 08/2026 — preparado em paralelo ao motor genérico de competência
 * (`@/hooks/use-lancamentos-competencia`), que já recebeu a leitura completa dos
 * extratos (BB, Itaú, SOFTDIB) via importação. Este arquivo segue o padrão de
 * `nitaplast-bancos-julho.ts`: só entram aqui movimentos cuja origem e
 * contrapartida estão documentadas com certeza, sem forçar saldo por conta
 * transitória.
 *
 * IMPORTANTE — diferença deliberada frente a julho:
 * - BB e Itaú NÃO são repetidos aqui. O extrato BB bate 100% com o SOFTDIB (11/11
 *   movimentos) e o extrato Itaú fecha sozinho (532 linhas, 0 achados após a
 *   correção do saldo de referência — ver `extrato-bancario.ts`), então os dois já
 *   estão cobertos pelo JSON de importação gerado para o motor genérico
 *   (`scripts/gerar-import-agosto.mjs`), linha a linha, com rastreio ao documento.
 *   Não faz sentido duplicar manualmente aqui o que já foi lido automaticamente.
 * - Bradesco 895 (conta de energia) é a única fonte deste mês com extrato PDF
 *   completo E anexo de obrigações CCEE (Smart Energia) cruzando os mesmos valores
 *   — por isso é o único bloco com lançamentos individuais abaixo.
 * - Itaú Trust DI: zerada desde 31/07/2026 (confirmado no extrato oficial de
 *   fundos "Nitaplast Itau fundo.pdf" — Saldo Líquido R$ 0,00), sem aplicação
 *   nova em agosto — nada a lançar.
 * - Itaú aplicação automática (conta 54, agência/conta 1656/04114-0): tinha
 *   essa observação como "sem resumo recebido" — corrigido em 23/09/2026, o
 *   resumo mensal ("Nitaplast Itaú resumo.pdf") foi localizado e está lançado
 *   abaixo.
 * - Greencred: a posição de 31/08 (Greencred Nitaplast.pdf) traz juros e IR
 *   acumulados desde a aplicação (uma delas de 30/05/2025), não o movimento do
 *   mês. Para isolar agosto, comparou-se com a posição de 31/07/2026 (mesmo
 *   relatório, mês anterior) e, principalmente, com o EXTRATO MOVIMENTO
 *   082026 - SISTEMA CLIENTE SOFTDIB, que já traz o movimento diário das duas
 *   contas Greencred (B00002 conta-corrente e B00003 aplicação) com
 *   classificação própria: "RENDIMENTO APLIC. FINANCEIRA" (gerencial
 *   09.01.002) e "TRANSF. - MESMA TITULARIDADE" (gerencial 90.01.001) para os
 *   resgates parciais transferidos à conta corrente da própria Greencred (não
 *   saem do grupo). O SOFTDIB não lança provisão de IR mensal sobre os títulos
 *   não resgatados — só o rendimento bruto — por isso não foi criada partida
 *   de IR a recuperar (conta 25118) sem lastro na fonte.
 */
export const controlesBancariosAgosto = {
  bancoBrasil: {
    contaContabil: "10",
    agenciaConta: "3275-1 / 30807-2",
    observacao: "Extrato Banco do Brasil 01/08 a 31/08 lido via PDF; 11/11 movimentos batem exatamente com o SOFTDIB (mesma data e valor). Lançamentos completos no JSON de importação do motor genérico, não repetidos aqui.",
  },
  itau04114: {
    contaContabil: "11",
    agenciaConta: "1656 / 04114-0",
    observacao: "Extrato Itaú 01/08 a 31/08 lido via PDF (532 linhas, fecha com 0 achados). 489/532 linhas batem com o SOFTDIB; 43 movimentos reais do banco (SISPAG salários/tributos, boletos, PIX/TED a fornecedores) não aparecem no SOFTDIB — o extrato PDF é a fonte usada para esta conta, e não o SOFTDIB. Lançamentos completos no JSON de importação do motor genérico, não repetidos aqui.",
  },
  bradescoEnergia: {
    contaCorrenteContabil: "25001",
    aplicacaoContabil: "62",
    agenciaConta: "895 / 27418-6",
    saldoContaCorrenteFinal: 1.00,
    observacao: "Conta dedicada a obrigações CCEE (Câmara de Comercialização de Energia Elétrica), operada via Bradesco Invest Fácil: os recursos entram, são aplicados automaticamente e resgatados na data de vencimento de cada obrigação. Conciliado com o anexo 'Smart Energia' (relatórios de Energia de Reserva, Reserva de Capacidade e Cotas de Energia Nuclear CCEE referência Agosto/2026).",
  },
  greencred: {
    status: "validado",
    contaAplicacao: "25110",
    contaContaCorrente: "21",
    agenciaConta: "5001 / 70233-1",
    saldoLiquidoExtrato: 1_536_985.11,
    jurosAcumuladosTitulos: 224_591.31,
    irProjetadoAcumulado: 42_953.36,
    rendimentoAgosto: 15_788.36,
    resgatesAgosto: 300_000.00,
    observacao: "Posição de 31/08/2026 (Greencred Nitaplast.pdf) comparada com a de 31/07/2026 e com o movimento diário do EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB: rendimento bruto de agosto R$ 15.788,36 (conta 25110, aplicação Capital Coop Green Cred) e dois resgates parciais (R$ 140.000,00 + R$ 160.000,00) transferidos para a conta corrente da própria Greencred (conta 21), sem saída do grupo.",
    fonte: "Greencred Nitaplast.pdf + Aplic Nitaplast Greencred.pdf (31/07/2026) + EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv",
  },
} as const;

const base = (parcial: Omit<LancamentoIntegrado, "status" | "rastreio"> & { status?: LancamentoIntegrado["status"] }): LancamentoIntegrado => ({
  ...parcial,
  status: parcial.status ?? "validado",
  rastreio: "documento",
});

/**
 * Bradesco 895 (energia) — obrigações CCEE de referência Agosto/2026, cada uma com
 * o par aplicação (entrada de recursos na conta) / resgate (liquidação do encargo
 * na data de vencimento), no mesmo padrão de `lancamentosBancariosSegurosJulho`.
 * Valores conferidos simultaneamente no extrato Bradesco (frente/verso) e no
 * relatório "Smart Energia" (anexo enviado com os extratos).
 */
export const lancamentosBancariosSegurosAgosto: LancamentoIntegrado[] = [
  // Energia de Reserva CCEE — referência Agosto/2026, depositar até 18/08.
  base({ id: "AGO-BAN-BRAD895-APL-ENERGRES", data: "18/08/2026", origem: "BRADESCO 895 INVEST FÁCIL 08/2026", debitoCodigo: "62", debito: nomeConta("62"), creditoCodigo: "25001", credito: nomeConta("25001"), historico: "Aplicação Invest Fácil Bradesco 895 - Energia de Reserva CCEE Ago/2026", documento: "6349902", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 3_087.46, observacao: "Principal transferido da conta corrente para aplicação, para pagamento do encargo de Energia de Reserva CCEE.", fonte: "Bradesco energia (extrato + anexo Smart Energia).pdf" }),
  base({ id: "AGO-BAN-BRAD895-RESG-ENERGRES", data: "19/08/2026", origem: "BRADESCO 895 INVEST FÁCIL 08/2026", debitoCodigo: "25001", debito: nomeConta("25001"), creditoCodigo: "62", credito: nomeConta("62"), historico: "Resgate Invest Fácil e pagamento do encargo Energia de Reserva CCEE Ago/2026", documento: "0089519", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 3_087.46, observacao: "Liquidação do boleto CCEE de Energia de Reserva; contrapartida (despesa) pendente de reclassificação da conta transitória.", fonte: "Bradesco energia (extrato + anexo Smart Energia).pdf" }),

  // Reserva de Capacidade CCEE — referência Agosto/2026, depositar até 24/08.
  base({ id: "AGO-BAN-BRAD895-APL-RESCAP", data: "21/08/2026", origem: "BRADESCO 895 INVEST FÁCIL 08/2026", debitoCodigo: "62", debito: nomeConta("62"), creditoCodigo: "25001", credito: nomeConta("25001"), historico: "Aplicação Invest Fácil Bradesco 895 - Reserva de Capacidade CCEE Ago/2026", documento: "6349615", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 707.67, observacao: "Principal transferido da conta corrente para aplicação, para pagamento do encargo de Reserva de Capacidade CCEE.", fonte: "Bradesco energia (extrato + anexo Smart Energia).pdf" }),
  base({ id: "AGO-BAN-BRAD895-RESG-RESCAP", data: "25/08/2026", origem: "BRADESCO 895 INVEST FÁCIL 08/2026", debitoCodigo: "25001", debito: nomeConta("25001"), creditoCodigo: "62", credito: nomeConta("62"), historico: "Resgate Invest Fácil e pagamento do encargo Reserva de Capacidade CCEE Ago/2026", documento: "0089525", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 707.67, observacao: "Liquidação do boleto CCEE de Reserva de Capacidade; contrapartida (despesa) pendente de reclassificação da conta transitória.", fonte: "Bradesco energia (extrato + anexo Smart Energia).pdf" }),

  // Cotas de Energia Nuclear CCEE — referência Agosto/2026, depositar até 26/08.
  base({ id: "AGO-BAN-BRAD895-APL-ENUCLEAR", data: "24/08/2026", origem: "BRADESCO 895 INVEST FÁCIL 08/2026", debitoCodigo: "62", debito: nomeConta("62"), creditoCodigo: "25001", credito: nomeConta("25001"), historico: "Aplicação Invest Fácil Bradesco 895 - Cotas de Energia Nuclear CCEE Ago/2026", documento: "6349047", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 1_535.11, observacao: "Principal transferido da conta corrente para aplicação, para pagamento do encargo de Cotas de Energia Nuclear CCEE.", fonte: "Bradesco energia (extrato + anexo Smart Energia).pdf" }),
  base({ id: "AGO-BAN-BRAD895-RESG-ENUCLEAR", data: "27/08/2026", origem: "BRADESCO 895 INVEST FÁCIL 08/2026", debitoCodigo: "25001", debito: nomeConta("25001"), creditoCodigo: "62", credito: nomeConta("62"), historico: "Resgate Invest Fácil e pagamento do encargo Cotas de Energia Nuclear CCEE Ago/2026", documento: "0089527", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 1_535.11, observacao: "Liquidação do boleto CCEE de Cotas de Energia Nuclear; contrapartida (despesa) pendente de reclassificação da conta transitória.", fonte: "Bradesco energia (extrato + anexo Smart Energia).pdf" }),

  // Greencred — rendimento e resgate parcial de agosto, apurados por comparação
  // com a posição de 31/07 e o movimento diário do SOFTDIB (ver observação acima).
  base({ id: "AGO-BAN-GREENCRED-REND", data: "31/08/2026", origem: "GREENCRED APLICAÇÃO 08/2026", debitoCodigo: "25110", debito: nomeConta("25110"), creditoCodigo: "2859", credito: nomeConta("2859"), historico: "Rendimento de agosto — aplicações Capital Coop Green Cred (CDI-MAX)", documento: "Greencred Nitaplast.pdf (posição 31/08) × Aplic Nitaplast Greencred.pdf (posição 31/07)", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 15_788.36, observacao: "Soma dos lançamentos diários 'RENDIMENTO APLIC. FINANCEIRA' (gerencial 09.01.002) da conta B00003 no EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB; bate com a variação de juros+correção entre as posições de 31/07 e 31/08 descontado o efeito dos resgates.", fonte: "EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv" }),
  base({ id: "AGO-BAN-GREENCRED-RESG", data: "17/08/2026", origem: "GREENCRED APLICAÇÃO 08/2026", debitoCodigo: "21", debito: nomeConta("21"), creditoCodigo: "25110", credito: nomeConta("25110"), historico: "Resgate parcial de aplicações — transferência interna Greencred aplicação → conta corrente", documento: "TRANSF DO B00003 . (2x)", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 300_000.00, observacao: "Dois resgates de R$ 140.000,00 e R$ 160.000,00 em 17/08/2026, transferidos da aplicação (B00003) para a conta corrente Greencred (B00002) — mesma titularidade, sem saída do grupo. Confirmado pelo EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB e pela queda equivalente no líquido resgatado entre as posições de 31/07 e 31/08.", fonte: "EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv" }),

  // Itaú aplicação automática (conta 54, ag/conta 1656/04114-0) — achado em
  // 23/09/2026 ao investigar a pendência de aplicação financeira do cliente.
  // Resumo mensal oficial ("Nitaplast Itaú resumo.pdf", período Agosto/2026):
  //   Saldo em 31/07/2026 (líquido)   123.989,75
  //   Aplicações no mês                332.595,90
  //   Rendimento apurado (líquido)          1,36
  //   Resgates antec. e vencimentos    388.799,07
  //   Saldo em 31/08/2026 (líquido)    67.787,94
  // Confere exatamente com a abertura já corrigida em junho (ver
  // APL-ITAU-AUTO-RECLASS-001 em nitaplast-aplicacoes-junho.ts) mais a
  // reconciliação de julho já existente (JUL-APL-ITAU-AUTO-001 a 005) — fecha
  // em R$ 123.990,14, batendo com o saldo de abertura de agosto do resumo
  // (diferença de R$ 0,39, imaterial).
  base({ id: "AGO-BAN-ITAU-AUTO-APL", data: "31/08/2026", origem: "ITAÚ APLICAÇÃO AUTOMÁTICA 08/2026", debitoCodigo: "54", debito: nomeConta("54"), creditoCodigo: "11", credito: nomeConta("11"), historico: "Aplicações do mês — Itaú aplicação automática 04114-0", documento: "Nitaplast Itaú resumo.pdf, agência 1656 / conta 04114-0", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 332_595.90, observacao: "Total de aplicações de agosto/2026 conforme resumo mensal Itaú.", fonte: "Nitaplast Itaú resumo.pdf" }),
  base({ id: "AGO-BAN-ITAU-AUTO-RESG", data: "31/08/2026", origem: "ITAÚ APLICAÇÃO AUTOMÁTICA 08/2026", debitoCodigo: "11", debito: nomeConta("11"), creditoCodigo: "54", credito: nomeConta("54"), historico: "Resgates antecipados e vencimentos do mês — Itaú aplicação automática 04114-0", documento: "Nitaplast Itaú resumo.pdf, agência 1656 / conta 04114-0", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: 388_799.07, observacao: "Total líquido de resgates/vencimentos de agosto/2026 (já descontados IOF R$ 7,77 e IR R$ 0,27 do mês) conforme resumo mensal Itaú.", fonte: "Nitaplast Itaú resumo.pdf" }),
  base({ id: "AGO-BAN-ITAU-AUTO-REND", data: "31/08/2026", origem: "ITAÚ APLICAÇÃO AUTOMÁTICA 08/2026", debitoCodigo: "54", debito: nomeConta("54"), creditoCodigo: "25098", credito: nomeConta("25098"), historico: "Rendimento líquido apurado no mês — Itaú aplicação automática 04114-0", documento: "Nitaplast Itaú resumo.pdf, agência 1656 / conta 04114-0", cc: "901", centroCusto: "RECEITAS FINANCEIRAS", valor: 1.36, observacao: "Rendimento líquido apurado no mês (referente às operações resgatadas e ao saldo remanescente), conforme resumo mensal Itaú.", fonte: "Nitaplast Itaú resumo.pdf" }),
];
