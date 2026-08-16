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
    reversaoDre: arred(composicao.reduce((total, item) => total + item.creditos, 0)),
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
 * Crédito fiscal de aquisição é outro controle: fica em tributos a recuperar /
 * compensação e NÃO reduz a linha de imposto sobre vendas da DRE.
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
  explicacao: "PIS/COFINS são apurados de forma consolidada. Matriz x Filial na DRE é segregação gerencial pelo nota a nota. Créditos fiscais de aquisição são conciliados na apuração, fora da dedução sobre vendas.",
} as const;

/** Controle fiscal efetivo do registro de apuração consolidado. */
export const controleFiscalFederalJunho = {
  pis: {
    debitoSaidas: 47548.49,
    creditoAquisicoes: 32907.70,
    saldoDevedor: 14640.79,
    fonte: regraPisCofinsGerencialJunho.fontes.pisConsolidado,
  },
  cofins: {
    debitoSaidas: 219011.34,
    creditoAquisicoes: 151385.76,
    saldoDevedor: 67625.58,
    fonte: regraPisCofinsGerencialJunho.fontes.cofinsConsolidado,
  },
} as const;

// Reversão na DRE = crédito lançado contra a dedução sobre vendas (ex.: devolução).
// NÃO confundir com crédito fiscal de entrada/aquisição do registro de apuração.
const pisReversaoDreConsolidada = arred(pisMatrizBase.reversaoDre + pisFilialBase.reversaoDre);
const cofinsReversaoDreConsolidada = arred(cofinsMatrizBase.reversaoDre + cofinsFilialBase.reversaoDre);

export const conciliacaoPisGerencialJunho = conciliarTributoGerencial({
  tributo: "PIS",
  consolidadoDebitoSobreVendas: controleFiscalFederalJunho.pis.debitoSaidas,
  consolidadoReversaoDre: pisReversaoDreConsolidada,
  filialDebitoNotaANota: tributosFederaisFilialDocumentados.pisDebitoFilial,
  filialReversaoNotaANota: tributosFederaisFilialDocumentados.pisCreditoDevolucoesFilialIdentificado,
});

export const conciliacaoCofinsGerencialJunho = conciliarTributoGerencial({
  tributo: "COFINS",
  consolidadoDebitoSobreVendas: controleFiscalFederalJunho.cofins.debitoSaidas,
  consolidadoReversaoDre: cofinsReversaoDreConsolidada,
  filialDebitoNotaANota: tributosFederaisFilialDocumentados.cofinsDebitoFilial,
  filialReversaoNotaANota: tributosFederaisFilialDocumentados.cofinsCreditoDevolucoesFilialIdentificado,
});

const pisDebitoRazao = arred(pisMatrizBase.debito + pisFilialBase.debito);
const cofinsDebitoRazao = arred(cofinsMatrizBase.debito + cofinsFilialBase.debito);

export const conciliacaoFederalGerencialJunho = {
  pis: conciliacaoPisGerencialJunho,
  cofins: conciliacaoCofinsGerencialJunho,
  controleFiscal: controleFiscalFederalJunho,
  razaoVsApuracao: {
    pisDebitoRazao,
    pisDebitoApuracao: controleFiscalFederalJunho.pis.debitoSaidas,
    pisDiferenca: arred(pisDebitoRazao - controleFiscalFederalJunho.pis.debitoSaidas),
    cofinsDebitoRazao,
    cofinsDebitoApuracao: controleFiscalFederalJunho.cofins.debitoSaidas,
    cofinsDiferenca: arred(cofinsDebitoRazao - controleFiscalFederalJunho.cofins.debitoSaidas),
  },
  confere:
    conciliacaoPisGerencialJunho.confere
    && conciliacaoCofinsGerencialJunho.confere
    && Math.abs(arred(pisDebitoRazao - controleFiscalFederalJunho.pis.debitoSaidas)) <= 0.01
    && Math.abs(arred(cofinsDebitoRazao - controleFiscalFederalJunho.cofins.debitoSaidas)) <= 0.01,
  regra: regraPisCofinsGerencialJunho,
} as const;

function composicaoGerencial(
  composicao: ComposicaoDre[],
  tributo: "PIS" | "COFINS",
  estabelecimento: "MATRIZ" | "FILIAL",
  debitoSobreVendas: number,
  reversaoDre: number,
): ComposicaoDre[] {
  const fonte = estabelecimento === "FILIAL"
    ? `${regraPisCofinsGerencialJunho.fontes.notasFilial} · ${tributo === "PIS" ? regraPisCofinsGerencialJunho.fontes.pisConsolidado : regraPisCofinsGerencialJunho.fontes.cofinsConsolidado} · ${regraPisCofinsGerencialJunho.fontes.devolucoesFilial}`
    : `${tributo === "PIS" ? regraPisCofinsGerencialJunho.fontes.pisConsolidado : regraPisCofinsGerencialJunho.fontes.cofinsConsolidado} · residual após segregação nota a nota da filial`;

  const observacao = estabelecimento === "FILIAL"
    ? `${tributo} gerencial da filial 82.295.817/0003-60: segregado pelos documentos/notas do estabelecimento. Não é uma segunda apuração fiscal. Créditos fiscais de aquisição não entram nesta linha.`
    : `${tributo} gerencial da matriz: parcela remanescente do débito consolidado após retirar a filial identificada nota a nota. Matriz + Filial deve fechar com o débito sobre saídas da apuração consolidada.`;

  if (composicao.length === 0) return [];

  return composicao.map((item, index) => index === 0
    ? {
        ...item,
        debitos: arred(debitoSobreVendas),
        creditos: arred(reversaoDre),
        valorLinha: arred(debitoSobreVendas - reversaoDre),
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
      calculado: v.liquidoDre,
      diferenca: arred(v.liquidoDre - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "PIS", "MATRIZ", v.debitoSobreVendas, v.reversaoDre),
      criterio: "PIS gerencial da MATRIZ = débito consolidado da empresa menos a parcela da filial identificada nota a nota. Crédito fiscal de aquisição não reduz esta linha.",
    };
  }

  if (linha.id === "pis-f") {
    const v = conciliacaoPisGerencialJunho.filialGerencial;
    return {
      ...linha,
      calculado: v.liquidoDre,
      diferenca: arred(v.liquidoDre - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "PIS", "FILIAL", v.debitoSobreVendas, v.reversaoDre),
      criterio: "PIS gerencial da FILIAL = documentos/notas do estabelecimento 82.295.817/0003-60, conciliados ao débito consolidado da empresa. Não é uma segunda apuração fiscal.",
    };
  }

  if (linha.id === "cofins-m") {
    const v = conciliacaoCofinsGerencialJunho.matrizGerencial;
    return {
      ...linha,
      calculado: v.liquidoDre,
      diferenca: arred(v.liquidoDre - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "COFINS", "MATRIZ", v.debitoSobreVendas, v.reversaoDre),
      criterio: "COFINS gerencial da MATRIZ = débito consolidado da empresa menos a parcela da filial identificada nota a nota. Crédito fiscal de aquisição não reduz esta linha.",
    };
  }

  if (linha.id === "cofins-f") {
    const v = conciliacaoCofinsGerencialJunho.filialGerencial;
    return {
      ...linha,
      calculado: v.liquidoDre,
      diferenca: arred(v.liquidoDre - linha.enviado),
      composicao: composicaoGerencial(linha.composicao, "COFINS", "FILIAL", v.debitoSobreVendas, v.reversaoDre),
      criterio: "COFINS gerencial da FILIAL = documentos/notas do estabelecimento 82.295.817/0003-60, conciliados ao débito consolidado da empresa. Não é uma segunda apuração fiscal.",
    };
  }

  if (linha.id === "deducoes") {
    return {
      ...linha,
      criterio: `${linha.criterio} PIS/COFINS: débito fiscal consolidado; abertura Matriz x Filial pelo nota a nota; créditos fiscais de aquisição permanecem fora das deduções sobre vendas.`,
    };
  }

  return linha;
}

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = comparacaoBase.map(atualizarLinhaFederal);

export const resumoDreDetalhada = {
  ...resumoBase,
  conciliacaoPisGerencial: conciliacaoPisGerencialJunho,
  conciliacaoCofinsGerencial: conciliacaoCofinsGerencialJunho,
  controleFiscalFederal: controleFiscalFederalJunho,
  conciliacaoFederalGerencialConfere: conciliacaoFederalGerencialJunho.confere,
} as const;
