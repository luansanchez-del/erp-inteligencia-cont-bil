import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { saldoAberturaJulhoPorConta } from "./nitaplast-saldos-julho";
import { estabelecimentoResultadoNitaplast } from "./nitaplast-estabelecimento";

const arred = (v: number) => Math.round(v * 100) / 100;

export type EstabelecimentoResultadoJulho = "Matriz" | "Filial SP";

export type MovimentoBalanceteJulho = {
  conta: string;
  classificacao: string;
  descricao: string;
  cc: string;
  centroCusto: string;
  estabelecimento: EstabelecimentoResultadoJulho;
  debitos: number;
  creditos: number;
  movimento: number;
  status: "validado" | "revisar";
  fonte: string;
};

export type SaldoAnaliticoBalanceteJulho = {
  conta: string;
  classificacao: string;
  descricao: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  movimento: number;
  saldoAtual: number;
};

const analiticasEstrutura = estruturaBalanceteNitaplast.filter((x) => x.tipo === "A");
const contasAnaliticasEstrutura = new Set(analiticasEstrutura.map((x) => x.conta));
const classificacaoPorConta = new Map(analiticasEstrutura.map((x) => [x.conta, x.classificacao]));
const descricaoPorConta = new Map(analiticasEstrutura.map((x) => [x.conta, x.descricao]));

// Plano alvo é fallback apenas de metadado. Valor contábil continua vindo do Razão.
for (const conta of saldosImplantacao) {
  if (!classificacaoPorConta.has(conta.conta)) classificacaoPorConta.set(conta.conta, conta.classificacao);
  if (!descricaoPorConta.has(conta.conta)) descricaoPorConta.set(conta.conta, conta.descricao);
}
classificacaoPorConta.set("4760", "5.9.01.003.002");
descricaoPorConta.set("4760", "Custo Vendas do Ativo Imobilizado");

// Contas que nasceram depois da implantação de 31/05 e possuem vínculo
// documentado com o plano Domínio. Elas integram o Balancete/DRE com os saldos
// e movimentos existentes, sem criar conta de encaixe.
export const contasPosImplantacao = [
  ["290", "1.1.04.009.001", "Adiantamento de importação"],
  ["1734", "2.1.03.001.001", "Obrigação cambial em fornecedores"],
  ["4405", "5.7.01.007.005", "Despesas e adiantamentos de viagem"],
  ["4505", "5.7.05.001.001", "Combustíveis e Lubrificantes"],
] as const;
const contasPosImplantacaoConhecidas = new Set<string>(contasPosImplantacao.map(([conta]) => conta as string));
for (const [conta, classificacao, descricao] of contasPosImplantacao) {
  classificacaoPorConta.set(conta, classificacao);
  descricaoPorConta.set(conta, descricao);
}

export function calcularBalanceteJulho(base: LancamentoIntegrado[]) {
  const porConta = new Map<string, { debitos: number; creditos: number }>();
  const detalhado = new Map<string, MovimentoBalanceteJulho>();
  const contasRazao = new Set<string>();

  for (const lancamento of base) {
    for (const lado of ["D", "C"] as const) {
      const conta = lado === "D" ? lancamento.debitoCodigo : lancamento.creditoCodigo;
      const valor = lancamento.valor;
      contasRazao.add(conta);

      const total = porConta.get(conta) ?? { debitos: 0, creditos: 0 };
      if (lado === "D") total.debitos += valor;
      else total.creditos += valor;
      porConta.set(conta, total);

      const estabelecimento = estabelecimentoResultadoNitaplast(lancamento, conta) as EstabelecimentoResultadoJulho;
      const chave = `${conta}|${lancamento.cc}|${estabelecimento}`;
      const atual = detalhado.get(chave) ?? {
        conta,
        classificacao: classificacaoPorConta.get(conta) ?? "",
        descricao: descricaoPorConta.get(conta) ?? "Conta a revisar",
        cc: lancamento.cc,
        centroCusto: lancamento.centroCusto,
        estabelecimento,
        debitos: 0,
        creditos: 0,
        movimento: 0,
        status: "validado" as const,
        fonte: lancamento.fonte,
      };
      if (lado === "D") atual.debitos += valor;
      else atual.creditos += valor;
      atual.debitos = arred(atual.debitos);
      atual.creditos = arred(atual.creditos);
      atual.movimento = arred(atual.debitos - atual.creditos);
      if (lancamento.status === "revisar") atual.status = "revisar";
      detalhado.set(chave, atual);
    }
  }

  const contasRazaoSemEstrutura = [...contasRazao]
    .filter((conta) => !contasAnaliticasEstrutura.has(conta) && !contasPosImplantacaoConhecidas.has(conta))
    .sort();

  // Inclui as contas analíticas da estrutura e, defensivamente, qualquer conta do Razão
  // ainda ausente da estrutura. Assim nenhum fato contábil desaparece da conferência.
  const contasParaConferencia = new Set([...analiticasEstrutura.map((x) => x.conta), ...contasRazao]);
  const saldosAnaliticos: SaldoAnaliticoBalanceteJulho[] = [...contasParaConferencia].map((conta) => {
    const m = porConta.get(conta) ?? { debitos: 0, creditos: 0 };
    const saldoAnterior = saldoAberturaJulhoPorConta.get(conta) ?? 0;
    const movimento = arred(m.debitos - m.creditos);
    return {
      conta,
      classificacao: classificacaoPorConta.get(conta) ?? "",
      descricao: descricaoPorConta.get(conta) ?? "Conta a revisar",
      saldoAnterior: arred(saldoAnterior),
      debitos: arred(m.debitos),
      creditos: arred(m.creditos),
      movimento,
      saldoAtual: arred(saldoAnterior + movimento),
    };
  });

  const totalDebitos = arred(base.reduce((s, x) => s + x.valor, 0));
  const totalCreditos = totalDebitos;
  const somaMovimentosAnaliticos = arred(saldosAnaliticos.reduce((s, x) => s + x.movimento, 0));
  const somaSaldoAnteriorAnalitico = arred(saldosAnaliticos.reduce((s, x) => s + x.saldoAnterior, 0));
  const somaSaldoAtualAnalitico = arred(saldosAnaliticos.reduce((s, x) => s + x.saldoAtual, 0));

  const movimentoPorConta = new Map(
    saldosAnaliticos.map((x) => [x.conta, { debitos: x.debitos, creditos: x.creditos, movimento: x.movimento }]),
  );

  return {
    movimentosDetalhados: [...detalhado.values()].filter((x) => Math.abs(x.movimento) >= 0.005),
    saldosAnaliticos,
    movimentoPorConta,
    conferencia: {
      totalDebitos,
      totalCreditos,
      diferencaDebitosCreditos: arred(totalDebitos - totalCreditos),
      somaMovimentosAnaliticos,
      somaSaldoAnteriorAnalitico,
      somaSaldoAtualAnalitico,
      contasRazaoSemEstrutura,
      fechadoMovimento: Math.abs(somaMovimentosAnaliticos) < 0.01,
      fechadoSaldoFinal: Math.abs(somaSaldoAtualAnalitico) < 0.01,
    },
  } as const;
}
