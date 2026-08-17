export type ColunaExcel = {
  cabecalho: string;
  largura?: number;
  tipo?: "texto" | "numero" | "percentual";
};

export type ValorExcel = string | number | null | undefined;

type ExportarExcelOpcoes = {
  arquivo: string;
  aba: string;
  colunas: ColunaExcel[];
  linhas: ValorExcel[][];
  titulo?: string;
  subtitulo?: string;
};

type EstiloLinha = "sintetica" | "subtotal" | "resultado" | "alerta";

const encoder = new TextEncoder();

function escaparXml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function nomeAbaSeguro(nome: string) {
  return nome.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Relatorio";
}

function referenciaColuna(indice: number) {
  let numero = indice + 1;
  let referencia = "";
  while (numero > 0) {
    const resto = (numero - 1) % 26;
    referencia = String.fromCharCode(65 + resto) + referencia;
    numero = Math.floor((numero - 1) / 26);
  }
  return referencia;
}

function celulaXml(valor: ValorExcel, linha: number, coluna: number, tipo: ColunaExcel["tipo"], estiloForcado?: number) {
  const ref = `${referenciaColuna(coluna)}${linha}`;
  if (valor === null || valor === undefined || valor === "") {
    return `<c r="${ref}"${estiloForcado !== undefined ? ` s="${estiloForcado}"` : ""}/>`;
  }

  if (typeof valor === "number" && Number.isFinite(valor)) {
    const estilo = estiloForcado ?? (tipo === "percentual" ? 3 : 2);
    return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
  }

  const estilo = estiloForcado !== undefined ? ` s="${estiloForcado}"` : "";
  return `<c r="${ref}" t="inlineStr"${estilo}><is><t xml:space="preserve">${escaparXml(String(valor))}</t></is></c>`;
}

/**
 * Preserva no Excel a hierarquia visual da DRE exibida na tela.
 * Linhas analíticas continuam brancas; sintéticas, subtotais e o resultado final
 * recebem preenchimentos suaves para facilitar leitura e conferência.
 */
function classificarLinha(aba: string, valores: ValorExcel[]): EstiloLinha | undefined {
  if (nomeAbaSeguro(aba).toLocaleUpperCase("pt-BR") !== "DRE") return undefined;

  const descricao = String(valores[0] ?? "").trim();

  if (descricao === "LUCRO / PREJUÍZO LÍQUIDO") return "resultado";

  if ([
    "Receita Operacional Líquida",
    "LUCRO BRUTO",
    "Total Despesas Operacionais Líquidas",
    "RESULTADO OPERACIONAL",
  ].includes(descricao)) {
    return "subtotal";
  }

  if (descricao === "Outros resultados sem classificação gerencial") return "alerta";

  if ([
    "(+) Receita Operacional Bruta",
    "(-) Deduções da Receita Bruta",
    "(-) Custos / CPV / CMV",
    "(-) Despesas Operacionais antes dos créditos",
    "Resultado Não Operacional",
  ].includes(descricao)) {
    return "sintetica";
  }

  return undefined;
}

function estiloCelula(estiloLinha: EstiloLinha | undefined, tipo: ColunaExcel["tipo"]) {
  if (!estiloLinha) return undefined;

  const deslocamentoTipo = tipo === "numero" ? 1 : tipo === "percentual" ? 2 : 0;
  const base = estiloLinha === "sintetica"
    ? 6
    : estiloLinha === "subtotal"
      ? 9
      : estiloLinha === "resultado"
        ? 12
        : 15;

  return base + deslocamentoTipo;
}

function crc32(dados: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of dados) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(valor: number) {
  return new Uint8Array([valor & 0xff, (valor >>> 8) & 0xff]);
}

function u32(valor: number) {
  return new Uint8Array([
    valor & 0xff,
    (valor >>> 8) & 0xff,
    (valor >>> 16) & 0xff,
    (valor >>> 24) & 0xff,
  ]);
}

function juntar(partes: Uint8Array[]) {
  const tamanho = partes.reduce((total, parte) => total + parte.length, 0);
  const resultado = new Uint8Array(tamanho);
  let offset = 0;
  for (const parte of partes) {
    resultado.set(parte, offset);
    offset += parte.length;
  }
  return resultado;
}

function dataDos() {
  const agora = new Date();
  const ano = Math.max(1980, agora.getFullYear());
  const data = ((ano - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();
  const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | Math.floor(agora.getSeconds() / 2);
  return { data, hora };
}

function gerarZip(arquivos: Array<{ nome: string; conteudo: string }>) {
  const locais: Uint8Array[] = [];
  const centrais: Uint8Array[] = [];
  let offset = 0;
  const { data, hora } = dataDos();

  for (const arquivo of arquivos) {
    const nome = encoder.encode(arquivo.nome);
    const conteudo = encoder.encode(arquivo.conteudo);
    const crc = crc32(conteudo);

    const cabecalhoLocal = juntar([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(hora),
      u16(data),
      u32(crc),
      u32(conteudo.length),
      u32(conteudo.length),
      u16(nome.length),
      u16(0),
      nome,
    ]);

    locais.push(cabecalhoLocal, conteudo);

    const cabecalhoCentral = juntar([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(hora),
      u16(data),
      u32(crc),
      u32(conteudo.length),
      u32(conteudo.length),
      u16(nome.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nome,
    ]);
    centrais.push(cabecalhoCentral);
    offset += cabecalhoLocal.length + conteudo.length;
  }

  const diretorioCentral = juntar(centrais);
  const fim = juntar([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(arquivos.length),
    u16(arquivos.length),
    u32(diretorioCentral.length),
    u32(offset),
    u16(0),
  ]);

  return juntar([...locais, diretorioCentral, fim]);
}

export function exportarExcel({ arquivo, aba, colunas, linhas, titulo, subtitulo }: ExportarExcelOpcoes) {
  const nomeAba = nomeAbaSeguro(aba);
  const totalColunas = Math.max(1, colunas.length);
  const linhasXml: string[] = [];
  const mesclagens: string[] = [];
  let numeroLinha = 1;

  if (titulo) {
    linhasXml.push(`<row r="${numeroLinha}">${celulaXml(titulo, numeroLinha, 0, "texto", 4)}</row>`);
    if (totalColunas > 1) mesclagens.push(`A${numeroLinha}:${referenciaColuna(totalColunas - 1)}${numeroLinha}`);
    numeroLinha += 1;
  }

  if (subtitulo) {
    linhasXml.push(`<row r="${numeroLinha}">${celulaXml(subtitulo, numeroLinha, 0, "texto", 5)}</row>`);
    if (totalColunas > 1) mesclagens.push(`A${numeroLinha}:${referenciaColuna(totalColunas - 1)}${numeroLinha}`);
    numeroLinha += 1;
  }

  const linhaCabecalho = numeroLinha;
  linhasXml.push(
    `<row r="${numeroLinha}">${colunas
      .map((coluna, indice) => celulaXml(coluna.cabecalho, numeroLinha, indice, "texto", 1))
      .join("")}</row>`,
  );
  numeroLinha += 1;

  for (const valores of linhas) {
    const estiloLinha = classificarLinha(aba, valores);
    linhasXml.push(
      `<row r="${numeroLinha}">${colunas
        .map((coluna, indice) => celulaXml(
          valores[indice],
          numeroLinha,
          indice,
          coluna.tipo,
          estiloCelula(estiloLinha, coluna.tipo),
        ))
        .join("")}</row>`,
    );
    numeroLinha += 1;
  }

  const colunasXml = colunas
    .map((coluna, indice) => `<col min="${indice + 1}" max="${indice + 1}" width="${coluna.largura ?? 18}" customWidth="1"/>`)
    .join("");
  const mesclagensXml = mesclagens.length
    ? `<mergeCells count="${mesclagens.length}">${mesclagens.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";

  const planilha = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="${linhaCabecalho}" topLeftCell="A${linhaCabecalho + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${colunasXml}</cols>
  <sheetData>${linhasXml.join("")}</sheetData>
  ${mesclagensXml}
  <autoFilter ref="A${linhaCabecalho}:${referenciaColuna(totalColunas - 1)}${numeroLinha - 1}"/>
</worksheet>`;

  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="14"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9EAF7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2F0D9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FFB7C9D6"/></bottom><diagonal/></border>
    <border><left/><right/><top style="medium"><color rgb="FF548235"/></top><bottom style="double"><color rgb="FF548235"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="18">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>

    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="4" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>
    <xf numFmtId="10" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>

    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="4" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>
    <xf numFmtId="10" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>

    <xf numFmtId="0" fontId="1" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="4" fontId="1" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>
    <xf numFmtId="10" fontId="1" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>

    <xf numFmtId="0" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="4" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>
    <xf numFmtId="10" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escaparXml(nomeAba)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const arquivos = [
    {
      nome: "[Content_Types].xml",
      conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      nome: "_rels/.rels",
      conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    { nome: "xl/workbook.xml", conteudo: workbook },
    {
      nome: "xl/_rels/workbook.xml.rels",
      conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { nome: "xl/styles.xml", conteudo: estilos },
    { nome: "xl/worksheets/sheet1.xml", conteudo: planilha },
  ];

  const xlsx = gerarZip(arquivos);
  const blob = new Blob([xlsx], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = arquivo.toLowerCase().endsWith(".xlsx") ? arquivo : `${arquivo}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
