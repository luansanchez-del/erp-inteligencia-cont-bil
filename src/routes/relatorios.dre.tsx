import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { calcularDreBalancete, type ContaResultadoJunho, type GrupoDreBalancete } from "@/data/nitaplast-dre-balancete";
import {
  calcularDespesasOperacionaisPorCategoria,
  type CategoriaDespesaJunho,
} from "@/data/nitaplast-fechamento-despesas-junho";
import { calcularCreditosFederaisDespesas } from "@/data/nitaplast-fechamento-creditos-federais-junho";
import {
  conciliacaoPisGerencialJunho,
  conciliacaoCofinsGerencialJunho,
} from "@/data/nitaplast-dre-detalhada-v4";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

export const Route = createFileRoute("/relatorios/dre")({
  head: () => ({
    meta: [
      { title: "DRE Report — Nitaplast — ERP Contábil" },
      { name: "description", content: "Demonstração do Resultado calculada exclusivamente pelo Razão e Balancete." },
    ],
  }),
  component: DreReportPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const arred = (valor: number) => Math.round(valor * 100) / 100;

type LinhaReport = {
  id: string;
  descricao: string;
  valor: number;
  nivel: 0 | 1;
  tipo: "grupo" | "detalhe" | "subtotal" | "resultado" | "alerta";
};

const categoriasDespesas: Array<{ id: CategoriaDespesaJunho; descricao: string }> = [
  { id: "adm", descricao: "Despesas Administrativas" },
  { id: "nplog", descricao: "Despesas com Serviço - NPLog" },
  { id: "comerciais", descricao: "Despesas Comerciais" },
  { id: "producao", descricao: "Despesas Produção" },
  { id: "veiculos", descricao: "Despesas Veículos" },
  { id: "barracao", descricao: "Despesas Barracão" },
  { id: "imobilizado", descricao: "Despesas com Imobilizado" },
  { id: "industrializacao", descricao: "Despesas com Industrialização" },
  { id: "tributarias", descricao: "Despesas Tributárias" },
  { id: "comercial-sp", descricao: "Despesas Comercial SP" },
];

function detalhes(grupo: GrupoDreBalancete, contas: ContaResultadoJunho[]): LinhaReport[] {
  return contas.map((conta) => ({
    id: `${grupo}-${conta.codigo}`,
    descricao: `${conta.codigo} · ${conta.descricao}`,
    valor: conta.resultado,
    nivel: 1,
    tipo: "detalhe",
  }));
}

/**
 * O subtotal de deduções usa débito BRUTO dos impostos sobre vendas.
 * PIS/COFINS possuem uma única apuração consolidada no Razão/Balancete.
 * Aqui o consolidado é apenas segregado gerencialmente entre Matriz e Filial;
 * as parcelas substituem a linha consolidada na apresentação e NÃO geram
 * nenhum lançamento contábil adicional.
 */
function detalhesDeducoes(contas: ContaResultadoJunho[]): LinhaReport[] {
  const linhas: LinhaReport[] = [];

  for (const conta of contas) {
    if (conta.codigo === "2829") {
      linhas.push(
        {
          id: "deducoes-pis-matriz",
          descricao: "2829 · PIS sobre vendas — Matriz",
          valor: -arred(conciliacaoPisGerencialJunho.matrizGerencial.debitoSobreVendas),
          nivel: 1,
          tipo: "detalhe",
        },
        {
          id: "deducoes-pis-filial",
          descricao: "2829 · PIS sobre vendas — Filial",
          valor: -arred(conciliacaoPisGerencialJunho.filialGerencial.debitoSobreVendas),
          nivel: 1,
          tipo: "detalhe",
        },
      );
      continue;
    }

    if (conta.codigo === "2830") {
      linhas.push(
        {
          id: "deducoes-cofins-matriz",
          descricao: "2830 · COFINS sobre vendas — Matriz",
          valor: -arred(conciliacaoCofinsGerencialJunho.matrizGerencial.debitoSobreVendas),
          nivel: 1,
          tipo: "detalhe",
        },
        {
          id: "deducoes-cofins-filial",
          descricao: "2830 · COFINS sobre vendas — Filial",
          valor: -arred(conciliacaoCofinsGerencialJunho.filialGerencial.debitoSobreVendas),
          nivel: 1,
          tipo: "detalhe",
        },
      );
      continue;
    }

    linhas.push({
      id: `deducoes-${conta.codigo}`,
      descricao: `${conta.codigo} · ${conta.descricao}`,
      valor: conta.classificacao.startsWith("4.1.03.005")
        ? -arred(conta.debitos)
        : conta.resultado,
      nivel: 1,
      tipo: "detalhe",
    });
  }

  return linhas;
}

function DreReportPage() {
  useNitaplastJunho();
  const { aplicar } = useReclassificacoesInteligentes("2026-06");

  // REGRA ÚNICA: o mesmo Razão ajustado que alimenta o Balancete alimenta este Report.
  // Nenhum valor da DRE manual/de validação entra no cálculo.
  const lancamentosComAjustes = useMemo(() => aplicar(lancamentosIntegrados), [aplicar]);
  const apuracao = useMemo(() => calcularDreBalancete(lancamentosComAjustes), [lancamentosComAjustes]);
  const despesasPorCategoria = useMemo(
    () => calcularDespesasOperacionaisPorCategoria(lancamentosComAjustes),
    [lancamentosComAjustes],
  );
  const creditosFederais = useMemo(
    () => calcularCreditosFederaisDespesas(lancamentosComAjustes),
    [lancamentosComAjustes],
  );
  const r = apuracao.resumo;

  const receitaLiquida = arred(r.receitaBruta - r.deducoes);
  const lucroBruto = arred(receitaLiquida - r.custos);
  const despesasOperacionaisBase = arred(
    categoriasDespesas.reduce((total, item) => total + despesasPorCategoria[item.id], 0)
      + despesasPorCategoria["despesas-nao-mapeadas"],
  );
  const financeiroLiquido = arred(r.despesasFinanceiras - r.receitasFinanceiras);
  const despesasAntesCreditos = arred(despesasOperacionaisBase + financeiroLiquido);
  const totalCreditosFederais = arred(creditosFederais.pis + creditosFederais.cofins);
  const despesasLiquidas = arred(despesasAntesCreditos - totalCreditosFederais);
  const resultadoOperacional = arred(lucroBruto - despesasLiquidas);
  const resultadoLiquido = arred(resultadoOperacional + r.resultadoNaoOperacional + r.valorSemVinculo);

  const linhas = useMemo<LinhaReport[]>(() => {
    const base: LinhaReport[] = [
      { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: r.receitaBruta, nivel: 0, tipo: "grupo" },
      ...detalhes("receita", apuracao.contasPorGrupo.receita),

      { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: -r.deducoes, nivel: 0, tipo: "grupo" },
      ...detalhesDeducoes(apuracao.contasPorGrupo.deducoes),

      { id: "receita-liquida", descricao: "Receita Operacional Líquida", valor: receitaLiquida, nivel: 0, tipo: "subtotal" },

      { id: "custos", descricao: "(-) Custos / CPV / CMV", valor: -r.custos, nivel: 0, tipo: "grupo" },
      ...detalhes("custos", apuracao.contasPorGrupo.custos),

      { id: "lucro-bruto", descricao: "LUCRO BRUTO", valor: lucroBruto, nivel: 0, tipo: "subtotal" },

      { id: "despesas-operacionais", descricao: "(-) Despesas Operacionais antes dos créditos", valor: -despesasAntesCreditos, nivel: 0, tipo: "grupo" },
      ...categoriasDespesas.map<LinhaReport>((item) => ({
        id: `desp-${item.id}`,
        descricao: item.descricao,
        valor: -despesasPorCategoria[item.id],
        nivel: 1,
        tipo: "detalhe",
      })),
    ];

    if (Math.abs(despesasPorCategoria["despesas-nao-mapeadas"]) >= 0.005) {
      base.push({
        id: "desp-nao-mapeadas",
        descricao: "Outras despesas operacionais sem classificação gerencial",
        valor: -despesasPorCategoria["despesas-nao-mapeadas"],
        nivel: 1,
        tipo: "alerta",
      });
    }

    base.push(
      { id: "financeiro-liquido", descricao: "Despesas Financeiras Líquidas", valor: -financeiroLiquido, nivel: 1, tipo: "detalhe" },
      { id: "financeiro-despesas", descricao: "(-) Despesas Financeiras", valor: -r.despesasFinanceiras, nivel: 1, tipo: "detalhe" },
      { id: "financeiro-receitas", descricao: "(+) Receitas Financeiras", valor: r.receitasFinanceiras, nivel: 1, tipo: "detalhe" },
      { id: "credito-pis", descricao: "(-) Crédito de PIS sobre custos e despesas", valor: creditosFederais.pis, nivel: 0, tipo: "detalhe" },
      { id: "credito-cofins", descricao: "(-) Crédito de COFINS sobre custos e despesas", valor: creditosFederais.cofins, nivel: 0, tipo: "detalhe" },
      { id: "despesas-liquidas", descricao: "Total Despesas Operacionais Líquidas", valor: -despesasLiquidas, nivel: 0, tipo: "subtotal" },
      { id: "resultado-operacional", descricao: "RESULTADO OPERACIONAL", valor: resultadoOperacional, nivel: 0, tipo: "subtotal" },
      { id: "nao-operacional", descricao: "Resultado Não Operacional", valor: r.resultadoNaoOperacional, nivel: 0, tipo: "grupo" },
      ...detalhes("nao-operacional", apuracao.contasPorGrupo["nao-operacional"]),
    );

    if (r.contasSemVinculo > 0 || Math.abs(r.valorSemVinculo) >= 0.005) {
      base.push(
        { id: "sem-vinculo", descricao: "Outros resultados sem classificação gerencial", valor: r.valorSemVinculo, nivel: 0, tipo: "alerta" },
        ...detalhes("sem-vinculo", apuracao.contasPorGrupo["sem-vinculo"]),
      );
    }

    base.push({ id: "lucro-liquido", descricao: "LUCRO / PREJUÍZO LÍQUIDO", valor: resultadoLiquido, nivel: 0, tipo: "resultado" });
    return base;
  }, [
    apuracao,
    creditosFederais,
    despesasAntesCreditos,
    despesasLiquidas,
    despesasPorCategoria,
    financeiroLiquido,
    lucroBruto,
    r,
    receitaLiquida,
    resultadoLiquido,
    resultadoOperacional,
  ]);

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
    link.download = "Nitaplast_DRE_Report_062026.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <div className="print:hidden">
        <PageHeader
          titulo="DRE Report — Nitaplast"
          descricao="Competência 06/2026 · Razão → Balancete → DRE"
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
              const recuo = linha.nivel === 1 ? "pl-6" : "";
              const classe = linha.tipo === "resultado"
                ? "border-t-2 border-t-foreground font-bold print:border-t-black"
                : linha.tipo === "subtotal"
                  ? "font-bold"
                  : linha.tipo === "grupo"
                    ? "font-semibold"
                    : linha.tipo === "alerta"
                      ? "font-semibold"
                      : "";

              return (
                <tr key={linha.id} className={`border-b border-border print:border-neutral-300 ${classe}`}>
                  <td className={`py-2 pr-3 ${recuo}`}>{linha.descricao}</td>
                  <td className="py-2 text-right tabular-nums">{brl.format(linha.valor)}</td>
                  <td className="py-2 text-right tabular-nums">{pct.format(percentual(linha.valor))}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </PageShell>
  );
}
