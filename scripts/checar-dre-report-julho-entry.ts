import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
import { calcularDreJulhoFinal } from "../src/data/nitaplast-dre-julho-final";

const dre = calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal).dre;
console.log("=== DRE Report (julho/2026) — PIS/COFINS Matriz x Filial ===");
console.log("pis (total):", dre.pis);
console.log("pisMatriz:", dre.pisMatriz, "pisFilial:", dre.pisFilial);
console.log("cofins (total):", dre.cofins);
console.log("cofinsMatriz:", dre.cofinsMatriz, "cofinsFilial:", dre.cofinsFilial);
console.log("resultado:", dre.resultado);
