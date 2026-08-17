import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Fechamento financeiro contábil de 06/2026.
 *
 * REGRA OBRIGATÓRIA:
 * fato de junho -> lançamento -> Razão -> Balancete -> DRE.
 *
 * Juros Ativos e Juros Passivos são fatos contábeis próprios e não podem ser
 * calculados como "diferença para fechar a DRE". Tarifas, IOF, IRRF e JCP
 * permanecem separados nas respectivas contas.
 *
 * IMPORTANTE — JUROS ATIVOS:
 * o controle de fechamento informa R$ 25.294,70, porém não há nos documentos
 * disponíveis uma contrapartida bancária/aplicação que comprove D 54. Portanto
 * o sistema NÃO cria lançamento automático para esse valor. A conta 25095 só
 * recebe Juros Ativos quando a contrapartida documental (cliente/duplicata,
 * banco ou outra conta efetivamente comprovada) estiver identificada.
 *
 * A composição de R$ 13.492,62 das demais despesas financeiras de junho é:
 * - Despesas bancárias já existentes no Razão: R$ 2.807,23;
 * - IOF já existente no Razão: R$ 2.339,24;
 * - Juros Passivos residual: R$ 8.346,15.
 *
 * Portanto, lançar R$ 13.492,62 integralmente em Juros Passivos duplicaria
 * R$ 5.146,47 de tarifas/IOF. O Razão deve preservar cada natureza separada.
 */
const idsRendimentosComplementaresDuplicados = new Set([
  "APL-ITAU-TRUST-REND-001",
  "APL-BRAD-895-REND-001",
  "APL-GREEN-REND-001",
]);

const RECEITA_EXTRATOS_CONTROLE = 19621.28;
const JUROS_ATIVOS = 25294.70;
const DESPESAS_BANCARIAS_CONTROLE = 2807.23;
const IOF_CONTROLE = 2339.24;
const OUTRAS_DESPESAS_FINANCEIRAS_CONTROLE = 13492.62;
const JUROS_PASSIVOS = arred(OUTRAS_DESPESAS_FINANCEIRAS_CONTROLE - DESPESAS_BANCARIAS_CONTROLE - IOF_CONTROLE); // 8.346,15
const JCP = 140469.22;
const RECEITAS_FINANCEIRAS_CONTROLE = 44915.98;
const DESPESAS_FINANCEIRAS_CONTROLE = 153961.84;

function nomeConta(codigo: string) {
  const conta = estruturaBalanceteNitaplast.find((linha) => linha.tipo === "A" && linha.conta === codigo);
  return `${codigo} - ${conta?.descricao ?? "Conta a revisar"}`;
}

function movimentoLiquido(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.debitoCodigo === codigo) total += linha.valor;
    if (linha.creditoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

function contasDespesasFinanceiras() {
  return estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A" && linha.classificacao.startsWith("5.8"))
    .map((linha) => linha.conta);
}

function ehReceitaFinanceira(classificacao: string, descricao: string) {
  const d = descricao.toLocaleUpperCase("pt-BR");
  if (classificacao.startsWith("4.1.05.001")) return true;
  if (!classificacao.startsWith("5.7.12")) return false;
  if (d.includes("RECUPERAÇÃO") || d.includes("RECUPERACAO")) return false;
  if (d.includes("AMOSTRA")) return false;
  if (d.includes("RECEITA EVENTUAL") || d.includes("RECEITAS EVENTUAIS")) return false;
  return true;
}

function contasReceitasFinanceiras() {
  return estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A" && ehReceitaFinanceira(linha.classificacao, linha.descricao))
    .map((linha) => linha.conta);
}

function totalDespesasFinanceiras(base: LancamentoIntegrado[]) {
  return arred(contasDespesasFinanceiras().reduce((total, codigo) => total + movimentoLiquido(base, codigo), 0));
}

function totalReceitasFinanceiras(base: LancamentoIntegrado[]) {
  return arred(-contasReceitasFinanceiras().reduce((total, codigo) => total + movimentoLiquido(base, codigo), 0));
}

/**
 * Reconciliação dos rendimentos bancários do lote contábil final de 06/2026.
 *
 * O movimento bruto contém dois pontos que diferem do lote conciliado usado no
 * fechamento:
 * - B23700 em 03/06, R$ 1,98: não integra o lote final reconciliado;
 * - B23702 (Invest Fácil), R$ 1,07 em 17/06 e R$ 0,28 em 30/06: integram o lote
 *   final, mas eram descartados pelo parser por serem da conta interna B23702.
 *
 * Com essa reconciliação, os rendimentos documentados no Razão são R$ 19.621,28.
 */
function ehRendimentoBradescoForaDoLoteFinal(linha: LancamentoIntegrado) {
  return linha.origem === "MOVIMENTAÇÃO BANCÁRIA 06/2026"
    && linha.data === "03/06/2026"
    && linha.creditoCodigo === "2859"
    && Math.abs(linha.valor - 1.98) < 0.001
    && linha.fonte.includes("banco B23700, evento 7");
}

const rendimentosInvestFacilDoLoteFinal: LancamentoIntegrado[] = [
  {
    id: "FIN-REND-B23702-17062026",
    data: "17/06/2026",
    origem: "MOVIMENTAÇÃO BANCÁRIA 06/2026",
    debitoCodigo: "25001",
    debito: nomeConta("25001"),
    creditoCodigo: "2859",
    credito: nomeConta("2859"),
    historico: "Rendimento financeiro Invest Fácil Bradesco 895 - 17/06/2026",
    documento: "7",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 1.07,
    status: "validado",
    observacao: "Evento B23702 presente no lote contábil final de junho e restaurado no Razão após ter sido descartado pelo parser bancário.",
    rastreio: "documento",
    fonte: "MOVIMENTAÇÃO BANCÁRIA 06/2026 - banco B23702, evento 7 + lote contábil final 06/2026",
  },
  {
    id: "FIN-REND-B23702-30062026",
    data: "30/06/2026",
    origem: "MOVIMENTAÇÃO BANCÁRIA 06/2026",
    debitoCodigo: "25001",
    debito: nomeConta("25001"),
    creditoCodigo: "2859",
    credito: nomeConta("2859"),
    historico: "Rendimento financeiro Invest Fácil Bradesco 895 - 30/06/2026",
    documento: "7",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 0.28,
    status: "validado",
    observacao: "Evento B23702 presente no lote contábil final de junho e restaurado no Razão após ter sido descartado pelo parser bancário.",
    rastreio: "documento",
    fonte: "MOVIMENTAÇÃO BANCÁRIA 06/2026 - banco B23702, evento 7 + lote contábil final 06/2026",
  },
];

const lancamentoJcp: LancamentoIntegrado = {
  id: "FIN-JCP-062026",
  data: "30/06/2026",
  origem: "FECHAMENTO FINANCEIRO CONTÁBIL 06/2026",
  debitoCodigo: "25107",
  debito: nomeConta("25107"),
  creditoCodigo: "25253",
  credito: nomeConta("25253"),
  historico: "Juros sobre capital próprio de junho/2026",
  documento: "JCP 06/2026",
  cc: "902",
  centroCusto: "DESPESAS FINANCEIRAS",
  valor: JCP,
  status: "validado",
  observacao: "JCP de junho reconhecido no Razão antes do Balancete e da DRE.",
  rastreio: "documento",
  fonte: "Fechamento financeiro contábil de junho/2026",
};

const lancamentoJurosPassivos: LancamentoIntegrado = {
  id: "FIN-JUROS-PASSIVOS-062026",
  data: "30/06/2026",
  origem: "FECHAMENTO FINANCEIRO CONTÁBIL 06/2026",
  debitoCodigo: "25103",
  debito: nomeConta("25103"),
  creditoCodigo: "1496",
  credito: nomeConta("1496"),
  historico: "Juros passivos de junho/2026 - parcela residual após tarifas e IOF",
  documento: "JUROS PASSIVOS 06/2026",
  cc: "902",
  centroCusto: "DESPESAS FINANCEIRAS",
  valor: JUROS_PASSIVOS,
  status: "validado",
  observacao: "Juros Passivos de R$ 8.346,15. Despesas bancárias de R$ 2.807,23 e IOF de R$ 2.339,24 já estão lançados separadamente no Razão; somados, compõem os R$ 13.492,62 das demais despesas financeiras sem duplicidade.",
  rastreio: "documento",
  fonte: "Fechamento financeiro contábil de junho/2026 + composição do Razão bancário",
};

export type ValidacaoFinanceiroJunho = {
  receitasDocumentadas: number;
  jurosAtivosLancados: number;
  jurosPassivosLancados: number;
  jcpLancado: number;
  receitasFinanceirasCalculadas: number;
  despesasFinanceirasCalculadas: number;
  resultadoFinanceiroLiquidoCalculado: number;
  bloqueado: boolean;
  mensagens: string[];
};

export function validarFechamentoFinanceiroJunho(base: LancamentoIntegrado[]): ValidacaoFinanceiroJunho {
  const receitasDocumentadas = arred(-movimentoLiquido(base, "2859"));
  const receitasFinanceirasCalculadas = totalReceitasFinanceiras(base);
  const despesasFinanceirasCalculadas = totalDespesasFinanceiras(base);
  const resultadoFinanceiroLiquidoCalculado = arred(despesasFinanceirasCalculadas - receitasFinanceirasCalculadas);
  const jurosAtivosLancados = arred(-movimentoLiquido(base, "25095"));
  const jurosPassivosLancados = arred(base.filter((linha) => linha.id === "FIN-JUROS-PASSIVOS-062026").reduce((t, linha) => t + linha.valor, 0));
  const jcpLancado = arred(base.filter((linha) => linha.id === "FIN-JCP-062026").reduce((t, linha) => t + linha.valor, 0));
  const mensagens: string[] = [];

  if (Math.abs(receitasDocumentadas - RECEITA_EXTRATOS_CONTROLE) > 0.01) {
    mensagens.push(`Rendimentos documentados no Razão: R$ ${receitasDocumentadas.toFixed(2)}; controle dos extratos/lote final: R$ ${RECEITA_EXTRATOS_CONTROLE.toFixed(2)}.`);
  }
  if (Math.abs(jurosAtivosLancados - JUROS_ATIVOS) > 0.01) {
    mensagens.push(`Juros Ativos de junho aguardam contrapartida documental. Razão comprovado em 25095: R$ ${jurosAtivosLancados.toFixed(2)} / controle do fechamento: R$ ${JUROS_ATIVOS.toFixed(2)}. Não lançar em banco/aplicação sem extrato ou composição por cliente/duplicata.`);
  }
  if (Math.abs(jurosPassivosLancados - JUROS_PASSIVOS) > 0.01) {
    mensagens.push(`Juros Passivos de junho não estão conciliados no Razão. Calculado R$ ${jurosPassivosLancados.toFixed(2)} / esperado R$ ${JUROS_PASSIVOS.toFixed(2)}.`);
  }
  if (Math.abs(jcpLancado - JCP) > 0.01) {
    mensagens.push(`JCP de junho não está integralmente no Razão. Calculado R$ ${jcpLancado.toFixed(2)} / esperado R$ ${JCP.toFixed(2)}.`);
  }
  if (Math.abs(receitasFinanceirasCalculadas - RECEITAS_FINANCEIRAS_CONTROLE) > 0.01) {
    mensagens.push(`Receitas Financeiras do Razão: R$ ${receitasFinanceirasCalculadas.toFixed(2)} / fechamento 06/2026: R$ ${RECEITAS_FINANCEIRAS_CONTROLE.toFixed(2)}.`);
  }
  if (Math.abs(despesasFinanceirasCalculadas - DESPESAS_FINANCEIRAS_CONTROLE) > 0.01) {
    mensagens.push(`Despesas Financeiras do Razão: R$ ${despesasFinanceirasCalculadas.toFixed(2)} / fechamento 06/2026: R$ ${DESPESAS_FINANCEIRAS_CONTROLE.toFixed(2)}.`);
  }

  return {
    receitasDocumentadas,
    jurosAtivosLancados,
    jurosPassivosLancados,
    jcpLancado,
    receitasFinanceirasCalculadas,
    despesasFinanceirasCalculadas,
    resultadoFinanceiroLiquidoCalculado,
    bloqueado: mensagens.length > 0,
    mensagens,
  };
}

export function aplicarFechamentoFinanceiroJunho(
  lancamentos: LancamentoIntegrado[],
): LancamentoIntegrado[] {
  const baseSemProvisoriosEDuplicidades = lancamentos.filter((linha) =>
    linha.id !== "PON-JCP-001"
    && linha.id !== "FIN-JCP-062026"
    && linha.id !== "FIN-JUROS-ATIVOS-062026"
    && linha.id !== "FIN-JUROS-PASSIVOS-062026"
    && linha.id !== "FIN-REND-B23702-17062026"
    && linha.id !== "FIN-REND-B23702-30062026"
    && !ehRendimentoBradescoForaDoLoteFinal(linha)
    && !idsRendimentosComplementaresDuplicados.has(linha.id),
  );

  return [
    ...baseSemProvisoriosEDuplicidades,
    ...rendimentosInvestFacilDoLoteFinal,
    lancamentoJcp,
    lancamentoJurosPassivos,
  ];
}

export const fechamentoFinanceiroJunho = {
  receitaFinanceiraExtratosControle: RECEITA_EXTRATOS_CONTROLE,
  jurosAtivos: JUROS_ATIVOS,
  jurosAtivosStatus: "aguardando-contrapartida-documental",
  jurosPassivos: JUROS_PASSIVOS,
  despesasBancarias: DESPESAS_BANCARIAS_CONTROLE,
  iof: IOF_CONTROLE,
  outrasDespesasFinanceiras: OUTRAS_DESPESAS_FINANCEIRAS_CONTROLE,
  jcp: JCP,
  receitasFinanceiras: RECEITAS_FINANCEIRAS_CONTROLE,
  despesasFinanceiras: DESPESAS_FINANCEIRAS_CONTROLE,
} as const;
