import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { empresas, grupos, integracoes } from "@/data/mock";

export const Route = createFileRoute("/empresas/$id")({
  loader: ({ params }) => {
    const empresa = empresas.find((e) => e.id === params.id);
    if (!empresa) throw notFound();
    return { empresa };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.empresa.nomeFantasia} — ERP Contábil` : "Empresa" },
      { name: "description", content: "Detalhe cadastral da empresa no ERP Contábil." },
      { property: "og:title", content: "Detalhe da empresa — ERP Contábil" },
      { property: "og:description", content: "Dados cadastrais, contábeis e vínculos da empresa." },
    ],
  }),
  component: EmpresaDetalhe,
});

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="truncate text-sm font-medium">{valor}</p>
    </div>
  );
}

function EmpresaDetalhe() {
  const { empresa } = Route.useLoaderData();
  const grupo = grupos.find((g) => g.id === empresa.grupoId);

  return (
    <PageShell>
      <PageHeader
        titulo={empresa.razaoSocial}
        descricao={`${empresa.cnpj} · ${empresa.uf}`}
        acoes={
          <Button variant="outline" size="sm" asChild>
            <Link to="/empresas" className="gap-2">
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="contabil">Contábil</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cadastro</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Campo rotulo="Código" valor={empresa.codigo} />
              <Campo rotulo="Nome fantasia" valor={empresa.nomeFantasia} />
              <Campo rotulo="CNPJ" valor={empresa.cnpj} />
              <Campo rotulo="UF" valor={empresa.uf} />
              <Campo rotulo="Regime" valor={empresa.regime} />
              <Campo rotulo="Situação" valor={empresa.ativa ? "Ativa" : "Inativa"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contabil">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parâmetros contábeis</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Plano de contas, centros de custo e regras de encerramento serão vinculados aqui na
              próxima etapa.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grupos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vínculo de grupo</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {grupo ? (
                <span>
                  {grupo.nome} — responsável {grupo.responsavel}
                </span>
              ) : (
                <span className="text-muted-foreground">Empresa sem grupo vinculado.</span>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conectores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {integracoes.map((i) => (
                <div
                  key={i.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-3"
                >
                  <span className="min-w-0 truncate text-sm">{i.nome}</span>
                  <Badge variant="outline">
                    {i.status === "nao_conectado" ? "Não conectado" : "Planejado"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
