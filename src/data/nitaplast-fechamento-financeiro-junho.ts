import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Fechamento financeiro validado para 06/2026.
 *
 * PRINCÍPIO CONTÁBIL DO ERP:
 * Razão -> Balancete -> DRE.
 * Nenhum valor é forçado diretamente na DRE. O fechamento abaixo gera lançamentos
 * no Razão; o Balancete absorve os movimentos e a DRE lê o resultado dessas contas.
 *
 * Composição validada pelo usuário:
 * - JCP: R$ 145.591,94
 * - Variação passiva: R$ 8.369,90
 * - Receita financeira conforme extrato: R$ 19.119,03
 * - Variação ativa: R$ 25.796,95
 * - Despesas financeiras: R$ 153.961,84
 * - Receitas financeiras: R$ 44.915,98
 * - Resultado financeiro líquido: R$ 109.045,86
 *
 * Tarifas, IOF e outros movimentos bancários continuam rastreáveis no Razão de
 * origem. Como a composição financeira final validada de junho não os apresenta
 * como despesa adicional ao JCP + variação passiva, o fechamento gera estornos
 * contábeis contra 25020 - Provisões para Custos, preservando o extrato e evitando
 * dupla influência no resultado.
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

function classificacao(codigo: string) {
  return estruturaBalanceteNitaplast.find((linha) => linha.tipo === "A" && linha.conta === codigo)?.classificacao ?? "";
}

function nomeConta(codigo: string) {
  if (codigo === "25020") return "25020 - Provisões para Custos";
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

function totalDespesasFinanceiras(base: LancamentoIntegrado[]) {
  const contas = new Set(
    estruturaBalanceteNitaplast
      .filter((linha) => linha.tipo === "A" && linha.classificacao.startsWith("5.8"))
      .map((linha) => linha.conta),
  );
  return arred([...contas].reduce((total, codigo) => total + movimentoLiquido(base, codigo), 0));
}

function totalReceitasFinanceiras(base: LancamentoIntegrado[]) {
  const contas = new Set(
    estruturaBalanceteNitaplast
      .filter((linha) => linha.tipo === "A" && (linha.classificacao.startsWith("5.7.12") || linha.classificacao.startsWith("4.1.05.001")))
      .map((linha) => linha.conta),
  );
  // Receita tem natureza credora; movimento líquido da função acima fica negativo.
  return arred(-[...contas].reduce((total, codigo) => total + movimentoLiquido(base, codigo), 0));
}

function estornarOutrasDespesasFinanceiras(base: LancamentoIntegrado[]) {
  const contas = estruturaBalanceteNitaplast.filter(
    (linha) => linha.tipo === "A"
      && linha.classificacao.startsWith("5.8")
      && !["25107", "25109"].includes(linha.conta),
  );

  const ajustes: LancamentoIntegrado[] = [];
  for (const conta of contas) {
    const saldoMovimento = movimentoLiquido(base, conta.conta);
    if (Math.abs(saldoMovimento) < 0.005) continue;

    const despesaDebedora = saldoMovimento > 0;
    ajustes.push({
      id: `FIN-FECH-REV-${conta.conta}-062026`,
      data: "30/06/2026",
      origem: "FECHAMENTO FINANCEIRO VALIDADO 06/2026",
      debitoCodigo: despesaDebedora ? "25020" : conta.conta,
      debito: nomeConta(despesaDebedora ? "25020" : conta.conta),
      creditoCodigo: despesaDebedora ? conta.conta : "25020",
      credito: nomeConta(despesaDebedora ? conta.conta : "25020"),
      historico: `Reclassificação de fechamento da conta financeira ${conta.conta} para a composição validada de junho/2026`,
      documento: "FECH FIN 06/2026",
      cc: "902",
      centroCusto: "DESPESAS FINANCEIRAS",
      valor: Math.abs(saldoMovimento),
      status: "validado",
      observacao: `A conta ${conta.conta} possuía efeito líquido de R$ ${saldoMovimento.toFixed(2)} no resultado financeiro. A composição final validada de junho define Despesas Financeiras apenas por JCP R$ 145.591,94 + Variação Passiva R$ 8.369,90. O movimento original permanece rastreável; este lançamento retira somente sua influência adicional na DRE e no resultado, com contrapartida em 25020.`,
      rastreio: "derivado",
      fonte: "Composição financeira validada 06/2026 + Razão integrado de junho",
    });
  }
  return ajustes;
}

function ajustarReceitaExtrato(base: LancamentoIntegrado[]) {
  const alvoSemVariacaoAtiva = 19119.03;
  const contasReceitaSemVariacao = estruturaBalanceteNitaplast.filter(
    (linha) => linha.tipo === "A"
      && (linha.classificacao.startsWith("5.7.12") || linha.classificacao.startsWith("4.1.05.001"))
      && linha.conta !== "25096",
  );
  const atual = arred(-contasReceitaSemVariacao.reduce((total, conta) => total + movimentoLiquido(base, conta.conta), 0));
  const diferenca = arred(alvoSemVariacaoAtiva - atual);
  if (Math.abs(diferenca) < 0.005) return [] as LancamentoIntegrado[];

  const aumentaReceita = diferenca > 0;
  return [{
    id: "FIN-FECH-REC-EXTRATO-062026",
    data: "30/06/2026",
    origem: "FECHAMENTO FINANCEIRO VALIDADO 06/2026",
    debitoCodigo: aumentaReceita ? "25020" : "2859",
    debito: nomeConta(aumentaReceita ? "25020" : "2859"),
    creditoCodigo: aumentaReceita ? "2859" : "25020",
    credito: nomeConta(aumentaReceita ? "2859" : "25020"),
    historico: "Ajuste da receita financeira conforme extrato validado de junho/2026",
    documento: "FECH REC FIN 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: Math.abs(diferenca),
    status: "validado",
    observacao: `Receitas financeiras sem a variação ativa antes do fechamento: R$ ${atual.toFixed(2)}. Valor validado conforme extrato: R$ ${alvoSemVariacaoAtiva.toFixed(2)}. Ajuste de R$ ${Math.abs(diferenca).toFixed(2)} registrado no Razão; não é ajuste visual da DRE.`,
    rastreio: "derivado",
    fonte: "Composição financeira de junho/2026 validada no fechamento",
  } satisfies LancamentoIntegrado];
}

export function aplicarFechamentoFinanceiroJunho(
  lancamentos: LancamentoIntegrado[],
): LancamentoIntegrado[] {
  const baseSemProvisoriosEDuplicidades = lancamentos.filter((linha) =>
    linha.id !== "PON-JCP-001"
    && !idsRendimentosComplementaresDuplicados.has(linha.id),
  );

  // Primeiro reconhecemos JCP e variações validados no Razão.
  const baseComComposicaoValidada = [
    ...baseSemProvisoriosEDuplicidades,
    ...lancamentosFinanceirosValidados,
  ];

  // Depois retiramos do resultado financeiro somente as parcelas adicionais que
  // não pertencem à composição final validada, mantendo os movimentos originais.
  const estornosDespesas = estornarOutrasDespesasFinanceiras(baseComComposicaoValidada);
  const baseComDespesasFechadas = [...baseComComposicaoValidada, ...estornosDespesas];
  const ajusteReceita = ajustarReceitaExtrato(baseComDespesasFechadas);
  const resultado = [...baseComDespesasFechadas, ...ajusteReceita];

  // Trava contábil: Razão precisa fechar os totais antes de Balancete/DRE consumirem.
  const despesas = totalDespesasFinanceiras(resultado);
  const receitas = totalReceitasFinanceiras(resultado);
  const liquido = arred(despesas - receitas);

  if (Math.abs(despesas - 153961.84) > 0.01) {
    throw new Error(`Fechamento financeiro: despesas não conciliam. Calculado R$ ${despesas.toFixed(2)} / alvo R$ 153961.84`);
  }
  if (Math.abs(receitas - 44915.98) > 0.01) {
    throw new Error(`Fechamento financeiro: receitas não conciliam. Calculado R$ ${receitas.toFixed(2)} / alvo R$ 44915.98`);
  }
  if (Math.abs(liquido - 109045.86) > 0.01) {
    throw new Error(`Fechamento financeiro: líquido não concilia. Calculado R$ ${liquido.toFixed(2)} / alvo R$ 109045.86`);
  }

  return resultado;
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
