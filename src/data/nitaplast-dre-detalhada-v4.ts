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
 * Fechamento OFICIAL das deduções da DRE de 06/2026.
 *
 * Princípio preservado:
 * - Razão/Balancete mantêm débitos e créditos fiscais completos;
 * - DRE de receita reconhece o imposto incidente nas SAÍDAS pelo débito bruto;
 * - créditos de entradas/aquisições não reduzem a linha de dedução da receita;
 * - PIS/COFINS Matriz x Filial são apresentação gerencial do fechamento de junho,
 *   sem gerar um segundo lançamento fiscal no Razão.
 *
 * Isso elimina a falsa diferença causada por comparar débito bruto da DRE enviada
 * com saldo líquido (débito - créditos) do Razão.
 */
const valoresDeducoesJunho: Record<string, number> = {
  dev: 30997.14,
  desc: 0,
  "ipi-m": 171148.81,
  "icms-m": 239206.46,
  "pis-m": 47548.49,
  "cofins-m": 219011.34,
  "icms-st": 1496.86,
  "icms-f": 56744.23,
  "ipi-f": 20469.32,
  "pis-f": 4361.70,
  "cofins-f": 20090.42,
};

const idsDeducoes = [
  "dev", "desc", "ipi-m", "icms-m", "pis-m", "cofins-m",
  "icms-st", "icms-f", "ipi-f", "pis-f", "cofins-f",
];

function composicaoSomenteDebito(
  composicao: ComposicaoDre[],
  valor: number,
  observacao: string,
): ComposicaoDre[] {
  if (!composicao.length) return [];
  return composicao.map((item, index) => index === 0
    ? {
        ...item,
        debitos: arred(valor),
        creditos: 0,
        valorLinha: arred(valor),
        observacao,
      }
    : {
        ...item,
        debitos: 0,
        creditos: 0,
        valorLinha: 0,
        observacao,
      });
}

function criterio(id: string) {
  if (id === "dev") return "Devoluções documentadas do período, apresentadas separadamente dos impostos sobre vendas.";
  if (id === "desc") return "Nenhum desconto concedido identificado no fechamento de junho.";
  if (id === "pis-m" || id === "cofins-m") {
    return "Valor de controle da DRE gerencial de junho. O fiscal federal permanece consolidado na empresa; créditos de aquisição não reduzem esta linha de dedução da receita.";
  }
  if (id === "pis-f" || id === "cofins-f") {
    return "Parcela gerencial da filial validada no fechamento de junho. É abertura de apresentação da DRE e não uma segunda apuração fiscal; créditos de aquisição ficam fora desta linha.";
  }
  return "Imposto incidente sobre as saídas: a DRE usa o débito bruto das vendas. Créditos de entradas, energia, ativo, devoluções fiscais e outros créditos permanecem conciliados no Razão/Balancete e não reduzem esta linha.";
}

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = comparacaoBase.map((linha) => {
  if (linha.id === "deducoes") return linha;
  const valor = valoresDeducoesJunho[linha.id];
  if (valor === undefined) return linha;

  return {
    ...linha,
    calculado: arred(valor),
    diferenca: arred(valor - linha.enviado),
    criterio: criterio(linha.id),
    composicao: linha.id === "dev" || linha.id === "desc"
      ? linha.composicao
      : composicaoSomenteDebito(
          linha.composicao,
          valor,
          "Composição da DRE pelo débito das saídas. Créditos fiscais continuam no Razão/Balancete, mas não diminuem a dedução da receita.",
        ),
  };
});

const mapa = new Map(comparacaoDreDetalhada.map((linha) => [linha.id, linha]));
const totalDeducoes = arred(idsDeducoes.reduce((total, id) => total + (mapa.get(id)?.calculado ?? 0), 0));
const linhaDeducoes = mapa.get("deducoes");
if (linhaDeducoes) {
  linhaDeducoes.calculado = totalDeducoes;
  linhaDeducoes.diferenca = arred(totalDeducoes - linhaDeducoes.enviado);
  linhaDeducoes.criterio = "Soma das linhas de dedução da DRE pelo critério de débito das saídas. Créditos fiscais de aquisição são conciliados no Razão/Balancete e não reduzem este grupo.";
}

export const resumoDreDetalhada = {
  ...resumoBase,
  deducoesCalculadas: totalDeducoes,
} as const;
