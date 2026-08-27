import fs from "node:fs";
import { PDFParse } from "pdf-parse";
import XLSX from "xlsx";

const base = "C:\\Users\\Luan Sanchez\\Downloads";
const output = "validacao-saidas-julho-2026.xlsx";
const money = (value) => Number(value.replace(/\./g, "").replace(",", "."));
const loadSheet = (path) => {
  const workbook = XLSX.readFile(path);
  return XLSX.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: null, raw: true })
    .filter((row) => row["Chave do Lançamento"] != null);
};
const aggregate = (rows) => {
  const result = new Map();
  for (const row of rows) {
    const document = String(Number(row.Documento));
    const current = result.get(document) ?? { total: 0, rows: [] };
    current.total += Number(row["Valor Contábil"]) || 0;
    current.rows.push(row);
    result.set(document, current);
  }
  return result;
};

const cases = [
  {
    unit: "Matriz",
    pdf: `${base}\\Faturamento Matriz 07-2026.PDF`,
    outputs: `${base}\\SAIDAS - MATRIZ.xlsx`,
    inputs: `${base}\\ENTRADAS - MATRIZ.xlsx`,
  },
  {
    unit: "Filial",
    pdf: `${base}\\Faturamento Filial SP 07-2026.PDF`,
    outputs: `${base}\\SAIDAS - FILIAL.xlsx`,
    inputs: `${base}\\ENTRADAS - FILIAL.xlsx`,
  },
];

const workbook = XLSX.utils.book_new();
const summary = [];

for (const item of cases) {
  const parser = new PDFParse({ data: fs.readFileSync(item.pdf) });
  const text = (await parser.getText()).text;
  await parser.destroy();

  const pdfRows = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(
      /^Doc:\d+\s+\d+\s+\S+\s+(\d+)\s+(NE|1)\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})/,
    );
    if (match) {
      pdfRows.push({
        document: String(Number(match[1])),
        type: match[2],
        value: money(match[3]),
        ipi: money(match[4]),
        st: money(match[5]),
      });
    }
  }

  const outputs = loadSheet(item.outputs);
  const inputs = loadSheet(item.inputs);
  const outputByDocument = aggregate(outputs);
  const inputByDocument = aggregate(inputs);
  const pdfDocuments = new Set(pdfRows.map((row) => row.document));

  const reconciliation = pdfRows.map((row) => {
    const outputEntry = outputByDocument.get(row.document);
    const inputEntry = inputByDocument.get(row.document);
    const isReturn = row.type === "1" || row.value < 0;
    const source = outputEntry ? "Saídas" : inputEntry ? "Entradas (devolução)" : "Não localizado";
    const sourceEntry = outputEntry ?? inputEntry;
    return {
      Unidade: item.unit,
      Documento: row.document,
      Movimento_PDF: isReturn ? "Devolução/estorno" : "Venda",
      Valor_PDF: row.value,
      IPI_PDF: row.ipi,
      ICMS_ST_PDF: row.st,
      Localizado_em: source,
      Valor_contabil_planilha: sourceEntry?.total ?? null,
      CFOPs: sourceEntry ? [...new Set(sourceEntry.rows.map((r) => r.Natureza))].join(", ") : null,
      Data_planilha: sourceEntry ? [...new Set(sourceEntry.rows.map((r) => r["Data Entrada/Saída"]))].join(", ") : null,
      Status: sourceEntry ? "OK - documento localizado" : "PENDÊNCIA",
    };
  });

  const outside = outputs.filter((row) => !pdfDocuments.has(String(Number(row.Documento))));
  const outsideByCfop = new Map();
  for (const row of outside) {
    const cfop = String(row.Natureza ?? "Sem CFOP");
    const current = outsideByCfop.get(cfop) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(row["Valor Contábil"]) || 0;
    outsideByCfop.set(cfop, current);
  }

  const missing = reconciliation.filter((row) => row.Status === "PENDÊNCIA").length;
  const returns = reconciliation.filter((row) => row.Movimento_PDF === "Devolução/estorno");
  summary.push({
    Unidade: item.unit,
    Documentos_no_faturamento: pdfRows.length,
    Vendas_localizadas_nas_saidas: reconciliation.filter((row) => row.Localizado_em === "Saídas").length,
    Devolucoes_localizadas_nas_entradas: returns.filter((row) => row.Localizado_em === "Entradas (devolução)").length,
    Documentos_nao_localizados: missing,
    Valor_faturamento_PDF: pdfRows.reduce((sum, row) => sum + row.value, 0),
    IPI_PDF: pdfRows.reduce((sum, row) => sum + row.ipi, 0),
    ICMS_ST_PDF: pdfRows.reduce((sum, row) => sum + row.st, 0),
    Total_planilha_saidas: outputs.reduce((sum, row) => sum + (Number(row["Valor Contábil"]) || 0), 0),
    Resultado: missing === 0 ? "OK - 100% dos documentos localizados" : "Com pendências",
  });

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(reconciliation),
    `Conciliação ${item.unit}`,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      [...outsideByCfop].map(([cfop, values]) => ({
        Unidade: item.unit,
        CFOP: cfop,
        Quantidade_lancamentos: values.count,
        Valor_contabil: values.total,
        Motivo: "Documento fora do relatório de faturamento; revisar natureza da operação",
      })),
    ),
    `Fora PDF ${item.unit}`,
  );
}

XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Resumo");
workbook.SheetNames.unshift(workbook.SheetNames.pop());
XLSX.writeFile(workbook, output);
console.log(output);
