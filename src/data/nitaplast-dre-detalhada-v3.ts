import {
  comparacaoDreDetalhada as comparacaoBase,
  resumoDreDetalhada as resumoBase,
  tributosFederaisFilialDocumentados,
  type ComposicaoDre,
  type LinhaComparacaoDre,
} from "./nitaplast-dre-detalhada-v2";
import { conciliarTributoGerencial } from "./dre-segregacao-federal";

export type { ComposicaoDre, LinhaComparacaoDre } from "./nitaplast-dre-detalhada-v2";
export { tributosFederaisFilialDocumentados } from "./nitaplast-dre-detalhada-v2";
export type { ConciliacaoTributoGerencial, ValorTributoGerencial } from "./dre-segregacao-federal";
export { conciliarTributoGerencial } from "./dre-segregacao-federal";

const arred = (valor: number) => Math.round(valor * 100) / 100;

function linhaBase(id: string) {
  return comparacaoBase.find((linha) => linha.id === id);
}

function totaisComposicao(id: string) {
  const composicao = linhaBase(id)?.composicao ?? [];
  return {
    debito: arred(composicao.reduce((total, item) => total + item.debitos, 0)),
    credito: arred(composicao.reduce((total, item) => total + item.creditos, 0)),
  };
}

const pisMatrizBase = totaisComposicao("pis-m");
const pisFilialBase = totaisComposicao("pis-f");
const cofinsMatrizBase = totaisComposicao("cofins-m");
const cofinsFilialBase = totaisComposicao("cofins-f");

/**
 * JUNHO/2026 — REGRA OFICIAL
 *
 * A apuração fiscal de PIS/COFINS é consolidada na empresa.
 * A abertura da DRE gerencial entre Matriz e Filial NÃO representa duas
 * apurações fiscais: ela é obtida pelo documento/nota a nota do estabelecimento.
 *
 * Para junho, a filial 82.295.817/0003-60 é identificada pelos documentos do
 * relatório de saídas São Paulo. A parcela da matriz é o residual reconciliado
 * contra o total fiscal consolidado. Se a soma não fechar, o sistema expõe a
 * diferença em vez de criar lançamento ou alterar a DRE enviada.
 */
export const regraPisCofinsGerencialJunho = {
  competencia: "06/2026",
  matrizCnpj: "82.295.817/0001-07",
  filialCnpj: "82.295.817/0003-60",
  origemSegregacao: "DOCUMENTO_NOTA_A_NOTA",
  origemConsolidado: "REGISTRO_APURACAO_EMPRESA",
  fontes: {
    notasFilial: "RESUMO NOTAS FISCAIS SAIDA(2).pdf",
    pisConsolidado: "REGISTRO APURAÇÃO PIS(7).pdf",
    cofinsConsolidado: "REEGISTRO APURAÇÃO COFINS(2).pdf",
    devolucoesFilial: "RELATORIO DEVOLUÇÕES(6).pdf",
  },
  explicacao: "PIS/COFINS são apurados de forma consolidada. Matriz x Filial na DRE é segregação gerencial pelo nota a nota e deve reconciliar com a apuração consolidada.",
} as const;

const pisConsolidadoDebito = arred(pisMatrizBase.debito + pisFilialBase.debito);
const pisConsolidadoCredito = arred(pisMatrizBase.credito + pisFilialBase.credito);
const cofinsConsolidadoDebito = arred(cofinsMatrizBase.debito + cofinsFilialBase.debito);
const cofinsConsolidadoCredito = arred(cofinsMatrizBase.credito + cofinsFilialBase.credito);

export const conciliacaoPisGerencialJunho = conciliarTributoGerencial({
  tributo: "PIS",
  consolidadoDebito: pisConsolidadoDebito,
  consolidadoCredito: pisConsolidadoCredito,
  filialDebitoNotaANota: tributosFederaisFilialDocumentados.pisDebitoFilial,
  filialCreditoNotaANota: tributosFederaisFilialDocumentados.pisCreditoDevolucoesFilialIdentificado,
});

export const conciliacaoCofinsGerencialJunho = conciliarTributoGerencial({
  tributo: "COFINS",
  consolidadoDebito: cofinsConsolidadoDebito,
  consolidadoCredito: cofinsConsolidadoCredito,
  filialDebitoNotaANota: tributosFederaisFilialDocumentados.cofinsDebitoFilial,
  filialCreditoNotaANota: tributosFederaisFilialDocumentados.cofinsCreditoDevolucoesFilialIdentificado,
});

export const conciliacaoFederalGerencialJunho = {
  pis: conciliacaoPisGerencialJunho,
  cofins: conciliacaoCofinsGerencialJunho,
  confere: conciliacaoPisGerencialJunho.confere && conciliacaoCofinsGerencialJunho.confere,
  regra: regraPisCofinsGerencialJunho,
} as const;

function composicaoGerencial(
  composicao: ComposicaoDre[],
  tributo: "PIS" | "COFINS",
  estabelecimento: "MATRIZ" | "FILIAL",
  debito: number,
  credito: number,
): ComposicaoDre[] {
  const fonte = estabelecimento === "FILIAL"
    ? `${regraPisCofinsGerencialJunho.fontes.notasFilial} · ${tributo === "PIS" ? regraPisCofinsGerencialJunho.fontes.pisConsolidado : regraPisCofinsGerencialJunho.fontes.cofinsConsolidado} · ${regraPisCofinsGerencialJunho.fontes.devolucoesFilial}`
    : `${tributo === "PIS" ? regraPisCofinsGerencialJunho.fontes.pisConsolidado : regraPisCofinsGerencialJunho.fontes.cofinsConsolidado} · residual após segregação nota a nota da filial`;

  const observacao = estabelecimento === "FILIAL"
    ? `${tributo} gerencial da filial 82.295.817/0003-60: segregado pelos documentos/notas do estabelecimento. Não é uma segunda apuração fiscal.`
    : `${tributo} gerencial da matriz: parcela remanescente do consolidado fiscal após retirar a filial identificada nota a nota. A soma Matriz + Filial deve fechar com a apuração da empresa.`;

  if (composicao.length === 0) return [];

  return composicao.map((item, index) => index === 0
    ? {
        ...item,
        debitos: arred(debito),
        creditos: arred(credito),
        valorLinha: arred(debito - credito),
        fonte,
        observacao,
      }
    : { ...item, debitos: 0, creditos: 0, valorLinha: 0, fonte, observacao });
}

function atualizarLinhaFederal(linha: LinhaComparacaoDre): LinhaComparacaoDre {
  if (linha.id === "pis-m") {
    const v = conciliacaoPisGerencialJunho.matrizGerencial;
    return {
      ...linha,
      calculado: v.liquido,
      diferenca: arred(v.liquido - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "PIS", "MATRIZ", v.debito, v.credito),
      criterio: "PIS gerencial da MATRIZ = apuração consolidada da empresa menos a parcela da filial identificada nota a nota. Não cria segunda apuração fiscal.",
    };
  }

  if (linha.id === "pis-f") {
    const v = conciliacaoPisGerencialJunho.filialGerencial;
    return {
      ...linha,
      calculado: v.liquido,
      diferenca: arred(v.liquido - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "PIS", "FILIAL", v.debito, v.credito),
      criterio: "PIS gerencial da FILIAL = somatório/identificação dos documentos do estabelecimento 82.295.817/0003-60, conciliado com a apuração consolidada da empresa.",
    };
  }

  if (linha.id === "cofins-m") {
    const v = conciliacaoCofinsGerencialJunho.matrizGerencial;
    return {
      ...linha,
      calculado: v.liquido,
      diferenca: arred(v.liquido - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "COFINS", "MATRIZ", v.debito, v.credito),
      criterio: "COFINS gerencial da MATRIZ = apuração consolidada da empresa menos a parcela da filial identificada nota a nota. Não cria segunda apuração fiscal.",
    };
  }

  if (linha.id === "cofins-f") {
    const v = conciliacaoCofinsGerencialJunho.filialGerencial;
    return {
      ...linha,
      calculado: v.liquido,
      diferenca: arred(v.liquido - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "COFINS", "FILIAL", v.debito, v.credito),
      criterio: "COFINS gerencial da FILIAL = somatório/identificação dos documentos do estabelecimento 82.295.817/0003-60, conciliado com a apuração consolidada da empresa.",
    };
  }

  if (linha.id === "deducoes") {
    return {
      ...linha,
      criterio: `${linha.criterio} PIS/COFINS: apuração fiscal consolidada; abertura Matriz x Filial exclusivamente gerencial pelo nota a nota.`,
    };
  }

  return linha;
}

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = comparacaoBase.map(atualizarLinhaFederal);

export const resumoDreDetalhada = {
  ...resumoBase,
  conciliacaoPisGerencial: conciliacaoPisGerencialJunho,
  conciliacaoCofinsGerencial: conciliacaoCofinsGerencialJunho,
  conciliacaoFederalGerencialConfere: conciliacaoFederalGerencialJunho.confere,
} as const;
