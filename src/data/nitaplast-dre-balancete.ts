import { dreCompletaJunho } from "./nitaplast-dre-completa";
import { saldosImplantacao } from "./nitaplast-implantacao";
import { lancamentosIntegrados } from "./nitaplast-razao-integrado";

export type GrupoDreBalancete =
  | "receita"
  | "deducoes"
  | "custos"
  | "despesas-operacionais"
  | "receitas-financeiras"
  | "despesas-financeiras"
  | "nao-operacional"
  | "sem-vinculo";

export type ContaResultadoJunho = {
  codigo: string;
  classificacao: string;
  descricao: string;
  debitos: number;
  creditos: number;
  resultado: number;
  grupo: GrupoDreBalancete;
};

export type LinhaComparacaoDre = {
  id: GrupoDreBalancete | "resultado";
  descricao: string;
  apuradoBalancete: number;
  controleEsperado: number;
  diferenca: number;
  natureza: "receita" | "deducao" | "custo" | "despesa" | "resultado";
};

const plano = new Map(saldosImplantacao.map((conta) => [conta.conta, conta]));
const movimento = new Map<string, { debitos: number; creditos: number }>();

for (const lancamento of lancamentosIntegrados) {
  const debito = movimento.get(lancamento.debitoCodigo) ?? { debitos: 0, creditos: 0 };
  debito.debitos += lancamento.valor;
  movimento.set(lancamento.debitoCodigo, debito);

  const credito = movimento.get(lancamento.creditoCodigo) ?? { debitos: 0, creditos: 0 };
  credito.creditos += lancamento.valor;
  movimento.set(lancamento.creditoCodigo, credito);
}

function classificarGrupo(classificacao: string, descricao: string): GrupoDreBalancete {
  const d = descricao.toLocaleUpperCase("pt-BR");

  // A devolução está aberta dentro do grupo de receita no plano atual, mas na DRE é dedução.
  if (d.includes("DEVOLUÇÃO") || d.includes("DEVOLUCAO")) return "deducoes";

  if (classificacao.startsWith("4.1.01")) return "receita";
  if (classificacao.startsWith("4.1.03.005")) return "deducoes";

  // No plano da Nitaplast, compras/custos industriais (5.1/5.3) e CPV (4.2)
  // formam o bloco de custo. Não são somados às despesas administrativas.
  if (classificacao.startsWith("4.2.") || classificacao.startsWith("5.1.") || classificacao.startsWith("5.3.")) return "custos";

  // Receitas financeiras e recuperações existem em dois ramos históricos do plano.
  if (classificacao.startsWith("4.1.05") || classificacao.startsWith("5.7.12")) return "receitas-financeiras";

  if (classificacao.startsWith("5.8.")) return "despesas-financeiras";
  if (classificacao.startsWith("5.9.")) return "nao-operacional";

  // Despesas operacionais propriamente ditas. Créditos dentro desses grupos
  // (ex.: PIS/COFINS sobre custos e despesas) reduzem o valor líquido automaticamente.
  if (classificacao.startsWith("5.7.01") || classificacao.startsWith("5.7.03") || classificacao.startsWith("5.7.09")) return "despesas-operacionais";

  return "sem-vinculo";
}

export const contasResultadoJunho: ContaResultadoJunho[] = [...movimento.entries()]
  .map(([codigo, valores]) => {
    const conta = plano.get(codigo);
    if (!conta || (!conta.classificacao.startsWith("4.") && !conta.classificacao.startsWith("5."))) return null;
    const resultado = valores.creditos - valores.debitos;
    if (Math.abs(resultado) < 0.005 && Math.abs(valores.debitos) < 0.005 && Math.abs(valores.creditos) < 0.005) return null;
    return {
      codigo,
      classificacao: conta.classificacao,
      descricao: conta.descricao,
      debitos: valores.debitos,
      creditos: valores.creditos,
      resultado,
      grupo: classificarGrupo(conta.classificacao, conta.descricao),
    } satisfies ContaResultadoJunho;
  })
  .filter((conta): conta is ContaResultadoJunho => Boolean(conta))
  .sort((a, b) => a.classificacao.localeCompare(b.classificacao, "pt-BR") || a.codigo.localeCompare(b.codigo, "pt-BR"));

export const contasResultadoPorGrupo = contasResultadoJunho.reduce<Record<GrupoDreBalancete, ContaResultadoJunho[]>>((grupos, conta) => {
  grupos[conta.grupo].push(conta);
  return grupos;
}, {
  receita: [],
  deducoes: [],
  custos: [],
  "despesas-operacionais": [],
  "receitas-financeiras": [],
  "despesas-financeiras": [],
  "nao-operacional": [],
  "sem-vinculo": [],
});

const somaResultado = (grupo: GrupoDreBalancete) => contasResultadoPorGrupo[grupo].reduce((total, conta) => total + conta.resultado, 0);
const valorControle = (id: string) => dreCompletaJunho.find((linha) => linha.id === id)?.valor ?? 0;

export const resumoDreBalancete = {
  receitaBruta: somaResultado("receita"),
  deducoes: -somaResultado("deducoes"),
  custos: -somaResultado("custos"),
  despesasOperacionais: -somaResultado("despesas-operacionais"),
  receitasFinanceiras: somaResultado("receitas-financeiras"),
  despesasFinanceiras: -somaResultado("despesas-financeiras"),
  resultadoNaoOperacional: somaResultado("nao-operacional"),
  contasSemVinculo: contasResultadoPorGrupo["sem-vinculo"].length,
  valorSemVinculo: somaResultado("sem-vinculo"),
} as const;

export const resultadoOperacionalBalancete =
  resumoDreBalancete.receitaBruta
  - resumoDreBalancete.deducoes
  - resumoDreBalancete.custos
  - resumoDreBalancete.despesasOperacionais
  + resumoDreBalancete.receitasFinanceiras
  - resumoDreBalancete.despesasFinanceiras;

export const resultadoLiquidoBalancete =
  resultadoOperacionalBalancete
  + resumoDreBalancete.resultadoNaoOperacional
  + resumoDreBalancete.valorSemVinculo;

const despesasOperacionaisControle = valorControle("despesas-liquidas") - valorControle("fin-liq");

const comparacoesBase: Omit<LinhaComparacaoDre, "diferenca">[] = [
  { id: "receita", descricao: "Receita operacional bruta", apuradoBalancete: resumoDreBalancete.receitaBruta, controleEsperado: valorControle("receita"), natureza: "receita" },
  { id: "deducoes", descricao: "Deduções da receita", apuradoBalancete: resumoDreBalancete.deducoes, controleEsperado: valorControle("deducoes"), natureza: "deducao" },
  { id: "custos", descricao: "Custos / CPV / CMV", apuradoBalancete: resumoDreBalancete.custos, controleEsperado: valorControle("custos"), natureza: "custo" },
  { id: "despesas-operacionais", descricao: "Despesas operacionais líquidas (sem financeiro)", apuradoBalancete: resumoDreBalancete.despesasOperacionais, controleEsperado: despesasOperacionaisControle, natureza: "despesa" },
  { id: "receitas-financeiras", descricao: "Receitas financeiras e recuperações", apuradoBalancete: resumoDreBalancete.receitasFinanceiras, controleEsperado: Math.abs(valorControle("fin-rec")), natureza: "receita" },
  { id: "despesas-financeiras", descricao: "Despesas financeiras", apuradoBalancete: resumoDreBalancete.despesasFinanceiras, controleEsperado: valorControle("fin-desp"), natureza: "despesa" },
  { id: "nao-operacional", descricao: "Resultado não operacional", apuradoBalancete: resumoDreBalancete.resultadoNaoOperacional, controleEsperado: valorControle("nao-op"), natureza: "resultado" },
  { id: "resultado", descricao: "Lucro / prejuízo líquido", apuradoBalancete: resultadoLiquidoBalancete, controleEsperado: valorControle("lucro-liq"), natureza: "resultado" },
];

export const comparacaoDreBalancete: LinhaComparacaoDre[] = comparacoesBase.map((linha) => ({
  ...linha,
  diferenca: linha.apuradoBalancete - linha.controleEsperado,
}));

export const diferencaAbsolutaDre = comparacaoDreBalancete
  .filter((linha) => linha.id !== "resultado")
  .reduce((total, linha) => total + Math.abs(linha.diferenca), 0);
