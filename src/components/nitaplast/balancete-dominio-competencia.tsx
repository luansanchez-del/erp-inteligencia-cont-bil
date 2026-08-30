import { useMemo, useState } from "react";
import { AlertTriangle, Printer, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calcularBalanceteDominio } from "@/data/nitaplast-balancete-dominio-engine";
import { calcularBalanceteJulho } from "@/data/nitaplast-balancete-julho-engine";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
import { dreCompletaJunho } from "@/data/nitaplast-dre-completa";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { resumoPlanoDominio } from "@/data/nitaplast-plano-dominio";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { BalancetePrintSummary } from "@/components/balancete-print-summary";
import { resultadoExercicioMaio2026, saldoAnteriorResultadoJulho2026 } from "@/data/nitaplast-resultado-transportado";

const lucroLiquidoJunho2026 = dreCompletaJunho.find((linha) => linha.id === "lucro-liq")?.valor ?? 0;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 50;

export function BalanceteDominioCompetencia({ competencia }: { competencia: "2026-06" | "2026-07" }) {
  useNitaplastJunho();
  const junhoControle = useReclassificacoesInteligentes("2026-06");
  const julhoControle = useReclassificacoesInteligentes("2026-07");
  const junho = useMemo(() => junhoControle.aplicar(lancamentosIntegrados), [junhoControle.aplicar]);
  const julho = useMemo(() => julhoControle.aplicar(lancamentosIntegradosJulhoFinal), [julhoControle.aplicar]);
  const apuracao = useMemo(() => calcularBalanceteDominio(junho, competencia === "2026-07" ? julho : undefined), [competencia, julho, junho]);
  const motorJulho = useMemo(() => competencia === "2026-07" ? calcularBalanceteJulho(julho) : null, [competencia, julho]);
  const resultadoJulho = useMemo(() => competencia === "2026-07" ? calcularDreJulhoFinal(julho).dre : null, [competencia, julho]);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [soAnaliticas, setSoAnaliticas] = useState(false);
  const [soMovimento, setSoMovimento] = useState(false);
  const mes = competencia === "2026-06" ? "06/2026" : "07/2026";
  const periodo = competencia === "2026-06" ? "01/06/2026 a 30/06/2026" : "01/07/2026 a 31/07/2026";
  const pendencias = apuracao.pendencias;
  const pendentesUsadas = new Set(pendencias.map((item) => item.contaAtual));
  const nomesAtuais = new Map(saldosImplantacao.map((item) => [item.conta, item.descricao]));
  const filtradas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return apuracao.linhas.filter((linha) => (!soAnaliticas || linha.tipo === "A") && (!soMovimento || linha.lancamentos > 0) && (!q || `${linha.conta} ${linha.classificacao} ${linha.descricao}`.toLocaleLowerCase("pt-BR").includes(q)));
  }, [apuracao.linhas, busca, soAnaliticas, soMovimento]);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhas = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  return <>
    <PageHeader titulo={`Balancete — ${mes}`} descricao={`Mesmo plano de contas Domínio implantado em maio. Período ${periodo}.`} acoes={<Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><Printer className="size-4" />Imprimir / PDF</Button>} />
    {resultadoJulho ? <ResultadoCompetencia resultado={resultadoJulho} /> : null}
    <Card className="border-blue-500/30 bg-blue-500/5 print:hidden"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm"><div><strong>Estrutura Domínio preservada.</strong> Junho e julho usam os mesmos códigos, classificações e descrições do Balancete de maio; o plano atual fica somente como rastreio técnico.</div><Badge variant="outline">{resumoPlanoDominio.vinculadas} vínculos comprovados</Badge></CardContent></Card>
    {pendentesUsadas.size > 0 ? <Card className="border-amber-500/40 bg-amber-500/5 print:hidden"><CardContent className="pt-5 text-sm"><div className="flex gap-3"><AlertTriangle className="size-5 shrink-0 text-amber-700"/><div><strong>{pendentesUsadas.size} conta pós-implantação aguarda vínculo documental.</strong><p className="mt-1 text-muted-foreground">O movimento e o saldo estão incluídos nos totais contábeis, mas não foram encaixados artificialmente em outra conta Domínio. Código: {[...pendentesUsadas].join(", ")}.</p></div></div></CardContent></Card> : null}
    <Card className="print:border-0 print:shadow-none"><CardHeader className="print:px-0"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base">Balancete original completo — estrutura Domínio</CardTitle><CardDescription>Saldo anterior transportado, movimento da competência e saldo atual.</CardDescription></div><div className="flex w-full flex-wrap gap-2 sm:w-auto print:hidden"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9 sm:w-80" value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} placeholder="Buscar conta, classificação ou descrição"/></div><Button variant={soAnaliticas ? "default" : "outline"} onClick={() => { setSoAnaliticas((valor) => !valor); setPagina(1); }}>Somente analíticas</Button><Button variant={soMovimento ? "default" : "outline"} onClick={() => { setSoMovimento((valor) => !valor); setPagina(1); }}>Somente movimento</Button></div></div></CardHeader>
      <CardContent className="overflow-x-auto print:px-0 print:hidden"><table className="w-full min-w-[1200px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta Domínio</th><th className="p-2">S/A</th><th className="p-2">Classificação Domínio</th><th className="p-2">Descrição</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Movimento</th><th className="p-2 text-right">Saldo atual</th></tr></thead><tbody>{linhas.map((linha) => <LinhaTabela key={`${linha.conta}-${linha.classificacao}`} linha={linha} />)}</tbody></table></CardContent>
      {/* Só pra impressão/PDF: todas as linhas filtradas de uma vez, sem paginação — a tabela acima é limitada a 50 linhas por página na tela. */}
      <CardContent className="hidden print:block print:px-0"><table className="w-full text-sm print:text-[9px]"><thead><tr className="border-b bg-muted/40 text-left text-xs print:bg-white"><th className="p-2">Conta Domínio</th><th className="p-2">S/A</th><th className="p-2">Classificação Domínio</th><th className="p-2">Descrição</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Movimento</th><th className="p-2 text-right">Saldo atual</th></tr></thead><tbody>{filtradas.map((linha) => <LinhaTabela key={`${linha.conta}-${linha.classificacao}`} linha={linha} />)}</tbody></table><BalancetePrintSummary linhas={apuracao.linhas} {...(motorJulho ? { resultadoContabil: { saldoAnterior: saldoAnteriorResultadoJulho2026, movimentoMes: motorJulho.saldosAnaliticos.filter(x=>/^(4|5)(\.|$)/.test(x.classificacao)).reduce((s,x)=>s+x.movimento,0) } } : competencia === "2026-06" ? { resultadoContabil: { saldoAnterior: resultadoExercicioMaio2026, movimentoMes: -lucroLiquidoJunho2026 } } : {})}/></CardContent>
      <CardContent className="flex items-center justify-between border-t pt-4 print:hidden"><span className="text-xs text-muted-foreground">{filtradas.length} linhas encontradas</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={paginaAtual === 1} onClick={() => setPagina((valor) => valor - 1)}>Anterior</Button><span className="text-xs">Página {paginaAtual} de {totalPaginas}</span><Button size="sm" variant="outline" disabled={paginaAtual === totalPaginas} onClick={() => setPagina((valor) => valor + 1)}>Próxima</Button></div></CardContent>
    </Card>
    {pendencias.length ? <Card className="print:hidden"><CardHeader><CardTitle className="text-base">Conta pós-implantação — incluída na conferência</CardTitle><CardDescription>Movimento real preservado nos totais enquanto o vínculo definitivo com o plano Domínio é conferido.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs"><th className="p-2">Código atual</th><th className="p-2">Descrição atual</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Saldo atual</th></tr></thead><tbody>{pendencias.map((item) => <tr key={item.contaAtual} className="border-b"><td className="p-2 font-mono">{item.contaAtual}</td><td className="p-2">{nomesAtuais.get(item.contaAtual) ?? item.descricaoAtual}</td><Money valor={item.saldoAnterior}/><Money valor={item.debitos}/><Money valor={item.creditos}/><Money valor={item.saldoAtual}/></tr>)}</tbody></table></CardContent></Card> : null}
  </>;
}

function ResultadoCompetencia({ resultado }: { resultado: ReturnType<typeof calcularDreJulhoFinal>["dre"] }) {
  return (
    <Card className="print:hidden">
      <CardHeader><CardTitle className="text-base">Resultado contábil 07/2026</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Receita líquida" value={resultado.receitaLiquida} />
        <Metric label="CPV / CMV" value={resultado.custosReconhecidos} />
        <Metric label="Despesas operacionais" value={resultado.despesasReconhecidas} />
        <Metric label="Resultado operacional" value={resultado.receitaLiquida - resultado.custosReconhecidos - resultado.despesasReconhecidas + resultado.receitasFinanceiras} />
        <Metric label="Resultado na alienação" value={resultado.resultadoAlienacaoImobilizado} />
        <Metric label="Resultado contábil" value={resultado.resultado} />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{brl.format(value)}</p></CardContent></Card>;
}

function Money({ valor, strong = false }: { valor: number; strong?: boolean }) {
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{Math.abs(valor) < 0.005 ? "-" : valor < 0 ? `(${brl.format(Math.abs(valor))})` : brl.format(valor)}</td>;
}

type LinhaBalanceteDominio = ReturnType<typeof calcularBalanceteDominio>["linhas"][number];

function LinhaTabela({ linha }: { linha: LinhaBalanceteDominio }) {
  return (
    <tr className={`border-b ${linha.tipo === "S" ? "bg-muted/20 font-semibold print:bg-white" : ""}`}>
      <td className="p-2 font-mono">{linha.conta}</td>
      <td className="p-2">{linha.tipo}</td>
      <td className="p-2 font-mono text-xs">{linha.classificacao}</td>
      <td className="p-2">{linha.descricao}</td>
      <Money valor={linha.saldoAnterior} />
      <Money valor={linha.debitos} />
      <Money valor={linha.creditos} />
      <Money valor={linha.movimento} />
      <Money valor={linha.saldoAtual} strong />
    </tr>
  );
}
