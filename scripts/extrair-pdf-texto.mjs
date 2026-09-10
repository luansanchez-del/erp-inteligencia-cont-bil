import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "node:fs";

const caminho = process.argv[2];
if (!caminho) throw new Error("Informe o caminho do PDF.");
const pdf = await getDocument({ data: new Uint8Array(fs.readFileSync(caminho)) }).promise;
for (let pagina = 1; pagina <= pdf.numPages; pagina += 1) {
  const conteudo = await (await pdf.getPage(pagina)).getTextContent();
  console.log(conteudo.items.map((item) => item.str).join(" "));
}
