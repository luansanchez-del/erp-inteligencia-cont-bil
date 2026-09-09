import fs from "node:fs";

const fonte =
  "C:/082026/FISCAL/RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO -  SOFTDIB 082026.csv";
const destino = new URL("../src/data/nitaplast-despesas-documentais-agosto.ts", import.meta.url);
const linhas = fs.readFileSync(fonte, "utf8").split(/\r?\n/).slice(1).filter(Boolean);
const valor = (texto = "") => Number(texto.trim().replace(/\./g, "").replace(",", ".")) || 0;
const limpo = (texto = "") => texto.trim().replace(/\s+/g, " ");
const q = (texto = "") => JSON.stringify(limpo(texto));
const producao = new Set([
  "101",
  "102",
  "103",
  "104",
  "105",
  "106",
  "107",
  "108",
  "109",
  "110",
  "111",
  "503",
  "10014",
  "10032",
  "10058",
  "19999",
]);
const comercial = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const administrativo = new Set(["301", "302", "303", "304", "305", "306"]);

function mapa(g, cc) {
  if (g === "11.02.001") return ["25937", "1496", "validado"];
  if (g === "11.02.002" || g === "11.02.003") return ["25938", "1496", "validado"];
  if (g === "11.04.014" || g === "11.90.004") return ["25070", "1496", "validado"];
  if (g === "11.90.001") return ["3095", "1496", "validado"];
  if (g === "12.03.001")
    return comercial.has(cc)
      ? ["4028", "1496", "validado"]
      : administrativo.has(cc)
        ? ["4342", "1496", "validado"]
        : null;
  if (g === "12.03.002")
    return producao.has(cc)
      ? ["3203", "1496", "validado"]
      : comercial.has(cc)
        ? ["4023", "1496", "validado"]
        : administrativo.has(cc)
          ? ["4337", "1496", "validado"]
          : null;
  if (g === "12.03.003") return ["5799", "1496", "validado"];
  if (g === "12.03.005") return ["4250", "1496", "revisar"];
  if (g === "12.03.007") return ["4038", "1496", "validado"];
  if (g === "12.03.008") return ["25056", "1496", "validado"];
  if (g === "13.02.001" || g === "15.02.016") return ["4189", "1496", "validado"];
  if (g === "13.02.007") return ["25071", "1496", "validado"];
  if (g === "13.03.013") return ["25061", "1496", "validado"];
  if (g === "14.03.001" || g === "14.03.006") return ["4253", "1496", "validado"];
  if (g === "15.01.001") return ["4115", "1496", "validado"];
  if (g === "15.01.002") return ["4405", "1496", "revisar"];
  if (g === "15.01.005") return ["25063", "1496", "validado"];
  if (g === "15.01.008") return ["4085", "1496", "validado"];
  if (g === "15.01.011" && cc === "313") return ["4431", "1496", "validado"];
  if (g === "15.01.011" && cc === "204") return ["25064", "1496", "revisar"];
  if (g === "15.02.012" || g === "15.02.034") return ["4546", "1496", "validado"];
  if (g === "15.02.015")
    return producao.has(cc)
      ? ["3244", "1496", "validado"]
      : ["204", "205"].includes(cc)
        ? ["25064", "1496", "validado"]
        : ["304", "305"].includes(cc)
          ? ["4912", "1496", "validado"]
          : cc === "442"
            ? ["25028", "1496", "validado"]
            : null;
  if (g === "15.02.020")
    return producao.has(cc)
      ? ["3494", "25218", "validado"]
      : comercial.has(cc)
        ? ["4185", "25218", "validado"]
        : administrativo.has(cc)
          ? ["4477", "25218", "validado"]
          : null;
  if (g === "15.02.050") return ["25074", "1496", "validado"];
  if (g === "15.03.001") return ["4213", "1496", "validado"];
  if (g === "15.03.002") return ["4215", "1496", "validado"];
  if (g === "15.03.006") return ["4544", "1496", "validado"];
  return null;
}

const saida = [];
for (const texto of linhas) {
  const c = texto.split(";");
  const g = limpo(c[81]);
  // Estes grupos já integram CPV, devoluções, imobilizado ou apurações específicas.
  if (["11.01.001", "11.01.002", "11.01.003", "11.01.008", "11.01.010"].includes(g)) continue;
  for (const i of [84, 87, 90, 93]) {
    const ccBruto = limpo(c[i]);
    const cc = /^\d+$/.test(ccBruto) ? String(Number(ccBruto)) : ccBruto;
    const v = valor(c[i + 2]);
    const m = mapa(g, cc);
    if (!cc || !v || !m) continue;
    saida.push({ c, g, cc, v, m, centro: limpo(c[i + 1]) });
  }
}

const registros = saida
  .map(
    ({ c, g, cc, v, m, centro }, indice) => `  {
    id: "AGO-ENT-DOC-${String(indice + 1).padStart(4, "0")}", data: ${q(c[0])}, origem: "ENTRADAS FISCAIS POR CENTRO DE CUSTO 08/2026",
    debitoCodigo: ${q(m[0])}, debito: nomeConta(${q(m[0])}), creditoCodigo: ${q(m[1])}, credito: nomeConta(${q(m[1])}),
    historico: ${q(`${limpo(c[82])} - ${limpo(c[6])}`)}, documento: ${q(`NF ${limpo(c[2])} série ${limpo(c[3])} / NOP ${limpo(c[8])}${limpo(c[9]) ? `-${limpo(c[9])}` : ""}`)},
    cc: ${q(cc)}, centroCusto: ${q(centro)}, valor: ${v.toFixed(2)}, status: ${q(m[2])},
    observacao: ${q(`Documento individual da conta gerencial ${g}; regra herdada e validada no fechamento de julho. Pagamento bancário deve baixar a obrigação, sem duplicar esta despesa.`)},
    rastreio: "documento", fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv",
  }`,
  )
  .join(",\n");

const total = saida.reduce((s, x) => s + x.v, 0);
const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";\n\n/** Gerado documento a documento; não editar manualmente. Fonte e regra: scripts/gerar-despesas-documentais-agosto.mjs. */\nexport const lancamentosDespesasDocumentaisAgosto: LancamentoIntegrado[] = [\n${registros}\n];\n\nexport const resumoDespesasDocumentaisAgosto = { documentosRateados: ${saida.length}, valor: ${total.toFixed(2)}, emRevisao: ${saida.filter((x) => x.m[2] === "revisar").length} } as const;\n`;
const conteudoComNomes = conteudo.replace(
  'import type { LancamentoIntegrado } from "./nitaplast-razao-base";',
  'import type { LancamentoIntegrado } from "./nitaplast-razao-base";\nimport { descricaoContaJulho } from "./nitaplast-saldos-julho";\n\nconst nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta não encontrada no plano"}`;',
);
fs.writeFileSync(destino, conteudoComNomes, "utf8");
console.log(
  JSON.stringify(
    {
      documentosRateados: saida.length,
      valor: Math.round(total * 100) / 100,
      emRevisao: saida.filter((x) => x.m[2] === "revisar").length,
    },
    null,
    2,
  ),
);
