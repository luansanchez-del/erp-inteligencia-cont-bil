import { calcularDreJulhoFinal, ehCustoDreJulho, ehDespesaFinanceiraDreJulho, ehDespesaOperacionalDreJulho, ehReceitaFinanceiraDreJulho } from "../src/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
import { estabelecimentoResultadoNitaplast } from "../src/data/nitaplast-estabelecimento";

const calculo = calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
const filial = calculo.composicao.filter((item) => item.estabelecimento === "Filial SP");
const despesas = filial.filter(ehDespesaOperacionalDreJulho);
const creditos = filial.filter((item) => ["25946", "25947"].includes(item.conta));
const soma = (itens: typeof filial) => Math.round(itens.reduce((total, item) => total + item.valor, 0) * 100) / 100;
const arred = (valor: number) => Math.round(valor * 100) / 100;
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
  receitaLiquidaConsolidada: calculo.dre.receitaLiquida,
  resultadoConsolidado: calculo.dre.resultado,
  candidatosDiferenca,
  paresDiferenca,
  conta3095: agregados.filter((item) => item.conta === "3095"),
  foraDosGrupos,
}, null, 2));
