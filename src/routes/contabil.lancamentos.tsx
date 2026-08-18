import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Pencil, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { gerarCsvLoteContabilJunho, montarLoteContabilJunho } from "@/data/nitaplast-lote-final-junho";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useAjustesLancamentos, type DadosLancamentoManual } from "@/hooks/use-ajustes-lancamentos";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

export const Route = createFileRoute("/contabil/lancamentos")({ component: Lancamentos });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
type FiltroStatus = "todos" | "alerta" | "pendente";
type ModoEditor = "novo" | "editar";

type FormLancamento = {
  data: string;
  debitoCodigo: string;
  creditoCodigo: string;
  historico: string;
  documento: string;
  cc: string;
  centroCusto: string;
  valor: string;
  motivo: string;
};

const planoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));

const formInicial: FormLancamento = {
  data: "30/06/2026",
  debitoCodigo: "",
  creditoCodigo: "",
  historico: "",
  documento: "",
  cc: "0",
  centroCusto: "SEM CENTRO DE CUSTO",
  valor: "",
  motivo: "",
};

function parseValor(valor: string) {
  const texto = valor.trim();
  if (!texto) return Number.NaN;
  return Number(texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
}

function Lancamentos() {
  useNitaplastJunho();
  const { aplicar } = useReclassificacoesInteligentes("2026-06");
  const { ajustes, registrarNovo, registrarEdicao, registrarExclusao } = useAjustesLancamentos("2026-06");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [editorAberto, setEditorAberto] = useState(false);
  const [modoEditor, setModoEditor] = useState<ModoEditor>("novo");
  const [alvoId, setAlvoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormLancamento>(formInicial);
  const [erroEditor, setErroEditor] = useState<string | null>(null);

  // EXATAMENTE A MESMA BASE DO BALANCETE E DA DRE OFICIAL.
  // O hook `aplicar` inclui reclassificações e os ajustes manuais auditáveis.
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegrados), [aplicar]);
  const lote = useMemo(() => montarLoteContabilJunho(razaoAjustado), [razaoAjustado]);
  const resumo = lote.resumo;

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return lote.linhas.filter((linha) => {
      if (filtroStatus !== "todos" && linha.status !== filtroStatus) return false;
      if (!q) return true;
      return [linha.seq, linha.data, linha.debito, linha.credito, linha.ccDebito, linha.ccCredito, linha.documento, linha.historico, linha.lancamentoId, linha.origem]
        .join(" ").toLocaleLowerCase("pt-BR").includes(q);
    });
  }, [busca, filtroStatus, lote.linhas]);

  function baixarCsv() {
    const conteudo = gerarCsvLoteContabilJunho(lote.prontas);
    const blob = new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Nitaplast_062026_Lancamentos_CC.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function abrirNovo() {
    setModoEditor("novo");
    setAlvoId(null);
    setForm(formInicial);
    setErroEditor(null);
    setEditorAberto(true);
  }

  function abrirEditar(lancamentoId: string) {
    const linha = razaoAjustado.find((item) => item.id === lancamentoId);
    if (!linha) return;
    setModoEditor("editar");
    setAlvoId(linha.id);
    setForm({
      data: linha.data,
      debitoCodigo: linha.debitoCodigo,
      creditoCodigo: linha.creditoCodigo,
      historico: linha.historico,
      documento: linha.documento,
      cc: linha.cc,
      centroCusto: linha.centroCusto,
      valor: linha.valor.toFixed(2).replace(".", ","),
      motivo: "",
    });
    setErroEditor(null);
    setEditorAberto(true);
  }

  function salvarEditor() {
    try {
      const dados: DadosLancamentoManual = {
        data: form.data.trim(),
        debitoCodigo: form.debitoCodigo.trim(),
        creditoCodigo: form.creditoCodigo.trim(),
        historico: form.historico.trim(),
        documento: form.documento.trim(),
        cc: form.cc.trim() || "0",
        centroCusto: form.centroCusto.trim() || "SEM CENTRO DE CUSTO",
        valor: parseValor(form.valor),
      };
      if (modoEditor === "novo") registrarNovo(dados, form.motivo);
      else if (alvoId) registrarEdicao(alvoId, dados, form.motivo);
      setEditorAberto(false);
      setForm(formInicial);
      setAlvoId(null);
      setErroEditor(null);
    } catch (erro) {
      setErroEditor(erro instanceof Error ? erro.message : "Não foi possível salvar o lançamento.");
    }
  }

  function excluirLancamento(lancamentoId: string) {
    const linha = razaoAjustado.find((item) => item.id === lancamentoId);
    if (!linha) return;
    const confirmou = window.confirm(`Excluir contabilmente o lançamento ${lancamentoId}?\n\nA origem será preservada e o ERP criará um estorno auditável, sem apagar o documento original.`);
    if (!confirmou) return;
    const motivo = window.prompt("Informe o motivo da exclusão:", "Exclusão solicitada pelo usuário");
    if (motivo === null) return;
    registrarExclusao(lancamentoId, motivo);
  }

  return (
    <PageShell>
      <PageHeader
        titulo="Lançamentos finais — Nitaplast"
        descricao="O lote é o espelho do mesmo Razão que alimenta o Balancete e a DRE Oficial. Competência 06/2026."
        acoes={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={abrirNovo}>
              <Plus className="size-4" /> Novo lançamento
            </Button>
            <Button size="sm" className="gap-2" onClick={baixarCsv} disabled={!resumo.podeFinalizar}>
              <Download className="size-4" /> Gerar CSV final
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Partidas do Razão" value={resumo.totalPartidas} />
        <Metric label="Prontas" value={resumo.prontas} />
        <Metric label="Alertas exportáveis" value={resumo.alertas} warning={resumo.alertas > 0} />
        <Metric label="Pendências bloqueantes" value={resumo.pendentes} danger={resumo.pendentes > 0} />
        <Metric label="Valor das partidas" value={resumo.valorTotal} money />
        <Metric label="Ajustes manuais" value={ajustes.length} warning={ajustes.length > 0} />
      </div>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-5 text-sm">
          <strong>Novo, editar e excluir são ações contábeis auditáveis.</strong> Um lançamento importado nunca é apagado silenciosamente: editar gera estorno + nova partida; excluir gera estorno. Assim a alteração repercute no mesmo Razão usado por Balancete e DRE, preservando a referência original.
        </CardContent>
      </Card>

      {editorAberto ? (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{modoEditor === "novo" ? "Novo lançamento" : `Editar ${alvoId}`}</CardTitle>
              <CardDescription>Preencha a partida real. Não use esta função para abertura gerencial ou ajuste de encaixe.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setEditorAberto(false)} aria-label="Fechar editor"><X className="size-4" /></Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Campo label="Data" value={form.data} onChange={(value) => setForm((atual) => ({ ...atual, data: value }))} placeholder="30/06/2026" />
              <Campo label="Conta débito" value={form.debitoCodigo} onChange={(value) => setForm((atual) => ({ ...atual, debitoCodigo: value }))} detalhe={planoPorConta.get(form.debitoCodigo)} placeholder="Ex.: 25107" />
              <Campo label="Conta crédito" value={form.creditoCodigo} onChange={(value) => setForm((atual) => ({ ...atual, creditoCodigo: value }))} detalhe={planoPorConta.get(form.creditoCodigo)} placeholder="Ex.: 25253" />
              <Campo label="Valor" value={form.valor} onChange={(value) => setForm((atual) => ({ ...atual, valor: value }))} placeholder="0,00" />
              <Campo label="Centro de custo" value={form.cc} onChange={(value) => setForm((atual) => ({ ...atual, cc: value }))} placeholder="Ex.: 902" />
              <Campo label="Descrição do CC" value={form.centroCusto} onChange={(value) => setForm((atual) => ({ ...atual, centroCusto: value }))} placeholder="DESPESAS FINANCEIRAS" />
              <Campo label="Documento" value={form.documento} onChange={(value) => setForm((atual) => ({ ...atual, documento: value }))} placeholder="Documento/evidência" />
              <Campo label="Motivo da ação" value={form.motivo} onChange={(value) => setForm((atual) => ({ ...atual, motivo: value }))} placeholder="Por que este lançamento está sendo criado/alterado?" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Histórico</label>
              <textarea
                value={form.historico}
                onChange={(e) => setForm((atual) => ({ ...atual, historico: e.target.value }))}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Histórico contábil completo"
              />
            </div>
            {erroEditor ? <div className="rounded-md border border-red-400 bg-red-500/5 p-3 text-sm text-red-700">{erroEditor}</div> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditorAberto(false)}>Cancelar</Button>
              <Button onClick={salvarEditor}>{modoEditor === "novo" ? "Fazer lançamento" : "Salvar alteração"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {ajustes.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Auditoria de ações manuais</CardTitle><CardDescription>Últimas ações registradas nesta competência.</CardDescription></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {[...ajustes].reverse().slice(0, 5).map((ajuste) => (
              <div key={ajuste.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0">
                <div><Badge variant="outline">{ajuste.acao}</Badge> <span className="ml-2 font-mono text-xs">{ajuste.lancamentoAlvoId || `MAN-${ajuste.id}`}</span><div className="mt-1 text-xs text-muted-foreground">{ajuste.motivo}</div></div>
                <span className="text-xs text-muted-foreground">{new Date(ajuste.criadoEm).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {resumo.podeFinalizar ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="pt-5 text-sm">
            <strong>Lote apto para exportação.</strong> Ele contém o mesmo Razão ajustado usado no Balancete e na DRE Oficial. Alertas, inclusive a conta transitória 4859, são exportáveis e permanecem identificados para revisão posterior.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="flex gap-3 pt-5 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-700" />
            <div><strong>Exportação bloqueada.</strong> Existem erros estruturais reais: conta inexistente, dado obrigatório inválido ou conta de resultado sem destino na DRE. Alertas de revisão e uso da 4859 não bloqueiam.</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button size="sm" variant={filtroStatus === "todos" ? "default" : "outline"} onClick={() => setFiltroStatus("todos")}>Todos</Button>
              <Button size="sm" variant={filtroStatus === "alerta" ? "default" : "outline"} onClick={() => setFiltroStatus("alerta")}>Alertas</Button>
              <Button size="sm" variant={filtroStatus === "pendente" ? "default" : "outline"} onClick={() => setFiltroStatus("pendente")}>Bloqueantes</Button>
            </div>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conta, documento ou histórico" className="pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1750px] text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">SEQ</th><th className="p-2">Data</th><th className="p-2">Débito</th><th className="p-2">CC Débito</th><th className="p-2">Crédito</th><th className="p-2">CC Crédito</th><th className="p-2">N. Docto</th><th className="p-2 text-right">Valor</th><th className="p-2">Histórico</th><th className="p-2">Origem Razão</th><th className="p-2">Status</th><th className="p-2">Ações</th>
              </tr></thead>
              <tbody>{linhas.map((linha) => <tr key={`${linha.lancamentoId}-${linha.seq}`} className="border-b last:border-0">
                <td className="p-2 font-mono">{linha.seq}</td>
                <td className="p-2">{linha.data}</td>
                <td className="p-2 font-mono">{linha.debito}</td>
                <td className="p-2 font-mono">{linha.ccDebito || "—"}</td>
                <td className="p-2 font-mono">{linha.credito}</td>
                <td className="p-2 font-mono">{linha.ccCredito || "—"}</td>
                <td className="p-2 font-mono text-xs">{linha.documento || "—"}</td>
                <td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td>
                <td className="max-w-[420px] p-2">{linha.historico}</td>
                <td className="p-2"><div className="font-mono text-xs">{linha.lancamentoId}</div><div className="text-[11px] text-muted-foreground">{linha.origem}</div></td>
                <td className="p-2">
                  {linha.status === "pronto" ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Pronto</Badge>
                  ) : linha.status === "alerta" ? (
                    <div><Badge variant="outline" className="border-amber-400 text-amber-800">Alerta · exportável</Badge><div className="mt-1 max-w-[300px] text-[11px] text-amber-800">{linha.alertas.join(" · ")}</div></div>
                  ) : (
                    <div><Badge variant="outline" className="border-red-400 text-red-800">Bloqueante</Badge><div className="mt-1 max-w-[300px] text-[11px] text-red-800">{linha.pendencias.join(" · ")}</div></div>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => abrirEditar(linha.lancamentoId)}><Pencil className="size-3.5" /> Editar</Button>
                    <Button size="sm" variant="outline" className="gap-1 text-red-700" onClick={() => excluirLancamento(linha.lancamentoId)}><Trash2 className="size-3.5" /> Excluir</Button>
                  </div>
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Campo({ label, value, onChange, placeholder, detalhe }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; detalhe?: string }) {
  return <div><label className="mb-1 block text-xs font-medium">{label}</label><Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />{detalhe ? <p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p> : null}</div>;
}

function Metric({ label, value, money = false, warning = false, danger = false }: { label: string; value: number; money?: boolean; warning?: boolean; danger?: boolean }) {
  const display = money ? brl.format(value) : String(value);
  const border = danger ? "border-red-500/40" : warning ? "border-amber-500/40" : "";
  const text = danger ? "text-red-700" : warning ? "text-amber-700" : "";
  return <Card className={border}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${text}`}>{display}</p></CardContent></Card>;
}
