/**
 * Fonte normalizada do relatório Softdib "ENTRADAS POR CENTRO DE CUSTO 072026".
 * Gerado a partir de 597 documentos com Data de Recepção em 07/2026.
 * Não é Razão: esta base apenas preserva documento, NOP, conta gerencial, CC e valor para mapeamento contábil.
 */
export type EntradaCcFonteJulho = {
  data: string; documento: string; serie: string; emitente: string; nop1: string; nop2: string;
  gerencial: string; descricaoGerencial: string; cc: string; centroCusto: string; valor: number; diferencaDocumento: number;
};

export const entradasCcFonteJulho: EntradaCcFonteJulho[] = [];

export const resumoEntradasCcFonteJulho = {
  documentos: 597,
  linhasAlocadas: 628,
  valorDistribuido: 4202763.84,
  valorPendenteCentroCusto: 7047.92,
  documentosComDiferenca: 9,
} as const;
