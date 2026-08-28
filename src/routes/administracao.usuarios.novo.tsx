import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/administracao/usuarios/novo")({
  head: () => ({ meta: [{ title: "Novo usuário" }] }),
  component: NovoUsuarioPage,
});

async function buscarFuncoesParaSelecao() {
  const { data, error } = await supabase.from("funcoes").select("id, nome").order("nome");
  if (error) throw error;
  return data ?? [];
}

async function criarUsuario(input: { nome: string; email: string; funcaoId: string }) {
  const { data, error } = await supabase.functions.invoke<{ id: string }>("criar-usuario", {
    body: input,
  });
  if (error) {
    let mensagem = error.message;
    if ("context" in error && error.context instanceof Response) {
      try {
        const corpo = await error.context.clone().json();
        if (corpo?.error) mensagem = corpo.error;
      } catch {
        /* mantém a mensagem padrão */
      }
    }
    throw new Error(mensagem);
  }
  return data;
}

function NovoUsuarioPage() {
  const navigate = useNavigate();
  const { data: funcoes = [] } = useQuery({
    queryKey: ["administracao", "funcoes-selecao"],
    queryFn: buscarFuncoesParaSelecao,
  });

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [funcaoId, setFuncaoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    if (!nome.trim() || !email.trim() || !funcaoId) {
      setErro("Preencha nome, e-mail e função.");
      return;
    }
    setEnviando(true);
    try {
      await criarUsuario({ nome: nome.trim(), email: email.trim(), funcaoId });
      setSucesso(true);
      setNome("");
      setEmail("");
      setFuncaoId("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar o usuário.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        titulo="Novo usuário"
        descricao="O usuário recebe um convite por e-mail e define a própria senha ao aceitar."
        acoes={
          <Button variant="outline" size="sm" asChild>
            <Link to="/administracao">
              <ArrowLeft className="mr-1.5 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <form onSubmit={salvar} className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4" />
              Dados do usuário
            </CardTitle>
            <CardDescription>
              A função define quais módulos e ações este usuário poderá acessar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Nome *
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              E-mail *
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Função *
              <Select value={funcaoId} onValueChange={setFuncaoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {funcoes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </CardContent>
        </Card>
        {erro ? (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {erro}
          </p>
        ) : null}
        {sucesso ? (
          <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">
            Convite enviado. O usuário aparece na lista assim que aceitar o convite e definir a senha.
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/administracao" })}>
            Fechar
          </Button>
          <Button type="submit" disabled={enviando}>
            <Save className="mr-1.5 size-4" />
            {enviando ? "Enviando…" : "Convidar usuário"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
