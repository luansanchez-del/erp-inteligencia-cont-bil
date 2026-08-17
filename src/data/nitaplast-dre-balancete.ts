import { dreCompletaJunho } from "./nitaplast-dre-completa";
import { saldosImplantacao } from "./nitaplast-implantacao";
import { lancamentosIntegrados, type LancamentoIntegrado } from "./nitaplast-razao-integrado";

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

export type ApuracaoDreBalancete = {
  contasResultado: ContaResultadoJunho[];
  contasPorGrupo: Record<GrupoDreBalancete, ContaResultadoJunho[]>;
  resumo: {
    receitaBruta: number;
    deducoes: number;
    custos: number;
    despesasOperacionais: number;
    receitasFinanceiras: number;
    despesasFinanceiras: number;
    resultadoNaoOperacional: number;
    contasSemVinculo: number;
    valorSemVinculo: number;
  };
  resultadoOperacional: number;
  resultadoLiquido: number;
};

const plano = new Map(saldosImplantacao.map((conta) => [conta.conta, conta]));
const arred = (valor: number) => Math.round(valor * 100) / 100;

export function classificarGrupoDre(classificacao: string, descricao: string): GrupoDreBalancete {
  const d = descricao.toLocaleUpperCase("pt-BR");

  if (d.includes("DEVOLUÇÃO") || d.includes("DEVOLUCAO")) return "deducoes";
  if (classificacao.startsWith("4.1.01")) return "receita";
  if (classificacao.startsWith("4.1.03.005")) return "deducoes";

  // CUSTOS: CPV/CMV e demais contas de custo. Contas 5.3 são despesas
  // operacionais na estrutura gerencial da Nitaplast e não reduzem o Lucro Bruto.
  if (classificacao.startsWith("4.2.") || classificacao.startsWith("5.1.")) return "custos";

  if (classificacao.startsWith("4.1.05") || classificacao.startsWith("5.7.12")) return "receitas-financeiras";
  if (classificacao.startsWith("5.8.")) return "despesas-financeiras";
  if (classificacao.startsWith("5.9.")) return "nao-operacional";

  if (
    classificacao.startsWith("5.3.")
    || classificacao.startsWith("5.7.01")
    || classificacao.startsWith("5.7.03")
    || classificacao.startsWith("5.7.05")
    || classificacao.startsWith("5.7.09")
  ) return "despesas-operacionais";

  return "sem-vinculo";
}

/**
 * Motor da DRE Oficial/Report.
 * Recebe exatamente o conjunto de partidas que alimenta o Balancete no momento.
 * Não consulta a DRE enviada e não usa valores-alvo para formar o resultado.
 *
 * Regra contábil das deduções:
 * - devoluções/descontos: movimento líquido da própria conta;
 * - impostos incidentes sobre vendas (4.1.03.005): débito BRUTO das saídas;
 * - créditos fiscais de aquisição/reversões permanecem no Razão/Balancete e não
 *   diminuem a linha de imposto sobre vendas da DRE.
 */
export function calcularDreBalancete(lancamentos: LancamentoIntegrado[]): ApuracaoDreBalancete {
  const movimento = new Map<string, { debitos: number; creditos: number }>();

  for (const lancamento of lancamentos) {
    const debito = movimento.get(lancamento.debitoCodigo) ?? { debitos: 0, creditos: 0 };
    debito.debitos += lancamento.valor;
    movimento.set(lancamento.debitoCodigo, debito);

    const credito = movimento.get(lancamento.creditoCodigo) ?? { debitos: 0, creditos: 0 };
    credito.creditos += lancamento.valor;
    movimento.set(lancamento.creditoCodigo, credito);
  }

  const contasResultado = [...movimento.entries()]
    .map(([codigo, valores]) => {
      const conta = plano.get(codigo);
      if (!conta || (!conta.classificacao.startsWith("4.") && !conta.classificacao.startsWith("5."))) return null;
      const resultado = arred(valores.creditos - valores.debitos);
      if (Math.abs(resultado) < 0.005 && Math.abs(valores.debitos) < 0.005 && Math.abs(valores.creditos) < 0.005) return null;
      return {
        codigo,
        classificacao: conta.classificacao,
        descricao: conta.descricao,
        debitos: arred(valores.debitos),
        creditos: arred(valores.creditos),
        resultado,
        grupo: classificarGrupoDre(conta.classificacao, conta.descricao),
      } satisfies ContaResultadoJunho;
    })
    .filter((conta): conta is ContaResultadoJunho => Boolean(conta))
    .sort((a, b) => a.classificacao.localeCompare(b.classificacao, "pt-BR") || a.codigo.localeCompare(b.codigo, "pt-BR"));

  const contasPorGrupo = contasResultado.reduce<Record<GrupoDreBalancete, ContaResultadoJunho[]>>((grupos, conta) => {
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

  const somaResultado = (grupo: GrupoDreBalancete) => arred(
    contasPorGrupo[grupo].reduce((total, conta) => total + conta.resultado, 0),
  );

  // Para impostos sobre vendas usamos o débito bruto do Balancete, não o saldo
  // líquido da conta. Para devoluções/descontos mantemos o movimento líquido.
  const deducoes = arred(contasPorGrupo.deducoes.reduce((total, conta) => {
    if (conta.classificacao.startsWith("4.1.03.005")) {
      return total + conta.debitos;
    }
    return total + conta.debitos - conta.creditos;
  }, 0));

  const resumo = {
    receitaBruta: somaResultado("receita"),
    deducoes,
    custos: -somaResultado("custos"),
    despesasOperacionais: -somaResultado("despesas-operacionais"),
    receitasFinanceiras: somaResultado("receitas-financeiras"),
    despesasFinanceiras: -somaResultado("despesas-financeiras"),
    resultadoNaoOperacional: somaResultado("nao-operacional"),
    contasSemVinculo: contasPorGrupo["sem-vinculo"].length,
    valorSemVinculo: somaResultado("sem-vinculo"),
  };

  const resultadoOperacional = arred(
    resumo.receitaBruta
      - resumo.deducoes
      - resumo.custos
      - resumo.despesasOperacionais
      + resumo.receitasFinanceiras
      - resumo.despesasFinanceiras,
  );

  // Toda conta de resultado do Balancete entra no lucro líquido. Se existir conta
  // ainda sem grupo gerencial, ela não desaparece do resultado contábil.
  const resultadoLiquido = arred(
    resultadoOperacional
      + resumo.resultadoNaoOperacional
      + resumo.valorSemVinculo,
  );

  return { contasResultado, contasPorGrupo, resumo, resultadoOperacional, resultadoLiquido };
}

// Base sem reclassificações locais: mantida por compatibilidade das telas de validação.
const apuracaoBase = calcularDreBalancete(lancamentosIntegrados);
export const contasResultadoJunho = apuracaoBase.contasResultado;
export const contasResultadoPorGrupo = apuracaoBase.contasPorGrupo;
export const resumoDreBalancete = apuracaoBase.resumo;
export const resultadoOperacionalBalancete = apuracaoBase.resultadoOperacional;
export const resultadoLiquidoBalancete = apuracaoBase.resultadoLiquido;

// A partir daqui existe somente controle da DRE de Validação. Esses valores NÃO
// alimentam o motor da DRE Oficial acima.
const valorControle = (id: string) => dreCompletaJunho.find((linha) => linha.id === id)?.valor ?? 0;
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
  diferenca: arred(linha.apuradoBalancete - linha.controleEsperado),
}));

export const diferencaAbsolutaDre = comparacaoDreBalancete
  .filter((linha) => linha.id !== "resultado")
  .reduce((total, linha) => total + Math.abs(linha.diferenca), 0);
