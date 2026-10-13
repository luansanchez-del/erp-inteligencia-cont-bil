import { lancamentosIntegradosSetembro } from "../src/data/nitaplast-razao-setembro";
import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
const conta = process.env.CONTA ?? "4859";
const meses = (process.env.MESES ?? "set").split(",");
const fontes = [...(meses.includes("ago") ? lancamentosIntegradosAgosto : []), ...(meses.includes("set") ? lancamentosIntegradosSetembro : [])];
let total = 0;
for (const l of fontes) {
  if (l.debitoCodigo !== conta && l.creditoCodigo !== conta) continue;
  const v = l.debitoCodigo === conta ? l.valor : -l.valor;
  total += v;
  console.log([l.id, l.data, v.toFixed(2), l.debitoCodigo === conta ? l.creditoCodigo : l.debitoCodigo, l.historico.slice(0, 90)].join(" | "));
}
console.log("TOTAL", total.toFixed(2));
