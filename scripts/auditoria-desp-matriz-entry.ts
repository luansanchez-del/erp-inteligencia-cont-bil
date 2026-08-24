import { calcularDreJulhoFinal, ehCustoDreJulho, ehDespesaFinanceiraDreJulho, ehDespesaOperacionalDreJulho, ehReceitaFinanceiraDreJulho } from "../src/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";

const arred = (v: number) => Math.round(v * 100) / 100;
const soma = (a: { valor: number }[]) => arred(a.reduce((s, x) => s + x.valor, 0));

const calculo = calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
const composicao = calculo.composicao;

const ccProd = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10057", "10060", "19999"]);
const ccCom = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const ccAdm = new Set(["301", "302", "303", "304", "305", "306"]);

const despesas = composicao.filter(ehDespesaOperacionalDreJulho);
const matriz = despesas.filter((x) => x.estabelecimento === "Matriz");

const lancamentosNplog = lancamentosIntegradosJulhoFinal.filter((x) => x.documento?.startsWith("11.02.003"));
const nplogDebitos = arred(lancamentosNplog.reduce((s, x) => s + (x.debitoCodigo === "25938" ? x.valor : 0), 0));
const nplogCreditos = arred(lancamentosNplog.reduce((s, x) => s + (x.creditoCodigo === "25938" ? x.valor : 0), 0));
const valorNplog = arred(nplogDebitos - nplogCreditos);

const despesasSemNplog = matriz.map((x) => {
  if (x.conta !== "25938" || x.cc !== "304" || Math.abs(valorNplog) < 0.005) return x;
  const debitos = arred(x.debitos - nplogDebitos);
  const creditos = arred(x.creditos - nplogCreditos);
  return { ...x, debitos, creditos, valor: arred(debitos - creditos) };
}).filter((x) => Math.abs(x.valor) >= 0.005);

const industrializacao = despesasSemNplog.filter((x) => x.conta === "25937");
const depreciacao = despesasSemNplog.filter((x) => x.classificacao.startsWith("5.7.01.011"));
const exportacao = despesasSemNplog.filter((x) => x.conta === "25072");
const veiculos = despesasSemNplog.filter((x) => x.classificacao.startsWith("5.7.05") || x.classificacao.startsWith("5.7.01.015"));
const excluidas = new Set([...industrializacao, ...depreciacao, ...exportacao, ...veiculos].map((x) => x.id));
const classificaveis = despesasSemNplog.filter((x) => !excluidas.has(x.id));
const comerciais = classificaveis.filter((x) => ccCom.has(x.cc) || x.conta === "25070");
const adm = classificaveis.filter((x) => ccAdm.has(x.cc) || x.cc === "313" || x.cc === "0" || x.conta === "4250" || (x.conta === "25937" && x.cc === "503"));
const prod = classificaveis.filter((x) => ccProd.has(x.cc) && !comerciais.includes(x) && !adm.includes(x));
const outras = classificaveis.filter((x) => !prod.includes(x) && !comerciais.includes(x) && !adm.includes(x));

const clienteBuckets: Record<string, number> = {
  adm: 175861.49,
  nplog: 135289.01,
  comerciais: 406412.20,
  prod: 124407.23,
  veiculos: 6238.56,
  imobilizado: 52237.96,
  industrializacao: 364750.98,
  exportacao: 5225.43,
};

const sistemaBuckets: Record<string, number> = {
  adm: soma(adm),
  nplog: valorNplog,
  comerciais: soma(comerciais),
  prod: soma(prod),
  veiculos: soma(veiculos),
  imobilizado: soma(depreciacao),
  industrializacao: soma(industrializacao),
  exportacao: soma(exportacao),
};

const diffs = Object.fromEntries(Object.keys(clienteBuckets).map((k) => [k, arred(clienteBuckets[k] - sistemaBuckets[k])]));

const todosConta25937 = composicao.filter((x) => x.conta === "25937");
const rawEntradas25937 = lancamentosIntegradosJulhoFinal.filter((x) => x.debitoCodigo === "25937" || x.creditoCodigo === "25937");
const itensCc503 = composicao.filter((x) => x.cc === "503");
const ccProdTodos = new Set(["101","102","103","104","105","106","107","108","109","110","111","503","10014","10032","10057","10060","19999"]);
const vazandoParaFilial = despesas.filter((x) => x.estabelecimento === "Filial SP" && ccProdTodos.has(x.cc));
const totalVazandoFilial = soma(vazandoParaFilial);
const todasDespesasFilial = composicao.filter((x) => x.estabelecimento === "Filial SP" && ehDespesaOperacionalDreJulho(x));
const totalDespesasFilialReal = soma(todasDespesasFilial);

console.log(JSON.stringify({
  clienteBuckets, sistemaBuckets, diffs,
  outrasNaoClassificadas: outras, totalOutras: soma(outras),
  todosConta25937: todosConta25937.map((x) => ({ conta: x.conta, classificacao: x.classificacao, descricao: x.descricao, cc: x.cc, centroCusto: x.centroCusto, estabelecimento: x.estabelecimento, valor: x.valor, status: x.status, ehDespesaOp: ehDespesaOperacionalDreJulho(x) })),
  rawEntradas25937: rawEntradas25937.map((x) => ({ id: x.id, cc: x.cc, centroCusto: x.centroCusto, valor: x.valor, historico: x.historico, documento: x.documento, status: x.status })),
  itensCc503: itensCc503.map((x) => ({ conta: x.conta, classificacao: x.classificacao, descricao: x.descricao, estabelecimento: x.estabelecimento, valor: x.valor, ehDespesaOp: ehDespesaOperacionalDreJulho(x), ehCusto: ehCustoDreJulho(x) })),
  vazandoParaFilial: vazandoParaFilial.map((x) => ({ conta: x.conta, descricao: x.descricao, cc: x.cc, centroCusto: x.centroCusto, valor: x.valor })),
  totalVazandoFilial,
  totalDespesasFilialReal,
  todasDespesasFilial: todasDespesasFilial.map((x) => ({ conta: x.conta, descricao: x.descricao, cc: x.cc, centroCusto: x.centroCusto, valor: x.valor })),
}, null, 2));
