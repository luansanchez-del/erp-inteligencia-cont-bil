import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { funcoes, usuarios } from "@/data/mock";
import { navGroups } from "@/config/navigation";
import type { Usuario } from "@/types/erp";

export const Route = createFileRoute("/administracao")({
  head: () => ({
    meta: [
      { title: "Administração" },
      {
        name: "description",
        content: "Usuários, funções e matriz de permissões por módulo do ERP Contábil.",
      },
      { property: "og:title", content: "Administração — ERP Contábil" },
      { property: "og:description", content: "Usuários, funções e permissões." },
    ],
  }),
  component: AdministracaoPage,
});

const acoes = ["ver", "criar", "editar", "excluir", "efetivar"] as const;

function AdministracaoPage() {
  const colunas: Column<Usuario>[] = [
    {
      key: "nome",
      header: "Usuário",
      render: (u) => <span className="font-medium">{u.nome}</span>,
      valor: (u) => u.nome,
    },
    { key: "email", header: "E-mail", render: (u) => u.email, valor: (u) => u.email },
    {
      key: "funcao",
      header: "Função",
      render: (u) => funcoes.find((f) => f.id === u.funcaoId)?.nome ?? "—",
      valor: (u) => funcoes.find((f) => f.id === u.funcaoId)?.nome ?? "",
    },
    {
      key: "status",
      header: "Situação",
      className: "w-28",
      render: (u) => (
        <Badge variant={u.ativo ? "secondary" : "outline"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
      ),
      valor: (u) => (u.ativo ? "ativo" : "inativo"),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        titulo="Administração"
        descricao="Estrutura de acesso por usuário e função. Controles ainda não aplicados no backend."
      />

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="funcoes">Funções</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <DataTable
            colunas={colunas}
            dados={usuarios}
            chave={(u) => u.id}
            placeholderBusca="Buscar usuário…"
          />
        </TabsContent>

        <TabsContent value="funcoes">
          <div className="grid gap-3 md:grid-cols-3">
            {funcoes.map((f) => (
              <Card key={f.id}>
                <CardHeader>
                  <CardTitle className="text-base">{f.nome}</CardTitle>
                  <CardDescription>{f.descricao}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matriz de permissões — Administrador</CardTitle>
              <CardDescription>Somente visualização nesta etapa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-3 py-2 font-medium">Módulo</th>
                      {acoes.map((a) => (
                        <th key={a} className="px-3 py-2 font-medium capitalize">
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {navGroups.map((g) => (
                      <tr key={g.id} className="border-t">
                        <td className="whitespace-nowrap px-3 py-2">{g.label}</td>
                        {acoes.map((a) => (
                          <td key={a} className="px-3 py-2">
                            {g.futuro ? (
                              <Minus className="size-4 text-muted-foreground" />
                            ) : (
                              <Check className="size-4 text-primary" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametros">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parâmetros do sistema</CardTitle>
              <CardDescription>
                Numeração de lotes, máscaras de conta e políticas de fechamento entram aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nada configurado nesta etapa.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
