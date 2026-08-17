export * from "./nitaplast-razao-julho-v2";

import { lancamentosIntegradosJulho as lancamentosIntegradosJulhoBase } from "./nitaplast-razao-julho-v2";
import { lancamentosJcpJulho } from "./nitaplast-jcp-julho";

export { lancamentosJcpJulho, resumoJcpJulho } from "./nitaplast-jcp-julho";

/**
 * Razão de julho com o JCP autorizado para contabilização.
 * Junho não é alterado por esta camada.
 */
export const lancamentosIntegradosJulho = [
  ...lancamentosIntegradosJulhoBase,
  ...lancamentosJcpJulho,
];
