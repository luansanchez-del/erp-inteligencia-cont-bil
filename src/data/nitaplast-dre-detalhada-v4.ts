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
 * REGRA PERMANENTE PIS/COFINS:
 * - existe UMA apuração fiscal consolidada no Razão/Balancete;
 * - Matriz x Filial é somente ABERTURA GERENCIAL da DRE;
 * - a parcela da filial é segregada pelo documento/nota a nota;
 * - a parcela da matriz é o residual do consolidado após retirar a filial;
 * - Matriz + Filial = débito consolidado;
 * - essa segregação NÃO cria lançamento contábil adicional e NÃO polui o Razão.
 *
 * Para os demais impostos sobre vendas, a DRE usa o débito bruto das saídas.
 * Créditos fiscais de aquisição permanecem conciliados no Razão/Balancete e não
 * reduzem a linha de dedução da receita.
 */
const idsDeducoes = [
  "dev", "desc", "ipi-m", "icms-m", "pis-m", "cofins-m",
  "icms-st", "icms-f", "ipi-f", "pis-f", "cofins-f",
];

const basePorId = new Map(comparacaoBase.map((linha) => [linha.id, linha]));

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

function composicaoFederalGerencial(
  composicao: ComposicaoDre[],
  valor: number,
  tributo: "PIS" | "COFINS",
  estabelecimento: "MATRIZ" | "FILIAL",
): ComposicaoDre[] {
  if (!composicao.length) return [];
  const filial = estabelecimento === "FILIAL";
  return composicao.map((item, index) => index === 0
    ? {
        ...item,
        debitos: arred(valor),
        creditos: 0,
        valorLinha: arred(valor),
        cc: filial ? "502" : "201",
        centroCusto: filial ? "COMERCIAL SP" : "MATRIZ / VENDAS",
        observacao: `${tributo} ${estabelecimento}: segregação gerencial do débito consolidado. Não gera segundo lançamento no Razão.`,
      }
    : {
        ...item,
        debitos: 0,
        creditos: 0,
        valorLinha: 0,
        observacao: `${tributo}: composição gerencial; sem lançamento contábil adicional.`,
      });
}

function valorCalculado(id: string) {
  const linha = basePorId.get(id);
  if (!linha) return 0;

  if (id === "dev" || id === "desc") return arred(linha.calculado);

  if (id === "pis-m") return arred(conciliacaoPisGerencialJunho.matrizGerencial.debitoSobreVendas);
  if (id === "pis-f") return arred(conciliacaoPisGerencialJunho.filialGerencial.debitoSobreVendas);
  if (id === "cofins-m") return arred(conciliacaoCofinsGerencialJunho.matrizGerencial.debitoSobreVendas);
  if (id === "cofins-f") return arred(conciliacaoCofinsGerencialJunho.filialGerencial.debitoSobreVendas);

  return somaDebitos(linha.composicao);
}

function criterio(id: string) {
  if (id === "dev") return "Devoluções documentadas do período, apresentadas separadamente dos impostos sobre vendas.";
  if (id === "desc") return "Nenhum desconto concedido identificado no Razão de junho.";
  if (id === "pis-m") return "PIS Matriz = parcela residual do débito consolidado após a segregação documental da filial. Abertura gerencial, sem novo lançamento.";
  if (id === "pis-f") return "PIS Filial = parcela do débito consolidado identificada nos documentos da filial. Abertura gerencial, sem novo lançamento.";
  if (id === "cofins-m") return "COFINS Matriz = parcela residual do débito consolidado após a segregação documental da filial. Abertura gerencial, sem novo lançamento.";
  if (id === "cofins-f") return "COFINS Filial = parcela do débito consolidado identificada nos documentos da filial. Abertura gerencial, sem novo lançamento.";
  return "Imposto incidente sobre as saídas pelo débito bruto do Razão. Créditos de aquisição permanecem conciliados no Balancete e não reduzem esta linha da DRE.";
}

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = comparacaoBase.map((linha) => {
  if (linha.id === "deducoes") return { ...linha };
  if (!idsDeducoes.includes(linha.id)) return { ...linha };

  const calculado = valorCalculado(linha.id);
  let composicao = linha.composicao;

  if (linha.id === "pis-m") {
    composicao = composicaoFederalGerencial(linha.composicao, calculado, "PIS", "MATRIZ");
  } else if (linha.id === "pis-f") {
    composicao = composicaoFederalGerencial(linha.composicao, calculado, "PIS", "FILIAL");
  } else if (linha.id === "cofins-m") {
    composicao = composicaoFederalGerencial(linha.composicao, calculado, "COFINS", "MATRIZ");
  } else if (linha.id === "cofins-f") {
    composicao = composicaoFederalGerencial(linha.composicao, calculado, "COFINS", "FILIAL");
  } else if (linha.id !== "dev" && linha.id !== "desc") {
    composicao = composicaoDebitoBruto(
      linha.composicao,
      "DRE calculada pelo débito bruto das saídas. Créditos fiscais continuam no Razão/Balancete.",
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
  linhaDeducoes.criterio = "Total do Razão/Balancete. PIS/COFINS são consolidados e apenas segregados gerencialmente entre Matriz e Filial, sem duplicação e sem novo lançamento.";
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
  "Receita calculada pelo Razão menos deduções consolidadas/segregadas gerencialmente menos custos do Razão.",
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
