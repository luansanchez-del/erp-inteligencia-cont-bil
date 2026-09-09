import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const PASTA = "C:/082026/EXTRATOS 082026";
const ARQUIVOS = {
  BB: "NITA - BB.pdf",
  Bradesco: "NITA - BRADESCO.pdf",
  Itau: "NITA - ITAU.pdf",
  Uniprime: "NITA - UNIPRIME.pdf",
};

const saida = {};
for (const [nome, arquivo] of Object.entries(ARQUIVOS)) {
  const caminho = `${PASTA}/${arquivo}`;
  const documento = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(caminho)) }).promise;
  const paginas = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const page = await documento.getPage(pagina);
    const conteudo = await page.getTextContent();
    paginas.push(conteudo.items.map((item) => ({ str: item.str, transform: item.transform })));
  }
  saida[nome] = paginas;
}

fs.writeFileSync("scratch-extratos-agosto-texto.json", JSON.stringify(saida), "utf8");
console.log("OK", Object.fromEntries(Object.entries(saida).map(([k, v]) => [k, v.reduce((s, p) => s + p.length, 0)])));
