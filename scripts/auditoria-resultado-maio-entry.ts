import { balanceteDominioMaio } from "../src/data/nitaplast-balancete-dominio-maio";
import { resultadoExercicioMaio2026, resultadoJunho2026, saldoAnteriorResultadoJulho2026 } from "../src/data/nitaplast-resultado-transportado";

const raiz = (descricao: string) => balanceteDominioMaio.find((linha) => linha.tipo === "S" && linha.descricao === descricao);
const ativo = raiz("ATIVO");
const passivo = raiz("PASSIVO");
const pl = raiz("PATRIMÔNIO LÍQUIDO");

console.log(JSON.stringify({
  ativoMaio: ativo ? { saldoAnterior: ativo.saldoAnterior, saldoAtual: ativo.saldoAtual } : null,
  passivoMaio: passivo ? { saldoAnterior: passivo.saldoAnterior, saldoAtual: passivo.saldoAtual } : null,
  plMaio: pl ? { saldoAnterior: pl.saldoAnterior, saldoAtual: pl.saldoAtual } : null,
  resultadoExercicioMaio2026,
  resultadoJunho2026,
  saldoAnteriorResultadoJulho2026,
  resultadoExercicioJulho2026: Math.round((saldoAnteriorResultadoJulho2026 + 234732.08) * 100) / 100,
}, null, 2));
