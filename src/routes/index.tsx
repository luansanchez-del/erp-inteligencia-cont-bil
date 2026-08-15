import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  FileBarChart,
  Plug,
  Upload,
  CircleAlert,
} from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ERP Contábil" },
      {
        name: "description",
        content: "Visão geral da empresa e da competência selecionadas no ERP Contábil.",
      },
      { property: "og:title", content: "Dashboard — ERP Contábil" },
      {
        property: "og:description",
        content: "Visão geral da empresa e da competência selecionadas.",
      },
    ],
  }),
  component: Dashboard,
});

const indicadores = [
  { label: "Lançamentos na competência", valor: "—", nota: "aguardando motor contábil" },
  { label: "Lotes pendentes", valor: "—", nota: "sem processamento nesta etapa" },
  { label: "Itens a conciliar", valor: "—", nota: "conciliação não implementada" },
  {
    label: "Estabelecimentos ativos",
    valor: String(empresas.filter((e) => e.ativa).length),
    nota: "grupo NITAPLAST — matriz e filial SP",
  },
];

const atalhos = [
  { label: "Empresas", to: "/empresas", icon: Building2 },
  { label: "Lançamentos", to: "/contabil/lancamentos", icon: BookOpen },
  { label: "Importações", to: "/importacoes", icon: Upload },
  { label: "Integrações", to: "/integracoes", icon: Plug },
  { label: "Relatórios", to: "/relatorios", icon: FileBarChart },
];

function Dashboard() {
  const { empresa, competencia } = useErp();

  return (
    <PageShell>
      <PageHeader
        titulo="Dashboard"
        descricao={`Panorama de ${empresa.nomeFantasia} na competência ${competencia.label}.`}
        acoes={<Badge variant="outline">Fundação — sem motor contábil</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((i) => (
          <Card key={i.label}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{i.label}</CardDescription>
              <CardTitle className="font-mono text-2xl">{i.valor}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">{i.nota}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Atalhos</CardTitle>
            <CardDescription>Acesso direto aos módulos em construção.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {atalhos.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-accent"
              >
                <a.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{a.label}</span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status da competência</CardTitle>
            <CardDescription>{competencia.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Escrituração</span>
              <Badge variant="outline">não iniciada</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Conciliação</span>
              <Badge variant="outline">não iniciada</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fechamento</span>
              <Badge variant="outline">não iniciado</Badge>
            </div>
            <p className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              Etapa atual é a fundação visual: nenhuma regra contábil, importação ou integração está
              ativa.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
