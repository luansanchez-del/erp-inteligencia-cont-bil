import { lancamentosIntegradosSetembro } from "../src/data/nitaplast-razao-setembro";
import { saldoAberturaSetembroPorConta } from "../src/data/nitaplast-saldos-setembro";
import { saldosImplantacao } from "../src/data/nitaplast-implantacao";

const arred = (v: number) => Math.round(v * 100) / 100;
const classif = new Map(saldosImplantacao.map((c) => [c.conta, c.classificacao]));
const descr = new Map(saldosImplantacao.map((c) => [c.conta, c.descricao]));
const mov = new Map<string, number>();
for (const l of lancamentosIntegradosSetembro) {
  mov.set(l.debitoCodigo, (mov.get(l.debitoCodigo) ?? 0) + l.valor);
  mov.set(l.creditoCodigo, (mov.get(l.creditoCodigo) ?? 0) - l.valor);
}
const saldo = (c: string) => arred((saldoAberturaSetembroPorConta.get(c) ?? 0) + (mov.get(c) ?? 0));
const contas = process.argv.slice(2).length ? process.argv.slice(2) : ["11", "54", "9", "62", "10", "25001", "25002", "21", "25110", "4859", "25116", "1496", "25218", "25111", "1541", "1543", "25235", "25236", "1556", "1552", "1542", "25140", "25138", "25139"];
console.log("conta | descrição | abertura | movimento | saldo 30/09");
for (const c of contas) console.log(c, "|", descr.get(c), "|", arred(saldoAberturaSetembroPorConta.get(c) ?? 0), "|", arred(mov.get(c) ?? 0), "|", saldo(c));

// Resultado do mês: contas de resultado (classificação 4 e 5), credor positivo.
const grupos: Record<string, number> = {};
let resultado = 0;
for (const [c, v] of mov) {
  const k = classif.get(c) ?? "?";
  if (!/^[45]/.test(k)) continue;
  const g = k.slice(0, 6);
  grupos[g] = arred((grupos[g] ?? 0) - v);
  resultado -= v;
}
console.log("\nResultado por grupo (credor +):");
for (const [g, v] of Object.entries(grupos).sort()) console.log(g, v.toFixed(2));
console.log("RESULTADO SETEMBRO (parcial):", resultado.toFixed(2));
console.log("Lançamentos:", lancamentosIntegradosSetembro.length, "| em revisar:", lancamentosIntegradosSetembro.filter((l) => l.status === "revisar").length);
const semConta = [...mov.keys()].filter((c) => !classif.has(c));
if (semConta.length) console.log("CONTAS FORA DO PLANO:", semConta.join(", "));
