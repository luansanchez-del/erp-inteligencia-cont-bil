import { calcularDreJulhoFinal } from "../src/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
import { saldoAnteriorResultadoJulho2026 } from "../src/data/nitaplast-resultado-transportado";

const arred = (v: number) => Math.round(v * 100) / 100;
const calculo = calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
const movimentoMes = arred(-calculo.dre.resultado);

const linhaResultado = (descricao: string, incluirAnterior: boolean) => ({
  descricao,
  saldoAnterior: incluirAnterior ? saldoAnteriorResultadoJulho2026 : 0,
  debitos: Math.max(0, movimentoMes),
  creditos: Math.max(0, -movimentoMes),
  saldoAtual: arred((incluirAnterior ? saldoAnteriorResultadoJulho2026 : 0) + movimentoMes),
});

console.log(JSON.stringify({
  dreResultado: calculo.dre.resultado,
  movimentoMes,
  saldoAnteriorResultadoJulho2026,
  resultadoMes: linhaResultado("RESULTADO DO MÊS", false),
  resultadoExercicio: linhaResultado("RESULTADO DO EXERCÍCIO", true),
}, null, 2));
