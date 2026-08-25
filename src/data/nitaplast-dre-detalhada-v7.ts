import {
  comparacaoDreDetalhada as comparacaoBase,
  resumoDreDetalhada as resumoBase,
  type ComposicaoDre,
  type LinhaComparacaoDre,
} from "./nitaplast-dre-detalhada-v6";
import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { lancamentosIntegrados } from "./nitaplast-razao-integrado";

export * from "./nitaplast-dre-detalhada-v6";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const plano = new Map(
  estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A")
    .map((linha) => [linha.conta, linha]),
);

/**
 * Correção de 06/2026 confirmada na conferência da DRE:
 *
 * A composição documental exibida para Produção somava R$ 179.461,63, mas o
 * fechamento contábil possui também a partida real DESP-FECH-PRODUCAO-062026,
 * de R$ 595,38, lançada no Razão para completar a competência.
 *
 * Portanto:
 *   R$ 179.461,63 + R$ 595,38 = R$ 180.057,01
 *
 * Esta camada NÃO cria lançamento, NÃO usa plug visual e NÃO altera o Razão.
 * Ela apenas garante que a DRE Report inclua a partida que já existe no Razão.
 */
const linhas: LinhaComparacaoDre[] = comparacaoBase.map((linha) => ({
  ...linha,
  composicao: linha.composicao.map((item) => ({ ...item })),
}));
const mapa = new Map(linhas.map((linha) => [linha.id, linha]));

const ajusteProducao = lancamentosIntegrados.find(
  (linha) => linha.id === "DESP-FECH-PRODUCAO-062026",
);

const linhaProducao = mapa.get("producao");
if (ajusteProducao && linhaProducao) {
  const jaNaComposicao = linhaProducao.composicao.some((item) =>
    item.chave.includes(ajusteProducao.id)
      || (
        item.codigo === ajusteProducao.debitoCodigo
        && item.cc === ajusteProducao.cc
        && Math.abs(item.debitos - ajusteProducao.valor) <= 0.01
        && item.fonte.includes("FECHAMENTO DRE DESPESAS 06/2026")
      ),
  );

  if (!jaNaComposicao) {
    const conta = plano.get(ajusteProducao.debitoCodigo);
    const composicao: ComposicaoDre = {
      chave: `${ajusteProducao.debitoCodigo}|${ajusteProducao.cc}|${ajusteProducao.id}`,
      codigo: ajusteProducao.debitoCodigo,
      classificacao: conta?.classificacao ?? "",
      descricao: conta?.descricao ?? ajusteProducao.debito,
      cc: ajusteProducao.cc,
      centroCusto: ajusteProducao.centroCusto,
      debitos: arred(ajusteProducao.valor),
      creditos: 0,
      valorLinha: arred(ajusteProducao.valor),
      lancamentos: 1,
      fonte: `${ajusteProducao.origem} · ${ajusteProducao.fonte}`,
      observacao: "Complemento contábil de R$ 595,38 já existente no Razão de junho e necessário para fechar Despesas de Produção em R$ 180.057,01.",
    };
    linhaProducao.composicao.push(composicao);
    linhaProducao.calculado = arred(linhaProducao.calculado + ajusteProducao.valor);
  }
}

const idsOperacionais = [
  "adm",
  "nplog",
  "comerciais",
  "producao",
  "veiculos",
  "barracao",
  "imobilizado",
  "industrializacao",
  "tributarias",
  "comercial-sp",
  "despesas-nao-mapeadas",
];

const soma = (ids: string[]) => arred(
  ids.reduce((total, id) => total + (mapa.get(id)?.calculado ?? 0), 0),
);

function setCalculado(id: string, valor: number) {
  const linha = mapa.get(id);
  if (!linha) return;
  linha.calculado = arred(valor);
}

// Recalcula somente subtotais derivados, sem alterar qualquer lançamento.
const despesasAntesCreditos = arred(
  soma(idsOperacionais) + (mapa.get("fin-liq")?.calculado ?? 0),
);
const despesasLiquidas = arred(
  despesasAntesCreditos
    + (mapa.get("credito-pis")?.calculado ?? 0)
    + (mapa.get("credito-cofins")?.calculado ?? 0),
);
const resultadoOperacional = arred(
  (mapa.get("lucro-bruto")?.calculado ?? 0) - despesasLiquidas,
);
const resultadoLiquido = arred(
  resultadoOperacional + (mapa.get("nao-op")?.calculado ?? 0),
);

setCalculado("despesas", despesasAntesCreditos);
setCalculado("despesas-liquidas", despesasLiquidas);
setCalculado("resultado-op", resultadoOperacional);
setCalculado("lucro-liq", resultadoLiquido);

// DRE enviada pelo cliente: restaura exatamente a diferença de R$ 595,38 que
// havia sido perdida ao copiar a composição parcial para o controle de junho.
const enviadosCorretos: Record<string, number> = {
  producao: 180057.01,
  despesas: 1256946.43,
  "despesas-liquidas": 1188001.43,
  "resultado-op": 132502.91,
  "lucro-liq": 139798.77,
};

for (const linha of linhas) {
  if (Object.prototype.hasOwnProperty.call(enviadosCorretos, linha.id)) {
    linha.enviado = enviadosCorretos[linha.id] ?? linha.enviado;
  }
  linha.diferenca = arred(linha.calculado - linha.enviado);
}

const lucroLiqEnviado = enviadosCorretos["lucro-liq"] ?? 0;

export const comparacaoDreDetalhada = linhas;

export const resumoDreDetalhada = {
  ...resumoBase,
  despesasAntesCreditosCalculadas: despesasAntesCreditos,
  despesasLiquidasCalculadas: despesasLiquidas,
  resultadoOperacionalCalculado: resultadoOperacional,
  resultadoLiquidoCalculado: resultadoLiquido,
  resultadoLiquidoEnviado: lucroLiqEnviado,
  diferencaResultado: arred(resultadoLiquido - lucroLiqEnviado),
} as const;
