import { createFileRoute } from "@tanstack/react-router";
import { RelatorioShell } from "@/components/relatorio-shell";

export const Route = createFileRoute("/contabil/balanco-patrimonial")({
  head: () => ({
    meta: [
      { title: "Balanço Patrimonial" },
      { name: "description", content: "Posição patrimonial consolidada da competência." },
      { property: "og:title", content: "Balanço Patrimonial — ERP Contábil" },
      { property: "og:description", content: "Posição patrimonial consolidada da competência." },
    ],
  }),
  component: () => (
    <RelatorioShell
      titulo="Balanço Patrimonial"
      descricao="Posição patrimonial consolidada da competência."
      parametros={["Modelo: padrão", "Comparativo: exercício anterior"]}
      colunas={["Grupo", "Descrição", "Saldo atual", "Saldo anterior", "Variação"]}
    />
  ),
});
