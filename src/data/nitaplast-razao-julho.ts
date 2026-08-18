export * from "./nitaplast-razao-julho-v2";

import { lancamentosIntegradosJulho as lancamentosIntegradosJulhoBase } from "./nitaplast-razao-julho-v2";

export { resumoJcpJulho } from "./nitaplast-jcp-julho";

/**
 * Razão operacional de julho.
 * O JCP é incluído uma única vez pela camada financeira final.
 * Esta camada não injeta JCP adicional e não altera junho.
 */
export const lancamentosIntegradosJulho = [
  ...lancamentosIntegradosJulhoBase,
];
