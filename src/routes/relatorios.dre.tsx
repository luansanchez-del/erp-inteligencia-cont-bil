import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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

  function exportarCsv() {
    const cabecalho = ["DESCRIÇÃO", "VALOR", "% RECEITA"];
    const csv = [
      cabecalho,
      ...linhas.map((linha) => [
        linha.descricao,
        linha.valor.toFixed(2).replace(".", ","),
        percentual(linha.valor).toFixed(2).replace(".", ","),
      ]),
    ]
      .map((colunas) => colunas.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";"))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Nitaplast_DRE_Oficial_062026.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <div className="print:hidden">
        <PageHeader
          titulo="DRE Oficial — Nitaplast"
          descricao="Competência 06/2026"
          acoes={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={exportarCsv}>
                <Download className="size-4" /> Exportar CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                <Printer className="size-4" /> Imprimir / PDF
              </Button>
            </div>
          }
        />
      </div>

      <section className="mx-auto w-full max-w-5xl bg-background print:max-w-none print:bg-white print:text-black">
        <header className="border-b-2 border-foreground pb-4 text-center print:border-black">
          <h1 className="text-lg font-bold uppercase tracking-wide">NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA</h1>
          <p className="mt-1 text-sm">CNPJ 82.295.817/0001-07</p>
          <h2 className="mt-4 text-base font-semibold uppercase">Demonstração do Resultado do Exercício</h2>
          <p className="mt-1 text-sm">Período: 01/06/2026 a 30/06/2026</p>
        </header>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-foreground text-left text-xs uppercase print:border-black">
              <th className="py-2 pr-3">Descrição</th>
              <th className="w-44 py-2 text-right">Valor</th>
              <th className="w-28 py-2 text-right">% Receita</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr
                key={linha.descricao}
                className={`border-b border-border print:border-neutral-300 ${
                  linha.tipo === "resultado"
                    ? "border-t-2 border-t-foreground font-bold print:border-t-black"
                    : linha.tipo === "subtotal"
                      ? "font-semibold"
                      : linha.tipo === "grupo"
                        ? "font-semibold"
                        : ""
                }`}
              >
                <td className="py-2.5 pr-3">{linha.descricao}</td>
                <td className="py-2.5 text-right tabular-nums">{brl.format(linha.valor)}</td>
                <td className="py-2.5 text-right tabular-nums">{pct.format(percentual(linha.valor))}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageShell>
  );
}
