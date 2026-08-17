import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { comparacaoDreDetalhada } from "@/data/nitaplast-dre-detalhada";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/relatorios/dre")({
  head: () => ({
    meta: [
      { title: "DRE Oficial — Nitaplast — ERP Contábil" },
      { name: "description", content: "Demonstração do Resultado oficial calculada a partir do Razão e Balancete." },
    ],
  }),
  component: DreOficialPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LINHAS_INTERNAS = new Set(["base-ir", "ajuste-jul"]);

function DreOficialPage() {
  useNitaplastJunho();

  // A DRE OFICIAL usa a coluna CALCULADO da mesma estrutura detalhada que valida
  // o Razão/Balancete. A referência manual/enviada nunca é exibida nem usada como valor.
  const linhas = comparacaoDreDetalhada.filter((linha) => {
    if (LINHAS_INTERNAS.has(linha.id)) return false;
    // Diagnósticos zerados são internos. Se houver valor real sem classificação,
    // ele permanece visível para não esconder resultado contábil.
    if (linha.tipo === "diagnostico" && Math.abs(linha.calculado) < 0.005) return false;
    return true;
  });

  const receitaBruta = linhas.find((linha) => linha.id === "receita")?.calculado ?? 0;
  const percentual = (valor: number) => receitaBruta ? (valor / receitaBruta) * 100 : 0;

  function exportarCsv() {
    const cabecalho = ["DESCRIÇÃO", "VALOR", "% RECEITA"];
    const csv = [
      cabecalho,
      ...linhas.map((linha) => [
        linha.descricao,
        linha.calculado.toFixed(2).replace(".", ","),
        percentual(linha.calculado).toFixed(2).replace(".", ","),
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
          descricao="Competência 06/2026 · calculada pelo Razão/Balancete"
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
            {linhas.map((linha) => {
              const destaqueResultado = linha.tipo === "resultado";
              const destaqueGrupo = linha.tipo === "grupo";
              const diagnostico = linha.tipo === "diagnostico";
              const recuo = linha.nivel === 2 ? "pl-12" : linha.nivel === 1 ? "pl-6" : "";

              return (
                <tr
                  key={linha.id}
                  className={`border-b border-border print:border-neutral-300 ${
                    destaqueResultado
                      ? "border-t-2 border-t-foreground font-bold print:border-t-black"
                      : destaqueGrupo
                        ? "font-semibold"
                        : diagnostico
                          ? "italic"
                          : ""
                  }`}
                >
                  <td className={`py-2 pr-3 ${recuo}`}>{linha.descricao}</td>
                  <td className="py-2 text-right tabular-nums">{brl.format(linha.calculado)}</td>
                  <td className="py-2 text-right tabular-nums">{pct.format(percentual(linha.calculado))}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </PageShell>
  );
}
