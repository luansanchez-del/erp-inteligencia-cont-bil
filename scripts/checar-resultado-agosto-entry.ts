import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import { calcularResultadoAgosto, categorizarDespesasAgosto, categoriasDespesasAgostoDefs, descricaoPorContaCompleta, calcularDetalhesAnaliseDre } from "../src/components/nitaplast/contabil-agosto-completo";

const lancamentos = lancamentosIntegradosAgosto.map((linha) => ({
  id: linha.id,
  empresaId: "nitaplast-matriz",
  competenciaId: "2026-08",
  data: linha.data.split("/").reverse().join("-"),
  debitoCodigo: linha.debitoCodigo,
  creditoCodigo: linha.creditoCodigo,
  historico: linha.historico,
  documento: linha.documento,
  cc: linha.cc,
  centroCusto: linha.centroCusto,
  valor: linha.valor,
  criadoEm: "2026-08-31T23:59:59.000Z",
  origem: "importado" as const,
  status: linha.status,
  observacao: linha.observacao,
  fonte: linha.fonte,
}));

const r = calcularResultadoAgosto(lancamentos as any);
console.log("=== RESULTADO AGOSTO/2026 (Nitaplast, direto do Razão) ===");
console.log("Receita bruta:", r.receitaBruta.toFixed(2));
console.log("Deduções:", r.deducoes.toFixed(2));
console.log("Receita líquida:", r.receitaLiquida.toFixed(2));
console.log("CPV/CMV:", r.cpv.toFixed(2));
console.log("Lucro bruto:", r.lucroBruto.toFixed(2));
console.log("Despesas operacionais:", r.despesas.toFixed(2));
console.log("Despesas financeiras:", r.despesasFinanceiras.toFixed(2));
console.log("Receitas financeiras:", r.receitasFinanceiras.toFixed(2));
console.log("Resultado operacional:", r.resultadoOperacional.toFixed(2));
console.log("Não operacional:", r.naoOperacional.toFixed(2));
console.log("RESULTADO (lucro/prejuízo):", r.resultado.toFixed(2));

try {
  const categoriasDespesas = categorizarDespesasAgosto(lancamentos as any, r.operacionais);
  const totalCategorizado = categoriasDespesasAgostoDefs.reduce((s, [id]) => s + categoriasDespesas.total(id), 0);
  console.log("\n=== Checagem de invariantes (mesmos throw do componente) ===");
  console.log("Total categorizado despesas:", totalCategorizado.toFixed(2), "vs despesas:", r.despesas.toFixed(2), Math.abs(totalCategorizado - r.despesas) > 0.01 ? "!!! DIVERGE" : "OK");
  console.log("\nPor categoria:");
  for (const [id, descricao] of categoriasDespesasAgostoDefs) {
    const v = categoriasDespesas.total(id);
    if (Math.abs(v) > 0.005) console.log(" ", descricao.padEnd(55), v.toFixed(2));
  }
} catch (e) {
  console.log("\n!!! ERRO ao categorizar despesas:", (e as Error).message);
}

function abrirContas(titulo: string, contas: string[]) {
  console.log(`\n=== ${titulo} (por conta) ===`);
  const linhas = contas
    .map((c) => ({ c, v: r.mov(c), d: descricaoPorContaCompleta.get(c) ?? "?" }))
    .filter((x) => Math.abs(x.v) > 0.004)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  for (const { c, v, d } of linhas) console.log(" ", c.padEnd(8), d.padEnd(45), v.toFixed(2));
  console.log(" ", "TOTAL".padEnd(54), linhas.reduce((s, x) => s + x.v, 0).toFixed(2));
}
abrirContas("CPV/CMV", r.custos);
abrirContas("Despesas Financeiras", r.financeiras);

console.log("\n=== Itens de cada categoria de despesa operacional ===");
try {
  const categoriasDespesas = categorizarDespesasAgosto(lancamentos as any, r.operacionais);
  for (const [id, descricao] of categoriasDespesasAgostoDefs) {
    const itens = categoriasDespesas.itens(id);
    if (itens.length === 0) continue;
    console.log(`\n-- ${descricao} --`);
    for (const it of itens.sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))) {
      console.log(" ", it.conta.padEnd(8), it.descricao.padEnd(45), it.valor.toFixed(2));
    }
  }
} catch {}

console.log("\n=== Análise Vertical/Horizontal — linhas PIS/COFINS Matriz+Filial ===");
try {
  const detalhes = calcularDetalhesAnaliseDre(lancamentos as any);
  for (const chave of ["ded-pis-matriz", "ded-pis-filial", "ded-cofins-matriz", "ded-cofins-filial", "ded-icms-filial", "ded-ipi-filial"]) {
    console.log(" ", chave.padEnd(20), (detalhes.get(chave) ?? "undefined").toString());
  }
} catch (e) {
  console.log("!!! ERRO em calcularDetalhesAnaliseDre:", (e as Error).message);
}
