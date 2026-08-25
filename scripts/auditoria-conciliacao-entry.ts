import { calcularDreJulhoFinal } from "../src/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
const calculo = calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
console.log(JSON.stringify({
  resultado: calculo.dre.resultado,
  ajuste: calculo.dre.ajusteConciliacaoCliente,
  resultadoConciliadoClienteJulho: calculo.dre.resultadoConciliadoClienteJulho,
}, null, 2));
