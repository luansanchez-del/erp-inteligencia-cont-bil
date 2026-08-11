import { createFileRoute } from "@tanstack/react-router";
import { ModuloFuturo } from "@/components/modulo-futuro";

export const Route = createFileRoute("/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimônio — ERP Contábil" },
      { name: "description", content: "Controle de bens, depreciação e movimentações patrimoniais — previsto para etapa futura." },
      { property: "og:title", content: "Patrimônio — ERP Contábil" },
      { property: "og:description", content: "Controle de bens, depreciação e movimentações patrimoniais — previsto para etapa futura." },
    ],
  }),
  component: () => (
    <ModuloFuturo
      titulo="Patrimônio"
      descricao="Controle de bens, depreciação e movimentações patrimoniais — previsto para etapa futura."
      previsto={["Cadastro de bens", "Depreciação e amortização", "Baixas e transferências", "Integração com o contábil"]}
    />
  ),
});
