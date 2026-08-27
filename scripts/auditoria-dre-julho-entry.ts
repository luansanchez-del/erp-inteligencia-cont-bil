import { calcularDreJulhoFinal, ehCustoDreJulho, ehDespesaFinanceiraDreJulho, ehDespesaOperacionalDreJulho, ehReceitaFinanceiraDreJulho } from "../src/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
import { estabelecimentoResultadoNitaplast } from "../src/data/nitaplast-estabelecimento";

const calculo = calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
const filial = calculo.composicao.filter((item) => item.estabelecimento === "Filial SP");
const despesas = filial.filter(ehDespesaOperacionalDreJulho);
const creditos = filial.filter((item) => ["25946", "25947"].includes(item.conta));
const soma = (itens: typeof filial) => Math.round(itens.reduce((total, item) => total + item.valor, 0) * 100) / 100;
const arred = (valor: number) => Math.round(valor * 100) / 100;
// Ponte documental dos relatórios RVE520 recebidos em 27/08/2026.
// Os PDFs foram emitidos com "SEM DESP.ACESSORIAS+FRETE+SEGURO". Por isso,
// esses valores precisam ser reincorporados para comparar a base comercial
// com a receita bruta fiscal contabilizada. Alienações ficam fora da receita
// operacional e são demonstradas separadamente na DRE.
const ponteFaturamentoDre = {
  matriz: {
    vendasProdutosPdf: 3723226.76,
    alienacaoImobilizado: 306900,
    ipiVendas: 163767.46,
    icmsStVendas: 1024.72,
    freteSeguroDespesasAcessorias: 36037.92,
    devolucoesProdutosPdf: 34101.29,
    ipiDevolucoes: 2349.42,
    receitaBrutaEsperada: 3617156.86,
    devolucoesEsperadas: 36450.71,
  },
  filial: {
    vendasProdutosPdf: 488870.69,
    alienacaoImobilizado: 0,
    ipiVendas: 32002.17,
    icmsStVendas: 0,
    freteSeguroDespesasAcessorias: 520,
    devolucoesProdutosPdf: 1868.47,
    ipiDevolucoes: 88.04,
    receitaBrutaEsperada: 521392.86,
    devolucoesEsperadas: 1956.51,
  },
} as const;
const totalPonte = (item: (typeof ponteFaturamentoDre)[keyof typeof ponteFaturamentoDre]) => arred(
  item.vendasProdutosPdf - item.alienacaoImobilizado + item.ipiVendas + item.icmsStVendas + item.freteSeguroDespesasAcessorias,
);
const devolucoesPonte = (item: (typeof ponteFaturamentoDre)[keyof typeof ponteFaturamentoDre]) => arred(
  item.devolucoesProdutosPdf + item.ipiDevolucoes,
);
const receitaBrutaFilial = arred(["2606", "2655"].reduce((receita, conta) => receita - lancamentosIntegradosJulhoFinal.reduce((total, linha) => {
  if (estabelecimentoResultadoNitaplast(linha, conta) !== "Filial SP") return total;
  return total + (linha.debitoCodigo === conta ? linha.valor : 0) - (linha.creditoCodigo === conta ? linha.valor : 0);
}, 0), 0));
const deducoesFilial = arred(calculo.dre.devolucoesFilial + calculo.dre.icmsFilial + calculo.dre.ipiFilial + calculo.dre.pisFilial + calculo.dre.cofinsFilial + calculo.dre.icmsStFilial);
const resultadoFilial = arred(receitaBrutaFilial - deducoesFilial - calculo.dre.cpvFilial - soma(despesas) - calculo.dre.despesasFinanceirasFilial + calculo.dre.receitasFinanceirasFilial);
const alvo = 19225.58;
const agregados = Object.values(calculo.composicao.reduce<Record<string, { conta: string; descricao: string; estabelecimento: string; valor: number }>>((acc, item) => {
  const chave = `${item.conta}|${item.estabelecimento}`;
  acc[chave] ??= { conta: item.conta, descricao: item.descricao, estabelecimento: item.estabelecimento, valor: 0 };
  acc[chave].valor = arred(acc[chave].valor + item.valor);
  return acc;
}, {}));
const candidatosDiferenca = agregados.filter((item) => Math.abs(Math.abs(item.valor) - alvo) < 0.01);
const paresDiferenca: unknown[] = [];
for (let i = 0; i < agregados.length; i += 1) for (let j = i + 1; j < agregados.length; j += 1) {
  if (Math.abs(Math.abs(agregados[i].valor + agregados[j].valor) - alvo) < 0.01) paresDiferenca.push([agregados[i], agregados[j]]);
}
const foraDosGrupos = calculo.composicao.filter((item) =>
  item.valor > 0 && !ehCustoDreJulho(item) && !ehDespesaOperacionalDreJulho(item) &&
  !ehDespesaFinanceiraDreJulho(item) && !ehReceitaFinanceiraDreJulho(item) &&
  !["25943", "2827", "25054", "2826", "25055", "2829", "2830", "2832", "4760"].includes(item.conta),
);

if (totalPonte(ponteFaturamentoDre.matriz) !== ponteFaturamentoDre.matriz.receitaBrutaEsperada) throw new Error("Ponte do faturamento da Matriz não fecha.");
if (totalPonte(ponteFaturamentoDre.filial) !== ponteFaturamentoDre.filial.receitaBrutaEsperada) throw new Error("Ponte do faturamento da Filial não fecha.");
if (devolucoesPonte(ponteFaturamentoDre.matriz) !== ponteFaturamentoDre.matriz.devolucoesEsperadas) throw new Error("Ponte das devoluções da Matriz não fecha.");
if (devolucoesPonte(ponteFaturamentoDre.filial) !== ponteFaturamentoDre.filial.devolucoesEsperadas) throw new Error("Ponte das devoluções da Filial não fecha.");
if (arred(ponteFaturamentoDre.matriz.receitaBrutaEsperada + ponteFaturamentoDre.filial.receitaBrutaEsperada) !== calculo.dre.receitaBruta) throw new Error("Faturamento conciliado não fecha com a receita bruta da DRE.");
if (arred(ponteFaturamentoDre.matriz.devolucoesEsperadas + ponteFaturamentoDre.filial.devolucoesEsperadas) !== calculo.dre.devolucoes) throw new Error("Devoluções conciliadas não fecham com a DRE.");

console.log(JSON.stringify({
  receitaProducao: calculo.dre.receitaProducao,
  receitaRevenda: calculo.dre.receitaRevenda,
  receitaBrutaFilial,
  deducoesFilial,
  receitaLiquidaFilial: arred(receitaBrutaFilial - deducoesFilial),
  devolucoes: calculo.dre.devolucoes,
  icms: calculo.dre.icms,
  icmsSt: calculo.dre.icmsSt,
  ipi: calculo.dre.ipi,
  pis: calculo.dre.pis,
  cofins: calculo.dre.cofins,
  deducoesConsolidadas: calculo.dre.deducoes,
  cpvFilial: calculo.dre.cpvFilial,
  cpvMatriz: calculo.dre.cpvMatriz,
  cpvTotal: calculo.dre.custosReconhecidos,
  provisaoCustoCliente: calculo.dre.provisaoCustoCliente,
  despesasComerciaisFilialBrutas: soma(despesas),
  creditosFederaisFilial: soma(creditos),
  despesasComerciaisFilialLiquidas: soma(despesas) + soma(creditos),
  despesasFinanceirasFilial: calculo.dre.despesasFinanceirasFilial,
  despesasOperacionaisMatriz: calculo.dre.despesasOperacionaisMatriz,
  despesasOperacionaisFilial: calculo.dre.despesasOperacionaisFilial,
  despesasOperacionaisTotal: calculo.dre.despesasOperacionais,
  creditosFederaisTotal: calculo.dre.creditosFederais,
  despesasFinanceirasTotal: calculo.dre.despesasFinanceiras,
  receitasFinanceirasFilial: calculo.dre.receitasFinanceirasFilial,
  receitasFinanceirasTotal: calculo.dre.receitasFinanceiras,
  receitaAlienacao: calculo.dre.receitaAlienacaoImobilizado,
  custoAlienacao: calculo.dre.custoAlienacaoImobilizado,
  resultadoAlienacao: calculo.dre.resultadoAlienacaoImobilizado,
  resultadoFilial,
  receitaBrutaConsolidada: calculo.dre.receitaBruta,
  ponteFaturamentoDre: {
    ...ponteFaturamentoDre,
    receitaBrutaConciliada: arred(totalPonte(ponteFaturamentoDre.matriz) + totalPonte(ponteFaturamentoDre.filial)),
    devolucoesConciliadas: arred(devolucoesPonte(ponteFaturamentoDre.matriz) + devolucoesPonte(ponteFaturamentoDre.filial)),
    diferencaReceita: arred(totalPonte(ponteFaturamentoDre.matriz) + totalPonte(ponteFaturamentoDre.filial) - calculo.dre.receitaBruta),
    diferencaDevolucoes: arred(devolucoesPonte(ponteFaturamentoDre.matriz) + devolucoesPonte(ponteFaturamentoDre.filial) - calculo.dre.devolucoes),
  },
  receitaLiquidaConsolidada: calculo.dre.receitaLiquida,
  resultadoConsolidado: calculo.dre.resultado,
  candidatosDiferenca,
  paresDiferenca,
  conta3095: agregados.filter((item) => item.conta === "3095"),
  foraDosGrupos,
}, null, 2));
