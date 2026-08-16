import {
  comparacaoDreDetalhada as comparacaoBase,
  resumoDreDetalhada as resumoBase,
  type ComposicaoDre,
  type LinhaComparacaoDre,
} from "./nitaplast-dre-detalhada-v4";

export type { ComposicaoDre, LinhaComparacaoDre } from "./nitaplast-dre-detalhada-v4";
export * from "./nitaplast-dre-detalhada-v4";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Ajustes de APRESENTAÇÃO GERENCIAL baseados no documento + centro de custo.
 * Não alteram o resultado total e não criam lançamentos fictícios: apenas colocam
 * o mesmo movimento do Razão na linha correta da DRE gerencial.
 *
 * A natureza do documento prevalece sobre um agrupamento genérico da conta quando
 * há evidência do centro de custo/gerencial enviada pelo cliente.
 */
const linhas = comparacaoBase.map((linha) => ({
  ...linha,
  composicao: linha.composicao.map((item) => ({ ...item })),
}));
const mapa = new Map(linhas.map((linha) => [linha.id, linha]));

function moverComposicao(params: {
  origem: string;
  destino: string;
  predicado: (item: ComposicaoDre) => boolean;
  criterioOrigem: string;
  criterioDestino: string;
}) {
  const linhaOrigem = mapa.get(params.origem);
  const linhaDestino = mapa.get(params.destino);
  if (!linhaOrigem || !linhaDestino) return;

  const movidos = linhaOrigem.composicao.filter(params.predicado);
  if (!movidos.length) return;

  const chaves = new Set(movidos.map((item) => item.chave));
  linhaOrigem.composicao = linhaOrigem.composicao.filter((item) => !chaves.has(item.chave));
  linhaDestino.composicao = [...linhaDestino.composicao, ...movidos];

  const valor = arred(movidos.reduce((total, item) => total + item.valorLinha, 0));
  linhaOrigem.calculado = arred(linhaOrigem.calculado - valor);
  linhaOrigem.diferenca = arred(linhaOrigem.calculado - linhaOrigem.enviado);
  linhaDestino.calculado = arred(linhaDestino.calculado + valor);
  linhaDestino.diferenca = arred(linhaDestino.calculado - linhaDestino.enviado);
  linhaOrigem.criterio = params.criterioOrigem;
  linhaDestino.criterio = params.criterioDestino;
}

// NF de combustível está no CC 204 - Administração de Vendas. Na DRE gerencial
// enviada, esse gasto compõe Comercial; não deve ir para Veículos apenas pela conta.
moverComposicao({
  origem: "veiculos",
  destino: "comerciais",
  predicado: (item) => item.codigo === "4213" && item.cc === "204",
  criterioOrigem: "Veículos: manutenção/seguros e gastos vinculados aos centros de custo dos veículos. Combustível do CC 204 - Administração de Vendas é classificado em Despesas Comerciais.",
  criterioDestino: "Despesas comerciais pelo documento e centro de custo. Inclui combustível do CC 204 - Administração de Vendas, conforme relação de notas por CC.",
});

// 15.01.011 - OUTRAS DESPESAS no CC 106 - Oficina não é tributo. A conta 25077
// pertence a um agrupamento fiscal do plano, mas o documento/CC caracteriza produção.
moverComposicao({
  origem: "tributarias",
  destino: "producao",
  predicado: (item) => item.codigo === "25077" && item.cc === "106",
  criterioOrigem: "Despesas tributárias somente para impostos, taxas e contribuições efetivamente tributárias. 'Outras despesas' do CC Oficina não compõem esta linha.",
  criterioDestino: "Despesas de produção pelo centro de custo operacional e natureza do documento; inclui Outras Despesas do CC 106 - Oficina.",
});

// Os documentos do CC 10061 pertencem à empilhadeira e foram classificados na
// conferência final como Despesas com Imobilizado (R$ 616,00 + R$ 813,39).
moverComposicao({
  origem: "producao",
  destino: "imobilizado",
  predicado: (item) => item.cc === "10061" && ["25938", "3244"].includes(item.codigo),
  criterioOrigem: "Produção exclui os documentos vinculados diretamente ao imobilizado/empilhadeira CC 10061.",
  criterioDestino: "Despesas com imobilizado identificadas documentalmente no CC 10061 - Empilhadeira; não inclui depreciação provisória replicada de maio.",
});

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = linhas;

export const resumoDreDetalhada = {
  ...resumoBase,
  despesasAntesCreditosCalculadas: mapa.get("despesas")?.calculado ?? resumoBase.despesasAntesCreditosCalculadas,
  resultadoOperacionalCalculado: mapa.get("resultado-op")?.calculado ?? resumoBase.resultadoOperacionalCalculado,
  resultadoLiquidoCalculado: mapa.get("lucro-liq")?.calculado ?? resumoBase.resultadoLiquidoCalculado,
} as const;
