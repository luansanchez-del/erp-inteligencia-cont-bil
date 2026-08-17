import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  resumoDreBalancete,
  resultadoOperacionalBalancete,
  resultadoLiquidoBalancete,
} from "@/data/nitaplast-dre-balancete";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/relatorios/dre")({ component: DreReportPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (valor: number) => Math.round(valor * 100) / 100;

function DreReportPage() {
  useNitaplastJunho();

  const receitaLiquida = arred(resumoDreBalancete.receitaBruta - resumoDreBalancete.deducoes);
  const lucroBruto = arred(receitaLiquida - resumoDreBalancete.custos);
  const financeiroLiquido = arred(resumoDreBalancete.despesasFinanceiras - resumoDreBalancete.receitasFinanceiras);

  const linhas = [
    ["Receita Operacional Bruta", resumoDreBalancete.receitaBruta, "grupo"],
    ["(-) Deduções da Receita", -resumoDreBalancete.deducoes, "detalhe"],
    ["Receita Operacional Líquida", receitaLiquida, "subtotal"],
    ["(-) Custos / CPV / CMV", -resumoDreBalancete.custos, "detalhe"],
    ["Lucro Bruto", lucroBruto, "subtotal"],
    ["(-) Despesas Operacionais", -resumoDreBalancete.despesasOperacionais, "detalhe"],
    ["(-) Despesas Financeiras", -resumoDreBalancete.despesasFinanceiras, "detalhe"],
    ["(+) Receitas Financeiras", resumoDreBalancete.receitasFinanceiras, "detalhe"],
    ["Despesas Financeiras Líquidas", -financeiroLiquido, "detalhe"],
    ["Resultado Operacional", resultadoOperacionalBalancete, "subtotal"],
    ["Resultado Não Operacional", resumoDreBalancete.resultadoNaoOperacional, "detalhe"],
    ["Lucro / Prejuízo Líquido", resultadoLiquidoBalancete, "resultado"],
  ] as const;

  return (
    <PageShell>
      <PageHeader
        titulo="DRE Report — Nitaplast"
        descricao="Relatório gerencial da competência 06/2026. Os valores nascem exclusivamente do Razão e do Balancete; não utiliza a DRE manual como fonte."
        acoes={<Badge variant="outline">Consolidado · 06/2026</Badge>}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Demonstração do Resultado</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA · CNPJ 82.295.817/0001-07</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/contabil/dre">Abrir DRE de Validação <ExternalLink className="ml-2 size-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            {linhas.map(([descricao, valor, tipo]) => (
              <div
                key={descricao}
                className={`flex items-center justify-between gap-4 border-b px-4 py-3 last:border-0 ${
                  tipo === "resultado" ? "bg-primary/10 text-base font-bold" :
                  tipo === "subtotal" ? "bg-muted/50 font-semibold" :
                  tipo === "grupo" ? "font-semibold" : ""
                }`}
              >
                <span>{descricao}</span>
                <span className="tabular-nums">{brl.format(valor)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Report externo: sem alertas técnicos, sem comparação com valores enviados e sem lançamentos de diagnóstico. Divergências de validação permanecem somente na DRE de Validação.
      </p>
    </PageShell>
  );
}
