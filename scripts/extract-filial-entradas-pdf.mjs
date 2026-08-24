import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const [pdfPath, outputPath] = process.argv.slice(2);
if (!pdfPath || !outputPath) {
  throw new Error("Uso: node scripts/extract-filial-entradas-pdf.mjs <arquivo.pdf> <saida.ts>");
}

const document = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise;
let text = "";
for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();
  text += ` ${content.items.map((item) => item.str).join(" ")}`;
}

const number = (value) => Number(value.replace(/\./g, "").replace(",", "."));
const blocks = text.split(/(?=Data Recep\s+\d{2}\/\d{2}\/\d{4})/).slice(1);
const rows = blocks.map((block, index) => {
  const field = (pattern) => block.match(pattern)?.[1]?.trim() ?? "";
  const allocations = [...block.matchAll(/(\d{5})-([^\d]+?)\s+([\d.]+,\d{2})\s+(?=\d{5}-|\s+-\s+-|Data Recep|Total das Entradas)/g)]
    .map((match) => [match[1].replace(/^00/, ""), match[2].trim(), number(match[3])]);
  return [
    String(index + 1).padStart(3, "0"),
    field(/Data Recep\s+(\d{2}\/\d{2}\/\d{4})/),
    field(/Data Recep\s+\d{2}\/\d{2}\/\d{4}\s+(\d{2}\/\d{2}\/\d{4})\s+Data de Emiss/),
    field(/Nro do Docto:\s+(\d+)/), field(/Série:\s+(\S+)/), field(/Espécie\s*:\s+(\d+)/),
    field(/Emitente\s+(.+?)\s+Cnpj\/IE/).replace(/^[A-Z]\d+\s+-/, ""),
    field(/Cnpj\/IE\s+:\s+([\d.\/\-]+)/), field(/Cfop\s*:\s+(\d+)/),
    number(field(/Total Nota\s+([\d.]+,\d{2})/)), field(/Cta Gerenc\s+([\d.]+)/),
    field(/Cta Gerenc\s+[\d.]+\s+Vlr\s*:\s+[\d.]+,\d{2}\s+-(.+?)\s+:\s+\d{5}-/), allocations,
  ];
});

const total = Math.round(rows.reduce((sum, row) => sum + row[9], 0) * 100) / 100;
if (rows.length !== 113 || total !== 706859.28) {
  throw new Error(`Extração não conciliada: ${rows.length} documentos / R$ ${total.toFixed(2)}`);
}

const source = `// Gerado de ${pdfPath.replaceAll("\\", "/")} por scripts/extract-filial-entradas-pdf.mjs.\n` +
`export type RateioEntradaFilialJulho = { cc: string; centroCusto: string; valor: number };\n` +
`export type EntradaDetalhadaFilialJulho = { id: string; dataRecepcao: string; dataEmissao: string; documento: string; serie: string; especie: string; emitente: string; cnpj: string; cfop: string; valor: number; gerencial: string; descricaoGerencial: string; rateios: RateioEntradaFilialJulho[] };\n` +
`type LinhaFonte = [string,string,string,string,string,string,string,string,string,number,string,string,[string,string,number][]];\n` +
`const fonte: LinhaFonte[] = ${JSON.stringify(rows)};\n` +
`export const entradasDetalhadasFilialJulho: EntradaDetalhadaFilialJulho[] = fonte.map(([id,dataRecepcao,dataEmissao,documento,serie,especie,emitente,cnpj,cfop,valor,gerencial,descricaoGerencial,rateios]) => ({ id, dataRecepcao, dataEmissao, documento, serie, especie, emitente, cnpj, cfop, valor, gerencial, descricaoGerencial, rateios: rateios.map(([cc,centroCusto,valorRateio]) => ({cc,centroCusto,valor:valorRateio})) }));\n` +
`const arred = (valor: number) => Math.round(valor * 100) / 100;\n` +
`export const resumoEntradasDetalhadasFilialJulho = { documentos: entradasDetalhadasFilialJulho.length, total: arred(entradasDetalhadasFilialJulho.reduce((s,x)=>s+x.valor,0)), comprasCfop1102: arred(entradasDetalhadasFilialJulho.filter(x=>x.cfop===\"1102\").reduce((s,x)=>s+x.valor,0)), transferenciasCfop2152: arred(entradasDetalhadasFilialJulho.filter(x=>x.cfop===\"2152\").reduce((s,x)=>s+x.valor,0)), devolucoesCfop1202: arred(entradasDetalhadasFilialJulho.filter(x=>x.cfop===\"1202\").reduce((s,x)=>s+x.valor,0)) } as const;\n` +
`if (resumoEntradasDetalhadasFilialJulho.documentos !== 113 || resumoEntradasDetalhadasFilialJulho.total !== 706859.28) throw new Error(\"Entradas detalhadas da filial não conciliam com o PDF.\");\n`;

fs.writeFileSync(outputPath, source, "utf8");
