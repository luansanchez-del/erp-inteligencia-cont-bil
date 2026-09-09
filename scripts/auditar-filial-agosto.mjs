import fs from "node:fs";

const pasta = "C:/082026/FILIAL - AGO 26";
const br = (valor) => Number((valor ?? "").trim().replace(/\./g, "").replace(",", ".")) || 0;
const arred = (valor) => Math.round(valor * 100) / 100;
const ler = (nome) => fs.readFileSync(`${pasta}/${nome}`, "latin1").split(/\r?\n/).filter(Boolean).slice(1).map((linha) => linha.split(";"));
const somar = (mapa, chave, valor, base) => {
  const item = mapa.get(chave) ?? { ...base, valor: 0, documentos: 0, icms: 0, icmsSt: 0, ipi: 0, difal: 0 };
  item.valor = arred(item.valor + valor.valor);
  item.icms = arred(item.icms + valor.icms);
  item.icmsSt = arred(item.icmsSt + valor.icmsSt);
  item.ipi = arred(item.ipi + valor.ipi);
  item.difal = arred(item.difal + valor.difal);
  item.documentos++;
  mapa.set(chave, item);
};

function analisar(nome) {
  const linhas = ler(nome).filter((c) => /^\d{2}\/\d{2}\/\d{4}$/.test((c[0] ?? "").trim()));
  const porCfop = new Map();
  const porCc = new Map();
  const documentos = [];
  for (const c of linhas) {
    const documento = (c[1] ?? "").replace("/", "").trim();
    const cfop = (c[6] ?? "").trim();
    const cc = String(Number((c[21] ?? "").trim()) || 0);
    const valores = { valor: br(c[13]), icms: br(c[29]), icmsSt: br(c[30]), ipi: br(c[32]), difal: br(c[45]) };
    const base = { cfop, cc, centroCusto: (c[22] ?? "").trim() };
    somar(porCfop, cfop, valores, { cfop });
    somar(porCc, cc, valores, { cc, centroCusto: base.centroCusto });
    documentos.push({ data: c[0].trim(), documento, serie: (c[2] ?? "").trim(), participante: (c[5] ?? "").trim(), ...base, ...valores });
  }
  return {
    quantidade: documentos.length,
    total: arred(documentos.reduce((s, x) => s + x.valor, 0)),
    icms: arred(documentos.reduce((s, x) => s + x.icms, 0)),
    icmsSt: arred(documentos.reduce((s, x) => s + x.icmsSt, 0)),
    ipi: arred(documentos.reduce((s, x) => s + x.ipi, 0)),
    difal: arred(documentos.reduce((s, x) => s + x.difal, 0)),
    porCfop: [...porCfop.values()].sort((a, b) => a.cfop.localeCompare(b.cfop)),
    porCentroCusto: [...porCc.values()].sort((a, b) => b.valor - a.valor),
    documentos,
  };
}

const entradas = analisar("RESUMO NOTAS FISCAIS ENTRADA.csv");
const saidas = analisar("RESUMO NOTAS FISCAIS SAIDA.csv");
console.log(JSON.stringify({ entradas, saidas }, null, 2));
