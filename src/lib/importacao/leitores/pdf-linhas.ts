/**
 * Reconstrução de linhas visuais a partir da camada de texto de um PDF
 * (itens do `getTextContent()` do pdfjs, agrupados por posição). Puro e sem
 * dependência do pdfjs — recebe apenas `{ str, transform }`, o mesmo formato
 * de item de texto do pdfjs, pra poder ser validado tanto no navegador
 * quanto num script Node de conferência.
 */

export type TokenPdf = { texto: string; x: number; y: number };
export type LinhaPdf = TokenPdf[];

interface ItemTextoPdf {
  str: string;
  transform: number[];
}

export function agruparLinhasPorY(itens: ItemTextoPdf[]): LinhaPdf[] {
  const porY = new Map<number, TokenPdf[]>();
  for (const item of itens) {
    const texto = item.str.trim();
    if (!texto) continue;
    const x = item.transform[4] ?? 0;
    const y = Math.round(item.transform[5] ?? 0);
    const lista = porY.get(y) ?? [];
    lista.push({ texto, x, y });
    porY.set(y, lista);
  }
  const ys = [...porY.keys()].sort((a, b) => b - a);
  return ys.map((y) => porY.get(y)!.sort((a, b) => a.x - b.x));
}

export function textoLinha(linha: LinhaPdf): string {
  return linha.map((t) => t.texto).join(" ").replace(/\s+/g, " ").trim();
}

export function textoPagina(paginas: LinhaPdf[][]): string {
  return paginas.map((linhas) => linhas.map(textoLinha).join("\n")).join("\n");
}
