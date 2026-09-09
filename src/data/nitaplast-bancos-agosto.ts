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
 * - Itaú Trust DI, Greencred/Uniprime e Maxi DI: sem resumo mensal dedicado
 *   recebido para 08/2026 (só o que aparece dentro do SOFTDIB, já coberto pelo
 *   JSON de importação com conta transitória 4859 como contrapartida, pendente de
 *   reclassificação). Ficam de fora daqui até chegar documentação equivalente à de
 *   julho.
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
];
