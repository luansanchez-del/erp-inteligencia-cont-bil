import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { empresas, grupos } from "@/data/mock";
import type { Empresa } from "@/types/erp";

export const Route = createFileRoute("/empresas/")({
  head: () => ({
    meta: [
      { title: "Empresas — ERP Contábil" },
      { name: "description", content: "Cadastro de empresas atendidas pelo escritório contábil." },
      { property: "og:title", content: "Empresas — ERP Contábil" },
      { property: "og:description", content: "Cadastro de empresas do ERP Contábil." },
    ],
  }),
  component: EmpresasPage,
});

const regimeLabel: Record<string, string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
  imune: "Imune / Isenta",
};

export function regimeTexto(e: Empresa) {
  if (!e.regime || e.regimeConfirmado === false) return "A confirmar";
  return regimeLabel[e.regime] ?? "A confirmar";
}

function EmpresasPage() {
  const navigate = useNavigate();

  const colunas: Column<Empresa>[] = [
    {
      key: "codigo",
      header: "Código",
      className: "font-mono w-24",
      render: (e) => e.codigo,
      valor: (e) => e.codigo,
    },
    {
      key: "razao",
      header: "Razão social",
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{e.razaoSocial}</p>
          <p className="truncate text-xs text-muted-foreground">{e.nomeFantasia}</p>
        </div>
      ),
      valor: (e) => `${e.razaoSocial} ${e.nomeFantasia}`,
    },
    {
      key: "cnpj",
      header: "CNPJ",
      className: "font-mono whitespace-nowrap",
      render: (e) => e.cnpj,
      valor: (e) => e.cnpj,
    },
    {
      key: "local",
      header: "Município / UF",
      className: "whitespace-nowrap",
      render: (e) => (e.municipio ? `${e.municipio}/${e.uf}` : e.uf),
      valor: (e) => `${e.municipio ?? ""} ${e.uf}`,
    },
    {
      key: "tipo",
      header: "Estabelecimento",
      className: "w-32",
      render: (e) => (
        <Badge variant={e.tipo === "matriz" ? "default" : "outline"}>
          {e.tipo === "matriz" ? "Matriz" : "Filial"}
        </Badge>
      ),
      valor: (e) => e.tipo,
    },
    {
      key: "regime",
      header: "Regime",
      render: (e) => {
        const texto = regimeTexto(e);
        return texto === "A confirmar" ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <CircleAlert className="size-3.5 text-amber-600" /> A confirmar
          </span>
        ) : (
          texto
        );
      },
      valor: (e) => regimeTexto(e),
    },
    {
      key: "grupo",
      header: "Grupo",
      render: (e) => grupos.find((g) => g.id === e.grupoId)?.nome ?? "—",
      valor: (e) => grupos.find((g) => g.id === e.grupoId)?.nome ?? "",
    },
    {
      key: "status",
      header: "Situação",
      className: "w-28",
      render: (e) => (
        <Badge variant={e.ativa ? "secondary" : "outline"}>{e.ativa ? "Ativa" : "Inativa"}</Badge>
      ),
      valor: (e) => (e.ativa ? "ativa" : "inativa"),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        titulo="Empresas"
        descricao="Cadastro base das empresas atendidas. Vínculos de grupo e parâmetros contábeis."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Nova empresa
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={empresas}
        chave={(e) => e.id}
        placeholderBusca="Buscar por razão social, CNPJ ou código…"
        onRowClick={(e) => navigate({ to: "/empresas/$id", params: { id: e.id } })}
      />
    </PageShell>
  );
}
