import fs from "node:fs";

const detalhadoPath = "C:/082026/FISCAL/RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO -  SOFTDIB 082026.csv";
const resumoPath = "C:/082026/FISCAL/RESUMO NOTAS FISCAIS ENTRADA.csv";
const ler = (path) => fs.readFileSync(path, "latin1").split(/\r?\n/).filter(Boolean).slice(1).map((linha) => linha.split(";"));
const br = (texto) => Number((texto ?? "").trim().replace(/\./g, "").replace(",", ".")) || 0;
const limpo = (texto) => (texto ?? "").trim();
const arred = (valor) => Math.round(valor * 100) / 100;
const somar = (mapa, chave, valor, campos = {}) => {
  const atual = mapa.get(chave) ?? { ...campos, valor: 0, linhas: 0 };
  atual.valor = arred(atual.valor + valor);
  atual.linhas++;
  mapa.set(chave, atual);
};

const detalhado = ler(detalhadoPath);
const resumo = ler(resumoPath);
const porCfop = new Map();
const porConta = new Map();
const porCc = new Map();
const docsDetalhado = new Map();
const docsResumo = new Map();
const rateiosAdmGeral = [];

for (const c of detalhado) {
  const cfop = limpo(c[8]);
  const conta = limpo(c[81]);
  const documento = limpo(c[2]).replace(/^0+/, "") || "0";
  const serie = limpo(c[3]);
  const fornecedor = limpo(c[6]);
  const valorConta = br(c[83]);
  if (!cfop || !conta || !valorConta) continue;
  somar(porCfop, cfop, valorConta, { cfop });
  somar(porConta, conta, valorConta, { conta, descricao: limpo(c[82]) });
  const centros = [[84, 86], [87, 89], [90, 92], [93, 95]];
  let totalCc = 0;
  for (const [iCc, iValor] of centros) {
    const cc = String(Number(limpo(c[iCc]) || 0));
    const valor = br(c[iValor]);
    if (!valor) continue;
    totalCc = arred(totalCc + valor);
    somar(porCc, cc, valor, { cc, descricao: limpo(c[iCc + 1]) });
    somar(docsDetalhado, `${documento}|${serie}|${cfop}|${cc}`, valor, { documento, serie, cfop, cc, fornecedor });
  }
  if (Math.abs(totalCc - valorConta) > 0.01) {
    const valorAdmGeral = arred(valorConta - totalCc);
    rateiosAdmGeral.push({ documento, serie, cfop, cc: "304", centroCusto: "ADM GERAL", fornecedor, valor: valorAdmGeral, criterio: "Orientacao do cliente em 09/09/2026" });
    somar(porCc, "304", valorAdmGeral, { cc: "304", descricao: "ADM GERAL" });
    somar(docsDetalhado, `${documento}|${serie}|${cfop}|304`, valorAdmGeral, { documento, serie, cfop, cc: "304", fornecedor });
  }
}

for (const c of resumo) {
  const documento = limpo(c[1]).replace(/\/$/, "").replace(/^0+/, "") || "0";
  const serie = limpo(c[2]);
  const cfop = limpo(c[6]);
  const cc = String(Number(limpo(c[21]) || 0));
  const valor = br(c[13]);
  if (!documento || !cfop || !valor) continue;
  somar(docsResumo, `${documento}|${serie}|${cfop}|${cc}`, valor, { documento, serie, cfop, cc, fornecedor: limpo(c[5]) });
}

const chaves = new Set([...docsDetalhado.keys(), ...docsResumo.keys()]);
const divergencias = [...chaves].map((chave) => {
  const d = docsDetalhado.get(chave);
  const r = docsResumo.get(chave);
  const diferenca = arred((d?.valor ?? 0) - (r?.valor ?? 0));
  return { chave, detalhado: d?.valor ?? 0, resumo: r?.valor ?? 0, diferenca, fornecedor: d?.fornecedor ?? r?.fornecedor };
}).filter((x) => Math.abs(x.diferenca) > 0.01);

console.log(JSON.stringify({
  totais: {
    detalhadoPorConta: arred([...porConta.values()].reduce((s, x) => s + x.valor, 0)),
    detalhadoPorCc: arred([...porCc.values()].reduce((s, x) => s + x.valor, 0)),
    resumoFiscal: arred([...docsResumo.values()].reduce((s, x) => s + x.valor, 0)),
    ctesForaDoResumoNf: arred((porCfop.get("1352")?.valor ?? 0) + (porCfop.get("2352")?.valor ?? 0)),
    diferencaAposAdicionarCtes: arred([...porConta.values()].reduce((s, x) => s + x.valor, 0) - [...docsResumo.values()].reduce((s, x) => s + x.valor, 0) - (porCfop.get("1352")?.valor ?? 0) - (porCfop.get("2352")?.valor ?? 0)),
    valorDirecionadoAdmGeralPorOrientacaoCliente: arred(rateiosAdmGeral.reduce((s, x) => s + x.valor, 0)),
    valorSemCentroCustoAposDirecionamento: 0,
  },
  porCfop: [...porCfop.values()].sort((a, b) => a.cfop.localeCompare(b.cfop)),
  porConta: [...porConta.values()].sort((a, b) => b.valor - a.valor),
  porCentroCusto: [...porCc.values()].sort((a, b) => b.valor - a.valor),
  rateiosAdmGeralPorOrientacaoCliente: rateiosAdmGeral.sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor)),
  conciliacao: { documentosDetalhados: docsDetalhado.size, documentosResumo: docsResumo.size, divergencias: divergencias.length, itens: divergencias },
}, null, 2));
