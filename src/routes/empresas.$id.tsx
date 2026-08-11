import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useErp, type NovaEmpresa } from "@/context/erp-context";
import { integracoes } from "@/data/mock";
import type { RegimeTributario } from "@/types/erp";

export const Route = createFileRoute("/empresas/$id")({
  head: () => ({
    meta: [
      { title: "Empresa — ERP Contábil" },
      { name: "description", content: "Detalhe cadastral da empresa no ERP Contábil." },
      { property: "og:title", content: "Detalhe da empresa — ERP Contábil" },
      { property: "og:description", content: "Dados cadastrais, contábeis e vínculos da empresa." },
    ],
  }),
  component: EmpresaDetalhe,
});

const regimeLabel: Record<RegimeTributario, string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
  imune: "Imune / Isenta",
};

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
  const { empresas, grupos, atualizarEmpresa } = useErp();
  const empresa = empresas.find((item) => item.id === id);
  const grupo = grupos.find((item) => item.id === empresa?.grupoId);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<NovaEmpresa | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!empresa) return;
    const { id: _id, ...dados } = empresa;
    setForm(dados);
  }, [empresa]);

  if (!empresa || !form) {
    return (
      <PageShell>
        <PageHeader titulo="Empresa não encontrada" descricao="O cadastro pode ter sido removido ou não está disponível neste navegador." />
        <Button variant="outline" asChild>
          <Link to="/empresas"><ArrowLeft className="size-4" /> Voltar para empresas</Link>
        </Button>
      </PageShell>
    );
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    if (!form) return;

    const cnpj = form.cnpj.replace(/\D/g, "");
    if (!form.codigo.trim() || !form.razaoSocial.trim() || !form.nomeFantasia.trim() || cnpj.length !== 14) {
      setErro("Preencha os campos obrigatórios e informe um CNPJ com 14 dígitos.");
      return;
    }
    if (
      empresas.some(
        (item) =>
          item.id !== empresa.id &&
          (item.codigo.toLowerCase() === form.codigo.trim().toLowerCase() ||
            item.cnpj.replace(/\D/g, "") === cnpj),
      )
    ) {
      setErro("Código ou CNPJ já utilizado por outra empresa.");
      return;
    }

    atualizarEmpresa(empresa.id, {
      ...form,
      codigo: form.codigo.trim(),
      razaoSocial: form.razaoSocial.trim(),
      nomeFantasia: form.nomeFantasia.trim(),
      cnpj: form.cnpj.trim(),
      uf: form.uf.toUpperCase(),
    });
    setAberto(false);
  }

  return (
    <PageShell>
      <PageHeader
        titulo={empresa.razaoSocial}
        descricao={`${empresa.cnpj} · ${empresa.uf}`}
        acoes={
          <>
            <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/empresas" className="gap-2">
                <ArrowLeft className="size-4" /> Voltar
              </Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="contabil">Contábil</TabsTrigger>
          <TabsTrigger value="grupos">Grupo</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardHeader><CardTitle className="text-base">Cadastro</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Campo rotulo="Código" valor={empresa.codigo} />
              <Campo rotulo="Nome fantasia" valor={empresa.nomeFantasia} />
              <Campo rotulo="CNPJ" valor={empresa.cnpj} />
              <Campo rotulo="UF" valor={empresa.uf} />
              <Campo rotulo="Regime" valor={regimeLabel[empresa.regime]} />
              <Campo rotulo="Situação" valor={empresa.ativa ? "Ativa" : "Inativa"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contabil">
          <Card>
            <CardHeader><CardTitle className="text-base">Parâmetros contábeis</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Plano de contas, centros de custo e regras de encerramento serão sempre vinculados ao identificador desta empresa.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grupos">
          <Card>
            <CardHeader><CardTitle className="text-base">Vínculo de grupo</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {grupo ? (
                <span>{grupo.nome} — responsável {grupo.responsavel}</span>
              ) : (
                <span className="text-muted-foreground">Empresa sem grupo vinculado.</span>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card>
            <CardHeader><CardTitle className="text-base">Conectores</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {integracoes.map((integracao) => (
                <div key={integracao.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-3">
                  <span className="min-w-0 truncate text-sm">{integracao.nome}</span>
                  <Badge variant="outline">
                    {integracao.status === "nao_conectado" ? "Não conectado" : "Planejado"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={salvar}>
            <DialogHeader>
              <DialogTitle>Editar empresa</DialogTitle>
              <DialogDescription>As alterações atualizam também o seletor global.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <Entrada label="Código">
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
              </Entrada>
              <Entrada label="CNPJ">
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
              </Entrada>
              <Entrada label="Razão social" className="sm:col-span-2">
                <Input value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
              </Entrada>
              <Entrada label="Nome fantasia">
                <Input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
              </Entrada>
              <Entrada label="UF">
                <Input value={form.uf} maxLength={2} onChange={(e) => setForm({ ...form, uf: e.target.value })} />
              </Entrada>
              <Entrada label="Regime">
                <Select value={form.regime} onValueChange={(regime) => setForm({ ...form, regime: regime as RegimeTributario })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(regimeLabel).map(([valor, label]) => (
                      <SelectItem key={valor} value={valor}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Entrada>
              <Entrada label="Grupo">
                <Select
                  value={form.grupoId ?? "sem-grupo"}
                  onValueChange={(grupoId) => setForm({ ...form, grupoId: grupoId === "sem-grupo" ? undefined : grupoId })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-grupo">Sem grupo</SelectItem>
                    {grupos.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Entrada>
              <Entrada label="Situação">
                <Select value={form.ativa ? "ativa" : "inativa"} onValueChange={(status) => setForm({ ...form, ativa: status === "ativa" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </Entrada>
            </div>
            {erro && <p className="mb-4 text-sm text-destructive">{erro}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Entrada({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
