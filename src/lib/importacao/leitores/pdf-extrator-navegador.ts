import { agruparLinhasPorY, type LinhaPdf } from "./pdf-linhas";

/**
 * Extrai as linhas de texto de todas as páginas de um PDF, 100% no navegador
 * (sem backend). Importa o pdfjs dinamicamente pra nunca entrar no bundle de
 * SSR — só roda quando o usuário efetivamente seleciona um arquivo.
 */
export async function extrairLinhasPdf(arquivo: File): Promise<LinhaPdf[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;

  const buffer = await arquivo.arrayBuffer();
  const documento = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const linhas: LinhaPdf[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const page = await documento.getPage(pagina);
    const conteudo = await page.getTextContent();
    linhas.push(...agruparLinhasPorY(conteudo.items as { str: string; transform: number[] }[]));
  }
  return linhas;
}
