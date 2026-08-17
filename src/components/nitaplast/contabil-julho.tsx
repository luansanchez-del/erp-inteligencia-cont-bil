import { useMemo, useState } from "react";
import { CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { estruturaBalanceteNitaplast, type LinhaEstruturaBalancete } from "@/data/nitaplast-balancete-estrutura";
import { estoqueFinalMatrizJulhoPorConta, estoqueFinalMatrizJulhoTotal } from "@/data/nitaplast-fechamento-julho";
import { composicaoResultadoJulho, dreParcialJulho } from "@/data/nitaplast-dre-julho";
import {
  diagnosticoFechamentoJulho,
  lancamentosIntegradosJulho,
  pendenciasRazaoJulho,
  totalCreditosJulho,
  totalDebitosJulho,
  valorEntradasMapeadasJulho,
  valorEntradasPendentesMapeamentoJulho,
} from "@/data/nitaplast-razao-julho";
import { saldoAberturaJulhoPorConta, saldosAberturaJulho } from "@/data/nitaplast-saldos-julho";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (valor: number) => Math.round(valor * 100) / 100;

type LinhaBalanceteJulho = LinhaEstruturaBalancete & {
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  movimento: number;
  saldoAtual: number;
  lancamentos: number;
};

function descendente(analitica: LinhaEstruturaBalancete, sintetica: LinhaEstruturaBalancete) {
  return analitica.classificacao === sintetica.classificacao || analitica.classificacao.startsWith(`${sintetica.classificacao}.`);
}

function calcularBalanceteJulho() {
  const movimentos = new Map<string, { debitos: number; creditos: number; lancamentos: number }>();
  for (const lancamento of lancamentosIntegradosJulho) {
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
  const valores = new Map<string, Omit<LinhaBalanceteJulho, keyof LinhaEstruturaBalancete>>();
  for (const linha of analiticas) {
    const movimento = movimentos.get(linha.conta) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
    const saldoAnterior = saldoAberturaJulhoPorConta.get(linha.conta) ?? 0;
    const liquido = arred(movimento.debitos - movimento.creditos);
    valores.set(linha.conta, {
      saldoAnterior,
      debitos: arred(movimento.debitos),
      creditos: arred(movimento.creditos),
      movimento: liquido,
      saldoAtual: arred(saldoAnterior + liquido),
      lancamentos: movimento.lancamentos,
    });
  }

  return estruturaBalanceteNitaplast.map<LinhaBalanceteJulho>((linha) => {
    if (linha.tipo === "A") {
      return { ...linha, ...(valores.get(linha.conta) ?? { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 }) };
    }
    const total = { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 };
    for (const analitica of analiticas) {
      if (!descendente(analitica, linha)) continue;
      const valor = valores.get(analitica.conta);
      if (!valor) continue;
      total.saldoAnterior += valor.saldoAnterior;
      total.debitos += valor.debitos;
      total.creditos += valor.creditos;
      total.movimento += valor.movimento;
      total.saldoAtual += valor.saldoAtual;
      total.lancamentos += valor.lancamentos;
    }
    return {
      ...linha,
      saldoAnterior: arred(total.saldoAnterior),
      debitos: arred(total.debitos),
      creditos: arred(total.creditos),
      movimento: arred(total.movimento),
      saldoAtual: arred(total.saldoAtual),
      lancamentos: total.lancamentos,
    };
  });
}

const balanceteJulho = calcularBalanceteJulho();

function HeaderJulho({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div><h1 className="text-xl font-semibold tracking-tight">{titulo}</h1><p className="mt-1 text-sm text-muted-foreground">{descricao}</p></div>
      <Badge variant="outline" className="border-amber-400 text-amber-800">PARCIAL · 07/2026 · EM FECHAMENTO</Badge>
    </div>
  );
}

function Metric({ label, value, money = true, warning = false }: { label: string; value: number; money?: boolean; warning?: boolean }) {
  return (
    <Card className={warning ? "border-amber-400/50" : undefined}>
      <CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? "text-amber-700" : ""}`}>{money ? brl.format(value) : value.toLocaleString("pt-BR")}</p></CardContent>
    </Card>
  );
}

function PendenciasJulho() {
  return (
    <Card className="border-amber-400/50 bg-amber-50/40">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div className="w-full">
            <p className="font-semibold">Fechamento ainda parcial — sem lançamentos de encaixe</p>
            <p className="mt-1 text-sm text-muted-foreground">Os valores abaixo permanecem visíveis como pendência. Nenhum deles foi lançado em conta genérica apenas para fechar o Balancete/DRE.</p>
            <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-3">
              <Pending label="Entradas sem mapeamento seguro" value={brl.format(diagnosticoFechamentoJulho.valorEntradasPendentesMapeamento)} />
              <Pending label="Diferença sem CC completo" value={brl.format(diagnosticoFechamentoJulho.valorSemCcCompleto)} />
              <Pending label="Créditos PIS a abrir" value={brl.format(diagnosticoFechamentoJulho.pisCreditosPendentesAbertura)} />
              <Pending label="Créditos COFINS a abrir" value={brl.format(diagnosticoFechamentoJulho.cofinsCreditosPendentesAbertura)} />
              <Pending label="ICMS matriz a classificar" value={brl.format(diagnosticoFechamentoJulho.icmsMatrizPendenteClassificacao)} />
              <Pending label="ICMS filial a classificar" value={brl.format(diagnosticoFechamentoJulho.icmsFilialPendenteClassificacao)} />
              <Pending label="Folha 07/2026" value="Documento não recebido" />
              <Pending label="Bancos / Clientes / Fornecedores" value="Em conciliação" />
              <Pending label="Estoque / CPV" value="Ajuste bloqueado até completar movimentos" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Fora desta etapa por decisão operacional: {diagnosticoFechamentoJulho.itensManuaisExcluidos.join(" · ")}.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Pending({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border bg-background p-3"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

export function BalanceteJulho() {
  const [busca, setBusca] = useState("");
  const [mostrarZeradas, setMostrarZeradas] = useState(false);
  const linhas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return balanceteJulho.filter((linha) => {
      const zero = Math.abs(linha.saldoAnterior) < 0.005 && Math.abs(linha.debitos) < 0.005 && Math.abs(linha.creditos) < 0.005 && Math.abs(linha.saldoAtual) < 0.005;
      if (!mostrarZeradas && zero) return false;
      if (!q) return true;
      return [linha.conta, linha.classificacao, linha.descricao].join(" ").toLocaleLowerCase("pt-BR").includes(q);
    });
  }, [busca, mostrarZeradas]);

  return (
    <div className="grid gap-5">
      <HeaderJulho titulo="Balancete consolidado — Nitaplast 07/2026" descricao="Saldo anterior calculado em 30/06/2026 + fatos contábeis já documentados de julho. A abertura é referência de cálculo, nunca lançamento no Razão." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Débitos já escriturados" value={totalDebitosJulho} />
        <Metric label="Créditos já escriturados" value={totalCreditosJulho} />
        <Metric label="Partidas no Razão" value={lancamentosIntegradosJulho.length} money={false} />
        <Metric label="Entradas/CC mapeadas" value={valorEntradasMapeadasJulho} />
        <Metric label="Entradas sem mapeamento" value={valorEntradasPendentesMapeamentoJulho} warning />
      </div>
      <PendenciasJulho />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle className="text-base">Balancete conta a conta — parcial</CardTitle><p className="mt-1 text-xs text-muted-foreground">O saldo atual muda exclusivamente pelos lançamentos existentes no Razão 07/2026.</p></div>
            <div className="flex w-full gap-2 sm:w-auto"><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Conta, classificação ou descrição" /></div><Button variant="outline" onClick={() => setMostrarZeradas((v) => !v)}>{mostrarZeradas ? "Ocultar zeradas" : "Exibir zeradas"}</Button></div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1350px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">S/A</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2 text-right">Saldo 30/06</th><th className="p-2 text-right">Débito 07</th><th className="p-2 text-right">Crédito 07</th><th className="p-2 text-right">Movimento</th><th className="p-2 text-right">Saldo atual</th><th className="p-2 text-right">Razão</th></tr></thead>
            <tbody>{linhas.map((linha) => <tr key={`${linha.tipo}-${linha.conta}-${linha.classificacao}`} className={`border-b ${linha.tipo === "S" ? "bg-muted/30 font-semibold" : ""}`}><td className="p-2 font-mono">{linha.conta}</td><td className="p-2">{linha.tipo}</td><td className="p-2 font-mono text-xs">{linha.classificacao}</td><td className="p-2" style={{ paddingLeft: 8 + Math.max(0, linha.nivel - 1) * 10 }}>{linha.descricao}</td><Money value={linha.saldoAnterior} /><Money value={linha.debitos} /><Money value={linha.creditos} /><Money value={linha.movimento} /><Money value={linha.saldoAtual} strong />
              <td className="p-2 text-right">{linha.tipo === "A" ? <Button variant="outline" size="sm" onClick={() => window.location.assign(`/contabil/razao?conta=${encodeURIComponent(linha.conta)}`)}>Abrir</Button> : "—"}</td></tr>)}</tbody></table>
        </CardContent>
      </Card>
      <Card><CardContent className="pt-5"><p className="font-medium">Inventário oficial 31/07 — alvo patrimonial, ainda sem lançamento de fechamento</p><div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{Object.entries(estoqueFinalMatrizJulhoPorConta).map(([conta, valor]) => <Pending key={conta} label={`Conta ${conta}`} value={brl.format(valor)} />)}<Pending label="Total" value={brl.format(estoqueFinalMatrizJulhoTotal)} /></div></CardContent></Card>
    </div>
  );
}

export function RazaoJulho() {
  const contaUrl = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("conta") ?? "";
  const [busca, setBusca] = useState("");
  const [conta, setConta] = useState(contaUrl);
  const linhas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return lancamentosIntegradosJulho.filter((linha) => {
      if (conta && linha.debitoCodigo !== conta && linha.creditoCodigo !== conta) return false;
      if (!q) return true;
      return [linha.id, linha.origem, linha.debito, linha.credito, linha.historico, linha.documento, linha.centroCusto].join(" ").toLocaleLowerCase("pt-BR").includes(q);
    });
  }, [busca, conta]);
  const saldoAnterior = conta ? saldoAberturaJulhoPorConta.get(conta) ?? 0 : 0;
  const movimentoConta = conta ? linhas.reduce((t, l) => t + (l.debitoCodigo === conta ? l.valor : 0) - (l.creditoCodigo === conta ? l.valor : 0), 0) : 0;

  return <div className="grid gap-5">
    <HeaderJulho titulo="Razão contábil — Nitaplast 07/2026" descricao="Partidas reais já formadas para julho. JCP, depreciação, juros, variação cambial e abertura não integram esta base." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Débitos" value={totalDebitosJulho} /><Metric label="Créditos" value={totalCreditosJulho} /><Metric label="Partidas" value={lancamentosIntegradosJulho.length} money={false} /><Metric label="Em revisão" value={pendenciasRazaoJulho} money={false} warning /><Metric label="Sem mapeamento" value={valorEntradasPendentesMapeamentoJulho} warning /></div>
    {conta ? <Card><CardContent className="grid gap-3 pt-5 sm:grid-cols-3"><Pending label="Conta filtrada" value={conta} /><Pending label="Saldo anterior 30/06" value={brl.format(saldoAnterior)} /><Pending label="Saldo após partidas exibidas" value={brl.format(arred(saldoAnterior + movimentoConta))} /></CardContent></Card> : null}
    <PendenciasJulho />
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="text-base">Partidas do Razão — 07/2026</CardTitle><div className="flex w-full gap-2 sm:w-auto"><select className="h-9 max-w-[280px] rounded-md border bg-background px-3 text-sm" value={conta} onChange={(e) => setConta(e.target.value)}><option value="">Todas as contas</option>{saldosAberturaJulho.map((c) => <option key={c.conta} value={c.conta}>{c.conta} — {c.descricao}</option>)}</select><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Histórico, documento, conta..." /></div></div></div></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1700px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">ID</th><th className="p-2">Data</th><th className="p-2">Origem</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico</th><th className="p-2">Documento</th><th className="p-2">CC</th><th className="p-2 text-right">Valor</th><th className="p-2">Rastreio</th><th className="p-2">Status</th></tr></thead><tbody>{linhas.map((linha) => <tr key={linha.id} className="border-b"><td className="p-2 font-mono text-xs">{linha.id}</td><td className="p-2">{linha.data}</td><td className="p-2">{linha.origem}</td><td className="p-2">{linha.debito}</td><td className="p-2">{linha.credito}</td><td className="p-2">{linha.historico}</td><td className="p-2 font-mono text-xs">{linha.documento}</td><td className="p-2">{linha.cc} — {linha.centroCusto}</td><Money value={linha.valor} /><td className="p-2">{linha.rastreio}</td><td className="p-2">{linha.status === "validado" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Validado</span> : <span className="inline-flex items-center gap-1 text-amber-700"><TriangleAlert className="size-4" />Revisar</span>}</td></tr>)}</tbody></table></CardContent></Card>
  </div>;
}

export function LancamentosJulho() {
  const [busca, setBusca] = useState("");
  const linhas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return lancamentosIntegradosJulho.filter((linha) => !q || [linha.id, linha.debito, linha.credito, linha.historico, linha.documento, linha.origem].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca]);
  return <div className="grid gap-5"><HeaderJulho titulo="Lançamentos — Nitaplast 07/2026" descricao="Partidas já escrituradas no Razão parcial. Exportação final permanece bloqueada enquanto existirem fontes estruturais pendentes." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Partidas" value={lancamentosIntegradosJulho.length} money={false} /><Metric label="Débitos" value={totalDebitosJulho} /><Metric label="Créditos" value={totalCreditosJulho} /><Metric label="Em revisão" value={pendenciasRazaoJulho} money={false} warning /><Metric label="Sem mapeamento" value={valorEntradasPendentesMapeamentoJulho} warning /></div><Card className="border-red-400/40 bg-red-50/30"><CardContent className="flex items-start gap-3 pt-5"><TriangleAlert className="mt-0.5 size-5 text-red-700" /><div><p className="font-semibold">CSV final bloqueado</p><p className="text-sm text-muted-foreground">Ainda faltam mapeamentos, folha, bancos/AR/AP, créditos federais e fechamento técnico do estoque. O sistema não considera este lote definitivo para importação no Questor.</p></div></CardContent></Card><PendenciasJulho /><Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">Partidas formadas</CardTitle><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar partida" /></div></div></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1450px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">ID</th><th className="p-2">Data</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">CC</th><th className="p-2">Documento</th><th className="p-2">Histórico</th><th className="p-2 text-right">Valor</th><th className="p-2">Status</th></tr></thead><tbody>{linhas.map((linha) => <tr key={linha.id} className="border-b"><td className="p-2 font-mono text-xs">{linha.id}</td><td className="p-2">{linha.data}</td><td className="p-2 font-mono">{linha.debitoCodigo}</td><td className="p-2 font-mono">{linha.creditoCodigo}</td><td className="p-2">{linha.cc}</td><td className="p-2">{linha.documento}</td><td className="p-2">{linha.historico}</td><Money value={linha.valor} /><td className="p-2">{linha.status}</td></tr>)}</tbody></table></CardContent></Card></div>;
}

export function DreJulho() {
  const linhas = [
    ["(+) Receita Operacional Bruta", dreParcialJulho.receitaBruta],
    ["(-) Devoluções", -dreParcialJulho.devolucoes],
    ["(-) ICMS sobre vendas", -dreParcialJulho.icms],
    ["(-) ICMS-ST", -dreParcialJulho.icmsSt],
    ["(-) IPI", -dreParcialJulho.ipi],
    ["(-) PIS", -dreParcialJulho.pis],
    ["(-) COFINS", -dreParcialJulho.cofins],
    ["(=) Receita Líquida Parcial", dreParcialJulho.receitaLiquida],
    ["(-) Custos reconhecidos no Razão até agora", -dreParcialJulho.custosReconhecidos],
    ["(-) Despesas reconhecidas no Razão até agora", -dreParcialJulho.despesasReconhecidas],
    ["(=) Resultado Parcial", dreParcialJulho.resultadoParcial],
  ] as const;
  return <div className="grid gap-5"><HeaderJulho titulo="DRE calculada parcial — Nitaplast 07/2026" descricao="Nasce exclusivamente do Razão de julho. Não existe DRE enviada de julho alimentando este cálculo e o resultado ainda não é fechamento final." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Receita bruta" value={dreParcialJulho.receitaBruta} /><Metric label="Deduções" value={dreParcialJulho.deducoes} /><Metric label="Receita líquida" value={dreParcialJulho.receitaLiquida} /><Metric label="Custos + despesas reconhecidos" value={dreParcialJulho.custosDespesasReconhecidos} /><Metric label="Resultado parcial" value={dreParcialJulho.resultadoParcial} warning /></div><PendenciasJulho /><Card><CardHeader><CardTitle className="text-base">DRE parcial derivada do Razão</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><tbody>{linhas.map(([descricao, valor], index) => <tr key={descricao} className={`border-b ${index === 0 || descricao.startsWith("(=") ? "font-semibold bg-muted/20" : ""}`}><td className="p-3">{descricao}</td><td className={`p-3 text-right tabular-nums ${valor < 0 ? "text-rose-700" : ""}`}>{brl.format(valor)}</td></tr>)}</tbody></table></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Composição de custos/despesas já reconhecidos</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">Centro de custo</th><th className="p-2 text-right">Valor</th><th className="p-2">Status</th></tr></thead><tbody>{composicaoResultadoJulho.map((linha) => <tr key={linha.id} className="border-b"><td className="p-2 font-mono">{linha.conta}</td><td className="p-2 font-mono text-xs">{linha.classificacao}</td><td className="p-2">{linha.descricao}</td><td className="p-2">{linha.cc} — {linha.centroCusto}</td><Money value={linha.valor} /><td className="p-2">{linha.status}</td></tr>)}</tbody></table></CardContent></Card></div>;
}

function Money({ value, strong = false }: { value: number; strong?: boolean }) {
  const texto = value < 0 ? `(${brl.format(Math.abs(value))})` : value ? brl.format(value) : "—";
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{texto}</td>;
}
