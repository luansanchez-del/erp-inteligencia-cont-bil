/**
 * Competências com motor contábil próprio (dados reais já auditados da Nitaplast).
 * Qualquer competência fora deste conjunto — inclusive novas criadas pelo usuário —
 * usa o motor genérico em `@/components/competencia-aberta`, que começa sempre vazio.
 */
const COMPETENCIAS_COM_MOTOR_DEDICADO = new Set(["2026-05", "2026-06", "2026-07", "2026-08"]);

export function temMotorDedicado(competenciaId: string) {
  return COMPETENCIAS_COM_MOTOR_DEDICADO.has(competenciaId);
}
