import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const caminho = process.argv[2];
if (!caminho) throw new Error("Informe o PDF.");
const documento = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(caminho)) }).promise;
for (let n = 1; n <= documento.numPages; n++) {
  const pagina = await documento.getPage(n);
  const lista = await pagina.getOperatorList();
  const imagens = [];
  for (let i = 0; i < lista.fnArray.length; i++) {
    if ([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintJpegXObject, pdfjs.OPS.paintInlineImageXObject].includes(lista.fnArray[i])) {
      imagens.push({ operacao: lista.fnArray[i], argumentos: lista.argsArray[i] });
    }
  }
  console.log(JSON.stringify({ pagina: n, imagens }, null, 2));
}
