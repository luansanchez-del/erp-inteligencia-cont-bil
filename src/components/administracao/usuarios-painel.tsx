import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import {
  criarUsuario,
  listarFuncoes,
  listarUsuarios,
  podeCriarUsuario,
  type UsuarioListado,
} from "@/lib/usuarios.functions";

export function UsuariosPainel() {
  const queryClient = useQueryClient();
  const fetchUsuarios = useServerFn(listarUsuarios);
  const fetchFuncoes = useServerFn(listarFuncoes);
  const fetchPodeCriar = useServerFn(podeCriarUsuario);
  const enviarConvite = useServerFn(criarUsuario);

  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [funcaoId, setFuncaoId] = useState("");

  const usuarios = useQuery({
    queryKey: ["administracao", "usuarios"],
    queryFn: () => fetchUsuarios(),
  });

  const funcoes = useQuery({
    queryKey: ["administracao", "funcoes"],
    queryFn: () => fetchFuncoes(),
  });

  const permissao = useQuery({
    queryKey: ["administracao", "pode-criar-usuario"],
    queryFn: () => fetchPodeCriar(),
  });

  const convite = useMutation({
    mutationFn: (entrada: { nome: string; email: string; funcaoId: string }) =>
      enviarConvite({
        data: {
          ...entrada,
          ...(typeof window !== "undefined"
            ? { redirectTo: `${window.location.origin}/login` }
            : {}),
        },
      }),
    onSuccess: () => {
      toast.success("Convite enviado", {
        description: `${email} recebeu um e-mail para definir a senha de acesso.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["administracao", "usuarios"] });
      setAberto(false);
      setNome("");
      setEmail("");
      setFuncaoId("");
    },
    onError: (erro: unknown) => {
      toast.error("Não foi possível criar o usuário", {
        description: erro instanceof Error ? erro.message : "Erro inesperado.",
      });
    },
  });

  const colunas: Column<UsuarioListado>[] = [
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

  const carregandoLista = usuarios.isLoading;
  const erroLista = usuarios.error;

  return (
    <div className="space-y-3">
      {permissao.data === true && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAberto(true)}>
            <UserPlus className="mr-2 size-4" />
            Novo usuário
          </Button>
        </div>
      )}

      {erroLista ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {erroLista instanceof Error ? erroLista.message : "Falha ao carregar usuários."}
        </div>
      ) : carregandoLista ? (
        <div className="flex items-center gap-2 rounded-md border p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Carregando usuários…
        </div>
      ) : (
        <DataTable
          colunas={colunas}
          dados={usuarios.data ?? []}
          chave={(u) => u.id}
          placeholderBusca="Buscar usuário…"
        />
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              O usuário recebe um convite por e-mail para definir a própria senha. O perfil já fica
              vinculado à função escolhida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario-nome">Nome</Label>
              <Input
                id="usuario-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario-email">E-mail</Label>
              <Input
                id="usuario-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario-funcao">Função</Label>
              <Select value={funcaoId} onValueChange={setFuncaoId}>
                <SelectTrigger id="usuario-funcao">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {(funcoes.data ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={convite.isPending || !nome.trim() || !email.trim() || !funcaoId}
              onClick={() => convite.mutate({ nome, email, funcaoId })}
            >
              {convite.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
