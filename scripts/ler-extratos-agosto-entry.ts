import fs from "node:fs";
import { agruparLinhasPorY, type LinhaPdf } from "../src/lib/importacao/leitores/pdf-linhas";
import { lerExtratoBancario, identificarBanco } from "../src/lib/importacao/leitores/extrato-bancario";
import { lerExtratoSoftdib } from "../src/lib/importacao/leitores/extrato-softdib";

const PASTA = "C:/082026/EXTRATOS 082026";

type ItemBruto = { str: string; transform: number[] };
const textoBruto: Record<string, ItemBruto[][]> = JSON.parse(fs.readFileSync("C:/Users/LUANSA~1/AppData/Local/Temp/claude/c--GEST-O-INTELIGENTE-LEGACY-erp-inteligencia-cont-bil/fe58ffef-1030-45d8-b990-352d1a6b2718/scratchpad/scratch-extratos-agosto-texto.json", "utf8"));

const relatorio: Record<string, unknown> = {};

for (const [nome, paginas] of Object.entries(textoBruto)) {
  const linhas: LinhaPdf[] = paginas.flatMap((itens) => agruparLinhasPorY(itens));
  const banco = identificarBanco(linhas);
  const resultado = lerExtratoBancario(linhas);
  relatorio[nome] = {
    bancoIdentificado: banco,
    suportado: resultado.suportado,
    totalLinhas: resultado.linhas.length,
    somaValores: Math.round(resultado.linhas.reduce((s, l) => s + l.valor, 0) * 100) / 100,
    achados: resultado.achados,
    linhas: resultado.linhas,
  };
}

const csvPath = `${PASTA}/EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv`;
const textoCsv = new TextDecoder("iso-8859-1").decode(fs.readFileSync(csvPath));
const softdib = lerExtratoSoftdib(textoCsv);
relatorio["SOFTDIB"] = {
  suportado: softdib.suportado,
  totalLinhas: softdib.linhas.length,
  somaValores: Math.round(softdib.linhas.reduce((s, l) => s + l.valor, 0) * 100) / 100,
  achados: softdib.achados,
  linhas: softdib.linhas,
};

fs.writeFileSync("C:/Users/LUANSA~1/AppData/Local/Temp/claude/c--GEST-O-INTELIGENTE-LEGACY-erp-inteligencia-cont-bil/fe58ffef-1030-45d8-b990-352d1a6b2718/scratchpad/scratch-relatorio-extratos-agosto.json", JSON.stringify(relatorio, null, 2), "utf8");
console.log(JSON.stringify(Object.fromEntries(Object.entries(relatorio).map(([k, v]) => [k, { suportado: (v as any).suportado, totalLinhas: (v as any).totalLinhas, somaValores: (v as any).somaValores, bancoIdentificado: (v as any).bancoIdentificado, qtdAchados: (v as any).achados.length }])), null, 2));
