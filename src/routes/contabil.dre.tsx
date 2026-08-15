import { createFileRoute } from "@tanstack/react-router";
import { RelatorioShell } from "@/components/relatorio-shell";

export const Route = createFileRoute("/contabil/dre")({
  head: () => ({
    meta: [
      { title: "DRE — ERP Contábil" },
      { name: "description", content: "Demonstração do resultado do exercício da competência." },
      { property: "og:title", content: "DRE — ERP Contábil" },
      { property: "og:description", content: "Demonstração do resultado do exercício da competência." },
    ],
  }),
  component: () => (
    <RelatorioShell
      titulo="DRE"
      descricao="Demonstração do resultado do exercício da competência."
      parametros={["Comparativo: não", "Modelo: padrão"]}
      colunas={["Grupo", "Descrição", "Período", "Acumulado", "AV %"]}
    />
  ),
});
