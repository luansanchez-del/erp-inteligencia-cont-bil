import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Acertos dos saldos bancários de 31/08/2026 carregados para setembro (decisão do usuário em
 * 07/10/2026: agosto fechado não muda; as diferenças de julho/agosto são acertadas em 09/2026).
 *
 * Saldos reais em 31/08/2026 (extratos):
 * - Bradesco 895/27418-6: conta corrente 1,00 e Invest Fácil 6.364,52 ("Extrato frente.pdf", saldos de 01/09);
 * - Bradesco 6349: conta corrente 25.767,29 e Invest Fácil 274.483,97 (extrato 08/2026);
 * - conta 62 reúne os dois Invest Fácil: 274.483,97 + 6.364,52 = 280.848,49;
 * - Itaú 04114-0: saldo total 67.788,94 = aplicação automática 67.787,94 + conta corrente 1,00;
 * - Itaú Trust DI: 266.681,63 (movimento financeiro Softdib, banco B34101).
 */
const acerto = (
  id: string,
  debitoCodigo: string,
  creditoCodigo: string,
  valor: number,
  historico: string,
  observacao: string,
  fonte: string,
  extra: Partial<LancamentoIntegrado> = {},
): LancamentoIntegrado => ({
  id: `SET-ACERTO-BANCO-${id}`,
  data: "01/09/2026",
  origem: "ACERTO DE SALDOS BANCÁRIOS 31/08/2026",
  debitoCodigo,
  debito: nome(debitoCodigo),
  creditoCodigo,
  credito: nome(creditoCodigo),
  historico,
  documento: "Extratos bancários 08/2026",
  cc: "0",
  centroCusto: "SEM CENTRO DE CUSTO",
  valor,
  status: "revisar",
  observacao,
  rastreio: "documento",
  fonte,
  ...extra,
});

const extrato895 = "Bradesco energia 08/2026 — Extrato frente.pdf / Extrato verso.pdf / Anexos.pdf (relatórios Smart Energia CCEE)";

export const lancamentosAcertosBancosSetembro: LancamentoIntegrado[] = [
  // Bradesco 895 (energia)
  acerto("895-CCEE", "3494", "25001", 5_330.24,
    "Encargos CCEE ref. julho/2026 pagos pela conta 895 em agosto — energia de reserva 3.087,46 (19/08), reserva de capacidade 707,67 (25/08), cotas de energia nuclear 1.535,11 (27/08)",
    "Em agosto foram lançados a transferência da 6349, a aplicação e o resgate do Invest Fácil, mas não o débito do encargo na 895. Mesmo critério de julho (JUL-BAN-ENERG-DESP, 3494 Energia Elétrica, CC 102). Despesa carregada para setembro por decisão do usuário.",
    extrato895, { cc: "102", centroCusto: "PRODUÇÃO", status: "validado" }),
  acerto("895-CREDITO-CCEE", "62", "3494", 1_244.04,
    "Créditos da CCEE recebidos na conta 895 e aplicados no Invest Fácil — MERC ENERG CP 1.239,84 (06/08) e transferências da Câmara de Comercialização 4,20 (14/08)",
    "Recuperação de custo de energia (anotado como reembolso no extrato), não lançada em agosto.",
    extrato895, { cc: "102", centroCusto: "PRODUÇÃO" }),
  acerto("895-TARIFA", "25104", "62", 48.21,
    "Tarifa SERV DEP QUALIF da conta 895 (17/08), paga com resgate do Invest Fácil",
    "Tarifa bancária de agosto não lançada.",
    extrato895),
  acerto("895-REND", "62", "25098", 1.37,
    "Rendimentos do Invest Fácil da conta 895 em agosto (17/08, 19/08, 25/08 e 27/08)",
    "Rendimento bruto creditado nos resgates do Invest Fácil da 895.",
    extrato895),
  // Itaú Trust DI
  acerto("TRUST-REND-AGO", "25002", "25098", 131.63,
    "Rendimento do Itaú Trust DI em agosto/2026",
    "Posição do Softdib (B34101) em 31/08: 266.681,63 = aplicação 665.000,00 + rendimento 131,63 − resgates 398.450,00.",
    "EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv (banco B34101)"),
  acerto("TRUST-JUNHO", "25002", "25098", 3_253.75,
    "Rendimento do Itaú Trust DI de junho/2026 não reconhecido",
    "Posição real do fundo em 30/06/2026 R$ 456.764,42 (controlesBancariosJulho.itauTrustDi) x sistema R$ 453.510,67; a implantação de 31/05 batia (837.809,76) e a conta corrente de junho também, então a diferença é rendimento de junho que não entrou. Reconhecido em setembro por decisão do usuário.",
    "Nitaplast Itau fundo.pdf + nitaplast-bancos-julho.ts"),
  // Diferenças pequenas sem origem identificada
  acerto("ITAU-JULHO", "11", "4859", 517.09,
    "Diferença da conta corrente Itaú desde julho/2026 — origem a identificar",
    "Em 31/07 a conta 11 ficou em −517,50 com o extrato em 1,00; a conta 11 de julho foi montada com eventos agrupados do Softdib (arquivo de origem não disponível). Mantido na transitória até identificar.",
    "NITA - ITAU.pdf 07/2026 e 08/2026"),
  acerto("ITAU-AUT-MAIS", "54", "4859", 1.03,
    "Diferença da aplicação automática Itaú em 31/08/2026",
    "Sistema 67.786,91 x aplicação automática 67.787,94.",
    "NITA - ITAU.pdf 08/2026"),
  acerto("BRADESCO-RESIDUO", "4859", "9", 11.15,
    "Diferença da conta corrente Bradesco 6349 em 31/08/2026 — origem a identificar",
    "Sistema 25.778,44 x extrato 25.767,29.",
    "NITA - BRADESCO.pdf 08/2026"),
  acerto("895-RESIDUO-CC", "4859", "25001", 1.35,
    "Diferença da conta corrente 895 desde julho/2026 — origem a identificar",
    "Em 31/07 a 25001 ficou em 2,35 com o extrato em 1,00.",
    extrato895),
  acerto("895-RESIDUO-APL", "62", "4859", 7.22,
    "Diferença do Invest Fácil (6349 + 895) em 31/08/2026 — origem a identificar",
    "Após os acertos acima a conta 62 fica em 280.841,27 x extratos 280.848,49.",
    extrato895),
  ...lancamentosBancoBrasilAgostoEmSetembro(),
];

/**
 * Movimento do Banco do Brasil 3275-1/30807-2 de agosto/2026 que não entrou no Razão de agosto
 * (só a tarifa de R$ 215,90 estava lançada). Líquido +6.416,88 = extrato 7.283,15 − sistema 866,27.
 * Identificação pelo movimento financeiro do Softdib (banco B00100).
 */
function lancamentosBancoBrasilAgostoEmSetembro(): LancamentoIntegrado[] {
  const linhas: Array<[string, string, number, string, string, string, Partial<LancamentoIntegrado>?]> = [
    ["01", "12/08/2026", -298.61, "288", "Madeireira Base Sólida — adiantamento de OC", "Adiantamento a fornecedor (Softdib: ADTO OC)."],
    ["02", "13/08/2026", 6_715.0, "1712", "Sucatas Indaial — adiantamento de cliente", "Adiantamento de cliente mercado interno."],
    ["03", "13/08/2026", -283.83, "4663", "Detran — licenciamento de 3 veículos (3 × R$ 94,61)", "Despesa de agosto sem documento de entrada; reconhecida em setembro.", { cc: "304", centroCusto: "ADM GERAL" }],
    ["04", "14/08/2026", 864.66, "25111", "Alfonso Kurtz EPP — duplicata NF 93438/02", "Recebimento de duplicata."],
    ["05", "24/08/2026", -80.0, "1496", "Transportadora Gamper — frete Filial (título 3369)", "Pagamento de título de frete."],
    ["06", "26/08/2026", 3_249.45, "25111", "So Nylon Comercial — duplicata NF 94369/01", "Recebimento de duplicata."],
    ["07", "26/08/2026", -2_369.79, "1542", "ICMS ST a recolher (guia de 26/08)", "Pagamento de ICMS ST."],
    ["08", "27/08/2026", -1_380.0, "288", "Guiddolin e Guiddolin — adiantamento de OC", "Adiantamento a fornecedor (Softdib: ADTO OC)."],
  ];
  return linhas.map(([seq, data, valor, contrapartida, historico, observacao, extra]) => {
    const entrada = valor > 0;
    return acerto(`BB-AGO-${seq}`, entrada ? "10" : contrapartida, entrada ? contrapartida : "10", Math.abs(valor),
      `${historico} (BB, ${data})`,
      `${observacao} Movimento de agosto do BB lançado em setembro (decisão do usuário em 07/10/2026).`,
      "Movimento financeiro Softdib 08/2026 (B00100) + extrato Banco do Brasil 08/2026",
      { status: "validado", ...extra });
  });
}
