import {
  comparacaoDreDetalhada as comparacaoBase,
  resumoDreDetalhada as resumoBase,
  tributosFederaisFilialDocumentados,
  controleFiscalFederalJunho,
  conciliacaoFederalGerencialJunho,
  conciliacaoPisGerencialJunho,
  conciliacaoCofinsGerencialJunho,
  type ComposicaoDre,
  type LinhaComparacaoDre,
} from "./nitaplast-dre-detalhada-v3";
import { lancamentosIntegrados } from "./nitaplast-razao-integrado";

export type { ComposicaoDre, LinhaComparacaoDre } from "./nitaplast-dre-detalhada-v3";
export {
  tributosFederaisFilialDocumentados,
  controleFiscalFederalJunho,
  conciliacaoFederalGerencialJunho,
  conciliacaoPisGerencialJunho,
  conciliacaoCofinsGerencialJunho,
} from "./nitaplast-dre-detalhada-v3";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Validação das deduções da DRE de 06/2026.
 *
 * REGRA:
 * - o lado CALCULADO nasce do Razão/Balancete;
 * - impostos incidentes sobre vendas são apresentados pelo DÉBITO BRUTO;
 * - créditos/reversões permanecem no Razão/Balancete, sem reduzir essa linha;
 * - PIS/COFINS Matriz são R$ 47.548,49 e R$ 219.011,34;
 * - PIS/COFINS Filial são fatos contábeis reais no Razão, CC 502:
 *   FIL-DEB-PIS-SAI = R$ 4.361,70 e FIL-DEB-COF-SAI = R$ 20.090,42.
 *
 * Portanto a parcela da filial compõe a DRE CALCULADA e deve conferir com a
 * DRE enviada. Não existe mais ajuste visual de "diferença explicada".
 */
const idsDeducoes = [
  "dev", "desc", "ipi-m", "icms-m", "pis-m", "cofins-m",
  "icms-st", "icms-f", "ipi-f", "pis-f", "cofins-f",
];

const basePorId = new Map(comparacaoBase.map((linha) => [linha.id, linha]));
const lancamentoPorId = new Map(lancamentosIntegrados.map((linha) => [linha.id, linha]));

function somaDebitos(composicao: ComposicaoDre[]) {
  return arred(composicao.reduce((total, item) => total + item.debitos, 0));
}

function composicaoDebitoBruto(composicao: ComposicaoDre[], observacao: string): ComposicaoDre[] {
  return composicao
    .map((item) => ({
      ...item,
      creditos: 0,
      valorLinha: arred(item.debitos),
      observacao,
    }))
    .filter((item) => Math.abs(item.debitos) >= 0.005);
}

function composicaoFederalMatriz(
  composicao: ComposicaoDre[],
  valor: number,
  tributo: "PIS" | "COFINS",
): ComposicaoDre[] {
  if (!composicao.length) return [];
  return composicao.map((item, index) => index === 0
    ? {
        ...item,
        debitos: arred(valor),
        creditos: 0,
        valorLinha: arred(valor),
        cc: "201",
        centroCusto: "VENDAS",
        observacao: `${tributo} Matriz: débito fiscal das saídas contabilizado no Razão de 06/2026.`,
      }
    : {
        ...item,
        debitos: 0,
        creditos: 0,
        valorLinha: 0,
        observacao: `${tributo}: composição auxiliar sem efeito adicional no valor calculado.`,
      });
}

function valorLancamento(id: string) {
  return arred(lancamentoPorId.get(id)?.valor ?? 0);
}

function composicaoFederalFilial(
  lancamentoId: "FIL-DEB-PIS-SAI" | "FIL-DEB-COF-SAI",
  tributo: "PIS" | "COFINS",
): ComposicaoDre[] {
  const lancamento = lancamentoPorId.get(lancamentoId);
  if (!lancamento) return [];
  return [{
    chave: `${lancamento.debitoCodigo}|${lancamento.cc}|${lancamento.id}|debito-saida`,
    codigo: lancamento.debitoCodigo,
    classificacao: tributo === "PIS" ? "4.1.03.005.004" : "4.1.03.005.005",
    descricao: tributo === "PIS" ? "(-) PIS" : "(-) COFINS",
    cc: lancamento.cc,
    centroCusto: lancamento.centroCusto,
    debitos: arred(lancamento.valor),
    creditos: 0,
    valorLinha: arred(lancamento.valor),
    lancamentos: 1,
    fonte: `${lancamento.origem} · ${lancamento.fonte}`,
    observacao: `${tributo} Filial: fato contábil real da apuração fiscal, contabilizado no Razão e incluído na DRE calculada.`,
  }];
}

function valorCalculado(id: string) {
  const linha = basePorId.get(id);
  if (!linha) return 0;

  if (id === "dev" || id === "desc") return arred(linha.calculado);
  if (id === "pis-m") return arred(controleFiscalFederalJunho.pis.debitoSaidas);
  if (id === "cofins-m") return arred(controleFiscalFederalJunho.cofins.debitoSaidas);
  if (id === "pis-f") return valorLancamento("FIL-DEB-PIS-SAI");
  if (id === "cofins-f") return valorLancamento("FIL-DEB-COF-SAI");

  return somaDebitos(linha.composicao);
}

function criterio(id: string) {
  if (id === "dev") return "Devoluções documentadas do período, apresentadas separadamente dos impostos sobre vendas.";
  if (id === "desc") return "Nenhum desconto concedido identificado no Razão de junho.";
  if (id === "pis-m") return "PIS Matriz calculado pelo débito fiscal das saídas: R$ 47.548,49.";
  if (id === "cofins-m") return "COFINS Matriz calculada pelo débito fiscal das saídas: R$ 219.011,34.";
  if (id === "pis-f") return "PIS Filial calculado pelo lançamento real FIL-DEB-PIS-SAI no Razão, CC 502: R$ 4.361,70.";
  if (id === "cofins-f") return "COFINS Filial calculada pelo lançamento real FIL-DEB-COF-SAI no Razão, CC 502: R$ 20.090,42.";
  return "Imposto incidente sobre as saídas pelo débito bruto do Razão. Créditos/reversões permanecem conciliados no Balancete e não reduzem esta linha da DRE.";
}

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = comparacaoBase.map((linha) => {
  if (linha.id === "deducoes") return { ...linha };
  if (!idsDeducoes.includes(linha.id)) return { ...linha };

  const calculado = valorCalculado(linha.id);
  let composicao = linha.composicao;

  if (linha.id === "pis-m") {
    composicao = composicaoFederalMatriz(linha.composicao, calculado, "PIS");
  } else if (linha.id === "cofins-m") {
    composicao = composicaoFederalMatriz(linha.composicao, calculado, "COFINS");
  } else if (linha.id === "pis-f") {
    composicao = composicaoFederalFilial("FIL-DEB-PIS-SAI", "PIS");
  } else if (linha.id === "cofins-f") {
    composicao = composicaoFederalFilial("FIL-DEB-COF-SAI", "COFINS");
  } else if (linha.id !== "dev" && linha.id !== "desc") {
    composicao = composicaoDebitoBruto(
      linha.composicao,
      "DRE calculada pelo débito bruto das saídas. Créditos/reversões continuam no Razão/Balancete.",
    );
  }

  return {
    ...linha,
    calculado,
    diferenca: arred(calculado - linha.enviado),
    criterio: criterio(linha.id),
    composicao,
  };
});

const mapa = new Map(comparacaoDreDetalhada.map((linha) => [linha.id, linha]));
const totalDeducoes = arred(idsDeducoes.reduce((total, id) => total + (mapa.get(id)?.calculado ?? 0), 0));
const linhaDeducoes = mapa.get("deducoes");
if (linhaDeducoes) {
  linhaDeducoes.calculado = totalDeducoes;
  linhaDeducoes.diferenca = arred(totalDeducoes - linhaDeducoes.enviado);
  linhaDeducoes.criterio = "Total calculado pelo Razão/Balancete, incluindo os débitos fiscais reais de PIS/COFINS da filial. Deve conferir com a DRE enviada.";
}

function atualizarResultado(id: string, calculado: number, criterioResultado: string) {
  const linha = mapa.get(id);
  if (!linha) return;
  linha.calculado = arred(calculado);
  linha.diferenca = arred(linha.calculado - linha.enviado);
  linha.criterio = criterioResultado;
}

const receitaCalculada = arred(mapa.get("receita")?.calculado ?? resumoBase.receitaCalculada ?? 0);
const custosCalculados = arred(mapa.get("custos")?.calculado ?? resumoBase.custosCalculados ?? 0);
const despesasLiquidasCalculadas = arred(mapa.get("despesas-liquidas")?.calculado ?? resumoBase.despesasLiquidasCalculadas ?? 0);
const resultadoNaoOperacionalCalculado = arred(mapa.get("nao-op")?.calculado ?? 0);
const lucroBrutoCalculado = arred(receitaCalculada - totalDeducoes - custosCalculados);
const resultadoOperacionalCalculado = arred(lucroBrutoCalculado - despesasLiquidasCalculadas);
const resultadoLiquidoCalculado = arred(resultadoOperacionalCalculado + resultadoNaoOperacionalCalculado);

atualizarResultado(
  "lucro-bruto",
  lucroBrutoCalculado,
  "Receita calculada pelo Razão menos deduções brutas documentadas menos custos/CPV do Razão.",
);
atualizarResultado(
  "resultado-op",
  resultadoOperacionalCalculado,
  "Lucro bruto recalculado menos despesas operacionais líquidas calculadas pelo Razão/Balancete.",
);
atualizarResultado(
  "lucro-liq",
  resultadoLiquidoCalculado,
  "Resultado operacional recalculado mais resultado não operacional do Razão/Balancete.",
);

export const resumoDreDetalhada = {
  ...resumoBase,
  receitaCalculada,
  deducoesCalculadas: totalDeducoes,
  custosCalculados,
  lucroBrutoCalculado,
  despesasLiquidasCalculadas,
  resultadoOperacionalCalculado,
  resultadoLiquidoCalculado,
  diferencaResultado: arred(resultadoLiquidoCalculado - (mapa.get("lucro-liq")?.enviado ?? 0)),
} as const;
