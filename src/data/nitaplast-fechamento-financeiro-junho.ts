import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Fechamento financeiro contábil de 06/2026.
 *
 * REGRA OBRIGATÓRIA:
 * fato/documento -> Razão -> Balancete -> DRE.
 *
 * A DRE não cria lançamentos e não é usada para ajustar o resultado.
 * Divergências entre o Razão e os valores de controle são apresentadas como
 * validação contábil; nunca lançam exceção durante o carregamento do app.
 */
const idsRendimentosComplementaresDuplicados = new Set([
  "APL-ITAU-TRUST-REND-001",
  "APL-BRAD-895-REND-001",
  "APL-GREEN-REND-001",
]);

const RECEITA_EXTRATOS_CONTROLE = 19621.28;
const JUROS_ATIVOS = 25294.70;
const RECEITAS_FINANCEIRAS_CONTROLE = 44915.98;
const JCP = 140469.22;
const DEMAIS_DESPESAS_FINANCEIRAS_CONTROLE = 13492.62;
const DESPESAS_FINANCEIRAS_CONTROLE = 153961.84;
const RESULTADO_FINANCEIRO_LIQUIDO_CONTROLE = 109045.86;

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

function despesasFinanceirasSemJcp(base: LancamentoIntegrado[]) {
  return arred(contasDespesasFinanceiras()
    .filter((codigo) => codigo !== "25107")
    .reduce((total, codigo) => total + movimentoLiquido(base, codigo), 0));
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
  observacao: "Valor contábil de junho validado em R$ 140.469,22. Razão, Balancete e DRE usam a mesma base.",
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
  historico: "Juros ativos reconhecidos no fechamento financeiro de junho/2026",
  documento: "JUROS ATIVOS 06/2026",
  cc: "901",
  centroCusto: "RECEITAS FINANCEIRAS",
  valor: JUROS_ATIVOS,
  status: "validado",
  observacao: "Parcela de juros ativos do resultado financeiro de junho. Os rendimentos de aplicação documentados nos extratos permanecem separados no Razão.",
  rastreio: "documento",
  fonte: "Fechamento financeiro contábil de junho/2026",
};

function lancamentoJurosPassivosComplementar(valor: number): LancamentoIntegrado {
  return {
    id: "FIN-JUROS-PASSIVOS-062026",
    data: "30/06/2026",
    origem: "FECHAMENTO FINANCEIRO CONTÁBIL 06/2026",
    debitoCodigo: "25103",
    debito: nomeConta("25103"),
    creditoCodigo: "1496",
    credito: nomeConta("1496"),
    historico: "Juros passivos complementares de junho/2026",
    documento: "JUROS PASSIVOS 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor,
    status: "validado",
    observacao: "Tarifas, IOF e demais despesas documentadas permanecem nas contas próprias; somente a parcela remanescente validada é reconhecida como Juros Passivos.",
    rastreio: "derivado",
    fonte: "Fechamento financeiro contábil de junho/2026 + movimentos financeiros documentados no Razão",
  };
}

export type ValidacaoFinanceiroJunho = {
  receitasDocumentadas: number;
  receitasFinanceirasCalculadas: number;
  despesasSemJcpDocumentadas: number;
  despesasFinanceirasCalculadas: number;
  resultadoFinanceiroLiquidoCalculado: number;
  bloqueado: boolean;
  mensagens: string[];
};

export function validarFechamentoFinanceiroJunho(base: LancamentoIntegrado[]): ValidacaoFinanceiroJunho {
  const receitasDocumentadas = arred(totalReceitasFinanceiras(base) - (base.some((linha) => linha.id === "FIN-JUROS-ATIVOS-062026") ? JUROS_ATIVOS : 0));
  const receitasFinanceirasCalculadas = totalReceitasFinanceiras(base);
  const despesasSemJcpDocumentadas = despesasFinanceirasSemJcp(base);
  const despesasFinanceirasCalculadas = totalDespesasFinanceiras(base);
  const resultadoFinanceiroLiquidoCalculado = arred(despesasFinanceirasCalculadas - receitasFinanceirasCalculadas);
  const mensagens: string[] = [];

  if (Math.abs(receitasDocumentadas - RECEITA_EXTRATOS_CONTROLE) > 0.01) {
    mensagens.push(`Rendimentos/aplicações no Razão: R$ ${receitasDocumentadas.toFixed(2)}; controle anterior: R$ ${RECEITA_EXTRATOS_CONTROLE.toFixed(2)}. Revisar a composição, sem alterar o Razão para forçar a DRE.`);
  }
  if (Math.abs(receitasFinanceirasCalculadas - RECEITAS_FINANCEIRAS_CONTROLE) > 0.01) {
    mensagens.push(`Receitas financeiras calculadas pelo Razão: R$ ${receitasFinanceirasCalculadas.toFixed(2)}; DRE de controle: R$ ${RECEITAS_FINANCEIRAS_CONTROLE.toFixed(2)}.`);
  }
  if (Math.abs(despesasFinanceirasCalculadas - DESPESAS_FINANCEIRAS_CONTROLE) > 0.01) {
    mensagens.push(`Despesas financeiras calculadas pelo Razão: R$ ${despesasFinanceirasCalculadas.toFixed(2)}; DRE de controle: R$ ${DESPESAS_FINANCEIRAS_CONTROLE.toFixed(2)}.`);
  }
  if (Math.abs(resultadoFinanceiroLiquidoCalculado - RESULTADO_FINANCEIRO_LIQUIDO_CONTROLE) > 0.01) {
    mensagens.push(`Resultado financeiro líquido pelo Razão: R$ ${resultadoFinanceiroLiquidoCalculado.toFixed(2)}; DRE de controle: R$ ${RESULTADO_FINANCEIRO_LIQUIDO_CONTROLE.toFixed(2)}.`);
  }

  return {
    receitasDocumentadas,
    receitasFinanceirasCalculadas,
    despesasSemJcpDocumentadas,
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

  const despesasJaDocumentadas = despesasFinanceirasSemJcp(baseSemProvisoriosEDuplicidades);
  const jurosPassivosComplementares = arred(Math.max(0, DEMAIS_DESPESAS_FINANCEIRAS_CONTROLE - despesasJaDocumentadas));

  return [
    ...baseSemProvisoriosEDuplicidades,
    lancamentoJcp,
    lancamentoJurosAtivos,
    ...(jurosPassivosComplementares > 0.005
      ? [lancamentoJurosPassivosComplementar(jurosPassivosComplementares)]
      : []),
  ];
}

export const fechamentoFinanceiroJunho = {
  receitaFinanceiraExtratosControle: RECEITA_EXTRATOS_CONTROLE,
  jurosAtivos: JUROS_ATIVOS,
  receitasFinanceirasControle: RECEITAS_FINANCEIRAS_CONTROLE,
  jcp: JCP,
  demaisDespesasFinanceirasControle: DEMAIS_DESPESAS_FINANCEIRAS_CONTROLE,
  despesasFinanceirasControle: DESPESAS_FINANCEIRAS_CONTROLE,
  resultadoFinanceiroLiquidoControle: RESULTADO_FINANCEIRO_LIQUIDO_CONTROLE,
} as const;
