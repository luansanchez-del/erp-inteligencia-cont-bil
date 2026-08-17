import {
  comparacaoDreDetalhada as comparacaoBase,
  resumoDreDetalhada as resumoBase,
  type ComposicaoDre,
  type LinhaComparacaoDre,
} from "./nitaplast-dre-detalhada-v5";
import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { lancamentosIntegrados } from "./nitaplast-razao-integrado";

export * from "./nitaplast-dre-detalhada-v5";

const arred = (valor: number) => Math.round(valor * 100) / 100;

const plano = new Map(
  estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A")
    .map((linha) => [linha.conta, linha]),
);

function ehReceitaFinanceira(codigo: string) {
  const conta = plano.get(codigo);
  if (!conta) return false;
  const classificacao = conta.classificacao;
  const descricao = conta.descricao.toLocaleUpperCase("pt-BR");

  if (classificacao.startsWith("4.1.05.001")) return true;
  if (!classificacao.startsWith("5.7.12")) return false;

  // Estas contas pertencem ao agrupamento histórico 5.7.12 do plano,
  // mas não são juros/rendimentos financeiros para a DRE.
  if (descricao.includes("RECUPERAÇÃO") || descricao.includes("RECUPERACAO")) return false;
  if (descricao.includes("AMOSTRA")) return false;
  if (descricao.includes("RECEITA EVENTUAL") || descricao.includes("RECEITAS EVENTUAIS")) return false;
  return true;
}

function ehDespesaFinanceira(codigo: string) {
  const conta = plano.get(codigo);
  return Boolean(conta?.classificacao.startsWith("5.8"));
}

type Acumulado = {
  codigo: string;
  cc: string;
  centroCusto: string;
  debitos: number;
  creditos: number;
  lancamentos: number;
  fontes: Set<string>;
};

function montarComposicao(tipo: "receita" | "despesa"): ComposicaoDre[] {
  const acumulados = new Map<string, Acumulado>();

  const acumular = (
    codigo: string,
    cc: string,
    centroCusto: string,
    debito: number,
    credito: number,
    fonte: string,
  ) => {
    const chave = `${codigo}|${cc}`;
    const atual = acumulados.get(chave) ?? {
      codigo,
      cc,
      centroCusto,
      debitos: 0,
      creditos: 0,
      lancamentos: 0,
      fontes: new Set<string>(),
    };
    atual.debitos += debito;
    atual.creditos += credito;
    atual.lancamentos += 1;
    atual.fontes.add(fonte);
    acumulados.set(chave, atual);
  };

  for (const lancamento of lancamentosIntegrados) {
    if (tipo === "receita") {
      if (ehReceitaFinanceira(lancamento.debitoCodigo)) {
        acumular(
          lancamento.debitoCodigo,
          lancamento.cc,
          lancamento.centroCusto,
          lancamento.valor,
          0,
          `${lancamento.origem} · ${lancamento.fonte}`,
        );
      }
      if (ehReceitaFinanceira(lancamento.creditoCodigo)) {
        acumular(
          lancamento.creditoCodigo,
          lancamento.cc,
          lancamento.centroCusto,
          0,
          lancamento.valor,
          `${lancamento.origem} · ${lancamento.fonte}`,
        );
      }
    } else {
      if (ehDespesaFinanceira(lancamento.debitoCodigo)) {
        acumular(
          lancamento.debitoCodigo,
          lancamento.cc,
          lancamento.centroCusto,
          lancamento.valor,
          0,
          `${lancamento.origem} · ${lancamento.fonte}`,
        );
      }
      if (ehDespesaFinanceira(lancamento.creditoCodigo)) {
        acumular(
          lancamento.creditoCodigo,
          lancamento.cc,
          lancamento.centroCusto,
          0,
          lancamento.valor,
          `${lancamento.origem} · ${lancamento.fonte}`,
        );
      }
    }
  }

  return [...acumulados.values()]
    .map((item) => {
      const conta = plano.get(item.codigo);
      return {
        chave: `${item.codigo}|${item.cc}|financeiro-razao-062026`,
        codigo: item.codigo,
        classificacao: conta?.classificacao ?? "",
        descricao: conta?.descricao ?? "Conta a revisar",
        cc: item.cc,
        centroCusto: item.centroCusto,
        debitos: arred(item.debitos),
        creditos: arred(item.creditos),
        // Tanto receita quanto despesa seguem a apresentação da DRE:
        // despesa = débito - crédito; receita financeira = redutora, portanto
        // também é apresentada como débito - crédito (normalmente negativa).
        valorLinha: arred(item.debitos - item.creditos),
        lancamentos: item.lancamentos,
        fonte: [...item.fontes].join(" · "),
        observacao: tipo === "receita"
          ? "Receita financeira reconstruída diretamente pelos débitos/créditos do Razão de 06/2026."
          : "Despesa financeira reconstruída diretamente pelos débitos/créditos do Razão de 06/2026.",
      } satisfies ComposicaoDre;
    })
    .filter((item) => Math.abs(item.debitos) >= 0.005 || Math.abs(item.creditos) >= 0.005)
    .sort((a, b) => Math.abs(b.valorLinha) - Math.abs(a.valorLinha));
}

const composicaoReceitasFinanceiras = montarComposicao("receita");
const composicaoDespesasFinanceiras = montarComposicao("despesa");

const receitasFinanceirasCalculadas = arred(
  -composicaoReceitasFinanceiras.reduce((total, item) => total + item.valorLinha, 0),
);
const despesasFinanceirasCalculadas = arred(
  composicaoDespesasFinanceiras.reduce((total, item) => total + item.valorLinha, 0),
);
const resultadoFinanceiroLiquido = arred(despesasFinanceirasCalculadas - receitasFinanceirasCalculadas);

const linhas: LinhaComparacaoDre[] = comparacaoBase.map((linha) => ({
  ...linha,
  composicao: linha.composicao.map((item) => ({ ...item })),
}));
const mapa = new Map(linhas.map((linha) => [linha.id, linha]));

function atualizar(id: string, calculado: number, composicao: ComposicaoDre[], criterio: string) {
  const linha = mapa.get(id);
  if (!linha) return;
  linha.calculado = arred(calculado);
  linha.diferenca = arred(linha.calculado - linha.enviado);
  linha.composicao = composicao;
  linha.criterio = criterio;
}

atualizar(
  "fin-rec",
  -receitasFinanceirasCalculadas,
  composicaoReceitasFinanceiras,
  "Receitas financeiras calculadas exclusivamente pelos lançamentos do Razão de 06/2026. Inclui Juros Ativos (25095), Receita s/ Aplicação Financeira (25098) e demais contas financeiras válidas do plano; não usa a DRE enviada como fonte.",
);
atualizar(
  "fin-desp",
  despesasFinanceirasCalculadas,
  composicaoDespesasFinanceiras,
  "Despesas financeiras calculadas exclusivamente pelas contas 5.8 movimentadas no Razão de 06/2026, incluindo Juros Passivos (25103), despesas bancárias/IOF, JCP (25107) e demais contas financeiras efetivamente lançadas.",
);
atualizar(
  "fin-liq",
  resultadoFinanceiroLiquido,
  [...composicaoDespesasFinanceiras, ...composicaoReceitasFinanceiras],
  "Resultado financeiro líquido = despesas financeiras do Razão menos receitas financeiras do Razão. Nenhum valor é criado para fechar a DRE enviada.",
);

const idsOperacionais = ["adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp", "despesas-nao-mapeadas"];
const soma = (ids: string[]) => arred(ids.reduce((total, id) => total + (mapa.get(id)?.calculado ?? 0), 0));

const despesasAntesCreditos = arred(soma(idsOperacionais) + resultadoFinanceiroLiquido);
const despesasLiquidas = arred(
  despesasAntesCreditos
  + (mapa.get("credito-pis")?.calculado ?? 0)
  + (mapa.get("credito-cofins")?.calculado ?? 0),
);
const resultadoOperacional = arred((mapa.get("lucro-bruto")?.calculado ?? 0) - despesasLiquidas);
const resultadoLiquido = arred(resultadoOperacional + (mapa.get("nao-op")?.calculado ?? 0));

atualizar(
  "despesas",
  despesasAntesCreditos,
  mapa.get("despesas")?.composicao ?? [],
  "Despesas operacionais antes dos créditos, recalculadas com o resultado financeiro que nasce do Razão de 06/2026.",
);
atualizar(
  "despesas-liquidas",
  despesasLiquidas,
  [],
  "Despesas operacionais recalculadas pelo Razão, líquidas dos créditos de PIS/COFINS apresentados separadamente.",
);
atualizar(
  "resultado-op",
  resultadoOperacional,
  [],
  "Lucro bruto menos despesas operacionais líquidas, já incorporando Juros Ativos e Juros Passivos efetivamente lançados no Razão de junho.",
);
atualizar(
  "lucro-liq",
  resultadoLiquido,
  [],
  "Resultado operacional recalculado pelo Razão/Balancete mais resultado não operacional do período.",
);

export const comparacaoDreDetalhada = linhas;

export const resumoDreDetalhada = {
  ...resumoBase,
  despesasAntesCreditosCalculadas: despesasAntesCreditos,
  despesasLiquidasCalculadas: despesasLiquidas,
  resultadoOperacionalCalculado: resultadoOperacional,
  resultadoLiquidoCalculado: resultadoLiquido,
  diferencaResultado: arred(resultadoLiquido - (mapa.get("lucro-liq")?.enviado ?? 0)),
  receitasFinanceirasCalculadas,
  despesasFinanceirasCalculadas,
  resultadoFinanceiroLiquido,
} as const;
