import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, Search } from "lucide-react";
import { ReclassificacaoInteligente } from "@/components/reclassificacao-inteligente";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { estruturaBalanceteNitaplast } from "@/data/nitaplast-balancete-estrutura";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
import { saldoAberturaJulhoPorConta } from "@/data/nitaplast-saldos-julho";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import type { LancamentoIntegrado } from "@/data/nitaplast-razao-base";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (valor: number) => Math.round(valor * 100) / 100;

function chaveData(data: string) {
  const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : data;
}

function correspondeBusca(linha: LancamentoIntegrado, busca: string) {
  const q = busca.trim().toLocaleLowerCase("pt-BR");
  if (!q) return true;
  return [
    linha.id,
    linha.origem,
    linha.historico,
    linha.documento,
    linha.debito,
    linha.credito,
    linha.cc,
    linha.centroCusto,
    linha.fonte,
  ].join(" ").toLocaleLowerCase("pt-BR").includes(q);
}

function Cabecalho() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Razão contábil - Nitaplast 07/2026</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O saldo anterior é apresentado no livro apenas como transporte. Somente fatos contábeis reais compõem as partidas da competência.
        </p>
      </div>
      <Badge variant="outline">Consolidado · 07/2026</Badge>
    </div>
  );
}

function Metric({ label, value, money = true }: { label: string; value: number; money?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{money ? brl.format(value) : value.toLocaleString("pt-BR")}</p>
      </CardContent>
    </Card>
  );
}

export function RazaoJulhoLivro() {
  const contaUrl = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("conta") ?? "";
  const { aplicar, registrar, reclassificacoes } = useReclassificacoesInteligentes("2026-07");
  const razao = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const resultado = useMemo(() => calcularDreJulhoFinal(razao).dre, [razao]);
  const contas = useMemo(
    () => estruturaBalanceteNitaplast
      .filter((item) => item.tipo === "A")
      .sort((a, b) => a.classificacao.localeCompare(b.classificacao, "pt-BR", { numeric: true }) || a.conta.localeCompare(b.conta)),
    [],
  );

  const [contaCodigo, setContaCodigo] = useState(contaUrl);
  const [busca, setBusca] = useState("");
  const conta = contaCodigo ? contas.find((item) => item.conta === contaCodigo) ?? null : null;
  const contaInexistente = Boolean(contaCodigo && !conta);
  const abertura = conta ? saldoAberturaJulhoPorConta.get(conta.conta) ?? 0 : 0;

  const movimentosConta = useMemo(() => {
    if (!conta) return [];
    return razao
      .filter((linha) => linha.debitoCodigo === conta.conta || linha.creditoCodigo === conta.conta)
      .sort((a, b) => chaveData(a.data).localeCompare(chaveData(b.data)) || a.id.localeCompare(b.id));
  }, [conta, razao]);

  const movimentosComSaldo = useMemo(() => {
    let saldo = abertura;
    return movimentosConta.map((linha) => {
      const debito = linha.debitoCodigo === conta?.conta ? linha.valor : 0;
      const credito = linha.creditoCodigo === conta?.conta ? linha.valor : 0;
      saldo = arred(saldo + debito - credito);
      return { linha, debito, credito, saldo };
    });
  }, [abertura, conta, movimentosConta]);

  const movimentosVisiveis = useMemo(
    () => movimentosComSaldo.filter(({ linha }) => correspondeBusca(linha, busca)),
    [busca, movimentosComSaldo],
  );

  const todosVisiveis = useMemo(
    () => razao.filter((linha) => correspondeBusca(linha, busca)),
    [busca, razao],
  );

  const debitos = arred(movimentosConta.reduce((total, linha) => total + (linha.debitoCodigo === conta?.conta ? linha.valor : 0), 0));
  const creditos = arred(movimentosConta.reduce((total, linha) => total + (linha.creditoCodigo === conta?.conta ? linha.valor : 0), 0));
  const saldoAtual = arred(abertura + debitos - creditos);

  return (
    <div className="grid gap-5">
      <Cabecalho />

      <ResultadoCompetencia resultado={resultado} />

      {conta ? (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Conta selecionada</p>
          <p className="mt-1 text-base font-semibold">{conta.conta} - {conta.descricao}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">Classificação {conta.classificacao}</p>
        </div>
      ) : contaInexistente ? (
        <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Conta não encontrada no plano.</strong> O código {contaCodigo} não será tratado como conta contábil nem receberá descrição inventada.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Partidas da conta" value={conta ? movimentosConta.length : razao.length} money={false} />
        <Metric label="Saldo anterior" value={abertura} />
        <Metric label="Débitos da competência" value={conta ? debitos : arred(razao.reduce((s, x) => s + x.valor, 0))} />
        <Metric label="Créditos da competência" value={conta ? creditos : arred(razao.reduce((s, x) => s + x.valor, 0))} />
        <Metric label="Saldo atual" value={saldoAtual} />
      </div>

      <Card className="border-sky-500/40 bg-sky-50/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm">
          <span><strong>Ações contábeis:</strong> reclassificações e lançamentos manuais permanecem auditáveis. Saldo anterior transportado nunca é gravado como partida.</span>
          <Button variant="outline" size="sm" onClick={() => window.location.assign("/contabil/lancamentos")}>
            Abrir Lançamentos contábeis <ExternalLink className="ml-2 size-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="grid gap-3 md:grid-cols-[minmax(280px,420px)_1fr]">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Conta contábil
              <select
                value={contaCodigo}
                onChange={(event) => setContaCodigo(event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Todas as contas</option>
                {contas.map((item) => <option key={`${item.conta}-${item.classificacao}`} value={item.conta}>{item.conta} - {item.descricao}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Buscar dentro do Razão
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input className="pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Histórico, documento, origem, CC..." />
              </div>
            </label>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {conta ? (
            <table className="w-full min-w-[1500px] text-xs">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="p-2">Data</th>
                  <th className="p-2">Lançamento / origem</th>
                  <th className="p-2">Histórico / documento</th>
                  <th className="p-2">Contrapartida</th>
                  <th className="p-2">CC</th>
                  <th className="p-2 text-right">Débito</th>
                  <th className="p-2 text-right">Crédito</th>
                  <th className="p-2 text-right">Saldo</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-slate-50 font-medium">
                  <td className="p-2 whitespace-nowrap">30/06/2026</td>
                  <td className="p-2" colSpan={2}>
                    <p>Saldo anterior transportado</p>
                    <p className="text-[10px] font-normal text-muted-foreground">Linha informativa do livro. Não é lançamento contábil.</p>
                  </td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2 text-right">—</td>
                  <td className="p-2 text-right">—</td>
                  <td className="p-2 text-right font-semibold tabular-nums">{brl.format(abertura)}</td>
                  <td className="p-2">Transportado</td>
                  <td className="p-2 text-right">—</td>
                </tr>

                {movimentosVisiveis.map(({ linha, debito, credito, saldo }) => {
                  const contrapartida = linha.debitoCodigo === conta.conta ? linha.credito : linha.debito;
                  return (
                    <tr key={linha.id} className="border-b align-top">
                      <td className="p-2 whitespace-nowrap">{linha.data}</td>
                      <td className="p-2"><p className="font-mono font-medium">{linha.id}</p><p className="text-[10px] text-muted-foreground">{linha.origem}</p></td>
                      <td className="max-w-[420px] p-2"><p>{linha.historico}</p><p className="text-[10px] text-muted-foreground">{linha.documento} · {linha.fonte}</p></td>
                      <td className="p-2">{contrapartida}</td>
                      <td className="p-2"><span className="font-mono">{linha.cc}</span><br />{linha.centroCusto}</td>
                      <td className="p-2 text-right tabular-nums">{debito ? brl.format(debito) : "—"}</td>
                      <td className="p-2 text-right tabular-nums">{credito ? brl.format(credito) : "—"}</td>
                      <td className="p-2 text-right font-semibold tabular-nums">{brl.format(saldo)}</td>
                      <td className="p-2">{linha.status === "validado" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Validado</span> : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />Revisar</span>}</td>
                      <td className="p-2 text-right"><ReclassificacaoInteligente lancamento={linha} onRegistrar={registrar} /></td>
                    </tr>
                  );
                })}

                {movimentosConta.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-5 text-center text-sm text-muted-foreground">
                      Nenhuma movimentação na competência. O saldo atual é exclusivamente o saldo anterior transportado de {brl.format(abertura)}.
                    </td>
                  </tr>
                ) : movimentosVisiveis.length === 0 ? (
                  <tr><td colSpan={10} className="p-5 text-center text-sm text-muted-foreground">Nenhum lançamento desta conta corresponde à busca.</td></tr>
                ) : null}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1700px] text-xs">
              <thead><tr className="border-b bg-muted text-left"><th className="p-2">Data</th><th className="p-2">ID / Origem</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico / Documento</th><th className="p-2">CC</th><th className="p-2 text-right">Valor</th><th className="p-2">Status</th><th className="p-2 text-right">Ações</th></tr></thead>
              <tbody>
                {todosVisiveis.map((linha) => (
                  <tr key={linha.id} className="border-b align-top">
                    <td className="p-2 whitespace-nowrap">{linha.data}</td>
                    <td className="p-2"><p className="font-mono font-medium">{linha.id}</p><p className="text-[10px] text-muted-foreground">{linha.origem}</p></td>
                    <td className="p-2">{linha.debito}</td>
                    <td className="p-2">{linha.credito}</td>
                    <td className="max-w-[420px] p-2"><p>{linha.historico}</p><p className="text-[10px] text-muted-foreground">{linha.documento} · {linha.fonte}</p></td>
                    <td className="p-2"><span className="font-mono">{linha.cc}</span><br />{linha.centroCusto}</td>
                    <td className="p-2 text-right font-semibold tabular-nums">{brl.format(linha.valor)}</td>
                    <td className="p-2">{linha.status === "validado" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Validado</span> : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />Revisar</span>}</td>
                    <td className="p-2 text-right"><ReclassificacaoInteligente lancamento={linha} onRegistrar={registrar} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Regra do livro: saldo anterior é transportado da competência anterior para apresentação e cálculo do saldo, mas não compõe a quantidade de partidas nem gera débito/crédito na competência atual. Reclassificações: {reclassificacoes.length}.
      </p>
    </div>
  );
}

function ResultadoCompetencia({ resultado }: { resultado: ReturnType<typeof calcularDreJulhoFinal>["dre"] }) {
  return (
    <Card>
      <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Receita líquida" value={resultado.receitaLiquida} />
        <Metric label="CPV / CMV" value={resultado.custosReconhecidos} />
        <Metric label="Despesas operacionais" value={resultado.despesasReconhecidas} />
        <Metric label="Resultado operacional" value={arred(resultado.receitaLiquida - resultado.custosReconhecidos - resultado.despesasReconhecidas + resultado.receitasFinanceiras)} />
        <Metric label="Resultado na alienação" value={resultado.resultadoAlienacaoImobilizado} />
        <Metric label="Resultado contábil" value={resultado.resultado} />
      </CardContent>
    </Card>
  );
}
