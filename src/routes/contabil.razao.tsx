import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { movimentosFinanceiros } from "@/data/nitaplast-movimento-financeiro";
import { lancamentosIntegrados, totalCreditosIntegrados, totalDebitosIntegrados } from "@/data/nitaplast-razao-integrado";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/razao")({ component: RazaoPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 100;
type Modo = "contabil" | "implantacao" | "financeiro";

function RazaoPage() {
  useNitaplastJunho();
  const contaUrl = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("conta");
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<Modo>("contabil");
  const [contaSelecionada, setContaSelecionada] = useState(contaUrl ?? "todas");
  const [origem, setOrigem] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);

  const contas = useMemo(() => [...saldosImplantacao].sort((a, b) => a.classificacao.localeCompare(b.classificacao, "pt-BR", { numeric: true })), []);
  const origens = useMemo(() => Array.from(new Set(lancamentosIntegrados.map((linha) => linha.origem))).sort(), []);
  const contabil = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return lancamentosIntegrados.filter((linha) => {
      const naConta = contaSelecionada === "todas" || linha.debitoCodigo === contaSelecionada || linha.creditoCodigo === contaSelecionada;
      const naOrigem = origem === "todas" || linha.origem === origem;
      const noStatus = status === "todos" || linha.status === status;
      const naBusca = !q || [linha.id, linha.debito, linha.credito, linha.historico, linha.documento, linha.centroCusto].join(" ").toLocaleLowerCase("pt-BR").includes(q);
      return naConta && naOrigem && noStatus && naBusca;
    });
  }, [busca, contaSelecionada, origem, status]);
  const implantacao = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return contas.filter((linha) => !q || [linha.conta, linha.classificacao, linha.descricao, linha.grupo].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca, contas]);
  const financeiro = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return movimentosFinanceiros.filter((linha) => !q || [linha.banco, linha.codigo, linha.historico, linha.classificacao].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca]);

  const dados = modo === "contabil" ? contabil : modo === "implantacao" ? implantacao : financeiro;
  const totalPaginas = Math.max(1, Math.ceil(dados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA;
  const pendentes = lancamentosIntegrados.filter((linha) => linha.status === "revisar").length;
  const conta = contaSelecionada === "todas" ? null : contas.find((linha) => linha.conta === contaSelecionada);
  const movimentoConta = conta ? lancamentosIntegrados.filter((linha) => linha.debitoCodigo === conta.conta || linha.creditoCodigo === conta.conta).reduce((total, linha) => ({ debitos: total.debitos + (linha.debitoCodigo === conta.conta ? linha.valor : 0), creditos: total.creditos + (linha.creditoCodigo === conta.conta ? linha.valor : 0), registros: total.registros + 1 }), { debitos: 0, creditos: 0, registros: 0 }) : null;

  function trocarModo(valor: Modo) { setModo(valor); setPagina(1); setBusca(""); }

  return <PageShell>
    <PageHeader titulo="Razão completo - Nitaplast" descricao="Junho vinculado ao plano contábil do balancete; maio usado somente como padrão para lançamentos recorrentes e centros de custo." acoes={<Badge variant="outline">Matriz - 06/2026</Badge>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total de débitos integrados" value={totalDebitosIntegrados} />
      <Metric label="Total de créditos integrados" value={totalCreditosIntegrados} />
      <Metric label="Lançamentos para revisar" value={pendentes} warning />
      <Metric label="Contas analíticas do plano" value={saldosImplantacao.length} />
    </div>
    <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="pt-5 text-sm"><strong>Critério aplicado:</strong> movimento bancário e folha são de junho; códigos e descrições vêm do balancete; razão anterior é referência apenas para depreciação, JCP e abertura de folha por centro de custo.</CardContent></Card>
    <Card>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">Consulta do Razão</CardTitle><CardDescription>O Balancete abre esta tela já filtrada na conta selecionada.</CardDescription></div><div className="relative w-full sm:w-96"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} placeholder="Buscar conta, histórico, documento ou centro de custo" className="pl-9" /></div></div><div className="flex flex-wrap gap-2 pt-2"><ModeButton active={modo === "contabil"} onClick={() => trocarModo("contabil")}>Razão contábil</ModeButton><ModeButton active={modo === "implantacao"} onClick={() => trocarModo("implantacao")}>Saldo de implantação</ModeButton><ModeButton active={modo === "financeiro"} onClick={() => trocarModo("financeiro")}>Movimento financeiro original</ModeButton></div></CardHeader>
      {modo === "contabil" && <CardContent className="grid gap-4">
        <div className="grid gap-2 md:grid-cols-3"><select value={contaSelecionada} onChange={(event) => { setContaSelecionada(event.target.value); setPagina(1); }} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="todas">Todas as contas</option>{contas.map((linha) => <option key={`${linha.conta}-${linha.classificacao}`} value={linha.conta}>{linha.conta} - {linha.descricao}</option>)}</select><select value={origem} onChange={(event) => { setOrigem(event.target.value); setPagina(1); }} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="todas">Todas as origens</option>{origens.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPagina(1); }} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="todos">Todos os status</option><option value="validado">Validado</option><option value="revisar">Revisar</option></select></div>
        {conta && movimentoConta && <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Conta selecionada</p><p className="font-medium">{conta.conta} - {conta.descricao}</p><p className="text-xs text-muted-foreground">{conta.classificacao}</p></div><div><p className="text-xs text-muted-foreground">Saldo em 31/05</p><p className="font-medium">{brl.format(Math.abs(conta.saldo))} {conta.natureza}</p></div><div><p className="text-xs text-muted-foreground">Movimento de junho</p><p className="font-medium">D {brl.format(movimentoConta.debitos)} - C {brl.format(movimentoConta.creditos)}</p></div><div><p className="text-xs text-muted-foreground">Vinculação</p><p className={movimentoConta.registros ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>{movimentoConta.registros ? `${movimentoConta.registros} lançamentos localizados` : "Sem movimento de junho"}</p></div></div>}
        <div className="overflow-x-auto"><table className="w-full min-w-[1550px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Lcto.</th><th className="p-2">Data</th><th className="p-2">Origem</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico original</th><th className="p-2">Documento</th><th className="p-2">Centro de custo</th><th className="p-2 text-right">Valor</th><th className="p-2 text-right">Status</th></tr></thead><tbody>{contabil.slice(inicio, fim).map((linha) => <tr key={linha.id} className="border-b last:border-0"><td className="p-2 font-mono text-xs">{linha.id}</td><td className="p-2">{linha.data}</td><td className="p-2"><Badge variant="outline">{linha.origem}</Badge></td><td className="p-2">{linha.debito}</td><td className="p-2">{linha.credito}</td><td className="max-w-[520px] p-2 text-muted-foreground">{linha.historico}</td><td className="p-2 font-mono text-xs">{linha.documento}</td><td className="p-2">{linha.cc} - {linha.centroCusto}</td><td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td><td className="p-2 text-right">{linha.status === "validado" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Validado</span> : <span title={linha.observacao} className="inline-flex items-center gap-1 text-amber-700"><TriangleAlert className="size-4" />Revisar</span>}</td></tr>)}</tbody></table></div>
      </CardContent>}
      {modo === "implantacao" && <CardContent className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">Grupo</th><th className="p-2 text-right">Saldo 31/05</th><th className="p-2 text-center">Natureza</th></tr></thead><tbody>{implantacao.slice(inicio, fim).map((linha) => <tr key={`${linha.conta}-${linha.classificacao}`} className="border-b last:border-0"><td className="p-2 font-mono">{linha.conta}</td><td className="p-2 font-mono text-xs">{linha.classificacao}</td><td className="p-2">{linha.descricao}</td><td className="p-2 text-muted-foreground">{linha.grupo}</td><td className="p-2 text-right tabular-nums">{linha.saldo ? brl.format(Math.abs(linha.saldo)) : "-"}</td><td className="p-2 text-center"><Badge variant="outline">{linha.natureza}</Badge></td></tr>)}</tbody></table></CardContent>}
      {modo === "financeiro" && <CardContent className="overflow-x-auto"><table className="w-full min-w-[1200px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Data</th><th className="p-2">Banco</th><th className="p-2">Código</th><th className="p-2">Histórico original</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2">Classificação</th></tr></thead><tbody>{financeiro.slice(inicio, fim).map((linha) => <tr key={linha.id} className="border-b last:border-0"><td className="p-2">{linha.data}</td><td className="p-2 font-mono">{linha.banco}</td><td className="p-2 font-mono">{linha.codigo}</td><td className="p-2">{linha.historico}</td><td className="p-2 text-right tabular-nums">{linha.tipo === "debito" ? brl.format(linha.valor) : "-"}</td><td className="p-2 text-right tabular-nums">{linha.tipo === "credito" ? brl.format(linha.valor) : "-"}</td><td className="p-2 text-muted-foreground">{linha.classificacao}</td></tr>)}</tbody></table></CardContent>}
      <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-muted-foreground">Exibindo {dados.length ? inicio + 1 : 0}-{Math.min(fim, dados.length)} de {dados.length} registros.</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</Button><span className="text-xs">Página {paginaAtual} de {totalPaginas}</span><Button variant="outline" size="sm" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Próxima</Button></div></CardContent>
    </Card>
  </PageShell>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button onClick={onClick} className={`rounded-md border px-3 py-1.5 text-xs ${active ? "bg-primary text-primary-foreground" : "bg-background"}`}>{children}</button>; }
function Metric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { const display = Number.isInteger(value) && value < 10000 ? String(value) : brl.format(value); return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? "text-amber-700" : ""}`}>{display}</p></CardContent></Card>; }
