import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, ChevronRight, CircleAlert, ExternalLink, ListTree } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { cadastroFiscalNitaplast, dreCompletaJunho, receitaBrutaJunho } from "@/data/nitaplast-dre-completa";
import { composicaoDrePorConta, depreciacaoContaAConta, totalDepreciacaoPrevisto } from "@/data/nitaplast-dre-contas";
import { depreciacoes } from "@/data/nitaplast-razao-integrado";

const valoresComCodigo = new Set<number>(depreciacaoContaAConta.map((conta) => conta.valor));
const depreciacaoSemCodigo = depreciacoes.filter(([, , valor]) => !valoresComCodigo.has(valor));

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const idsComComposicao = [...new Set(composicaoDrePorConta.map((conta) => conta.grupoId))];

function DrePage() {
  useNitaplastJunho();
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["adm", "nplog", "industrializacao", "fin-desp"]));
  const resultadoOperacional = dreCompletaJunho.find((linha) => linha.id === "resultado-op")!.valor;
  const lucroLiquido = dreCompletaJunho.find((linha) => linha.id === "lucro-liq")!.valor;
  const diferencas = composicaoDrePorConta.filter((conta) => conta.situacao === "a_distribuir");
  const totalDepreciacaoLocalizado = depreciacaoContaAConta.reduce((total, conta) => total + conta.valor, 0) + depreciacaoSemCodigo.reduce((total, [, , valor]) => total + valor, 0);
  const diferencaDepreciacao = Math.round((totalDepreciacaoPrevisto - totalDepreciacaoLocalizado) * 100) / 100;

  const porGrupo = useMemo(() => {
    const grupos = new Map<string, typeof composicaoDrePorConta>();
    for (const conta of composicaoDrePorConta) grupos.set(conta.grupoId, [...(grupos.get(conta.grupoId) ?? []), conta]);
    return grupos;
  }, []);

  const alternar = (id: string) => setAbertas((atual) => {
    const proximo = new Set(atual);
    if (proximo.has(id)) proximo.delete(id); else proximo.add(id);
    return proximo;
  });

  const todasAbertas = idsComComposicao.every((id) => abertas.has(id));

  return (
    <PageShell>
      <PageHeader
        titulo="DRE contábil — Nitaplast 06/2026"
        descricao="DRE de controle cruzada com o plano de contas e o razão: código, classificação, descrição, centro de custo e valor."
        acoes={<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Estrutura conta a conta</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Receita operacional bruta" value={receitaBrutaJunho} />
        <Metric label="Resultado operacional" value={resultadoOperacional} success />
        <Metric label="Lucro líquido" value={lucroLiquido} success />
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Diferenças ainda sem conta</p><p className="mt-1 text-xl font-semibold text-amber-700">{diferencas.length}</p></CardContent></Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div><p className="font-medium">Regime tributário confirmado</p><p className="text-sm text-muted-foreground">{cadastroFiscalNitaplast.regimeTributario} por {cadastroFiscalNitaplast.formaApuracaoIrpjCsll.toLocaleLowerCase("pt-BR")}.</p></div>
          <Badge variant="outline">Confirmado pelo cliente</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">DRE com abertura contábil real</CardTitle>
              <CardDescription>Os totais vêm da DRE enviada. A abertura usa as contas reais do plano/razão; diferenças sem suporte aparecem separadamente e não recebem conta fictícia.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAbertas(todasAbertas ? new Set() : new Set(idsComComposicao))}><ListTree className="mr-2 size-4" />{todasAbertas ? "Recolher contas" : "Expandir todas as contas"}</Button>
              <Button asChild variant="outline" size="sm"><Link to="/contabil/razao">Abrir Razão <ExternalLink className="ml-2 size-4" /></Link></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="w-[34%] p-2">Linha da DRE</th><th className="p-2">Fonte</th><th className="p-2 text-right">Valor DRE</th><th className="p-2 text-right">% receita</th><th className="p-2 text-right">Composição</th></tr></thead>
            <tbody>{dreCompletaJunho.map((linha) => {
              const contas = porGrupo.get(linha.id) ?? [];
              const pendencias = contas.filter((conta) => conta.situacao === "a_distribuir").length;
              const podeAbrir = contas.length > 0;
              const aberta = abertas.has(linha.id);
              const totalEstrutural = linha.tipo === "grupo" || linha.tipo === "resultado" || linha.tipo === "informativo" || linha.id === "fin-liq";
              return [
                <tr key={linha.id} className={linha.tipo === "resultado" ? "border-y-2 bg-primary/5 font-semibold" : linha.nivel === 0 ? "border-t bg-muted/20 font-medium" : "border-b"}>
                  <td className="p-2" style={{ paddingLeft: 8 + linha.nivel * 24 }}>
                    <button className={`inline-flex items-center gap-1.5 text-left ${podeAbrir ? "cursor-pointer hover:text-primary" : "cursor-default"}`} onClick={() => podeAbrir && alternar(linha.id)} type="button">
                      {podeAbrir ? (aberta ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />) : <span className="inline-block w-4" />}
                      {linha.descricao}
                    </button>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">{linha.origem}</td>
                  <td className={`p-2 text-right tabular-nums ${linha.valor < 0 ? "text-emerald-700" : ""}`}>{brl.format(linha.valor)}</td>
                  <td className="p-2 text-right tabular-nums text-muted-foreground">{`${((Math.abs(linha.valor) / receitaBrutaJunho) * 100).toFixed(2).replace(".", ",")}%`}</td>
                  <td className="p-2 text-right">
                    {podeAbrir ? pendencias ? <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />{contas.length - pendencias} linhas + {pendencias} diferença</span> : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />{contas.length} {contas.length === 1 ? "linha contábil" : "linhas contábeis"}</span> : totalEstrutural || linha.valor === 0 ? <span className="text-xs text-muted-foreground">{linha.valor === 0 ? "Sem movimento" : "Total calculado"}</span> : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />Conta não localizada</span>}
                  </td>
                </tr>,
                podeAbrir && aberta ? <tr key={`${linha.id}-contas`} className="border-b bg-slate-50/70"><td colSpan={5} className="p-3 pl-10"><TabelaContas contas={contas} /></td></tr> : null,
              ];
            })}</tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Depreciação — conta a conta</CardTitle><CardDescription>Lançamento pontual previsto em {brl.format(totalDepreciacaoPrevisto)}. As contas abaixo têm código do plano localizado; as demais aparecem com o detalhe do razão até o código ser confirmado.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2 text-right">Valor</th></tr></thead><tbody>
            {depreciacaoContaAConta.map((conta) => <tr key={conta.codigo} className="border-b"><td className="p-2 font-mono">{conta.codigo}</td><td className="p-2 font-mono text-xs">{conta.classificacao}</td><td className="p-2">{conta.descricao}</td><td className="p-2 text-right tabular-nums">{brl.format(conta.valor)}</td></tr>)}
            {depreciacaoSemCodigo.map(([, creditoCodigo, valor, descricao]) => <tr key={creditoCodigo} className="border-b bg-amber-50/60"><td className="p-2 font-mono text-muted-foreground">—</td><td className="p-2 font-mono text-xs text-muted-foreground">—</td><td className="p-2">{descricao} <span className="text-xs text-muted-foreground">(detalhe do razão; conta da DRE a confirmar)</span></td><td className="p-2 text-right tabular-nums">{brl.format(valor)}</td></tr>)}
            <tr className="border-t-2 bg-amber-50 font-medium"><td className="p-2" colSpan={3}>Saldo de depreciação/amortização ainda sem suporte documental</td><td className="p-2 text-right text-amber-800">{brl.format(diferencaDepreciacao)}</td></tr>
          </tbody></table>
        </CardContent>
      </Card>


      <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="flex gap-3 pt-6"><CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><p className="font-medium">O total da DRE fecha; a distribuição contábil ainda tem diferenças identificadas</p><p className="mt-1 text-sm text-muted-foreground">As linhas “DIFERENÇA DO FECHAMENTO A DISTRIBUIR POR CONTA” são a ponte entre os documentos/folha localizados e a DRE manual. Elas não são lançadas automaticamente em uma conta genérica. Precisam ser classificadas antes da importação definitiva no Questor.</p></div></CardContent></Card>
    </PageShell>
  );
}

function TabelaContas({ contas }: { contas: typeof composicaoDrePorConta }) {
  return <div className="overflow-hidden rounded-md border bg-background"><table className="w-full min-w-[1040px] text-xs"><thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Código</th><th className="p-2">Classificação</th><th className="p-2">Descrição contábil</th><th className="p-2">Centro de custo</th><th className="p-2 text-right">Valor</th><th className="p-2">Rastreabilidade</th></tr></thead><tbody>{contas.map((conta, index) => <tr key={`${conta.grupoId}-${conta.codigo}-${conta.centroCusto}-${index}`} className={`border-b last:border-0 ${conta.situacao === "a_distribuir" ? "bg-amber-50" : ""}`}><td className="p-2 font-mono font-medium">{conta.codigo || "—"}</td><td className="p-2 font-mono">{conta.classificacao || "—"}</td><td className="p-2 font-medium">{conta.descricao}</td><td className="p-2"><span className="font-mono">{conta.centroCusto || "—"}</span> — {conta.centroCustoDescricao}</td><td className={`p-2 text-right font-mono font-medium ${conta.valor < 0 ? "text-emerald-700" : ""}`}>{brl.format(conta.valor)}</td><td className="max-w-[260px] p-2 text-muted-foreground">{conta.origem}</td></tr>)}</tbody></table></div>;
}

function Metric({ label, value, success = false }: { label: string; value: number; success?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{brl.format(value)}</p></CardContent></Card>;
}
