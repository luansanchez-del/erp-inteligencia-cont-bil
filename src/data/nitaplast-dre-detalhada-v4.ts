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
 * REGRA:
 * - o lado CALCULADO nasce do Razão/Balancete;
 * - impostos incidentes sobre vendas são apresentados pelo DÉBITO BRUTO;
 * - créditos/reversões permanecem no Razão/Balancete, sem reduzir essa linha;
 * - a apuração federal documentada possui um único débito consolidado de
 *   PIS R$ 47.548,49 e COFINS R$ 219.011,34;
 * - portanto PIS/COFINS "Filial" da DRE manual ficam como diferença de
 *   validação enquanto não existir um segundo débito fiscal/documental.
 *
 * A DRE enviada é somente REFERÊNCIA. Nenhum valor dela é usado para montar
 * o valor calculado.
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

function composicaoFederalConsolidada(
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
        cc: "0",
        centroCusto: "APURAÇÃO FEDERAL CONSOLIDADA",
        observacao: `${tributo}: débito por saídas da apuração federal documentada. Não existe segundo débito fiscal da filial no Razão.`,
      }
    : {
        ...item,
        debitos: 0,
        creditos: 0,
        valorLinha: 0,
        observacao: `${tributo}: composição gerencial não gera segundo débito contábil.`,
      });
}

function valorCalculado(id: string) {
  const linha = basePorId.get(id);
  if (!linha) return 0;

  if (id === "dev" || id === "desc") return arred(linha.calculado);
  if (id === "pis-m") return arred(controleFiscalFederalJunho.pis.debitoSaidas);
  if (id === "cofins-m") return arred(controleFiscalFederalJunho.cofins.debitoSaidas);
  if (id === "pis-f" || id === "cofins-f") return 0;

  return somaDebitos(linha.composicao);
}

function criterio(id: string) {
  if (id === "dev") return "Devoluções documentadas do período, apresentadas separadamente dos impostos sobre vendas.";
  if (id === "desc") return "Nenhum desconto concedido identificado no Razão de junho.";
  if (id === "pis-m") return "PIS calculado pelo débito por saídas da apuração federal documentada: R$ 47.548,49. O valor é consolidado no Razão.";
  if (id === "cofins-m") return "COFINS calculada pelo débito por saídas da apuração federal documentada: R$ 219.011,34. O valor é consolidado no Razão.";
  if (id === "pis-f") return "A DRE manual informa PIS Filial, mas não há segundo débito fiscal no Razão/apuração federal. Mantido como diferença de validação, sem criar lançamento artificial.";
  if (id === "cofins-f") return "A DRE manual informa COFINS Filial, mas não há segundo débito fiscal no Razão/apuração federal. Mantido como diferença de validação, sem criar lançamento artificial.";
  return "Imposto incidente sobre as saídas pelo débito bruto do Razão. Créditos/reversões permanecem conciliados no Balancete e não reduzem esta linha da DRE.";
}

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = comparacaoBase.map((linha) => {
  if (linha.id === "deducoes") return { ...linha };
  if (!idsDeducoes.includes(linha.id)) return linha;

  const calculado = valorCalculado(linha.id);
  let composicao = linha.composicao;

  if (linha.id === "pis-m") {
    composicao = composicaoFederalConsolidada(linha.composicao, calculado, "PIS");
  } else if (linha.id === "cofins-m") {
    composicao = composicaoFederalConsolidada(linha.composicao, calculado, "COFINS");
  } else if (linha.id === "pis-f" || linha.id === "cofins-f") {
    composicao = [];
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
  linhaDeducoes.criterio = "Total calculado exclusivamente pelo Razão/Balancete. A diferença para a DRE enviada corresponde a valores manuais sem segundo débito fiscal contabilizado.";
}

export const resumoDreDetalhada = {
  ...resumoBase,
  deducoesCalculadas: totalDeducoes,
} as const;
