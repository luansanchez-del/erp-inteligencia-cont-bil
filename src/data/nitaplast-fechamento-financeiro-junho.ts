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
 * Os valores abaixo são a composição contábil validada para junho:
 * - rendimentos financeiros documentados nos extratos: R$ 19.621,28;
 * - juros ativos: R$ 25.294,70;
 * - receitas financeiras totais: R$ 44.915,98;
 * - JCP: R$ 140.469,22;
 * - demais despesas financeiras, incluindo juros passivos e despesas já
 *   documentadas no Razão: R$ 13.492,62;
 * - despesas financeiras totais: R$ 153.961,84;
 * - despesa financeira líquida: R$ 109.045,86.
 *
 * Os complementos de rendimento das aplicações abaixo não entram duas vezes:
 * o movimento financeiro já contém os rendimentos efetivamente capturados em junho.
 */
const idsRendimentosComplementaresDuplicados = new Set([
  "APL-ITAU-TRUST-REND-001",
  "APL-BRAD-895-REND-001",
  "APL-GREEN-REND-001",
]);

const RECEITA_EXTRATOS = 19621.28;
const JUROS_ATIVOS = 25294.70;
const RECEITAS_FINANCEIRAS = 44915.98;
const JCP = 140469.22;
const DEMAIS_DESPESAS_FINANCEIRAS = 13492.62;
const DESPESAS_FINANCEIRAS = 153961.84;
const RESULTADO_FINANCEIRO_LIQUIDO = 109045.86;

function classificacao(codigo: string) {
  return estruturaBalanceteNitaplast.find((linha) => linha.tipo === "A" && linha.conta === codigo)?.classificacao ?? "";
}

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

function contasReceitasFinanceiras() {
  return estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A" && (linha.classificacao.startsWith("5.7.12") || linha.classificacao.startsWith("4.1.05.001")))
    .map((linha) => linha.conta);
}

function totalDespesasFinanceiras(base: LancamentoIntegrado[]) {
  return arred(contasDespesasFinanceiras().reduce((total, codigo) => total + movimentoLiquido(base, codigo), 0));
}

function totalReceitasFinanceiras(base: LancamentoIntegrado[]) {
  // Receita tem natureza credora; movimento líquido fica negativo.
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
  observacao: "Valor contábil de junho validado em R$ 140.469,22. O lançamento provisório anterior é substituído para que Razão, Balancete e DRE usem a mesma base.",
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
    observacao: `O total das demais despesas financeiras de junho é R$ ${DEMAIS_DESPESAS_FINANCEIRAS.toFixed(2)}. Tarifas, IOF e demais despesas já documentadas permanecem nas contas próprias; somente a parcela remanescente é reconhecida como Juros Passivos.`,
    rastreio: "derivado",
    fonte: "Fechamento financeiro contábil de junho/2026 + movimentos financeiros documentados no Razão",
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

  // Primeiro validamos o que já nasceu dos extratos/documentos. Não criamos
  // complemento de receita para fazer a DRE bater.
  const receitasDocumentadas = totalReceitasFinanceiras(baseSemProvisoriosEDuplicidades);
  if (Math.abs(receitasDocumentadas - RECEITA_EXTRATOS) > 0.01) {
    throw new Error(
      `Fechamento financeiro: rendimentos documentados não conciliam. Razão R$ ${receitasDocumentadas.toFixed(2)} / esperado R$ ${RECEITA_EXTRATOS.toFixed(2)}`,
    );
  }

  const despesasJaDocumentadas = despesasFinanceirasSemJcp(baseSemProvisoriosEDuplicidades);
  const jurosPassivosComplementares = arred(DEMAIS_DESPESAS_FINANCEIRAS - despesasJaDocumentadas);

  if (jurosPassivosComplementares < -0.01) {
    throw new Error(
      `Fechamento financeiro: despesas documentadas sem JCP (R$ ${despesasJaDocumentadas.toFixed(2)}) superam o total validado de R$ ${DEMAIS_DESPESAS_FINANCEIRAS.toFixed(2)}. Revisar antes da DRE.`,
    );
  }

  const resultado: LancamentoIntegrado[] = [
    ...baseSemProvisoriosEDuplicidades,
    lancamentoJcp,
    lancamentoJurosAtivos,
    ...(jurosPassivosComplementares > 0.005
      ? [lancamentoJurosPassivosComplementar(jurosPassivosComplementares)]
      : []),
  ];

  // Trava contábil: só libera Balancete/DRE se o próprio Razão fechar.
  const despesas = totalDespesasFinanceiras(resultado);
  const receitas = totalReceitasFinanceiras(resultado);
  const liquido = arred(despesas - receitas);

  if (Math.abs(despesas - DESPESAS_FINANCEIRAS) > 0.01) {
    throw new Error(`Fechamento financeiro: despesas não conciliam no Razão. Calculado R$ ${despesas.toFixed(2)} / esperado R$ ${DESPESAS_FINANCEIRAS.toFixed(2)}`);
  }
  if (Math.abs(receitas - RECEITAS_FINANCEIRAS) > 0.01) {
    throw new Error(`Fechamento financeiro: receitas não conciliam no Razão. Calculado R$ ${receitas.toFixed(2)} / esperado R$ ${RECEITAS_FINANCEIRAS.toFixed(2)}`);
  }
  if (Math.abs(liquido - RESULTADO_FINANCEIRO_LIQUIDO) > 0.01) {
    throw new Error(`Fechamento financeiro: líquido não concilia no Razão. Calculado R$ ${liquido.toFixed(2)} / esperado R$ ${RESULTADO_FINANCEIRO_LIQUIDO.toFixed(2)}`);
  }

  return resultado;
}

export const fechamentoFinanceiroJunho = {
  receitaFinanceiraExtratos: RECEITA_EXTRATOS,
  jurosAtivos: JUROS_ATIVOS,
  receitasFinanceiras: RECEITAS_FINANCEIRAS,
  jcp: JCP,
  demaisDespesasFinanceiras: DEMAIS_DESPESAS_FINANCEIRAS,
  despesasFinanceiras: DESPESAS_FINANCEIRAS,
  resultadoFinanceiroLiquido: RESULTADO_FINANCEIRO_LIQUIDO,
} as const;
