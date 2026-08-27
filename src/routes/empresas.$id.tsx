import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { regimeTexto } from "@/lib/empresa";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { grupos, integracoes } from "@/data/mock";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/empresas/$id")({
  head: () => ({
    meta: [
      { title: "Empresa" },
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
  const { id } = Route.useParams();
  const { empresas } = useErp();
  const empresa = empresas.find((item) => item.id === id);
  if (!empresa) {
    return <PageShell><PageHeader titulo="Empresa não encontrada" descricao="O cadastro solicitado não existe." acoes={<Button variant="outline" size="sm" asChild><Link to="/empresas"><ArrowLeft className="mr-1.5 size-4"/>Voltar</Link></Button>}/></PageShell>;
  }
  const grupo = grupos.find((g) => g.id === empresa.grupoId);

  return (
    <PageShell>
      <PageHeader
        titulo={empresa.razaoSocial}
        descricao={`${empresa.cnpj} · ${empresa.municipio ? `${empresa.municipio}/` : ""}${empresa.uf} · ${empresa.tipo === "matriz" ? "Matriz" : "Filial"}`}
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
              <Campo
                rotulo="Município / UF"
                valor={empresa.municipio ? `${empresa.municipio}/${empresa.uf}` : empresa.uf}
              />
              <Campo rotulo="Estabelecimento" valor={empresa.tipo === "matriz" ? "Matriz" : "Filial"} />
              <Campo rotulo="Atividade" valor={empresa.atividade ?? "A confirmar"} />
              <Campo rotulo="Regime" valor={regimeTexto(empresa)} />
              <Campo rotulo="Situação" valor={empresa.ativa ? "Ativa" : "Inativa"} />
              {regimeTexto(empresa) === "A confirmar" && (
                <p className="col-span-full flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  Pendência cadastral: regime tributário ainda não confirmado com o cliente. Nenhum
                  regime é presumido pelo sistema.
                </p>
              )}
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
