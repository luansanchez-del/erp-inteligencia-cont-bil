import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import { calcularResultadoAgosto, categorizarDespesasAgosto, categoriasDespesasAgostoDefs } from "../src/components/nitaplast/contabil-agosto-completo";

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
