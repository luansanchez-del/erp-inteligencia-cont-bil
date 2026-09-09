import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const caminho = process.argv[2];
if (!caminho) throw new Error("Informe o caminho do PDF.");
const documento = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(caminho)) }).promise;
for (let numero = 1; numero <= documento.numPages; numero++) {
  const pagina = await documento.getPage(numero);
  const conteudo = await pagina.getTextContent();
  const itens = conteudo.items
    .filter((item) => "str" in item && item.str.trim())
    .sort((a, b) => Math.abs(b.transform[5] - a.transform[5]) > 2 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]);
  let y;
  let linha = [];
  console.log(`\n=== PÁGINA ${numero} ===`);
  for (const item of itens) {
    if (y !== undefined && Math.abs(item.transform[5] - y) > 2) {
      console.log(linha.join(" | "));
      linha = [];
    }
    linha.push(item.str.trim());
    y = item.transform[5];
  }
  if (linha.length) console.log(linha.join(" | "));
}
