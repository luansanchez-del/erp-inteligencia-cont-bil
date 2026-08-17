import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularDreBalancete } from "@/data/nitaplast-dre-balancete";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

export const Route = createFileRoute("/relatorios/dre")({
  head: () => ({
    meta: [
      { title: "DRE Oficial — Nitaplast — ERP Contábil" },
      { name: "description", content: "Demonstração do Resultado oficial calculada pelo Razão e Balancete." },
    ],
  }),
  component: DreOficialPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const arred = (valor: number) => Math.round(valor * 100) / 100;

type TipoLinha = "grupo" | "detalhe" | "subtotal" | "resultado";

type LinhaDre = {
  descricao: string;
  valor: number;
  tipo: TipoLinha;
};

function DreOficialPage() {
  useNitaplastJunho();
  const { aplicar } = useReclassificacoesInteligentes("2026-06");

  // MESMA BASE DO RAZÃO E DO BALANCETE. Qualquer reclassificação registrada no
  // Razão entra aqui na mesma renderização, sem depender da DRE de Validação.
  const lancamentosComAjustes = useMemo(() => aplicar(lancamentosIntegrados), [aplicar]);
  const apuracao = useMemo(() => calcularDreBalancete(lancamentosComAjustes), [lancamentosComAjustes]);
  const r = apuracao.resumo;

  const receitaLiquida = arred(r.receitaBruta - r.deducoes);
  const lucroBruto = arred(receitaLiquida - r.custos);
  const financeiroLiquido = arred(r.despesasFinanceiras - r.receitasFinanceiras);
  const outrosResultados = arred(r.resultadoNaoOperacional + r.valorSemVinculo);

  const linhas: LinhaDre[] = [
    { descricao: "Receita Operacional Bruta", valor: r.receitaBruta, tipo: "grupo" },
    { descricao: "(-) Deduções da Receita Bruta", valor: -r.deducoes, tipo: "detalhe" },
    { descricao: "Receita Operacional Líquida", valor: receitaLiquida, tipo: "subtotal" },
    { descricao: "(-) Custos / CPV / CMV", valor: -r.custos, tipo: "detalhe" },
    { descricao: "Lucro Bruto", valor: lucroBruto, tipo: "subtotal" },
    { descricao: "(-) Despesas Operacionais", valor: -r.despesasOperacionais, tipo: "detalhe" },
    { descricao: "(-) Despesas Financeiras", valor: -r.despesasFinanceiras, tipo: "detalhe" },
    { descricao: "(+) Receitas Financeiras", valor: r.receitasFinanceiras, tipo: "detalhe" },
    { descricao: "Despesas Financeiras Líquidas", valor: -financeiroLiquido, tipo: "detalhe" },
    { descricao: "Resultado Operacional", valor: apuracao.resultadoOperacional, tipo: "subtotal" },
    { descricao: "Resultado Não Operacional", valor: outrosResultados, tipo: "detalhe" },
    { descricao: "Lucro / Prejuízo Líquido", valor: apuracao.resultadoLiquido, tipo: "resultado" },
  ];

  const percentual = (valor: number) => r.receitaBruta ? (valor / r.receitaBruta) * 100 : 0;

  return (
    <PageShell>
      <PageHeader
        titulo="DRE Oficial — Nitaplast"
        descricao="Competência 06/2026"
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Demonstração do Resultado</CardTitle>
          <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <span>NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA</span>
            <span className="sm:text-right">CNPJ 82.295.817/0001-07 · 06/2026</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[minmax(0,1fr)_170px_100px] border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>Descrição</span>
            <span className="text-right">Valor</span>
            <span className="text-right">% Receita</span>
          </div>

          {linhas.map((linha) => (
            <div
              key={linha.descricao}
              className={`grid grid-cols-[minmax(0,1fr)_170px_100px] items-center border-b px-4 py-3 last:border-0 ${
                linha.tipo === "resultado"
                  ? "bg-primary/10 text-base font-bold"
                  : linha.tipo === "subtotal"
                    ? "bg-muted/50 font-semibold"
                    : linha.tipo === "grupo"
                      ? "font-semibold"
                      : ""
              }`}
            >
              <span>{linha.descricao}</span>
              <span className="text-right tabular-nums">{brl.format(linha.valor)}</span>
              <span className="text-right text-sm tabular-nums text-muted-foreground">{pct.format(percentual(linha.valor))}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
