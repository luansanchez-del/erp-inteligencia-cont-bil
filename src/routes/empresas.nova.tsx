import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useErp } from "@/context/erp-context";
import type { RegimeTributario, TipoEstabelecimento } from "@/types/erp";

export const Route = createFileRoute("/empresas/nova")({
  validateSearch: (search: Record<string, unknown>) => ({ retorno: search.retorno === "/importacoes" ? "/importacoes" as const : undefined }),
  head: () => ({ meta: [{ title: "Nova empresa — ERP Contábil" }] }),
  component: NovaEmpresaPage,
});

function NovaEmpresaPage() {
  const navigate = useNavigate();
  const { retorno } = Route.useSearch();
  const { empresas, registrarEmpresa, setEmpresaId } = useErp();
  const [codigo, setCodigo] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [uf, setUf] = useState("");
  const [tipo, setTipo] = useState<TipoEstabelecimento>("matriz");
  const [atividade, setAtividade] = useState("");
  const [regime, setRegime] = useState<RegimeTributario | "">("");
  const [erro, setErro] = useState<string | null>(null);

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    const documento = cnpj.replace(/\D/g, "");
    if (!codigo.trim() || !razaoSocial.trim() || !nomeFantasia.trim() || !municipio.trim() || uf.trim().length !== 2) return setErro("Preencha código, razão social, nome fantasia, município e UF.");
    if (documento.length !== 14) return setErro("Informe um CNPJ com 14 dígitos.");
    if (empresas.some((empresa) => empresa.cnpj.replace(/\D/g, "") === documento)) return setErro("Já existe uma empresa cadastrada com este CNPJ.");
    const criada = registrarEmpresa({ codigo: codigo.trim(), razaoSocial: razaoSocial.trim(), nomeFantasia: nomeFantasia.trim(), cnpj: documento, municipio: municipio.trim(), uf: uf.trim().toUpperCase(), tipo, atividade: atividade.trim() || undefined, regime: regime || undefined, regimeConfirmado: Boolean(regime) });
    setEmpresaId(criada.id);
    void navigate({ to: retorno ?? "/empresas" });
  }

  return <PageShell>
    <PageHeader titulo="Nova empresa" descricao="Cadastro mestre para identificar a empresa antes da implantação contábil." acoes={<Button variant="outline" size="sm" asChild><Link to={retorno ?? "/empresas"}><ArrowLeft className="mr-1.5 size-4"/>Voltar</Link></Button>}/>
    <form onSubmit={salvar} className="grid gap-4">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4"/>Identificação</CardTitle><CardDescription>Estes dados vinculam arquivos, competências e relatórios à empresa correta.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo label="Código da empresa *"><Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: 1184"/></Campo>
        <Campo label="CNPJ *"><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} inputMode="numeric" placeholder="00.000.000/0000-00"/></Campo>
        <Campo label="Estabelecimento *"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value as TipoEstabelecimento)}><option value="matriz">Matriz</option><option value="filial">Filial</option></select></Campo>
        <Campo label="Razão social *" className="sm:col-span-2"><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)}/></Campo>
        <Campo label="Nome fantasia *"><Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)}/></Campo>
        <Campo label="Município *"><Input value={municipio} onChange={(e) => setMunicipio(e.target.value)}/></Campo>
        <Campo label="UF *"><Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} placeholder="PR"/></Campo>
        <Campo label="Atividade"><Input value={atividade} onChange={(e) => setAtividade(e.target.value)} placeholder="Opcional"/></Campo>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Parâmetros contábeis iniciais</CardTitle><CardDescription>O regime pode ficar a confirmar. Plano de contas e saldos serão definidos na implantação.</CardDescription></CardHeader><CardContent><Campo label="Regime tributário"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={regime} onChange={(e) => setRegime(e.target.value as RegimeTributario | "")}><option value="">A confirmar</option><option value="real">Lucro Real</option><option value="presumido">Lucro Presumido</option><option value="simples">Simples Nacional</option><option value="imune">Imune / Isenta</option></select></Campo></CardContent></Card>
      {erro ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{erro}</p> : null}
      <div className="flex justify-end"><Button type="submit"><Save className="mr-1.5 size-4"/>Salvar empresa</Button></div>
      <p className="text-xs text-muted-foreground">Salvar este cadastro não gera lançamento, saldo de abertura ou movimento no Razão.</p>
    </form>
  </PageShell>;
}

function Campo({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) { return <label className={`grid gap-1.5 text-sm font-medium ${className}`}>{label}{children}</label>; }
