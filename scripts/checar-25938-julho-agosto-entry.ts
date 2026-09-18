import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";

function ehNplog(l: { debitoCodigo: string; historico?: string }) {
  return l.debitoCodigo === "25938" && /TRANSPORTE E LOG[IÍ]STICA/i.test(l.historico ?? "");
}

function analisar(lancamentos: typeof lancamentosIntegradosAgosto, label: string) {
  let total = 0, nplog = 0, admin = 0;
  const fornecedores = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.debitoCodigo === "25938") {
      total += l.valor;
      if (ehNplog(l)) nplog += l.valor;
      else {
        admin += l.valor;
        const chave = (l.historico ?? "").slice(0, 60);
        fornecedores.set(chave, (fornecedores.get(chave) ?? 0) + l.valor);
      }
    }
    if (l.creditoCodigo === "25938") {
      total -= l.valor;
      if (!ehNplog(l)) {
        admin -= l.valor;
        console.log("  [CRÉDITO em 25938]", l.id, l.valor.toFixed(2), l.historico);
      } else nplog -= l.valor;
    }
  }
  console.log(`\n=== ${label} — conta 25938 ===`);
  console.log("Total:", total.toFixed(2), "| NPLog:", nplog.toFixed(2), "| Administrativas (resto):", admin.toFixed(2));
  console.log("Todos os históricos dentro de 'Administrativas' (" + fornecedores.size + " itens):");
  let soma = 0;
  for (const [h, v] of [...fornecedores.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))) {
    soma += v;
    console.log(" ", v.toFixed(2).padStart(12), " ", h);
  }
  console.log("Soma de conferência:", soma.toFixed(2));
}

analisar(lancamentosIntegradosJulhoFinal as any, "JULHO/2026 (dados brutos, sem reclassificações inteligentes)");
analisar(lancamentosIntegradosAgosto as any, "AGOSTO/2026");
