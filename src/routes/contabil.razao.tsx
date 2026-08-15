import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lancamentosJunho, totalCreditos, totalDebitos } from "@/data/nitaplast-junho";
import { movimentosFinanceiros } from "@/data/nitaplast-movimento-financeiro";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/razao")({ component: RazaoPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 100;
type Modo = "contabil" | "implantacao" | "financeiro";
type Status = "todos" | "validado" | "revisar";

function codigoInicial(texto: string) {
  return texto.match(/^\s*(\d+)\s+-/)?.[1] ?? null;
}

function RazaoPage() {
  useNitaplastJunho();
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<Modo>("contabil");
  const [status, setStatus] = useState<Status>("todos");
  const [origem, setOrigem] = useState("todas");
  const [contaSelecionada, setContaSelecionada] = useState("todas");
  const [pagina, setPagina] = useState(1);

  const codigosPlano = useMemo(() => new Set(saldosImplantacao.map((linha) => linha.conta)), []);
  const origens = useMemo(() => Array.from(new Set(lancamentosJunho.map((linha) => linha.origem))).sort(), []);

  const contabilFiltrado = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return lancamentosJunho.filter((linha) => {
      const correspondeBusca = !q || [linha.id, linha.origem, linha.debito, linha.credito, linha.historico].join(" ").toLocaleLowerCase("pt-BR").includes(q);
      const correspondeStatus = status === "todos" || linha.status === status;
      const correspondeOrigem = origem === "todas" || linha.origem === origem;
      const correspondeConta = contaSelecionada === "todas" || codigoInicial(linha.debito) === contaSelecionada || codigoInicial(linha.credito) === contaSelecionada;
      return correspondeBusca && correspondeStatus && correspondeOrigem && correspondeConta;
    });
  }, [busca, contaSelecionada, origem, status]);

  const implantacaoFiltrada = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return saldosImplantacao.filter((linha) => !q || [linha.conta, linha.classificacao, linha.descricao, linha.grupo].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca]);

  const financeiroFiltrado = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return movimentosFinanceiros.filter((linha) => !q || [linha.banco, linha.codigo, linha.historico, linha.classificacao].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca]);

  const dadosAtuais = modo === "contabil" ? contabilFiltrado : modo === "implantacao" ? implantacaoFiltrada : financeiroFiltrado;
  const totalPaginas = Math.max(1, Math.ceil(dadosAtuais.length / POR_PAGINA));
  const inicio = (Math.min(pagina, totalPaginas) - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA;
  const pendentes = lancamentosJunho.filter((linha) => linha.status === "revisar").length;
  const semVinculo = lancamentosJunho.filter((linha) => {
    const debito = codigoInicial(linha.debito);
    const credito = codigoInicial(linha.credito);
    return !debito || !credito || !codigosPlano.has(debito) || !codigosPlano.has(credito);
  }).length;

  const conta = contaSelecionada === "todas" ? null : saldosImplantacao.find((linha) => linha.conta === contaSelecionada);
  const movimentoConta = conta ? contabilFiltrado.reduce((saldo, linha) => {
    if (codigoInicial(linha.debito) === conta.conta) saldo.debitos += linha.valor;
    if (codigoInicial(linha.credito) === conta.conta) saldo.creditos += linha.valor;
    return saldo;
  }, { debitos: 0, creditos: 0 }) : null;

  function trocarModo(novoModo: Modo) {
    setModo(novoModo);
    setPagina(1);
    setBusca("");
  }

  return (
    <PageShell>
      <PageHeader titulo="Razão completo — Nitaplast" descricao="Saldo de implantação em 31/05/2026, lançamentos de junho e evidência financeira em uma única estrutura." acoes={<Badge variant="outline">Matriz • 06/2026</Badge>} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total de débitos de junho" value={totalDebitos} />
        <Metric label="Total de créditos de junho" value={totalCreditos} />
        <Metric label="Partidas pendentes" value={pendentes} warning />
        <Metric label="Partidas sem vínculo completo" value={semVinculo} warning />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle className="text-base">Consulta do Razão</CardTitle><CardDescription>Alterne entre escrituração, saldos de implantação e movimento financeiro original.</CardDescription></div>
            <div className="relative w-full sm:w-96"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} placeholder="Buscar conta, histórico, fornecedor ou banco" className="pl-9" /></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <ModeButton active={modo === "contabil"} onClick={() => trocarModo("contabil")}>Razão contábil</ModeButton>
            <ModeButton active={modo === "implantacao"} onClick={() => trocarModo("implantacao")}>Saldo de implantação</ModeButton>
            <ModeButton active={modo === "financeiro"} onClick={() => trocarModo("financeiro")}>Movimento financeiro original</ModeButton>
          </div>
        </CardHeader>

        {modo === "contabil" && (
          <CardContent className="grid gap-4">
            <div className="grid gap-2 md:grid-cols-3">
              <select value={contaSelecionada} onChange={(event) => { setContaSelecionada(event.target.value); setPagina(1); }} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="todas">Todas as contas</option>
                {saldosImplantacao.map((linha) => <option key={`${linha.conta}-${linha.classificacao}`} value={linha.conta}>{linha.conta} — {linha.descricao}</option>)}
              </select>
              <select value={origem} onChange={(event) => { setOrigem(event.target.value); setPagina(1); }} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="todas">Todas as origens</option>
                {origens.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={status} onChange={(event) => { setStatus(event.target.value as Status); setPagina(1); }} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="todos">Todos os status</option><option value="validado">Validado</option><option value="revisar">Revisar</option>
              </select>
            </div>

            {conta && movimentoConta && (
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Conta selecionada</p><p className="font-medium">{conta.conta} — {conta.descricao}</p></div>
                <div><p className="text-xs text-muted-foreground">Saldo em 31/05</p><p className="font-medium">{brl.format(Math.abs(conta.saldo))} {conta.natureza}</p></div>
                <div><p className="text-xs text-muted-foreground">Movimento localizado</p><p className="font-medium">D {brl.format(movimentoConta.debitos)} • C {brl.format(movimentoConta.creditos)}</p></div>
                <div><p className="text-xs text-muted-foreground">Vinculação</p><p className="font-medium">{movimentoConta.debitos + movimentoConta.creditos > 0 ? "Com movimento" : "Sem lançamento vinculado"}</p></div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px] text-sm">
                <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Lcto.</th><th className="p-2">Data</th><th className="p-2">Origem</th><th className="p-2">Conta débito</th><th className="p-2">Conta crédito</th><th className="p-2">Histórico</th><th className="p-2">Centro de custo</th><th className="p-2 text-right">Valor</th><th className="p-2 text-right">Vínculo</th><th className="p-2 text-right">Status</th></tr></thead>
                <tbody>{contabilFiltrado.slice(inicio, fim).map((linha) => {
                  const debito = codigoInicial(linha.debito);
                  const credito = codigoInicial(linha.credito);
                  const vinculado = !!debito && !!credito && codigosPlano.has(debito) && codigosPlano.has(credito);
                  return <tr key={linha.id} className="border-b last:border-0"><td className="p-2 font-mono text-xs">{linha.id}</td><td className="p-2">{linha.data}</td><td className="p-2"><Badge variant="outline">{linha.origem}</Badge></td><td className="p-2">{linha.debito}</td><td className="p-2">{linha.credito}</td><td className="p-2 text-muted-foreground">{linha.historico}</td><td className="p-2 text-amber-700">A classificar</td><td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td><td className="p-2 text-right">{vinculado ? <span className="text-emerald-700">Plano vinculado</span> : <span className="text-amber-700">Revisar conta</span>}</td><td className="p-2 text-right">{linha.status === "validado" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Validado</span> : <span className="inline-flex items-center gap-1 text-amber-700"><TriangleAlert className="size-4" />Revisar</span>}</td></tr>;
                })}</tbody>
              </table>
            </div>
          </CardContent>
        )}

        {modo === "implantacao" && (
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">Grupo</th><th className="p-2 text-right">Saldo 31/05</th><th className="p-2 text-center">Natureza</th></tr></thead><tbody>{implantacaoFiltrada.slice(inicio, fim).map((linha) => <tr key={`${linha.conta}-${linha.classificacao}`} className="border-b last:border-0"><td className="p-2 font-mono">{linha.conta}</td><td className="p-2 font-mono text-xs">{linha.classificacao}</td><td className="p-2">{linha.descricao}</td><td className="p-2 text-muted-foreground">{linha.grupo}</td><td className="p-2 text-right tabular-nums">{brl.format(Math.abs(linha.saldo))}</td><td className="p-2 text-center"><Badge variant="outline">{linha.natureza}</Badge></td></tr>)}</tbody></table>
          </CardContent>
        )}

        {modo === "financeiro" && (
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Data</th><th className="p-2">Banco</th><th className="p-2">Código</th><th className="p-2">Histórico original</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2">Classificação proposta</th></tr></thead><tbody>{financeiroFiltrado.slice(inicio, fim).map((linha) => <tr key={linha.id} className="border-b last:border-0"><td className="p-2">{linha.data}</td><td className="p-2 text-xs">{linha.banco}</td><td className="p-2 font-mono">{linha.codigo}</td><td className="p-2">{linha.historico}</td><td className="p-2 text-right tabular-nums">{linha.tipo === "debito" ? brl.format(linha.valor) : "—"}</td><td className="p-2 text-right tabular-nums">{linha.tipo === "credito" ? brl.format(linha.valor) : "—"}</td><td className="p-2 text-muted-foreground">{linha.classificacao}</td></tr>)}</tbody></table>
          </CardContent>
        )}

        <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">Exibindo {dadosAtuais.length ? inicio + 1 : 0}–{Math.min(fim, dadosAtuais.length)} de {dadosAtuais.length} registros.</p>
          <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</Button><span className="text-xs">Página {Math.min(pagina, totalPaginas)} de {totalPaginas}</span><Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Próxima</Button></div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className={`rounded-md border px-3 py-1.5 text-xs ${active ? "bg-primary text-primary-foreground" : "bg-background"}`}>{children}</button>;
}

function Metric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  const display = Number.isInteger(value) && value < 1000 ? String(value) : brl.format(value);
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? "text-amber-700" : ""}`}>{display}</p></CardContent></Card>;
}
