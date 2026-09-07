import { useMemo, useState, type ReactNode } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ContaCombobox } from "@/components/conta-combobox";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useCentrosCusto } from "@/hooks/use-centros-custo";
import {
  useLancamentosCompetencia,
  type LancamentoCompetencia,
} from "@/hooks/use-lancamentos-competencia";
import type { Competencia } from "@/context/erp-context";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parseValor(valor: string) {
  const texto = valor.trim();
  if (!texto) return Number.NaN;
  return Number(texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
}

function contaInfo(codigo: string) {
  return saldosImplantacao.find((conta) => conta.conta === codigo);
}

function labelCompetenciaAnterior(competenciaId: string) {
  const partes = competenciaId.match(/^(\d{4})-(\d{2})$/);
  if (!partes) return "do período anterior";
  const data = new Date(Number(partes[1]), Number(partes[2]) - 1, 1);
  data.setMonth(data.getMonth() - 1);
  return `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
}

function CandidatoVazio({ competencia, mensagem }: { competencia: Competencia; mensagem: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-1 py-10 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Competência {competencia.label} sem lançamentos ainda</p>
        <p>{mensagem}</p>
      </CardContent>
    </Card>
  );
}

function BadgeStatusCompetencia({ competencia }: { competencia: Competencia }) {
  if (competencia.status === "fechada") return <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><Lock className="size-3" /> Fechada</Badge>;
  if (competencia.status === "em_fechamento") return <Badge variant="outline" className="border-amber-400 text-amber-800">Em fechamento</Badge>;
  return <Badge variant="outline">Aberta</Badge>;
}

export function LancamentosCompetenciaAberta({ empresaId, competencia }: { empresaId: string; competencia: Competencia }) {
  const { lancamentos, registrar, remover } = useLancamentosCompetencia(empresaId, competencia.id);
  const { centros } = useCentrosCusto();
  const fechada = competencia.status === "fechada";
  const [form, setForm] = useState({ data: "", debitoCodigo: "", creditoCodigo: "", historico: "", documento: "", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: "" });
  const [erro, setErro] = useState<string | null>(null);

  function registrarLancamento() {
    const valor = parseValor(form.valor);
    if (!form.data.trim()) return setErro("Informe a data do lançamento.");
    if (!form.debitoCodigo || !form.creditoCodigo) return setErro("Informe as contas de débito e crédito.");
    if (form.debitoCodigo === form.creditoCodigo) return setErro("Débito e crédito não podem ser a mesma conta.");
    if (!form.historico.trim()) return setErro("Informe o histórico do lançamento.");
    if (!Number.isFinite(valor) || valor <= 0) return setErro("Informe um valor maior que zero.");
    registrar({ data: form.data.trim(), debitoCodigo: form.debitoCodigo, creditoCodigo: form.creditoCodigo, historico: form.historico.trim(), documento: form.documento.trim(), cc: form.cc, centroCusto: form.centroCusto, valor });
    setForm({ data: form.data, debitoCodigo: "", creditoCodigo: "", historico: "", documento: "", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: "" });
    setErro(null);
  }

  return (
    <div className="grid gap-4">
      {fechada ? (
        <Card className="border-emerald-600/30 bg-emerald-500/5">
          <CardContent className="flex items-start gap-3 pt-5 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            <div><strong>Competência {competencia.label} fechada.</strong> Os lançamentos abaixo ficam preservados como histórico; novas partidas e edições estão bloqueadas — inclusive por automações. Para lançar algo novo, abra uma nova competência.</div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Novo lançamento — {competencia.label}</CardTitle><CardDescription>Partida dobrada simples. Toda entrada fica registrada como fato contábil desta competência, sem herdar nada de outros meses.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo label="Data *"><Input type="date" value={form.data} onChange={(e) => setForm((a) => ({ ...a, data: e.target.value }))} /></Campo>
              <label className="grid gap-1.5 text-sm font-medium">Conta débito *<ContaCombobox value={form.debitoCodigo} onChange={(codigo) => setForm((a) => ({ ...a, debitoCodigo: codigo }))} excluir={form.creditoCodigo} /></label>
              <label className="grid gap-1.5 text-sm font-medium">Conta crédito *<ContaCombobox value={form.creditoCodigo} onChange={(codigo) => setForm((a) => ({ ...a, creditoCodigo: codigo }))} excluir={form.debitoCodigo} /></label>
              <Campo label="Valor *"><Input value={form.valor} onChange={(e) => setForm((a) => ({ ...a, valor: e.target.value }))} placeholder="0,00" inputMode="decimal" /></Campo>
              <label className="grid gap-1.5 text-sm font-medium">Centro de custo
                <select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.cc} onChange={(e) => { const c = centros.find((x) => x.codigo === e.target.value); setForm((a) => ({ ...a, cc: e.target.value, centroCusto: c?.descricao ?? "SEM CENTRO DE CUSTO" })); }}>
                  <option value="0">Sem centro de custo</option>
                  {centros.filter((c) => c.situacao === "Ativo").map((c) => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</option>)}
                </select>
              </label>
              <Campo label="Documento"><Input value={form.documento} onChange={(e) => setForm((a) => ({ ...a, documento: e.target.value }))} placeholder="Nota, contrato, comprovante…" /></Campo>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Histórico *</label><textarea value={form.historico} onChange={(e) => setForm((a) => ({ ...a, historico: e.target.value }))} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Descrição do fato contábil" /></div>
            {erro ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{erro}</p> : null}
            <div className="flex justify-end"><Button onClick={registrarLancamento} className="gap-2"><Plus className="size-4" /> Lançar</Button></div>
          </CardContent>
        </Card>
      )}

      {lancamentos.length ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Lançamentos de {competencia.label}</CardTitle><CardDescription>{lancamentos.length} partida(s) registrada(s) diretamente nesta competência.</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Data</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico</th><th className="p-2">Documento</th><th className="p-2 text-right">Valor</th>{fechada ? null : <th className="p-2 text-right">Ações</th>}</tr></thead>
              <tbody>{lancamentos.map((l) => <LinhaLancamento key={l.id} lancamento={l} onRemover={fechada ? undefined : () => remover(l.id)} />)}</tbody>
            </table>
          </CardContent>
        </Card>
      ) : !fechada ? <CandidatoVazio competencia={competencia} mensagem="Lance a primeira partida acima para começar a escrituração deste período." /> : null}
    </div>
  );
}

function LinhaLancamento({ lancamento, onRemover }: { lancamento: LancamentoCompetencia; onRemover?: (() => void) | undefined }) {
  const debito = contaInfo(lancamento.debitoCodigo);
  const credito = contaInfo(lancamento.creditoCodigo);
  return (
    <tr className="border-b last:border-0">
      <td className="p-2 whitespace-nowrap">{new Date(`${lancamento.data}T12:00:00`).toLocaleDateString("pt-BR")}</td>
      <td className="p-2">{lancamento.debitoCodigo} — {debito?.descricao ?? "conta não cadastrada"}</td>
      <td className="p-2">{lancamento.creditoCodigo} — {credito?.descricao ?? "conta não cadastrada"}</td>
      <td className="max-w-[420px] p-2 text-muted-foreground">{lancamento.historico}</td>
      <td className="p-2 font-mono text-xs">{lancamento.documento || "—"}</td>
      <td className="p-2 text-right tabular-nums">{brl.format(lancamento.valor)}</td>
      {onRemover ? <td className="p-2 text-right"><Button variant="outline" size="sm" className="gap-1 text-red-700" onClick={onRemover}><Trash2 className="size-3.5" /> Remover</Button></td> : null}
    </tr>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}

export function RazaoCompetenciaAberta({ lancamentos, competencia }: { lancamentos: LancamentoCompetencia[]; competencia: Competencia }) {
  const porConta = useMemo(() => {
    const mapa = new Map<string, { conta: string; descricao: string; debitos: number; creditos: number; lancamentos: number }>();
    for (const l of lancamentos) {
      for (const [codigo, tipo] of [[l.debitoCodigo, "D"], [l.creditoCodigo, "C"]] as const) {
        const atual = mapa.get(codigo) ?? { conta: codigo, descricao: contaInfo(codigo)?.descricao ?? "conta não cadastrada", debitos: 0, creditos: 0, lancamentos: 0 };
        if (tipo === "D") atual.debitos += l.valor; else atual.creditos += l.valor;
        atual.lancamentos += 1;
        mapa.set(codigo, atual);
      }
    }
    return [...mapa.values()].sort((a, b) => a.conta.localeCompare(b.conta, "pt-BR", { numeric: true }));
  }, [lancamentos]);

  if (!lancamentos.length) return <CandidatoVazio competencia={competencia} mensagem="O Razão desta competência é derivado direto dos lançamentos — registre a primeira partida em Lançamentos." />;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Razão por conta — {competencia.label}</CardTitle><CardDescription>Movimento do período apurado a partir dos lançamentos desta competência. Sem saldo anterior aplicado.</CardDescription></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">Descrição</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Lançamentos</th></tr></thead>
          <tbody>{porConta.map((c) => <tr key={c.conta} className="border-b last:border-0"><td className="p-2 font-mono">{c.conta}</td><td className="p-2">{c.descricao}</td><td className="p-2 text-right tabular-nums">{brl.format(c.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(c.creditos)}</td><td className="p-2 text-right">{c.lancamentos}</td></tr>)}</tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function BalanceteCompetenciaAberta({ lancamentos, competencia }: { lancamentos: LancamentoCompetencia[]; competencia: Competencia }) {
  const porConta = useMemo(() => {
    const mapa = new Map<string, { conta: string; descricao: string; grupo: string; debitos: number; creditos: number }>();
    for (const l of lancamentos) {
      for (const [codigo, tipo] of [[l.debitoCodigo, "D"], [l.creditoCodigo, "C"]] as const) {
        const info = contaInfo(codigo);
        const atual = mapa.get(codigo) ?? { conta: codigo, descricao: info?.descricao ?? "conta não cadastrada", grupo: info?.grupo ?? "Sem classificação", debitos: 0, creditos: 0 };
        if (tipo === "D") atual.debitos += l.valor; else atual.creditos += l.valor;
        mapa.set(codigo, atual);
      }
    }
    return [...mapa.values()].sort((a, b) => a.grupo.localeCompare(b.grupo, "pt-BR") || a.conta.localeCompare(b.conta, "pt-BR", { numeric: true }));
  }, [lancamentos]);

  if (!lancamentos.length) return <CandidatoVazio competencia={competencia} mensagem="O Balancete desta competência aparece assim que houver lançamentos." />;

  return (
    <div className="grid gap-4">
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="pt-5 text-sm"><strong>Saldo anterior ainda não definido.</strong> Este Balancete mostra apenas o movimento (débitos e créditos) desta competência — a decisão de trazer o saldo final de {labelCompetenciaAnterior(competencia.id)} como saldo de abertura por conta depende de conferência do contador antes de ser automatizada.</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Balancete — movimento de {competencia.label}</CardTitle><CardDescription>Agrupado por classificação patrimonial/resultado do plano de contas.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Grupo</th><th className="p-2">Conta</th><th className="p-2">Descrição</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th></tr></thead>
            <tbody>{porConta.map((c) => <tr key={c.conta} className="border-b last:border-0"><td className="p-2 text-xs text-muted-foreground">{c.grupo}</td><td className="p-2 font-mono">{c.conta}</td><td className="p-2">{c.descricao}</td><td className="p-2 text-right tabular-nums">{brl.format(c.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(c.creditos)}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function DreCompetenciaAberta({ lancamentos, competencia }: { lancamentos: LancamentoCompetencia[]; competencia: Competencia }) {
  const apuracao = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    for (const l of lancamentos) {
      const debito = contaInfo(l.debitoCodigo);
      const credito = contaInfo(l.creditoCodigo);
      if (credito?.grupo === "Receitas acumuladas") receitas += l.valor;
      if (debito?.grupo === "Custos e despesas acumulados") despesas += l.valor;
    }
    return { receitas, despesas, resultado: receitas - despesas };
  }, [lancamentos]);

  if (!lancamentos.length) return <CandidatoVazio competencia={competencia} mensagem="A DRE desta competência aparece assim que houver lançamentos de receita ou despesa." />;

  return (
    <div className="grid gap-4">
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="pt-5 text-sm"><strong>DRE básica, sem regras fiscais aplicadas.</strong> Soma direta por grupo do plano de contas (receitas e custos/despesas) — ainda sem rateios, apuração tributária ou fechamento assistido, que só existem hoje para o motor dedicado da Nitaplast.</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">DRE — {competencia.label}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between border-b pb-2"><span>(+) Receitas</span><span className="tabular-nums">{brl.format(apuracao.receitas)}</span></div>
          <div className="flex justify-between border-b pb-2"><span>(-) Custos e despesas</span><span className="tabular-nums">{brl.format(apuracao.despesas)}</span></div>
          <div className="flex justify-between pt-1 font-semibold"><span>(=) Resultado</span><span className="tabular-nums">{brl.format(apuracao.resultado)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DiarioCompetenciaAberta({ lancamentos, competencia }: { lancamentos: LancamentoCompetencia[]; competencia: Competencia }) {
  const ordenados = useMemo(() => [...lancamentos].sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id)), [lancamentos]);
  if (!lancamentos.length) return <CandidatoVazio competencia={competencia} mensagem="O Diário desta competência é o espelho cronológico dos lançamentos registrados em Lançamentos." />;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Diário — {competencia.label}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Data</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico</th><th className="p-2 text-right">Valor</th></tr></thead>
          <tbody>{ordenados.map((l) => <tr key={l.id} className="border-b last:border-0"><td className="p-2 whitespace-nowrap">{new Date(`${l.data}T12:00:00`).toLocaleDateString("pt-BR")}</td><td className="p-2">{l.debitoCodigo} — {contaInfo(l.debitoCodigo)?.descricao ?? "—"}</td><td className="p-2">{l.creditoCodigo} — {contaInfo(l.creditoCodigo)?.descricao ?? "—"}</td><td className="p-2 text-muted-foreground">{l.historico}</td><td className="p-2 text-right tabular-nums">{brl.format(l.valor)}</td></tr>)}</tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function FechamentoCompetenciaAberta({ competencia, quantidadeLancamentos, onFechar }: { competencia: Competencia; quantidadeLancamentos: number; onFechar: () => void }) {
  const fechada = competencia.status === "fechada";
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div><CardTitle className="text-base">Fechamento — {competencia.label}</CardTitle><CardDescription>Documentos → Lançamentos → Razão → Balancete/DRE → Fechamento.</CardDescription></div>
          <BadgeStatusCompetencia competencia={competencia} />
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p>{quantidadeLancamentos} lançamento(s) registrado(s) nesta competência.</p>
          {fechada ? (
            <p className="text-muted-foreground">Competência fechada — os números ficam preservados e nenhuma automação ou reclassificação altera este período. Para corrigir algo, trate como ajuste na competência seguinte.</p>
          ) : (
            <>
              <p className="text-muted-foreground">Quando a conferência estiver concluída, feche a competência para travar os números — inclusive para automações e reclassificações inteligentes.</p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => { if (window.confirm(`Fechar a competência ${competencia.label}? Depois de fechada, os lançamentos ficam travados para edição.`)) onFechar(); }}
                >
                  <Lock className="size-4" /> Fechar competência
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
