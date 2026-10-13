import { lancamentosIntegradosSetembro } from "../src/data/nitaplast-razao-setembro";
import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import { saldoAberturaAgostoPorConta } from "../src/data/nitaplast-saldos-agosto";
const contas: [string, string, number][] = [["1541", "ICMS", 129_124.41], ["1543", "IPI", 98_981.52], ["25235", "ICMS Filial", 40_751.94], ["25236", "IPI Filial", 16_468.34], ["1556", "PIS", 19_368.73], ["1552", "COFINS", 89_274.48], ["1542", "ICMS ST", 886.14]];
const a = (v: number) => (Math.round(v * 100) / 100).toFixed(2);
for (const [c, n, apuradoSet] of contas) {
  const mov = (ls: typeof lancamentosIntegradosSetembro, f: (l: (typeof ls)[number]) => boolean) => ls.filter(f).reduce((t, l) => t + (l.creditoCodigo === c ? l.valor : 0) - (l.debitoCodigo === c ? l.valor : 0), 0);
  const ab = -(saldoAberturaAgostoPorConta.get(c) ?? 0);
  const banco = (l: { id: string }) => /ITAU|BRAD|BB-|BANC/.test(l.id);
  const agoApur = mov(lancamentosIntegradosAgosto, (l) => !banco(l));
  const agoPago = -mov(lancamentosIntegradosAgosto, banco);
  const setApur = mov(lancamentosIntegradosSetembro, (l) => !banco(l));
  const setPago = -mov(lancamentosIntegradosSetembro, banco);
  const final = ab + agoApur - agoPago + setApur - setPago;
  console.log(`${n.padEnd(12)} ${c} | abre ago ${a(ab)} | apur ago ${a(agoApur)} | pago ago ${a(agoPago)} | apur set ${a(setApur)} | pago set ${a(setPago)} | saldo 30/09 ${a(final)} | esperado ${a(apuradoSet)} | dif ${a(final - apuradoSet)}`);
}
