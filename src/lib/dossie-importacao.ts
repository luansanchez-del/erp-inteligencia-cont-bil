import type { ItemDossieImportacao } from "@/types/erp";

const STORAGE_KEY = "erp-dossie-importacao-v1";

export function carregarDossieImportacao(): ItemDossieImportacao[] {
  if (typeof window === "undefined") return [];
  try {
    const valor = window.localStorage.getItem(STORAGE_KEY);
    return valor ? JSON.parse(valor) as ItemDossieImportacao[] : [];
  } catch { return []; }
}

export function salvarDossieImportacao(itens: ItemDossieImportacao[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
}

export async function calcularHashArquivo(arquivo: File) {
  const conteudo = await arquivo.arrayBuffer();
  if (globalThis.crypto?.subtle) {
    const hash = await globalThis.crypto.subtle.digest("SHA-256", conteudo);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${arquivo.name}:${arquivo.size}:${arquivo.lastModified}`;
}
