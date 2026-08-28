import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Minus, Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { navGroups } from "@/config/navigation";
import type { AcaoPermissao, Permissao } from "@/types/erp";

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

const acoes: AcaoPermissao[] = ["ver", "criar", "editar", "excluir", "efetivar"];

interface FuncaoRow {
  id: string;
  nome: string;
  descricao: string;
  permissoes: Permissao[];
}

interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  funcaoNome: string | null;
  ativo: boolean;
}

async function buscarFuncoes(): Promise<FuncaoRow[]> {
  const { data, error } = await supabase
    .from("funcoes")
    .select("id, nome, descricao, permissoes")
    .order("nome");
  if (error) throw error;
  return (data ?? []).map((f) => ({
    ...f,
    permissoes: (f.permissoes as unknown as Permissao[] | null) ?? [],
  }));
}

async function buscarUsuarios(): Promise<UsuarioRow[]> {
  const [{ data: profiles, error: erroProfiles }, { data: funcoes, error: erroFuncoes }] =
    await Promise.all([
      supabase.from("profiles").select("id, nome, email, funcao_id, ativo").order("nome"),
      supabase.from("funcoes").select("id, nome"),
    ]);
  if (erroProfiles) throw erroProfiles;
  if (erroFuncoes) throw erroFuncoes;
  const nomesPorFuncao = new Map((funcoes ?? []).map((f) => [f.id, f.nome]));
  return (profiles ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    funcaoNome: p.funcao_id ? (nomesPorFuncao.get(p.funcao_id) ?? null) : null,
    ativo: p.ativo,
  }));
}

function AdministracaoPage() {
  const { data: usuarios = [], isLoading: carregandoUsuarios } = useQuery({
    queryKey: ["administracao", "usuarios"],
    queryFn: buscarUsuarios,
  });
  const { data: funcoes = [], isLoading: carregandoFuncoes } = useQuery({
    queryKey: ["administracao", "funcoes"],
    queryFn: buscarFuncoes,
  });

  const colunas: Column<UsuarioRow>[] = [
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
      render: (u) => u.funcaoNome ?? "—",
      valor: (u) => u.funcaoNome ?? "",
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
        descricao="Estrutura de acesso por usuário e função, com permissões aplicadas por módulo na navegação."
      />

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="funcoes">Funções</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <div className="mb-3 flex justify-end">
            <Button size="sm" className="gap-2" asChild>
              <Link to="/administracao/usuarios/novo">
                <Plus className="size-4" /> Novo usuário
              </Link>
            </Button>
          </div>
          <DataTable
            colunas={colunas}
            dados={usuarios}
            chave={(u) => u.id}
            placeholderBusca="Buscar usuário…"
            vazio={carregandoUsuarios ? "Carregando…" : "Nenhum usuário cadastrado."}
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
            {!carregandoFuncoes && funcoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma função cadastrada.</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="permissoes">
          <div className="grid gap-4">
            {funcoes.map((f) => (
              <Card key={f.id}>
                <CardHeader>
                  <CardTitle className="text-base">Matriz de permissões — {f.nome}</CardTitle>
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
                        {navGroups.map((g) => {
                          const permissaoModulo = f.permissoes.find((p) => p.modulo === g.id);
                          return (
                            <tr key={g.id} className="border-t">
                              <td className="whitespace-nowrap px-3 py-2">{g.label}</td>
                              {acoes.map((a) => (
                                <td key={a} className="px-3 py-2">
                                  {permissaoModulo?.acoes.includes(a) ? (
                                    <Check className="size-4 text-primary" />
                                  ) : (
                                    <Minus className="size-4 text-muted-foreground" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
