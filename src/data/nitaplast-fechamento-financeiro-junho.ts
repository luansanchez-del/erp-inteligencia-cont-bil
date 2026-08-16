import type { LancamentoIntegrado } from "./nitaplast-razao-base";

/**
 * Fechamento financeiro validado para 06/2026.
 *
 * PRINCÍPIO: a correção acontece no Razão. Balancete e DRE apenas consomem
 * os lançamentos resultantes; não existe número forçado diretamente na DRE.
 *
 * Composição validada:
 * - JCP: R$ 145.591,94
 * - Variação passiva: R$ 8.369,90
 * - Receita financeira conforme movimentação/extratos: R$ 19.119,03
 * - Variação ativa: R$ 25.796,95
 * - Resultado financeiro líquido: R$ 109.045,86
 *
 * Os lançamentos APL-*-REND abaixo eram complementos derivados dos extratos
 * de aplicação. Como a movimentação financeira já reconhece a receita
 * financeira validada do período, mantê-los junto com o movimento duplicava
 * rendimento. Aplicações, resgates, IOF e IRRF continuam preservados.
 */
const idsRendimentosComplementaresDuplicados = new Set([
  "APL-ITAU-TRUST-REND-001",
  "APL-BRAD-895-REND-001",
  "APL-GREEN-REND-001",
]);

const lancamentosFinanceirosValidados: LancamentoIntegrado[] = [
  {
    id: "FIN-JCP-062026",
    data: "30/06/2026",
    origem: "FECHAMENTO FINANCEIRO VALIDADO 06/2026",
    debitoCodigo: "25107",
    debito: "25107 - Juros s/ Capital Próprio",
    creditoCodigo: "25253",
    credito: "25253 - MARCOS VICTOR SIEDEL - JCPS",
    historico: "JCP de junho/2026 conforme composição financeira validada",
    documento: "JCP 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 145591.94,
    status: "validado",
    observacao: "Substitui o JCP provisório de R$ 140.469,22 replicado do razão de maio. Valor validado para o fechamento de junho.",
    rastreio: "documento",
    fonte: "Composição financeira de junho/2026 validada no fechamento",
  },
  {
    id: "FIN-VAR-PASSIVA-062026",
    data: "30/06/2026",
    origem: "FECHAMENTO FINANCEIRO VALIDADO 06/2026",
    debitoCodigo: "25109",
    debito: "25109 - Varições Cambiais Passivas",
    creditoCodigo: "1496",
    credito: "1496 - Fornecedores Diversos",
    historico: "Variação cambial passiva de junho/2026",
    documento: "VAR PASSIVA 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 8369.90,
    status: "validado",
    observacao: "Reconhece a variação passiva na conta financeira própria. Contrapartida mantida em Fornecedores Diversos até abertura por fornecedor/importação no razão analítico.",
    rastreio: "derivado",
    fonte: "Composição financeira de junho/2026 validada no fechamento",
  },
  {
    id: "FIN-VAR-ATIVA-062026",
    data: "30/06/2026",
    origem: "FECHAMENTO FINANCEIRO VALIDADO 06/2026",
    debitoCodigo: "1496",
    debito: "1496 - Fornecedores Diversos",
    creditoCodigo: "25096",
    credito: "25096 - Variações Cambiais Ativas",
    historico: "Variação cambial ativa de junho/2026",
    documento: "VAR ATIVA 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 25796.95,
    status: "validado",
    observacao: "Reconhece a variação ativa na conta financeira própria. Contrapartida mantida em Fornecedores Diversos até abertura por fornecedor/importação no razão analítico.",
    rastreio: "derivado",
    fonte: "Composição financeira de junho/2026 validada no fechamento",
  },
];

export function aplicarFechamentoFinanceiroJunho(
  lancamentos: LancamentoIntegrado[],
): LancamentoIntegrado[] {
  const baseSemProvisoriosEDuplicidades = lancamentos.filter((linha) =>
    linha.id !== "PON-JCP-001"
    && !idsRendimentosComplementaresDuplicados.has(linha.id),
  );

  return [
    ...baseSemProvisoriosEDuplicidades,
    ...lancamentosFinanceirosValidados,
  ];
}

export const fechamentoFinanceiroJunho = {
  jcp: 145591.94,
  variacaoPassiva: 8369.90,
  receitaFinanceiraExtratos: 19119.03,
  variacaoAtiva: 25796.95,
  despesasFinanceiras: 153961.84,
  receitasFinanceiras: 44915.98,
  resultadoFinanceiroLiquido: 109045.86,
} as const;
