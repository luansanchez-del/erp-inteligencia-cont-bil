/**
 * Lê um arquivo como texto tentando o encoding indicado (o ERP de origem da
 * Nitaplast, SOFTDIB, exporta CSV em Latin-1/ISO-8859-1 — UTF-8 corrompe os
 * acentos). Roda 100% no navegador.
 */
export async function lerTextoArquivo(arquivo: File, encoding: string = "iso-8859-1"): Promise<string> {
  const buffer = await arquivo.arrayBuffer();
  return new TextDecoder(encoding).decode(buffer);
}
