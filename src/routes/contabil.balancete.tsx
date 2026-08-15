import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { estruturaBalanceteNitaplast, type LinhaEstruturaBalancete } from "@/data/nitaplast-balancete-estrutura";
import { lancamentosIntegrados, totalCreditosIntegrados, totalDebitosIntegrados } from "@/data/nitaplast-razao-integrado";
import { resumoImplantacao, saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 100;
const grupos = ["Todos", "Ativo", "Passivo e PL", "Receitas", "Custos e despesas"] as const;

type LinhaCalculada = LinhaEstruturaBalancete & {
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  movimento: number;
  saldoAtual: number;
  lancamentos: number;
};

function pertenceAoGrupo(classificacao: string, grupo: (typeof grupos)[number]) {
  if (grupo === "Todos") return true;
  if (grupo === "Ativo") return classificacao === "1" || classificacao.startsWith("1.");
  if (grupo === "Passivo e PL") return classificacao === "2" || classificacao.startsWith("2.");
  if (grupo === "Receitas") return classificacao === "4" || classificacao.startsWith("4.");
  return classificacao === "5" || classificacao.startsWith("5.");
}

function descendente(analitica: LinhaEstruturaBalancete, sintetica: LinhaEstruturaBalancete) {
  return analitica.classificacao === sintetica.classificacao || analitica.classificacao.startsWith(`${sintetica.classificacao}.`);
}

function linhaZerada(linha: LinhaCalculada) {
  const epsilon = 0.005;
  return Math.abs(linha.saldoAnterior) < epsilon
    && Math.abs(linha.debitos) < epsilon
    && Math.abs(linha.creditos) < epsilon
    && Math.abs(linha.saldoAtual) < epsilon;
}

function BalancetePage() {
  useNitaplastJunho();
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<(typeof grupos)[number]>("Todos");
  const [somenteMovimento, setSomenteMovimento] = useState(false);
  const [mostrarZeradas, setMostrarZeradas] = useState(false);
  const [pagina, setPagina] = useState(1);

  const linhasCalculadas = useMemo<LinhaCalculada[]>(() => {
    const saldos = new Map(saldosImplantacao.map((linha) => [linha.conta, linha]));
    const movimentos = new Map<string, { debitos: number; creditos: number; lancamentos: number }>();

    for (const lancamento of lancamentosIntegrados) {
      const debito = movimentos.get(lancamento.debitoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      debito.debitos += lancamento.valor;
      debito.lancamentos += 1;
      movimentos.set(lancamento.debitoCodigo, debito);

      const credito = movimentos.get(lancamento.creditoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      credito.creditos += lancamento.valor;
      credito.lancamentos += 1;
      movimentos.set(lancamento.creditoCodigo, credito);
    }

    const analiticas = estruturaBalanceteNitaplast.filter((linha) => linha.tipo === "A");
    const valoresAnaliticos = new Map<string, { saldoAnterior: number; debitos: number; creditos: number; movimento: number; saldoAtual: number; lancamentos: number }>();

    for (const linha of analiticas) {
      const saldo = saldos.get(linha.conta);
      const movimentoConta = movimentos.get(linha.conta) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      const saldoAnterior = saldo ? (saldo.natureza === "C" ? -Math.abs(saldo.saldo) : Math.abs(saldo.saldo)) : 0;
      const movimento = movimentoConta.debitos - movimentoConta.creditos;
      valoresAnaliticos.set(linha.conta, {
        saldoAnterior,
        debitos: movimentoConta.debitos,
        creditos: movimentoConta.creditos,
        movimento,
        saldoAtual: saldoAnterior + movimento,
        lancamentos: movimentoConta.lancamentos,
      });
    }

    return estruturaBalanceteNitaplast.map((linha) => {
      if (linha.tipo === "A") {
        return {
          ...linha,
          ...(valoresAnaliticos.get(linha.conta) ?? { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 }),
        };
      }

      const acumulado = { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 };
      for (const analitica of analiticas) {
        if (!descendente(analitica, linha)) continue;
        const valor = valoresAnaliticos.get(analitica.conta);
        if (!valor) continue;
        acumulado.saldoAnterior += valor.saldoAnterior;
        acumulado.debitos += valor.debitos;
        acumulado.creditos += valor.creditos;
        acumulado.movimento += valor.movimento;
        acumulado.saldoAtual += valor.saldoAtual;
        acumulado.lancamentos += valor.lancamentos;
      }
      return { ...linha, ...acumulado };
    });
  }, []);

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    const correspondenciasAnaliticas = linhasCalculadas.filter((linha) => linha.tipo === "A" && (!q || [linha.conta, linha.classificacao, linha.descricao].join(" ").toLocaleLowerCase("pt-BR").includes(q)));

    return linhasCalculadas.filter((linha) => {
      if (!pertenceAoGrupo(linha.classificacao, grupo)) return false;
      if (!mostrarZeradas && linhaZerada(linha)) return false;
      if (somenteMovimento && linha.lancamentos === 0) return false;
      if (!q) return true;

      const corresponde = [linha.conta, linha.classificacao, linha.descricao, linha.tipo]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(q);

      return corresponde || (linha.tipo === "S" && correspondenciasAnaliticas.some((analitica) => descendente(analitica, linha)));
    });
  }, [busca, grupo, linhasCalculadas, somenteMovimento, mostrarZeradas]);

  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA;

  function abrirRazao(conta: string) {
    window.location.assign(`/contabil/razao?conta=${encodeURIComponent(conta)}`);
  }

  return <PageShell>
    <PageHeader
      titulo="Balancete completo - Nitaplast"
      descricao="Estrutura sintética e analítica do plano contábil, com saldo de implantação em 31/05 e movimento integrado de junho. Contas totalmente zeradas ficam ocultas por padrão."
      acoes={<Badge variant="outline">Matriz - 06/2026</Badge>}
    />

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric label="Ativo em 31/05" value={resumoImplantacao.ativo} />
      <Metric label="Passivo + PL em 31/05" value={resumoImplantacao.passivoPatrimonioLiquido} />
      <Metric label="Linhas do balancete" value={linhasCalculadas.filter((linha) => mostrarZeradas || !linhaZerada(linha)).length} />
      <Metric label="Débitos integrados 06" value={totalDebitosIntegrados} />
      <Metric label="Créditos integrados 06" value={totalCreditosIntegrados} />
    </div>

    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="flex items-start gap-3 pt-6">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-700" />
        <div>
          <p className="font-medium">Balancete hierárquico implantado</p>
          <p className="text-sm text-muted-foreground">As linhas S acumulam as contas A abaixo delas. Débitos {brl.format(totalDebitosIntegrados)} e créditos {brl.format(totalCreditosIntegrados)} permanecem equilibrados.</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Balancete - Débito, Crédito e Movimento</CardTitle>
            <CardDescription>Por padrão, não exibe contas sem saldo anterior, sem débito/crédito no período e com saldo atual zero.</CardDescription>
          </div>
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => { setBusca(event.target.value); setPagina(1); }}
              placeholder="Buscar conta, classificação ou descrição"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {grupos.map((item) => <button
            key={item}
            onClick={() => { setGrupo(item); setPagina(1); }}
            className={`rounded-md border px-3 py-1.5 text-xs ${grupo === item ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >{item}</button>)}

          <button
            onClick={() => { setSomenteMovimento((valor) => !valor); setPagina(1); }}
            className={`rounded-md border px-3 py-1.5 text-xs ${somenteMovimento ? "bg-amber-100 text-amber-900" : "bg-background"}`}
          >Somente com movimento</button>

          <button
            onClick={() => { setMostrarZeradas((valor) => !valor); setPagina(1); }}
            className={`rounded-md border px-3 py-1.5 text-xs ${mostrarZeradas ? "bg-slate-200 text-slate-900" : "bg-background"}`}
          >{mostrarZeradas ? "Ocultar contas zeradas" : "Exibir contas zeradas"}</button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <p className="mb-3 text-xs text-muted-foreground">{linhas.length} linhas exibidas. Contas sem saldo anterior, sem movimentação e com saldo atual zero estão ocultas.</p>
        <table className="w-full min-w-[1450px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs">
              <th className="p-2">Conta contábil</th>
              <th className="p-2 text-center">S/A</th>
              <th className="p-2">Classificação</th>
              <th className="p-2">Descrição</th>
              <th className="p-2 text-right">Saldo anterior</th>
              <th className="p-2 text-right">Débito</th>
              <th className="p-2 text-right">Crédito</th>
              <th className="p-2 text-right">Movimento</th>
              <th className="p-2 text-right">Saldo atual</th>
              <th className="p-2 text-right">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {linhas.slice(inicio, fim).map((linha) => <tr key={`${linha.tipo}-${linha.conta}-${linha.classificacao}`} className={classeLinha(linha)}>
              <td className="p-2 font-mono">{linha.conta}</td>
              <td className="p-2 text-center font-medium">{linha.tipo}</td>
              <td className="p-2 font-mono text-xs">{linha.classificacao}</td>
              <td className="p-2" style={{ paddingLeft: `${8 + Math.max(0, linha.nivel - 1) * 12}px` }}>{linha.descricao}</td>
              <Money value={linha.saldoAnterior} strong={linha.tipo === "S"} />
              <Money value={linha.debitos} />
              <Money value={linha.creditos} />
              <Money value={linha.movimento} />
              <Money value={linha.saldoAtual} strong />
              <td className="p-2 text-right">{linha.tipo === "A"
                ? <Button variant="outline" size="sm" onClick={() => abrirRazao(linha.conta)}>Abrir Razão</Button>
                : <span className="text-muted-foreground">—</span>}
              </td>
            </tr>)}
          </tbody>
        </table>
      </CardContent>

      <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">Exibindo {linhas.length ? inicio + 1 : 0}-{Math.min(fim, linhas.length)} de {linhas.length} linhas.</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</Button>
          <span className="text-xs">Página {paginaAtual} de {totalPaginas}</span>
          <Button variant="outline" size="sm" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Próxima</Button>
        </div>
      </CardContent>
    </Card>
  </PageShell>;
}

function classeLinha(linha: LinhaCalculada) {
  if (linha.tipo === "A") return "border-b last:border-0 bg-background";
  if (linha.nivel === 1) return "border-b bg-blue-200/80 font-bold";
  if (linha.nivel === 2) return "border-b bg-emerald-200/70 font-bold";
  if (linha.nivel === 3) return "border-b bg-emerald-100/70 font-bold";
  return "border-b bg-emerald-50 font-semibold";
}

function Money({ value, strong = false }: { value: number; strong?: boolean }) {
  const conteudo = value < 0 ? `(${brl.format(Math.abs(value))})` : value ? brl.format(value) : "-";
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{conteudo}</td>;
}

function Metric({ label, value }: { label: string; value: number }) {
  const display = Number.isInteger(value) && value < 10000 ? String(value) : brl.format(value);
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{display}</p></CardContent></Card>;
}
