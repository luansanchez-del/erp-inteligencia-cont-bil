/**
 * Registro das bases iniciais efetivamente carregadas no motor genérico.
 * Centraliza a decisão usada pelo shell e pelos livros, evitando que a tela
 * esconda uma escrituração que já existe ou reutilize dados de outra empresa.
 */
const BASES_CONTABEIS_CARREGADAS = new Set([
  "nitaplast-matriz|2026-08",
]);

export function temBaseContabilCarregada(empresaId: string, competenciaId: string) {
  return BASES_CONTABEIS_CARREGADAS.has(`${empresaId}|${competenciaId}`);
}
