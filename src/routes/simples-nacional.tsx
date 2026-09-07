import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CheckCircle2, CircleAlert, FileCheck2, FileUp, Landmark, LibraryBig, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useErp } from "@/context/erp-context";
import { useAberturaSimplesNacional } from "@/hooks/use-abertura-simples-nacional";
import { regimeTexto } from "@/lib/empresa";
import type { AberturaSimplesNacional, Empresa, SocioCapitalAbertura } from "@/types/erp";

export const Route = createFileRoute("/simples-nacional")({
  head: () => ({ meta: [{ title: "Implantação de empresas" }, { name: "description", content: "Central de implantação contábil por empresa, com rastreabilidade e validação antes da efetivação." }] }),
  component: ImplantacaoPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const linhaSocioVazia = { nome: "", cpf: "", valor: "" };
type LinhaSocio = typeof linhaSocioVazia;

function parseValor(valor: string) {
  const texto = valor.trim();
  if (!texto) return 0;
  const numero = Number(texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
  return Number.isFinite(numero) ? numero : 0;
}

function ImplantacaoPage() {
  const { empresa, setEmpresaId } = useErp();
  const empresaLegada = empresa.grupoId === "g-nitaplast";

  return <PageShell>
    <PageHeader
      titulo="Implantação contábil"
      descricao="Uma única entrada para preparar empresas, importar a base anterior e iniciar a escrituração com segurança."
      acoes={<>
        {empresaLegada ? <Button size="sm" variant="outline" onClick={() => setEmpresaId("piloto-simples-demonstracao")}>Visualizar empresa-piloto</Button> : null}
        <Button size="sm" className="gap-2" asChild><Link to="/empresas/nova" search={{ retorno: "/simples-nacional" }}><Plus className="size-4"/> Nova empresa</Link></Button>
      </>}
    />
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 items-start gap-3 rounded-lg border bg-card p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-5"/></div>
        <div className="min-w-0"><p className="truncate font-semibold">{empresa.nomeFantasia}</p><p className="truncate text-sm text-muted-foreground">{empresa.cnpj} · {regimeTexto(empresa)}</p></div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        {empresaLegada ? <ShieldCheck className="size-5 text-emerald-600"/> : <CircleAlert className="size-5 text-amber-600"/>}
        <div><p className="font-medium">{empresaLegada ? "Base protegida" : "Implantação em preparação"}</p><p className="text-xs text-muted-foreground">{empresaLegada ? "Sem escrita pelo novo fluxo" : "Efetivação somente após conferência"}</p></div>
      </div>
    </div>
    {empresaLegada ? <BaseLegadaPreservada empresa={empresa}/> : <FluxoNovaEmpresa empresa={empresa}/>} 
  </PageShell>;
}

function BaseLegadaPreservada({ empresa }: { empresa: Empresa }) {
  return <Card className="border-emerald-600/30 bg-emerald-500/5">
    <CardHeader><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700"/><div><CardTitle className="text-base">Histórico contábil preservado</CardTitle><CardDescription className="mt-1">{empresa.nomeFantasia} continua utilizando sua base conferida. Esta central não altera os movimentos de maio, junho ou julho.</CardDescription></div></div></CardHeader>
    <CardContent className="grid gap-3 sm:grid-cols-3">
      <StatusCard icon={FileCheck2} titulo="Competências" valor="05/2026 e 06/2026" detalhe="Fechadas e protegidas" concluido/>
      <StatusCard icon={LibraryBig} titulo="Base contábil" valor="Motor legado" detalhe="Leitura mantida sem migração" concluido/>
      <StatusCard icon={ShieldCheck} titulo="Próxima etapa" valor="Testes de regressão" detalhe="Comparar saldos antes da migração"/>
    </CardContent>
  </Card>;
}

function FluxoNovaEmpresa({ empresa }: { empresa: Empresa }) {
  return <div className="grid gap-4">
    <Card><CardHeader><CardTitle className="text-base">Jornada de implantação</CardTitle><CardDescription>Cada etapa produz evidência e precisa ser validada antes de alimentar os livros contábeis.</CardDescription></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard icon={Building2} titulo="1. Cadastro" valor="Empresa identificada" detalhe="CNPJ e regime sob conferência" concluido/>
        <StatusCard icon={FileUp} titulo="2. Documentos" valor="Aguardando importação" detalhe="PIER, Questor, PDF, XLSX ou CSV"/>
        <StatusCard icon={LibraryBig} titulo="3. Plano e saldos" valor="Não iniciado" detalhe="Plano próprio e referencial"/>
        <StatusCard icon={Landmark} titulo="4. Validação" valor="Bloqueada" detalhe="Razão, Balancete e evidências"/>
      </CardContent>
    </Card>
    {empresa.regime === "simples" ? <AberturaContabil empresa={empresa}/> : <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="flex items-start gap-3 pt-5 text-sm"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600"/><div><strong>Regime tributário ainda não confirmado como Simples Nacional.</strong><p className="mt-1 text-muted-foreground">Confirme o cadastro antes de habilitar regras tributárias ou registrar fatos da abertura.</p></div></CardContent></Card>}
  </div>;
}

function StatusCard({ icon: Icon, titulo, valor, detalhe, concluido = false }: { icon: typeof Building2; titulo: string; valor: string; detalhe: string; concluido?: boolean }) {
  return <div className="rounded-lg border bg-card p-4"><div className="flex items-center justify-between gap-2"><Icon className="size-4 text-muted-foreground"/>{concluido ? <CheckCircle2 className="size-4 text-emerald-600"/> : <span className="size-2 rounded-full bg-amber-500"/>}</div><p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p><p className="mt-1 font-medium">{valor}</p><p className="mt-1 text-xs text-muted-foreground">{detalhe}</p></div>;
}

function AberturaContabil({ empresa }: { empresa: Empresa }) {
  const { aberturas, registrar, remover } = useAberturaSimplesNacional(empresa.id);
  const [dataAbertura, setDataAbertura] = useState(new Date().toISOString().slice(0, 10));
  const [contaContrapartidaCodigo, setContaContrapartidaCodigo] = useState("");
  const [contaContrapartidaDescricao, setContaContrapartidaDescricao] = useState("Caixa Geral");
  const [contaCapitalCodigo, setContaCapitalCodigo] = useState("");
  const [socios, setSocios] = useState<LinhaSocio[]>([{ ...linhaSocioVazia }]);
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const totalCapital = useMemo(() => socios.reduce((soma, socio) => soma + parseValor(socio.valor), 0), [socios]);

  function atualizarSocio(indice: number, campo: keyof LinhaSocio, valor: string) { setSocios((atual) => atual.map((socio, i) => i === indice ? { ...socio, [campo]: valor } : socio)); }
  function registrarAbertura() {
    const sociosValidos: Omit<SocioCapitalAbertura, "id">[] = socios.filter((socio) => socio.nome.trim()).map((socio) => ({ nome: socio.nome.trim(), cpf: socio.cpf.trim() || undefined, valorCapital: parseValor(socio.valor) }));
    if (!dataAbertura) return setErro("Informe a data do fato contábil.");
    if (!contaContrapartidaCodigo.trim() || !contaCapitalCodigo.trim()) return setErro("Informe os códigos das contas de contrapartida e de capital social.");
    if (!sociosValidos.length) return setErro("Informe ao menos um sócio com valor de capital.");
    if (sociosValidos.some((socio) => socio.valorCapital <= 0)) return setErro("Todos os sócios precisam ter valor de capital maior que zero.");
    registrar({ dataAbertura, contaContrapartidaCodigo: contaContrapartidaCodigo.trim(), contaContrapartidaDescricao: contaContrapartidaDescricao.trim(), contaCapitalCodigo: contaCapitalCodigo.trim(), contaCapitalDescricao: "Capital Social", socios: sociosValidos, observacoes: observacoes.trim() || undefined });
    setSocios([{ ...linhaSocioVazia }]); setObservacoes(""); setErro(null);
  }

  return <>
    <Card><CardHeader><CardTitle className="text-base">Capital efetivamente integralizado</CardTitle><CardDescription>Registre somente quando existir fato contábil e evidência. Saldos anteriores importados do Balancete serão tratados separadamente e não virarão partidas.</CardDescription></CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Data do fato *"><Input type="date" value={dataAbertura} onChange={(e) => setDataAbertura(e.target.value)}/></Campo>
          <Campo label="Conta contrapartida *"><Input value={contaContrapartidaCodigo} onChange={(e) => setContaContrapartidaCodigo(e.target.value)} placeholder="Ex.: 1.1.01.001"/></Campo>
          <Campo label="Descrição"><Input value={contaContrapartidaDescricao} onChange={(e) => setContaContrapartidaDescricao(e.target.value)}/></Campo>
          <Campo label="Conta Capital Social *"><Input value={contaCapitalCodigo} onChange={(e) => setContaCapitalCodigo(e.target.value)} placeholder="Ex.: 2.3.01.001"/></Campo>
        </div>
        <div className="grid gap-2"><p className="text-sm font-medium">Sócios e valores integralizados</p>
          {socios.map((socio, indice) => <div key={indice} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"><Input value={socio.nome} onChange={(e) => atualizarSocio(indice, "nome", e.target.value)} placeholder="Nome do sócio"/><Input value={socio.cpf} onChange={(e) => atualizarSocio(indice, "cpf", e.target.value)} placeholder="CPF (opcional)"/><Input value={socio.valor} onChange={(e) => atualizarSocio(indice, "valor", e.target.value)} placeholder="Valor" inputMode="decimal"/><Button variant="outline" size="icon" onClick={() => setSocios((atual) => atual.length > 1 ? atual.filter((_, i) => i !== indice) : atual)} disabled={socios.length === 1} aria-label="Remover sócio"><Trash2 className="size-4"/></Button></div>)}
          <Button variant="outline" size="sm" className="w-fit gap-2" onClick={() => setSocios((atual) => [...atual, { ...linhaSocioVazia }])}><Plus className="size-4"/> Adicionar sócio</Button>
        </div>
        <Campo label="Evidência ou observação"><textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Descreva contrato social, comprovante ou documento de origem"/></Campo>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm"><div className="mb-2 flex items-center gap-2 font-medium"><FileCheck2 className="size-4"/> Pré-visualização</div><p>Débito {contaContrapartidaCodigo || "—"} — {contaContrapartidaDescricao || "Contrapartida"}: <span className="font-mono">{brl.format(totalCapital)}</span></p>{socios.filter((s) => s.nome.trim()).map((socio, i) => <p key={i} className="pl-4 text-muted-foreground">Crédito {contaCapitalCodigo || "—"} — {socio.nome}: <span className="font-mono">{brl.format(parseValor(socio.valor))}</span></p>)}</div>
        {erro ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{erro}</p> : null}
        <div className="flex justify-end"><Button onClick={registrarAbertura} className="gap-2"><Save className="size-4"/> Registrar para conferência</Button></div>
      </CardContent>
    </Card>
    {aberturas.length ? <Card><CardHeader><CardTitle className="text-base">Registros preparados</CardTitle><CardDescription>Histórico local temporário de {empresa.nomeFantasia}; ainda não efetivado no Razão.</CardDescription></CardHeader><CardContent className="grid gap-3">{aberturas.map((abertura) => <HistoricoAbertura key={abertura.id} abertura={abertura} onRemover={() => remover(abertura.id)}/>)}</CardContent></Card> : null}
  </>;
}

function HistoricoAbertura({ abertura, onRemover }: { abertura: AberturaSimplesNacional; onRemover: () => void }) {
  const total = abertura.socios.reduce((soma, socio) => soma + socio.valorCapital, 0);
  return <div className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><span className="font-medium">{new Date(`${abertura.dataAbertura}T12:00:00`).toLocaleDateString("pt-BR")}</span><span className="ml-2 text-muted-foreground">Débito {abertura.contaContrapartidaCodigo} / Crédito {abertura.contaCapitalCodigo}</span></div><div className="flex items-center gap-3"><Badge variant="outline">Aguardando conferência</Badge><span className="font-mono font-medium">{brl.format(total)}</span><Button variant="outline" size="sm" className="gap-1 text-red-700" onClick={onRemover}><Trash2 className="size-3.5"/> Remover rascunho</Button></div></div><ul className="mt-2 grid gap-1 text-xs text-muted-foreground">{abertura.socios.map((socio) => <li key={socio.id}>{socio.nome}{socio.cpf ? ` (${socio.cpf})` : ""} — {brl.format(socio.valorCapital)}</li>)}</ul>{abertura.observacoes ? <p className="mt-2 text-xs text-muted-foreground">Evidência: {abertura.observacoes}</p> : null}</div>;
}

function Campo({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>; }
