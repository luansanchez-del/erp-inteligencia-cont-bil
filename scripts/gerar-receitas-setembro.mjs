import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const fontes = [
  {
    estabelecimento: "MATRIZ",
    caminho: "C:/092026/NITAPLAST - SET 26/RESUMO NOTAS FISCAIS SAIDA.csv",
    cfopsReceita: new Set(["5101", "6101", "6102", "6107", "6109", "6401", "7127"]),
  },
  {
    estabelecimento: "FILIAL SP",
    caminho: "C:/092026/FILIAL - SET 26/RESUMO NOTAS FISCAIS SAIDA.csv",
    cfopsReceita: new Set(["5102", "5123", "6102"]),
  },
];

const fontesDevolucoes = [
  { estabelecimento: "MATRIZ", caminho: "C:/092026/NITAPLAST - SET 26/RESUMO NOTAS FICAIS ENTRADA.csv" },
  {
    estabelecimento: "FILIAL SP",
    caminho: "C:/092026/FILIAL - SET 26/RESUMO NOTAS FISCAIS ENTRADA.csv",
  },
];

const limpar = (valor = "") => valor.trim().replace(/\/$/, "");
const moeda = (valor = "") => Number(valor.trim().replace(/\./g, "").replace(",", ".")) || 0;
const escapar = (valor) => JSON.stringify(valor);

const registros = [];
const devolucoes = [];

for (const fonte of fontes) {
  const linhas = readFileSync(fonte.caminho, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);
  const cabecalho = linhas.shift().split(";").map(limpar);
  const coluna = (nome) => cabecalho.indexOf(nome);

  for (const linha of linhas) {
    const campos = linha.split(";");
    const cfop = limpar(campos[coluna("NOP")]);
    if (!fonte.cfopsReceita.has(cfop)) continue;

    registros.push({
      estabelecimento: fonte.estabelecimento,
      data: limpar(campos[coluna("Data Emissao NF")]),
      nf: limpar(campos[coluna("Numero NF")]),
      serie: limpar(campos[coluna("Serie NF")]),
      clienteCodigo: limpar(campos[coluna("Codigo Fornecedor")]),
      cliente: limpar(campos[coluna("Descricao Fornecedor")]),
      cfop,
      valor: moeda(campos[coluna("Valor NF")]),
      cc: limpar(campos[coluna("Centro de Custo")]) || "0",
      centroCusto: limpar(campos[coluna("Descricao Centro de Custo")]) || "SEM CENTRO DE CUSTO",
    });
  }
}

for (const fonte of fontesDevolucoes) {
  const linhas = readFileSync(fonte.caminho, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);
  const cabecalho = linhas.shift().split(";").map(limpar);
  const coluna = (nome) => cabecalho.indexOf(nome);
  for (const linha of linhas) {
    const campos = linha.split(";");
    const cfop = limpar(campos[coluna("NOP")]);
    if (!["1201", "1202", "2201", "2202"].includes(cfop)) continue;
    devolucoes.push({
      estabelecimento: fonte.estabelecimento,
      data: limpar(campos[coluna("Data Emissao NF")]),
      nf: limpar(campos[coluna("Numero NF")]),
      serie: limpar(campos[coluna("Serie NF")]),
      clienteCodigo: limpar(campos[coluna("Codigo Fornecedor")]),
      cliente: limpar(campos[coluna("Descricao Fornecedor")]),
      cfop,
      valor: moeda(campos[coluna("Valor NF")]),
      cc: limpar(campos[coluna("Centro de Custo")]) || "0",
      centroCusto: limpar(campos[coluna("Descricao Centro de Custo")]) || "SEM CENTRO DE CUSTO",
    });
  }
}

const total = registros.reduce((soma, item) => soma + item.valor, 0);
if (registros.length !== 528 || Math.abs(total - 3_510_852.71) > 0.001) {
  throw new Error(
    `Conferencia das receitas falhou: ${registros.length} notas / ${total.toFixed(2)}`,
  );
}
const totalDevolucoes = devolucoes.reduce((soma, item) => soma + item.valor, 0);
if (devolucoes.length !== 6 || Math.abs(totalDevolucoes - 9_081.69) > 0.001) {
  throw new Error(
    `Conferencia das devolucoes falhou: ${devolucoes.length} notas / ${totalDevolucoes.toFixed(2)}`,
  );
}

const tuplas = registros
  .map(
    (item) =>
      `  [${[
        item.estabelecimento,
        item.data,
        item.nf,
        item.serie,
        item.clienteCodigo,
        item.cliente,
        item.cfop,
        item.valor,
        item.cc,
        item.centroCusto,
      ]
        .map(escapar)
        .join(", ")}],`,
  )
  .join("\n");

const tuplasDevolucoes = devolucoes
  .map(
    (item) =>
      `  [${[item.estabelecimento, item.data, item.nf, item.serie, item.clienteCodigo, item.cliente, item.cfop, item.valor, item.cc, item.centroCusto].map(escapar).join(", ")}],`,
  )
  .join("\n");

const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

type NotaReceita = readonly [string, string, string, string, string, string, string, number, string, string];

// Arquivo gerado por scripts/gerar-receitas-setembro.mjs a partir dos relatórios fiscais.
// Somente CFOPs de venda externa entram aqui; remessas, transferências e bonificações são excluídas.
const notasReceitaSetembro: NotaReceita[] = [
${tuplas}
];

const notasDevolucaoSetembro: NotaReceita[] = [
${tuplasDevolucoes}
];

const nomeConta = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;
const cfopRevenda = new Set(["5102", "6102"]);

export const lancamentosReceitasSetembro: LancamentoIntegrado[] = notasReceitaSetembro.map((nota, indice) => {
  const [estabelecimento, data, nf, serie, clienteCodigo, cliente, cfop, valor, cc, centroCusto] = nota;
  const contaReceita = cfopRevenda.has(cfop) ? "2655" : "2606";
  const sigla = estabelecimento === "MATRIZ" ? "M" : "F";

  return {
    id: \`SET-REC-\${sigla}-\${nf}-\${indice + 1}\`,
    data,
    origem: \`SAÍDAS FISCAIS \${estabelecimento} 09/2026\`,
    debitoCodigo: "25111",
    debito: nomeConta("25111"),
    creditoCodigo: contaReceita,
    credito: nomeConta(contaReceita),
    historico: \`Venda NF \${nf}, CFOP \${cfop}, cliente \${clienteCodigo} - \${cliente}\`,
    documento: \`NF \${nf} / série \${serie}\`,
    cc,
    centroCusto,
    valor,
    status: "validado",
    observacao: "Receita reconhecida individualmente pela nota fiscal de saída; sem agregação e sem lançamento de fechamento.",
    rastreio: "documento",
    fonte: \`RESUMO NOTAS FISCAIS SAIDA.csv - \${estabelecimento}\`,
  };
});

export const lancamentosDevolucoesVendasSetembro: LancamentoIntegrado[] = notasDevolucaoSetembro.map((nota, indice) => {
  const [estabelecimento, data, nf, serie, clienteCodigo, cliente, cfop, valor, cc, centroCusto] = nota;
  const sigla = estabelecimento === "MATRIZ" ? "M" : "F";
  return {
    id: \`SET-DEV-\${sigla}-\${nf}-\${indice + 1}\`, data,
    origem: \`DEVOLUÇÕES DE VENDAS \${estabelecimento} 09/2026\`,
    debitoCodigo: "25943", debito: nomeConta("25943"), creditoCodigo: "25111", credito: nomeConta("25111"),
    historico: \`Devolução de venda NF \${nf}, CFOP \${cfop}, emitente \${clienteCodigo} - \${cliente}\`,
    documento: \`NF \${nf} / série \${serie}\`, cc, centroCusto, valor, status: "validado",
    observacao: "Devolução de venda reconhecida individualmente pela nota fiscal de entrada.",
    rastreio: "documento", fonte: \`RESUMO NOTAS FISCAIS ENTRADA.csv - \${estabelecimento}\`,
  };
});

export const resumoReceitasSetembro = {
  quantidadeNotas: lancamentosReceitasSetembro.length,
  matriz: lancamentosReceitasSetembro.filter((item) => item.origem.includes("MATRIZ")).reduce((soma, item) => soma + item.valor, 0),
  filial: lancamentosReceitasSetembro.filter((item) => item.origem.includes("FILIAL")).reduce((soma, item) => soma + item.valor, 0),
  total: lancamentosReceitasSetembro.reduce((soma, item) => soma + item.valor, 0),
  devolucoes: lancamentosDevolucoesVendasSetembro.reduce((soma, item) => soma + item.valor, 0),
  receitaAposDevolucoes: lancamentosReceitasSetembro.reduce((soma, item) => soma + item.valor, 0) - lancamentosDevolucoesVendasSetembro.reduce((soma, item) => soma + item.valor, 0),
} as const;
`;

writeFileSync(resolve("src/data/nitaplast-receitas-setembro.ts"), conteudo, "utf8");
console.log(
  `Geradas ${registros.length} receitas (R$ ${total.toFixed(2)}) e ${devolucoes.length} devolucoes (R$ ${totalDevolucoes.toFixed(2)})`,
);
