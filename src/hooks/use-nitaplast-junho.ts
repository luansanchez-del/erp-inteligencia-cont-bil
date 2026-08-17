import { useEffect } from "react";
import { useErp } from "@/context/erp-context";

const EMPRESA_ID = "nitaplast-matriz";

/**
 * Mantém o contexto na empresa Nitaplast, mas NÃO força a competência.
 *
 * Antes este hook redefinia a competência para 06/2026 em toda renderização.
 * Isso impedia o seletor global de permanecer em 07/2026. As telas que ainda
 * usam a base fechada de junho continuam protegidas pela lógica de competência
 * da própria página/PageShell, sem sobrescrever a seleção feita pelo usuário.
 */
export function useNitaplastJunho() {
  const contexto = useErp();

  useEffect(() => {
    if (contexto.empresa.id !== EMPRESA_ID) contexto.setEmpresaId(EMPRESA_ID);
  }, [contexto.empresa.id, contexto.setEmpresaId]);

  return {
    ...contexto,
    contextoCorreto: contexto.empresa.id === EMPRESA_ID,
  };
}
