import { writeFileSync } from "node:fs";
import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import { lancamentosIntegradosSetembro } from "../src/data/nitaplast-razao-setembro";
import { estabelecimentoLancamentoNitaplast } from "../src/data/nitaplast-estabelecimento";
import { calcularResultadoAgosto, categorizarDespesasAgosto, categoriasDespesasAgostoDefs, descricaoPorContaCompleta } from "../src/components/nitaplast/contabil-agosto-completo";
import type { LancamentoIntegrado } from "../src/data/nitaplast-razao-base";

// DRE no layout da planilha de envio (DRE Conferência — Nitaplast), agosto x setembro/2026.
// Usa o mesmo motor da tela de agosto (calcularResultadoAgosto / categorizarDespesasAgosto).
const arred = (v: number) => Math.round(v * 100) / 100;
const paraMotor = (linhas: LancamentoIntegrado[], competencia: string) =>
  linhas.map((l) => ({ ...l, empresaId: "nitaplast-matriz", competenciaId: competencia, data: l.data.split("/").reverse().join("-"), criadoEm: `${competencia}-28T00:00:00.000Z`, origem: "importado" as const }));

function dre(linhas: LancamentoIntegrado[], competencia: string) {
  const lanc = paraMotor(linhas, competencia) as any[];
  const r = calcularResultadoAgosto(lanc as any);
  const porEstab = (conta: string, estab: "Matriz" | "Filial SP", sinal: 1 | -1) =>
    arred(sinal * lanc.reduce((t, l) => (estabelecimentoLancamentoNitaplast(l) !== estab ? t : t + (l.debitoCodigo === conta ? l.valor : 0) - (l.creditoCodigo === conta ? l.valor : 0)), 0));
  // CPV por conta: 25945 é o CPV da Filial; o resto (25944, 3035, 3093) é Matriz. Assim as
  // transferências entre estabelecimentos ficam no CPV de cada lado.
  const cpvFilial = r.mov("25945");
  const cat = categorizarDespesasAgosto(lanc as any, r.operacionais);
  const v: [string, number][] = [
    ["(+)Receita Operacional Bruta", r.receitaBruta],
    ["     Receita Venda Produção Matriz", porEstab("2606", "Matriz", -1)],
    ["     Receita Revenda Matriz", porEstab("2655", "Matriz", -1)],
    ["     Receita Venda Produção Filial", porEstab("2606", "Filial SP", -1)],
    ["     Receita Revenda Filial", porEstab("2655", "Filial SP", -1)],
    ["(-)Deduções da Receita Bruta", r.deducoes],
    ["Devoluções - Matriz", porEstab("25943", "Matriz", 1)],
    ["Devoluções - Filial", porEstab("25943", "Filial SP", 1)],
    ["IPI Matriz", r.mov("2826")],
    ["ICMS Matriz", r.mov("2827")],
    ["Pis Matriz", porEstab("2829", "Matriz", 1)],
    ["Cofins Matriz", porEstab("2830", "Matriz", 1)],
    ["ICMS ST", r.mov("2832")],
    ["ICMS s/ vendas Filial", r.mov("25054")],
    ["IPI Filial", r.mov("25055")],
    ["Pis Filial", porEstab("2829", "Filial SP", 1)],
    ["Cofins Filial", porEstab("2830", "Filial SP", 1)],
    ["(=) Receita Operacional Líquida", r.receitaLiquida],
    ["(-) Custo TOTAL", r.cpv],
    ["(-) CPV Matriz", arred(r.cpv - cpvFilial)],
    ["(-) CPV Filial", cpvFilial],
    ["LUCRO BRUTO", r.lucroBruto],
    ["(-)Despesas Operacionais", r.despesas],
    ...categoriasDespesasAgostoDefs.map(([id, d]) => [d, cat.total(id)] as [string, number]),
    ["Despesas Financeiras", r.despesasFinanceiras],
    ["(-)Receitas Financeiras", r.receitasFinanceiras],
    ["Despesas Financeiras Líquidas", arred(r.despesasFinanceiras - r.receitasFinanceiras)],
    ["Outras receitas operacionais", r.outrasReceitasOperacionais],
    ["Resultado Operacional", r.resultadoOperacional],
    ["RESULTADO NÃO OPERACIONAL", r.naoOperacional],
    ["LUCRO/PREJUÍZO LÍQUIDO (antes IRPJ/CSLL)", r.resultado],
  ];
  return { r, v, cat };
}

const ago = dre(lancamentosIntegradosAgosto, "2026-08");
const set = dre(lancamentosIntegradosSetembro, "2026-09");
const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rb = set.r.receitaBruta;
console.log(["Linha", "AGO 26", "SET 26", "% RB set"].join(" | "));
set.v.forEach(([d, x], i) => {
  if (Math.abs(x) < 0.005 && Math.abs(ago.v[i][1]) < 0.005) return;
  console.log([d.trim(), fmt(ago.v[i][1]), fmt(x), `${((x / rb) * 100).toFixed(1)}%`].join(" | "));
});

if (process.env.DETALHE) {
  for (const [id, d] of categoriasDespesasAgostoDefs) {
    const itens = set.cat.itens(id).sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
    if (!itens.length) continue;
    console.log(`\n-- ${d}: ${fmt(set.cat.total(id))}`);
    for (const it of itens) console.log(`   ${it.conta} ${it.descricao} | ${fmt(it.valor)}`);
  }
  for (const [t, contas] of [["CPV", set.r.custos], ["Desp. financeiras", set.r.financeiras]] as const) {
    console.log(`\n-- ${t}`);
    for (const c of contas) if (Math.abs(set.r.mov(c)) > 0.004) console.log(`   ${c} | ${fmt(set.r.mov(c))}`);
  }
  console.log("\n-- Receitas financeiras");
  for (const c of ["4927", "25095", "25096", "25097", "25098", "25099", "25100", "25101", "2859"]) if (Math.abs(set.r.credito(c)) > 0.004) console.log(`   ${c} | ${fmt(set.r.credito(c))}`);
  console.log("\n-- Não operacional");
  for (const c of ["4736", "4760", "25948", "25950"]) if (Math.abs(set.r.mov(c)) > 0.004) console.log(`   ${c} | ${fmt(-set.r.mov(c))}`);
}


// JSON=arquivo: grava a DRE (agosto x setembro) e a composição de setembro lançamento a lançamento.
if (process.env.JSON) {
  const lanc = paraMotor(lancamentosIntegradosSetembro, "2026-09") as any[];
  type Item = { grupo: string; conta: string; nomeConta: string; data: string; cc: string; historico: string; documento: string; valor: number };
  const itens: Item[] = [];
  const nomeConta = (c: string) => descricaoPorContaCompleta.get(c) ?? "";
  const add = (grupo: string, conta: string, l: any, valor: number) =>
    itens.push({ grupo, conta, nomeConta: nomeConta(conta), data: l.data.split("-").reverse().join("/"), cc: l.cc ?? "", historico: l.historico ?? "", documento: l.documento ?? "", valor: arred(valor) });
  const nomes = new Map(categoriasDespesasAgostoDefs);
  categorizarDespesasAgosto(lanc as any, set.r.operacionais, (cat, conta, l, v) => add(nomes.get(cat) ?? cat, conta, l, v));
  const porConta = (grupo: string, contas: Iterable<string>, sinal: 1 | -1) => {
    const cs = new Set(contas);
    for (const l of lanc) {
      if (cs.has(l.debitoCodigo)) add(grupo, l.debitoCodigo, l, sinal * l.valor);
      if (cs.has(l.creditoCodigo)) add(grupo, l.creditoCodigo, l, -sinal * l.valor);
    }
  };
  porConta("CPV Matriz", set.r.custos.filter((c) => c !== "25945"), 1);
  porConta("CPV Filial", ["25945"], 1);
  porConta("Despesas Financeiras", set.r.financeiras, 1);
  porConta("Receitas Financeiras", ["4927", "25095", "25096", "25097", "25098", "25099", "25100", "25101", "2859"], -1);
  porConta("Outras Receitas Operacionais", ["2892", "2893"], -1);
  porConta("Resultado Não Operacional", ["4736", "4760", "25948", "25950"], -1);
  writeFileSync(process.env.JSON, JSON.stringify({ dre: set.v.map(([d, x], i) => [d, ago.v[i][1], x]), itens: itens.filter((x) => Math.abs(x.valor) > 0.004) }));
}

// COMPARA="Despesas Administrativas;Despesas Produção": abre por conta, agosto x setembro.
if (process.env.COMPARA) {
  for (const nomeCat of process.env.COMPARA.split(";")) {
    const id = categoriasDespesasAgostoDefs.find(([, d]) => d === nomeCat)?.[0];
    if (!id) continue;
    const porConta = new Map<string, { descricao: string; ago: number; set: number }>();
    for (const [mes, d] of [["ago", ago], ["set", set]] as const)
      for (const it of d.cat.itens(id)) {
        const x = porConta.get(it.conta) ?? { descricao: it.descricao, ago: 0, set: 0 };
        x[mes] = it.valor;
        porConta.set(it.conta, x);
      }
    console.log(`\n== ${nomeCat}: ${ago.cat.total(id).toFixed(2)} -> ${set.cat.total(id).toFixed(2)}`);
    for (const [c, x] of [...porConta].sort((a, b) => Math.abs(b[1].set - b[1].ago) - Math.abs(a[1].set - a[1].ago)))
      console.log([c, x.descricao, x.ago.toFixed(2), x.set.toFixed(2), (x.set - x.ago).toFixed(2)].join(" | "));
  }
}
