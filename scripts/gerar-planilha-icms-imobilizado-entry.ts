import { writeFile } from "node:fs/promises";
import { exportarExcel } from "../src/lib/exportar-excel";

let arquivoGerado: Blob | null = null;

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: (blob: Blob) => {
    arquivoGerado = blob;
    return "blob:planilha-icms-imobilizado";
  },
});
Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => undefined });
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: {
    createElement: () => ({ style: {}, click: () => undefined, remove: () => undefined }),
    body: { appendChild: () => undefined },
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { setTimeout: () => 0 },
});

const linhas = [
  ["Documento", "NF 93495", "NF 93569", "NF 93639", ""],
  ["Data da venda", "03/07/2026", "08/07/2026", "14/07/2026", ""],
  ["Valor contábil disponível", 52500, 93139.29, 57638.86, 203278.15],
  ["(+) Valor da venda", 119900, 127000, 60000, 306900],
  ["(-) Custo contábil na baixa", 52500, 93139.29, 57638.86, 203278.15],
  ["(=) Ganho na alienação", 67400, 33860.71, 2361.14, 103621.85],
  ["", "", "", "", ""],
  ["Fórmula", "Venda - custo contábil", "Venda - custo contábil", "Venda - custo contábil", ""],
];

exportarExcel({
  arquivo: "Composicao_Simples_Venda_Imobilizado_072026.xlsx",
  aba: "Venda Imobilizado",
  titulo: "COMPOSIÇÃO DAS VENDAS DE IMOBILIZADO",
  subtitulo: "Nitaplast · Competência 07/2026 · Resultado por bem vendido",
  colunas: [
    { cabecalho: "Composição", largura: 34 },
    { cabecalho: "Mini Cooper", largura: 25, tipo: "numero" },
    { cabecalho: "Corolla GLI", largura: 25, tipo: "numero" },
    { cabecalho: "Transformador 1000 KVA", largura: 29, tipo: "numero" },
    { cabecalho: "Total", largura: 22, tipo: "numero" },
  ],
  linhas,
});

if (!arquivoGerado) throw new Error("A planilha não foi gerada.");
await writeFile("Composicao_Simples_Venda_Imobilizado_072026.xlsx", Buffer.from(await arquivoGerado.arrayBuffer()));
