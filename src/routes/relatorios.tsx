import { Outlet, createFileRoute } from "@tanstack/react-router";

/**
 * Layout dos relatórios.
 *
 * IMPORTANTE: esta rota NÃO pode redirecionar em beforeLoad, porque DRE Report,
 * Razão Report e Diário Report são rotas filhas de /relatorios. Um redirect no
 * pai entra também durante a navegação dos filhos e cria loop de rota.
 *
 * O menu Relatórios funciona apenas como agrupador; cada relatório possui sua
 * própria rota e renderiza aqui através do Outlet.
 */
export const Route = createFileRoute("/relatorios")({
  component: RelatoriosLayout,
});

function RelatoriosLayout() {
  return <Outlet />;
}
