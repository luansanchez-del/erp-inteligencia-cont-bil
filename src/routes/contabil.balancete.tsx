import { createFileRoute } from "@tanstack/react-router";
import { RelatorioShell } from "@/components/relatorio-shell";

export const Route = createFileRoute("/contabil/balancete")({
  head: () => ({
    meta: [
      { title: "Balancete — ERP Contábil" },
      { name: "description", content: "Saldos anterior, movimento do período e saldo atual por conta." },
      { property: "og:title", content: "Balancete — ERP Contábil" },
      { property: "og:description", content: "Saldos anterior, movimento do período e saldo atual por conta." },
    ],
  }),
  component: () => (
    <RelatorioShell
      titulo="Balancete"
      descricao="Saldos anterior, movimento do período e saldo atual por conta."
      parametros={["Nível: analítico", "Zerar contas sem movimento: não"]}
      colunas={["Conta", "Descrição", "Saldo anterior", "Débito", "Crédito", "Saldo atual"]}
    />
  ),
});
