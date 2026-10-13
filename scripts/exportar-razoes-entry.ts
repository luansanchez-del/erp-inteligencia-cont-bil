// Exporta os Razões de julho, agosto e setembro em JSON (uso dos geradores .mjs que precisam cruzar lançamentos).
import { writeFileSync } from "node:fs";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import { lancamentosEntradasSetembro } from "../src/data/nitaplast-entradas-setembro";
const pasta = process.env.SAIDA ?? ".";
writeFileSync(`${pasta}/razao-julho.json`, JSON.stringify(lancamentosIntegradosJulhoFinal));
writeFileSync(`${pasta}/razao-agosto.json`, JSON.stringify(lancamentosIntegradosAgosto));
writeFileSync(`${pasta}/entradas-setembro.json`, JSON.stringify(lancamentosEntradasSetembro));
