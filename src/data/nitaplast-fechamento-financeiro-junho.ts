import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Fechamento financeiro contábil de 06/2026.
 *
 * REGRA OBRIGATÓRIA:
 * fato de junho -> lançamento em 30/06 -> Razão -> Balancete -> DRE.
 *
 * Juros Ativos e Juros Passivos são fatos contábeis próprios e não podem ser
 * calculados como "diferença para fechar a DRE". Tarifas, IOF, IRRF e JCP
 * permanecem separados nas respectivas contas.
 */
const idsRendimentosComplementaresDuplicados = new Set([
  "APL-ITAU-TRUST-REND-001",
  "APL-BRAD-895-REND-001",
  "APL-GREEN-REND-001",
]);

const RECEITA_EXTRATOS_CONTROLE = 19621.28;
const JUROS_ATIVOS = 25294.70;
const JUROS_PASSIVOS = 13492.62;
const JCP = 140469.22;

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

const lancamentoJurosAtivos: LancamentoIntegrado = {
  id: "FIN-JUROS-ATIVOS-062026",
  data: "30/06/2026",
  origem: "FECHAMENTO FINANCEIRO CONTÁBIL 06/2026",
  debitoCodigo: "54",
  debito: nomeConta("54"),
  creditoCodigo: "25095",
  credito: nomeConta("25095"),
  historico: "Juros ativos de junho/2026",
  documento: "JUROS ATIVOS 06/2026",
  cc: "901",
  centroCusto: "RECEITAS FINANCEIRAS",
  valor: JUROS_ATIVOS,
  status: "validado",
  observacao: "Lançamento próprio de Juros Ativos. Não é complemento gerencial da DRE.",
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
  historico: "Juros passivos de junho/2026",
  documento: "JUROS PASSIVOS 06/2026",
  cc: "902",
  centroCusto: "DESPESAS FINANCEIRAS",
  valor: JUROS_PASSIVOS,
  status: "validado",
  observacao: "Lançamento próprio de Juros Passivos. Tarifas, IOF e demais encargos bancários permanecem separados e não reduzem este valor.",
  rastreio: "documento",
  fonte: "Fechamento financeiro contábil de junho/2026",
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
  const receitasDocumentadas = arred(totalReceitasFinanceiras(base) - (base.some((linha) => linha.id === "FIN-JUROS-ATIVOS-062026") ? JUROS_ATIVOS : 0));
  const receitasFinanceirasCalculadas = totalReceitasFinanceiras(base);
  const despesasFinanceirasCalculadas = totalDespesasFinanceiras(base);
  const resultadoFinanceiroLiquidoCalculado = arred(despesasFinanceirasCalculadas - receitasFinanceirasCalculadas);
  const jurosAtivosLancados = arred(base.filter((linha) => linha.id === "FIN-JUROS-ATIVOS-062026").reduce((t, linha) => t + linha.valor, 0));
  const jurosPassivosLancados = arred(base.filter((linha) => linha.id === "FIN-JUROS-PASSIVOS-062026").reduce((t, linha) => t + linha.valor, 0));
  const jcpLancado = arred(base.filter((linha) => linha.id === "FIN-JCP-062026").reduce((t, linha) => t + linha.valor, 0));
  const mensagens: string[] = [];

  if (Math.abs(receitasDocumentadas - RECEITA_EXTRATOS_CONTROLE) > 0.01) {
    mensagens.push(`Rendimentos documentados no Razão: R$ ${receitasDocumentadas.toFixed(2)}; controle dos extratos: R$ ${RECEITA_EXTRATOS_CONTROLE.toFixed(2)}.`);
  }
  if (Math.abs(jurosAtivosLancados - JUROS_ATIVOS) > 0.01) {
    mensagens.push(`Juros Ativos de junho não estão integralmente no Razão. Calculado R$ ${jurosAtivosLancados.toFixed(2)} / esperado R$ ${JUROS_ATIVOS.toFixed(2)}.`);
  }
  if (Math.abs(jurosPassivosLancados - JUROS_PASSIVOS) > 0.01) {
    mensagens.push(`Juros Passivos de junho não estão integralmente no Razão. Calculado R$ ${jurosPassivosLancados.toFixed(2)} / esperado R$ ${JUROS_PASSIVOS.toFixed(2)}.`);
  }
  if (Math.abs(jcpLancado - JCP) > 0.01) {
    mensagens.push(`JCP de junho não está integralmente no Razão. Calculado R$ ${jcpLancado.toFixed(2)} / esperado R$ ${JCP.toFixed(2)}.`);
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
    && !idsRendimentosComplementaresDuplicados.has(linha.id),
  );

  return [
    ...baseSemProvisoriosEDuplicidades,
    lancamentoJcp,
    lancamentoJurosAtivos,
    lancamentoJurosPassivos,
  ];
}

export const fechamentoFinanceiroJunho = {
  receitaFinanceiraExtratosControle: RECEITA_EXTRATOS_CONTROLE,
  jurosAtivos: JUROS_ATIVOS,
  jurosPassivos: JUROS_PASSIVOS,
  jcp: JCP,
} as const;
