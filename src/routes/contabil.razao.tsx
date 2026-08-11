import { createFileRoute } from "@tanstack/react-router";
import { RelatorioShell } from "@/components/relatorio-shell";

export const Route = createFileRoute("/contabil/razao")({
  head: () => ({
    meta: [
      { title: "Razão — ERP Contábil" },
      { name: "description", content: "Movimento analítico por conta contábil no período selecionado." },
      { property: "og:title", content: "Razão — ERP Contábil" },
      { property: "og:description", content: "Movimento analítico por conta contábil no período selecionado." },
    ],
  }),
  component: () => (
    <RelatorioShell
      titulo="Razão"
      descricao="Movimento analítico por conta contábil no período selecionado."
      parametros={["Conta: todas", "Ordenação: data"]}
      colunas={["Data", "Lançamento", "Histórico", "Débito", "Crédito", "Saldo"]}
    />
  ),
});
