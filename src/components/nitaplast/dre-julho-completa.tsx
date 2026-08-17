import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, CircleAlert, FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { composicaoResultadoJulho, dreParcialJulho } from "@/data/nitaplast-dre-julho";
import { fiscalJulho, receitaFiscalJulho } from "@/data/nitaplast-fechamento-julho";
import { diagnosticoFechamentoJulho, lancamentosIntegradosJulho } from "@/data/nitaplast-razao-julho";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (valor: number) => Math.round(valor * 100) / 100;

const ccProducao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10058", "19999"]);
const ccComercial = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const ccAdministrativo = new Set(["301", "302", "303", "304", "305", "306"]);

type StatusLinha = "calculado" | "parcial" | "pendente" | "manual" | "conciliado";
type ItemComposicao = (typeof composicaoResultadoJulho)[number];
type Linha = {
  id: string;
  descricao: string;
  nivel: number;
  valor: number;
  status: StatusLinha;
  criterio: string;
  composicao?: ItemComposicao[];
};

function valorLancamento(id: string) {
  return lancamentosIntegradosJulho.find((item) => item.id === id)?.valor ?? 0;
}

function categoriaDespesa(item: ItemComposicao) {
  if (item.classificacao.startsWith("5.1") || item.classificacao.startsWith("4.2")) return "custos";
  if (item.conta === "25937") return "industrializacao";
  if (item.cc === "502") return "comercial-sp";
  if (item.classificacao.startsWith("5.7.05")) return "veiculos";
  if (item.classificacao.startsWith("5.7.01.009") || item.classificacao.startsWith("5.7.03.007")) return "barracao";
  if (item.classificacao.startsWith("5.7.01.011")) return "imobilizado";
  if (item.classificacao.startsWith("5.7.09")) return "tributarias";
  if (ccProducao.has(item.cc)) return "producao";
  if (ccComercial.has(item.cc)) return "comerciais";
  if (ccAdministrativo.has(item.cc)) return "administrativas";
  return "outras";
}

function itensCategoria(categoria: string) {
  return composicaoResultadoJulho.filter((item) => categoriaDespesa(item) === categoria);
}

function somaItens(itens: ItemComposicao[]) {
  return arred(itens.reduce((total, item) => total + item.valor, 0));
}

export function DreJulhoCompleta() {
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos", "despesas"]));

  const grupos = useMemo(() => {
    const custos = itensCategoria("custos");
    const administrativas = itensCategoria("administrativas");
    const comerciais = itensCategoria("comerciais");
    const producao = itensCategoria("producao");
    const veiculos = itensCategoria("veiculos");
    const barracao = itensCategoria("barracao");
    const imobilizado = itensCategoria("imobilizado");
    const industrializacao = itensCategoria("industrializacao");
    const tributarias = itensCategoria("tributarias");
    const comercialSp = itensCategoria("comercial-sp");
    const outras = itensCategoria("outras");

    return {
      custos,
      administrativas,
      comerciais,
      producao,
      veiculos,
      barracao,
      imobilizado,
      industrializacao,
      tributarias,
      comercialSp,
      outras,
      totalCustos: somaItens(custos),
      totalAdministrativas: somaItens(administrativas),
      totalComerciais: somaItens(comerciais),
      totalProducao: somaItens(producao),
      totalVeiculos: somaItens(veiculos),
      totalBarracao: somaItens(barracao),
      totalImobilizado: somaItens(imobilizado),
      totalIndustrializacao: somaItens(industrializacao),
      totalTributarias: somaItens(tributarias),
      totalComercialSp: somaItens(comercialSp),
      totalOutras: somaItens(outras),
    };
  }, []);

  const icmsMatriz = valorLancamento("JUL-TAX-ICMS-M-EXT");
  const icmsFilial = valorLancamento("JUL-TAX-ICMS-F-EXT");
  const ipiMatriz = valorLancamento("JUL-TAX-IPI-M");
  const ipiFilial = valorLancamento("JUL-TAX-IPI-F");
  const despesasOperacionais = arred(dreParcialJulho.despesasReconhecidas);
  const lucroBrutoParcial = arred(dreParcialJulho.receitaLiquida - dreParcialJulho.custosReconhecidos);
  const resultadoOperacionalParcial = arred(lucroBrutoParcial - despesasOperacionais);

  const linhas: Linha[] = [
    { id: "receita", descricao: "(+) Receita Operacional Bruta", nivel: 0, valor: receitaFiscalJulho.totalBruto, status: "calculado", criterio: "Receita externa reconstruída pelos documentos fiscais de julho; nenhuma DRE foi usada como fonte." },
    { id: "rec-matriz-prod", descricao: "Receita Venda Produção Matriz", nivel: 1, valor: receitaFiscalJulho.matriz.producao, status: "calculado", criterio: "Saídas fiscais externas da matriz." },
    { id: "rec-matriz-rev", descricao: "Receita Revenda Matriz", nivel: 1, valor: receitaFiscalJulho.matriz.revenda, status: "calculado", criterio: "CFOP de revenda da matriz." },
    { id: "rec-serv", descricao: "Receita Venda de Serviços", nivel: 1, valor: 0, status: "calculado", criterio: "Nenhuma receita de serviço foi identificada na base fiscal utilizada nesta etapa." },
    { id: "rec-filial-prod", descricao: "Receita Venda Produção Filial", nivel: 1, valor: receitaFiscalJulho.filialSp.producaoOperacaoTriangular, status: "calculado", criterio: "Operação triangular/produção da filial conforme documentos fiscais." },
    { id: "rec-filial-rev", descricao: "Receita Revenda Filial", nivel: 1, valor: receitaFiscalJulho.filialSp.revenda, status: "calculado", criterio: "Saídas de revenda da filial SP." },

    { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", nivel: 0, valor: receitaFiscalJulho.deducoesPreliminares.total, status: "calculado", criterio: "Débitos incidentes nas vendas e devoluções; créditos de entrada não reduzem estas linhas." },
    { id: "dev", descricao: "Devoluções de Produtos", nivel: 1, valor: receitaFiscalJulho.deducoesPreliminares.devolucoes, status: "calculado", criterio: "Devoluções fiscais da matriz e filial." },
    { id: "ipi-m", descricao: "IPI Matriz", nivel: 1, valor: ipiMatriz, status: "parcial", criterio: "IPI externo contabilizado da matriz; diferença documental de R$ 26,21 permanece destacada para conciliação." },
    { id: "icms-m", descricao: "ICMS Matriz", nivel: 1, valor: icmsMatriz, status: "calculado", criterio: "ICMS incidente nas vendas externas da matriz." },
    { id: "pis", descricao: "PIS Matriz + Filial (consolidado)", nivel: 1, valor: fiscalJulho.contribuicoes.pisDebitoSaidas, status: "calculado", criterio: "Apuração consolidada da empresa; não duplicar abertura gerencial da filial." },
    { id: "cofins", descricao: "COFINS Matriz + Filial (consolidado)", nivel: 1, valor: fiscalJulho.contribuicoes.cofinsDebitoSaidas, status: "calculado", criterio: "Apuração consolidada da empresa; não duplicar abertura gerencial da filial." },
    { id: "icms-st", descricao: "ICMS ST", nivel: 1, valor: receitaFiscalJulho.deducoesPreliminares.icmsSt, status: "calculado", criterio: "ICMS-ST incidente nas saídas." },
    { id: "icms-f", descricao: "ICMS s/ vendas Filial", nivel: 1, valor: icmsFilial, status: "calculado", criterio: "ICMS incidente nas vendas externas da filial." },
    { id: "ipi-f", descricao: "IPI Filial", nivel: 1, valor: ipiFilial, status: "calculado", criterio: "IPI conforme apuração/documentos da filial." },

    { id: "receita-liquida", descricao: "(=) Receita Operacional Líquida", nivel: 0, valor: dreParcialJulho.receitaLiquida, status: "calculado", criterio: "Receita bruta menos deduções documentadas." },

    { id: "custos", descricao: "(-) Custos reconhecidos no Razão", nivel: 0, valor: grupos.totalCustos, status: "parcial", criterio: "Somente custos já formados por lançamentos de julho. O fechamento técnico de estoque/CPV ainda não foi forçado por ajuste de encaixe.", composicao: grupos.custos },
    { id: "cpv-estoque", descricao: "CPV/CMV por fechamento de estoque", nivel: 1, valor: 0, status: "pendente", criterio: "Inventário final de 31/07 está carregado, porém o ajuste técnico fica bloqueado até completar os movimentos reais que afetam estoque." },

    { id: "lucro-bruto", descricao: "(=) LUCRO BRUTO PARCIAL", nivel: 0, valor: lucroBrutoParcial, status: "parcial", criterio: "Receita líquida menos custos já reconhecidos; ainda não é o lucro bruto final de julho." },

    { id: "despesas", descricao: "(-) Despesas Operacionais", nivel: 0, valor: despesasOperacionais, status: "parcial", criterio: "Despesas já reconhecidas no Razão de julho a partir da base por centro de custo." },
    { id: "adm", descricao: "Despesas Administrativas", nivel: 1, valor: grupos.totalAdministrativas, status: "parcial", criterio: "Centros administrativos já mapeados.", composicao: grupos.administrativas },
    { id: "comerciais", descricao: "Despesas Comerciais", nivel: 1, valor: grupos.totalComerciais, status: "parcial", criterio: "Centros comerciais já mapeados.", composicao: grupos.comerciais },
    { id: "producao", descricao: "Despesas Produção", nivel: 1, valor: grupos.totalProducao, status: "parcial", criterio: "Centros de produção já mapeados.", composicao: grupos.producao },
    { id: "veiculos", descricao: "Despesas Veículos", nivel: 1, valor: grupos.totalVeiculos, status: "parcial", criterio: "Contas classificadas como despesas com veículos.", composicao: grupos.veiculos },
    { id: "barracao", descricao: "Despesas Barracão", nivel: 1, valor: grupos.totalBarracao, status: "parcial", criterio: "Contas classificadas como despesas de barracão.", composicao: grupos.barracao },
    { id: "imobilizado", descricao: "Despesas com Imobilizado", nivel: 1, valor: grupos.totalImobilizado, status: "parcial", criterio: "Despesas de imobilizado já documentadas; depreciação permanece manual nesta etapa.", composicao: grupos.imobilizado },
    { id: "industrializacao", descricao: "Despesas com Industrialização", nivel: 1, valor: grupos.totalIndustrializacao, status: "parcial", criterio: "Industrialização já reconhecida pelos documentos/CC.", composicao: grupos.industrializacao },
    { id: "tributarias", descricao: "Despesas Tributárias", nivel: 1, valor: grupos.totalTributarias, status: "parcial", criterio: "Despesas tributárias reconhecidas na escrituração já mapeada.", composicao: grupos.tributarias },
    { id: "comercial-sp", descricao: "Despesas Comercial SP", nivel: 1, valor: grupos.totalComercialSp, status: "parcial", criterio: "Despesas da filial identificadas no CC 502.", composicao: grupos.comercialSp },
    { id: "outras", descricao: "Outras Despesas Operacionais já mapeadas", nivel: 1, valor: grupos.totalOutras, status: "parcial", criterio: "Itens de resultado mapeados que ainda não se enquadram com segurança nas categorias anteriores.", composicao: grupos.outras },

    { id: "fin-desp", descricao: "Despesas Financeiras", nivel: 0, valor: 0, status: "manual", criterio: "JCP e juros passivos foram mantidos fora desta etapa por orientação do usuário." },
    { id: "fin-rec", descricao: "(-) Receitas Financeiras", nivel: 0, valor: 0, status: "manual", criterio: "Juros ativos e rendimentos permanecem fora desta etapa por orientação do usuário." },
    { id: "credito-pis", descricao: "(-) PIS não cumulativo s/despesas", nivel: 0, valor: 0, status: "pendente", criterio: `Créditos PIS de ${brl.format(diagnosticoFechamentoJulho.pisCreditosPendentesAbertura)} aguardam abertura/classificação antes de afetar a DRE.` },
    { id: "credito-cofins", descricao: "(-) COFINS não cumulativo s/despesas", nivel: 0, valor: 0, status: "pendente", criterio: `Créditos COFINS de ${brl.format(diagnosticoFechamentoJulho.cofinsCreditosPendentesAbertura)} aguardam abertura/classificação antes de afetar a DRE.` },

    { id: "resultado-op", descricao: "(=) Resultado Operacional Parcial", nivel: 0, valor: resultadoOperacionalParcial, status: "parcial", criterio: "Resultado com os fatos já contabilizados; estoque/CPV, folha, bancos/AR/AP e créditos ainda precisam completar a escrituração." },
    { id: "nao-op", descricao: "Resultado Não Operacional", nivel: 0, valor: 0, status: "parcial", criterio: "Nenhum fato não operacional foi integrado ao Razão parcial nesta etapa." },
    { id: "resultado", descricao: "(=) RESULTADO PARCIAL 07/2026", nivel: 0, valor: dreParcialJulho.resultadoParcial, status: "parcial", criterio: "Resultado produzido exclusivamente pelo Razão existente de julho. Não representa fechamento final enquanto houver pendências estruturais." },
  ];

  const idsExpansiveis = linhas.filter((linha) => linha.nivel === 0 || (linha.composicao?.length ?? 0) > 0).map((linha) => linha.id);
  const tudoAberto = idsExpansiveis.every((id) => abertas.has(id));
  const pendenciasEstruturais = 9;

  function alternar(id: string) {
    setAbertas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id); else proximo.add(id);
      return proximo;
    });
  }

  function alternarTudo() {
    setAbertas(tudoAberto ? new Set() : new Set(idsExpansiveis));
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">DRE calculada — Nitaplast 07/2026</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mesmo padrão visual do fechamento de 06/2026. A DRE de julho nasce do Razão/Balancete da competência e mantém pendências sem criar lançamentos de encaixe.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Consolidado Matriz + Filial</Badge>
          <Button variant="outline" size="sm" onClick={alternarTudo}>{tudoAberto ? "Recolher toda DRE" : "Expandir toda DRE"}</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Receita Operacional Bruta" value={receitaFiscalJulho.totalBruto} detail="Calculada pelos documentos fiscais" />
        <SummaryCard label="Deduções da Receita Bruta" value={receitaFiscalJulho.deducoesPreliminares.total} detail="Devoluções + tributos sobre vendas" />
        <SummaryCard label="Resultado Parcial" value={dreParcialJulho.resultadoParcial} detail="Ainda sem itens estruturais pendentes" accent={dreParcialJulho.resultadoParcial >= 0 ? "success" : "warning"} />
        <Card className="border-amber-400/50"><CardContent className="pt-5"><p className="text-xs font-medium text-muted-foreground">Pendências estruturais</p><p className="mt-2 text-2xl font-semibold tabular-nums text-amber-700">{pendenciasEstruturais}</p><p className="mt-2 text-xs text-muted-foreground">Visíveis abaixo; nenhuma foi mascarada por conta transitória.</p></CardContent></Card>
      </div>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <p className="font-medium">Regra única aplicada à DRE inteira</p>
          <p className="mt-1 text-sm text-muted-foreground">Documentos → Lançamentos → Razão → Balancete → DRE. O saldo de 30/06 é referência de cálculo do Balancete, nunca lançamento de abertura no Razão. Julho não usa DRE de cliente para formar receita, custo ou despesa.</p>
        </CardContent>
      </Card>

      <Card className="border-sky-500/30 bg-sky-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileSearch className="mt-0.5 size-5 shrink-0 text-sky-700" />
            <div>
              <p className="font-medium">Itens financeiros deliberadamente fora desta etapa</p>
              <p className="mt-1 text-sm text-muted-foreground">JCP, depreciação, juros ativos, juros passivos e variação cambial permanecem manuais. Eles não foram zerados por falta de fonte nem lançados em conta genérica; foram excluídos do escopo atual conforme definido para julho.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div className="w-full">
              <p className="font-medium">Pendências que ainda alteram o resultado final</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Mini label="Entradas sem mapeamento seguro" value={brl.format(diagnosticoFechamentoJulho.valorEntradasPendentesMapeamento)} />
                <Mini label="Centro de custo incompleto" value={brl.format(diagnosticoFechamentoJulho.valorSemCcCompleto)} />
                <Mini label="Créditos PIS a abrir" value={brl.format(diagnosticoFechamentoJulho.pisCreditosPendentesAbertura)} />
                <Mini label="Créditos COFINS a abrir" value={brl.format(diagnosticoFechamentoJulho.cofinsCreditosPendentesAbertura)} />
                <Mini label="ICMS matriz a classificar" value={brl.format(diagnosticoFechamentoJulho.icmsMatrizPendenteClassificacao)} />
                <Mini label="ICMS filial a classificar" value={brl.format(diagnosticoFechamentoJulho.icmsFilialPendenteClassificacao)} />
                <Mini label="Folha 07/2026" value="Fonte ainda não integrada" />
                <Mini label="Bancos / Clientes / Fornecedores" value="Conciliação ainda não integrada" />
                <Mini label="Estoque / CPV" value="Fechamento técnico pendente" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">DRE 07/2026 — detalhamento completo</CardTitle>
              <CardDescription>Estrutura espelhada do fechamento de junho, com a competência e as fontes de julho. Abra as linhas para ver critério e composição contábil quando disponível.</CardDescription>
            </div>
            <Badge variant="outline">PARCIAL · EM FECHAMENTO</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm">
            <thead className="sticky top-0 z-10"><tr className="border-b bg-muted text-left text-xs shadow-sm"><th className="p-2">Linha da DRE</th><th className="p-2 text-right">DRE Calculada 07/2026</th><th className="p-2 text-center">Status</th></tr></thead>
            <tbody>
              {linhas.map((linha) => {
                const expansivel = linha.nivel === 0 || (linha.composicao?.length ?? 0) > 0;
                const aberta = abertas.has(linha.id);
                const destaque = linha.id === "resultado" || linha.id === "resultado-op" || linha.id === "lucro-bruto" || linha.id === "receita-liquida";
                return [
                  <tr key={linha.id} className={`border-b ${linha.nivel === 0 ? "bg-slate-100/70 font-semibold" : ""} ${destaque ? "border-y-2" : ""}`}>
                    <td className="p-2" style={{ paddingLeft: 8 + linha.nivel * 22 }}>
                      {expansivel ? <button type="button" className="inline-flex items-center gap-1.5 text-left hover:text-primary" onClick={() => alternar(linha.id)}>{aberta ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}<span>{linha.descricao}</span></button> : <span className="pl-[22px]">{linha.descricao}</span>}
                    </td>
                    <td className={`p-2 text-right tabular-nums ${destaque ? "font-semibold" : ""}`}>{brl.format(linha.valor)}</td>
                    <td className="p-2 text-center"><Status status={linha.status} /></td>
                  </tr>,
                  expansivel && aberta ? (
                    <tr key={`${linha.id}-detalhe`} className="border-b bg-slate-50/70">
                      <td colSpan={3} className="p-4 pl-8">
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Critério:</span> {linha.criterio}</p>
                        {linha.composicao?.length ? <TabelaComposicao itens={linha.composicao} /> : null}
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function TabelaComposicao({ itens }: { itens: ItemComposicao[] }) {
  return <div className="mt-3 overflow-x-auto rounded-md border bg-background"><table className="w-full min-w-[900px] text-xs"><thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">CC</th><th className="p-2 text-right">Valor</th><th className="p-2">Status</th></tr></thead><tbody>{itens.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-2 font-mono">{item.conta}</td><td className="p-2 font-mono">{item.classificacao}</td><td className="p-2">{item.descricao}</td><td className="p-2">{item.cc} — {item.centroCusto}</td><td className="p-2 text-right tabular-nums">{brl.format(item.valor)}</td><td className="p-2">{item.status}</td></tr>)}</tbody></table></div>;
}

function Status({ status }: { status: StatusLinha }) {
  if (status === "calculado" || status === "conciliado") return <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Calculado</span>;
  if (status === "manual") return <Badge variant="outline" className="border-sky-400 text-sky-800">Manual</Badge>;
  return <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />{status === "pendente" ? "Pendente" : "Parcial"}</span>;
}

function SummaryCard({ label, value, detail, accent }: { label: string; value: number; detail: string; accent?: "success" | "warning" }) {
  return <Card className={accent === "warning" ? "border-amber-400/50" : undefined}><CardContent className="pt-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${accent === "success" ? "text-emerald-700" : accent === "warning" ? "text-amber-700" : ""}`}>{brl.format(value)}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border bg-background/80 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{value}</p></div>;
}
