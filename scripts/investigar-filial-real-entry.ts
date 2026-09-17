import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
import { estruturaBalanceteNitaplast } from "../src/data/nitaplast-balancete-estrutura";
import { contasPosImplantacao } from "../src/data/nitaplast-balancete-julho-engine";
import {
  ehCustoDreJulho,
  ehDespesaFinanceiraDreJulho,
  ehDespesaOperacionalDreJulho,
  ehReceitaFinanceiraDreJulho,
} from "../src/data/nitaplast-dre-julho-final";

const contasEstruturaBase = new Set(estruturaBalanceteNitaplast.map((x) => x.conta));
const estruturaCompleta = [
  ...estruturaBalanceteNitaplast,
  ...contasPosImplantacao
    .filter(([conta]) => !contasEstruturaBase.has(conta))
    .map(([conta, classificacao, descricao]) => ({ conta, tipo: "A", classificacao, descricao })),
];
const analiticas = estruturaCompleta.filter((x) => x.tipo === "A");
const classificacaoPorConta = new Map(analiticas.map((x) => [x.conta, x.classificacao]));
const descricaoPorConta = new Map(analiticas.map((x) => [x.conta, x.descricao]));
const ccFilial = new Set(["501", "502", "503", "504", "505"]);

function movimentoFilialReal(lancamentos: any[], label: string) {
  const despesasOperacionaisContas = new Set<string>();
  for (const l of lancamentos) {
    for (const codigo of [l.debitoCodigo, l.creditoCodigo]) {
      const chave = { conta: codigo, classificacao: classificacaoPorConta.get(codigo) ?? "", cc: l.cc ?? "0" };
      if (ehCustoDreJulho(chave)) continue;
      if (ehDespesaFinanceiraDreJulho(chave)) continue;
      if (ehReceitaFinanceiraDreJulho(chave)) continue;
      if (ehDespesaOperacionalDreJulho(chave)) despesasOperacionaisContas.add(codigo);
    }
  }
  let total = 0;
  const porConta = new Map<string, number>();
  for (const l of lancamentos) {
    const cc = l.cc ?? "0";
    if (!ccFilial.has(cc)) continue;
    if (despesasOperacionaisContas.has(l.debitoCodigo)) {
      total += l.valor;
      porConta.set(l.debitoCodigo, (porConta.get(l.debitoCodigo) ?? 0) + l.valor);
    }
    if (despesasOperacionaisContas.has(l.creditoCodigo)) {
      total -= l.valor;
      porConta.set(l.creditoCodigo, (porConta.get(l.creditoCodigo) ?? 0) - l.valor);
    }
  }
  console.log(`\n=== ${label}: despesa operacional REAL por movimento em CC Filial (501-505) ===`);
  console.log("Total:", total.toFixed(2));
  for (const [conta, v] of [...porConta.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))) {
    if (Math.abs(v) > 0.005) console.log(" ", conta, descricaoPorConta.get(conta), v.toFixed(2));
  }
}

movimentoFilialReal(lancamentosIntegradosAgosto, "AGOSTO");
movimentoFilialReal(lancamentosIntegradosJulhoFinal, "JULHO");
