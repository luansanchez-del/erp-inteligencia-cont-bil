import fs from "node:fs";

const fonte = "C:/082026/FILIAL - AGO 26/RESUMO NOTAS FISCAIS ENTRADA.csv";
const valor = (texto = "") => Number(texto.trim().replace(/\./g, "").replace(",", ".")) || 0;
const linhas = fs.readFileSync(fonte, "utf8").split(/\r?\n/).slice(1);
const grupos = new Map();
for (const linha of linhas) {
  const c = linha.split(";");
  if (!/^\d{2}\/08\/2026$/.test(c[0] ?? "")) continue;
  const chave = `${c[6].trim()} | ${c[17].trim()}`;
  const atual = grupos.get(chave) ?? { documentos: 0, total: 0, icms: 0, ipi: 0 };
  atual.documentos += 1;
  atual.total += valor(c[13]);
  atual.icms += valor(c[29]);
  atual.ipi += valor(c[32]);
  grupos.set(chave, atual);
}
for (const [chave, totais] of [...grupos].sort()) {
  console.log(chave, JSON.stringify(totais));
}
