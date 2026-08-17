import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Relatórios não possui mais uma tela intermediária de cards.
 * O item no menu é apenas um agrupador; acesso direto antigo a /relatorios
 * é encaminhado para a DRE Oficial.
 */
export const Route = createFileRoute("/relatorios")({
  beforeLoad: () => {
    throw redirect({ to: "/relatorios/dre" });
  },
});
