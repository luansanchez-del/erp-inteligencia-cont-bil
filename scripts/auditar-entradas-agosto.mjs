import fs from "node:fs";

const caminho = "C:/082026/FISCAL/RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO -  SOFTDIB 082026.csv";
const linhas = fs.readFileSync(caminho, "latin1").split(/\r?\n/).slice(1);
const fonte = fs.readFileSync("src/data/nitaplast-entradas-cc-reconciliadas-junho.ts", "utf8");
const mapa = new Map(
  [...fonte.matchAll(/\["([^"]+)","[^"]*","([^"]+)","[^"]*","([^"]+)","([^"]+)",/g)]
    .map((item) => [`${item[1]}|${item[2]}`, [item[3], item[4]]]),
);
const nopsIgnorados = new Set(["1902", "1903", "1916", "2152", "2557", "2911"]);
const br = (texto) => Number((texto ?? "").trim().replace(/\./g, "").replace(",", ".")) || 0;
const agregado = new Map();
for (const linha of linhas) {
  const colunas = linha.split(";");
  if (colunas.length < 87 || nopsIgnorados.has(colunas[8]?.trim())) continue;
  const gerencial = colunas[81]?.trim();
  const cc = String(Number(colunas[84]?.trim() || 0));
  const valor = br(colunas[86]);
  if (!gerencial || !valor) continue;
  const chave = `${gerencial}|${cc}`;
  const atual = agregado.get(chave) ?? { gerencial, cc, valor: 0, documentos: 0, contas: mapa.get(chave) };
  atual.valor += valor;
  atual.documentos += 1;
  agregado.set(chave, atual);
}
const itens = [...agregado.values()];
console.log(JSON.stringify({
  total: itens.reduce((s, x) => s + x.valor, 0),
  mapeado: itens.filter((x) => x.contas).reduce((s, x) => s + x.valor, 0),
  naoMapeado: itens.filter((x) => !x.contas).reduce((s, x) => s + x.valor, 0),
  itens,
}, null, 2));
