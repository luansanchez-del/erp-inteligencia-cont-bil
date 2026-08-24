import { calcularDreJulhoFinal } from "../src/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
const calculo = calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
console.log(JSON.stringify({
  icmsMatriz: calculo.dre.icmsMatriz,
  icmsFilial: calculo.dre.icmsFilial,
  icmsFilialTransferenciasInternas: calculo.dre.icmsFilialTransferenciasInternas,
  cofinsMatriz: calculo.dre.cofinsMatriz,
  cofinsFilial: calculo.dre.cofinsFilial,
}, null, 2));
