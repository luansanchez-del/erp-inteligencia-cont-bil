import { useMemo } from "react";
import {
  comparacaoDreDetalhada as comparacaoBase,
  type ComposicaoDre,
  type LinhaComparacaoDre,
} from "@/data/nitaplast-dre-detalhada";
import { estruturaBalanceteNitaplast } from "@/data/nitaplast-balancete-estrutura";
import { lancamentosIntegrados, type LancamentoIntegrado } from "@/data/nitaplast-razao-integrado";
import { gerarLancamentosReclassificacao, useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const plano = new Map(
  estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A")
    .map((linha) => [linha.conta, linha]),
);

const ccProducao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10061", "19999"]);
const ccComercial = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const ccAdministrativo = new Set(["301", "302", "303", "304", "305", "306"]);

const idsReceita = ["rec-matriz-prod", "rec-matriz-rev", "rec-serv", "rec-filial-prod", "rec-filial-rev", "receita-nao-mapeada"];
const idsDeducoes = ["dev", "desc", "ipi-m", "icms-m", "pis-m", "cofins-m", "icms-st", "icms-f", "ipi-f", "pis-f", "cofins-f"];
const idsCustos = ["cpv-m", "cmv-m", "cpv-f", "cmv-f", "outros-custos"];
const idsOperacionais = ["adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp", "despesas-nao-mapeadas"];

function texto(lancamento: LancamentoIntegrado) {
  return `${lancamento.historico} ${lancamento.documento} ${lancamento.fonte}`.toLocaleUpperCase("pt-BR");
}

function resolverLinha(codigo: string, lancamento: LancamentoIntegrado): { id: string; multiplicador: number } | null {
  const conta = plano.get(codigo);
  if (!conta) return null;
  const classificacao = conta.classificacao;
  const cc = lancamento.cc;
  const t = texto(lancamento);

  if (codigo === "25943") return { id: "dev", multiplicador: -1 };
  if (codigo === "2826") return { id: cc === "502" ? "ipi-f" : "ipi-m", multiplicador: -1 };
  if (codigo === "2827") return { id: "icms-m", multiplicador: -1 };
  if (codigo === "2829") return { id: cc === "502" ? "pis-f" : "pis-m", multiplicador: -1 };
  if (codigo === "2830") return { id: cc === "502" ? "cofins-f" : "cofins-m", multiplicador: -1 };
  if (codigo === "2832") return { id: "icms-st", multiplicador: -1 };
  if (codigo === "25054") return { id: "icms-f", multiplicador: -1 };
  if (codigo === "25055") return { id: "ipi-f", multiplicador: -1 };

  if (classificacao.startsWith("4.1.01")) {
    if (codigo === "2703" || t.includes("SERVIÇO") || t.includes("SERVICO")) return { id: "rec-serv", multiplicador: 1 };
    if (cc === "502") {
      if (["2655", "2678"].includes(codigo) || t.includes("REVENDA") || t.includes("MERCADORIA")) return { id: "rec-filial-rev", multiplicador: 1 };
      return { id: "rec-filial-prod", multiplicador: 1 };
    }
    if (["2655", "2678"].includes(codigo) || t.includes("REVENDA") || t.includes("MERCADORIA")) return { id: "rec-matriz-rev", multiplicador: 1 };
    return { id: "rec-matriz-prod", multiplicador: 1 };
  }

  if (classificacao.startsWith("4.1.03")) return { id: "deducoes", multiplicador: -1 };
  if (codigo === "25944") return { id: "cpv-m", multiplicador: -1 };
  if (codigo === "25945") return { id: "cpv-f", multiplicador: -1 };
  if (classificacao.startsWith("5.1")) return { id: cc === "502" ? "cmv-f" : "cmv-m", multiplicador: -1 };
  if (classificacao.startsWith("4.2")) return { id: "outros-custos", multiplicador: -1 };

  if (codigo === "25946") return { id: "credito-pis", multiplicador: -1 };
  if (codigo === "25947") return { id: "credito-cofins", multiplicador: -1 };
  if (classificacao.startsWith("5.8")) return { id: "fin-desp", multiplicador: -1 };
  if (classificacao.startsWith("5.7.12") || classificacao.startsWith("4.1.05.001")) return { id: "fin-rec", multiplicador: -1 };

  if (classificacao.startsWith("5.9")) {
    if (codigo === "4736" || t.includes("ALIENA")) return { id: "alienacao", multiplicador: 1 };
    if (t.includes("BAIXA") || (t.includes("CUSTO") && t.includes("ALIENA"))) return { id: "baixa", multiplicador: -1 };
    if (t.includes("VINTER")) return { id: "rec-vinter", multiplicador: 1 };
    if (t.includes("SINISTR")) return { id: "sinistros", multiplicador: 1 };
    if (t.includes("EQUIVAL")) return { id: "equiv", multiplicador: 1 };
    return { id: "outras", multiplicador: 1 };
  }

  if (!(classificacao.startsWith("5.3") || classificacao.startsWith("5.7"))) return null;
  if (cc === "502") return { id: "comercial-sp", multiplicador: -1 };
  if (lancamento.documento.startsWith("11.02.003") || t.includes("NPLOG")) return { id: "nplog", multiplicador: -1 };
  if (classificacao.startsWith("5.7.05") || classificacao.startsWith("5.7.01.015")) return { id: "veiculos", multiplicador: -1 };
  if (classificacao.startsWith("5.7.01.009") || classificacao.startsWith("5.7.03.007")) return { id: "barracao", multiplicador: -1 };
  if (classificacao.startsWith("5.7.01.011")) return { id: "imobilizado", multiplicador: -1 };
  if (classificacao.startsWith("5.7.09")) return { id: "tributarias", multiplicador: -1 };
  if (codigo === "25937" || t.includes("INDUSTRIALIZA")) return { id: "industrializacao", multiplicador: -1 };
  if (ccProducao.has(cc)) return { id: "producao", multiplicador: -1 };
  if (ccComercial.has(cc)) return { id: "comerciais", multiplicador: -1 };
  if (ccAdministrativo.has(cc) || classificacao.startsWith("5.7.03")) return { id: "adm", multiplicador: -1 };
  return { id: "despesas-nao-mapeadas", multiplicador: -1 };
}

function adicionarComposicao(linha: LinhaComparacaoDre, conta: ComposicaoDre) {
  const existente = linha.composicao.find((item) => item.chave === conta.chave);
  if (!existente) {
    linha.composicao.push(conta);
    return;
  }
  existente.debitos = arred(existente.debitos + conta.debitos);
  existente.creditos = arred(existente.creditos + conta.creditos);
  existente.valorLinha = arred(existente.valorLinha + conta.valorLinha);
  existente.lancamentos += conta.lancamentos;
}

function soma(map: Map<string, LinhaComparacaoDre>, ids: string[]) {
  return arred(ids.reduce((total, id) => total + (map.get(id)?.calculado ?? 0), 0));
}

function recalcularDerivadas(map: Map<string, LinhaComparacaoDre>) {
  const set = (id: string, valor: number) => {
    const linha = map.get(id);
    if (!linha) return;
    linha.calculado = arred(valor);
    linha.diferenca = arred(linha.calculado - linha.enviado);
  };

  set("receita", soma(map, idsReceita));
  set("deducoes", soma(map, idsDeducoes));
  set("custos", soma(map, idsCustos));
  set("lucro-bruto", (map.get("receita")?.calculado ?? 0) - (map.get("deducoes")?.calculado ?? 0) - (map.get("custos")?.calculado ?? 0));

  set("fin-liq", (map.get("fin-desp")?.calculado ?? 0) + (map.get("fin-rec")?.calculado ?? 0));
  set("despesas", soma(map, idsOperacionais) + (map.get("fin-liq")?.calculado ?? 0));
  set("despesas-liquidas", (map.get("despesas")?.calculado ?? 0) + (map.get("credito-pis")?.calculado ?? 0) + (map.get("credito-cofins")?.calculado ?? 0));
  set("resultado-op", (map.get("lucro-bruto")?.calculado ?? 0) - (map.get("despesas-liquidas")?.calculado ?? 0));

  set(
    "nao-op",
    (map.get("alienacao")?.calculado ?? 0)
      - (map.get("baixa")?.calculado ?? 0)
      + (map.get("rec-vinter")?.calculado ?? 0)
      + (map.get("sinistros")?.calculado ?? 0)
      + (map.get("outras")?.calculado ?? 0)
      + (map.get("equiv")?.calculado ?? 0),
  );
  set("lucro-liq", (map.get("resultado-op")?.calculado ?? 0) + (map.get("nao-op")?.calculado ?? 0));
}

export function useDreComReclassificacoes() {
  const { reclassificacoes } = useReclassificacoesInteligentes("2026-06");

  return useMemo(() => {
    const linhas = comparacaoBase.map((linha) => ({
      ...linha,
      composicao: linha.composicao.map((item) => ({ ...item })),
    }));
    const map = new Map(linhas.map((linha) => [linha.id, linha]));

    // O identificador interno foi preservado por compatibilidade com a versão anterior.
    // O valor é de 06/2026 e agora possui lançamento contábil explícito no Razão.
    const ajusteJunho = map.get("ajuste-jul");
    if (ajusteJunho) {
      ajusteJunho.descricao = "Ajuste de estoque incorporado ao fechamento final de 06/2026";
      ajusteJunho.calculado = ajusteJunho.enviado;
      ajusteJunho.criterio = "Contabilizado no Razão em 30/06/2026: D 25135 - Estoque de Matéria-Prima / C 25944 - CPV Matriz, R$ 82.536,10. O inventário oficial e o lucro final de junho já incorporam este ajuste; não repetir em 07/2026.";
      ajusteJunho.diferenca = 0;
    }

    const ajustes = gerarLancamentosReclassificacao(lancamentosIntegrados, reclassificacoes);

    for (const ajuste of ajustes) {
      const pontas = [
        { codigo: ajuste.debitoCodigo, debitos: ajuste.valor, creditos: 0, efeito: -ajuste.valor },
        { codigo: ajuste.creditoCodigo, debitos: 0, creditos: ajuste.valor, efeito: ajuste.valor },
      ];

      for (const ponta of pontas) {
        const destino = resolverLinha(ponta.codigo, ajuste);
        if (!destino || destino.id === "deducoes") continue;
        const linha = map.get(destino.id);
        const conta = plano.get(ponta.codigo);
        if (!linha || !conta) continue;

        const delta = arred(ponta.efeito * destino.multiplicador);
        linha.calculado = arred(linha.calculado + delta);
        linha.diferenca = arred(linha.calculado - linha.enviado);
        adicionarComposicao(linha, {
          chave: `${ponta.codigo}|${ajuste.cc}|${ajuste.id}`,
          codigo: ponta.codigo,
          classificacao: conta.classificacao,
          descricao: conta.descricao,
          cc: ajuste.cc,
          centroCusto: ajuste.centroCusto,
          debitos: ponta.debitos,
          creditos: ponta.creditos,
          valorLinha: delta,
          lancamentos: 1,
          fonte: ajuste.fonte,
          observacao: ajuste.observacao,
        });
      }
    }

    recalcularDerivadas(map);

    const comparacaoDreDetalhada = linhas;
    const receita = map.get("receita")?.calculado ?? 0;
    const deducoes = map.get("deducoes")?.calculado ?? 0;
    const custos = map.get("custos")?.calculado ?? 0;
    const despesas = map.get("despesas")?.calculado ?? 0;
    const despesasLiquidas = map.get("despesas-liquidas")?.calculado ?? 0;
    const resultadoOperacional = map.get("resultado-op")?.calculado ?? 0;
    const resultadoLiquido = map.get("lucro-liq")?.calculado ?? 0;
    const resultadoLiquidoEnviado = map.get("lucro-liq")?.enviado ?? 0;

    return {
      comparacaoDreDetalhada,
      resumoDreDetalhada: {
        receitaCalculada: receita,
        deducoesCalculadas: deducoes,
        custosCalculados: custos,
        despesasAntesCreditosCalculadas: despesas,
        creditoPisDespesas: map.get("credito-pis")?.calculado ?? 0,
        creditoCofinsDespesas: map.get("credito-cofins")?.calculado ?? 0,
        despesasLiquidasCalculadas: despesasLiquidas,
        resultadoOperacionalCalculado: resultadoOperacional,
        resultadoLiquidoCalculado: resultadoLiquido,
        resultadoLiquidoEnviado,
        diferencaResultado: arred(resultadoLiquido - resultadoLiquidoEnviado),
        linhasComDiferenca: comparacaoDreDetalhada.filter((item) => Math.abs(item.diferenca) > 0.01).length,
        totalLinhas: comparacaoDreDetalhada.length,
      },
      reclassificacoes,
      ajustes,
    };
  }, [reclassificacoes]);
}
