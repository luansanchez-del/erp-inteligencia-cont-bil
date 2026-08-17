import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { saldosImplantacao } from "./nitaplast-implantacao";

type ContaFechamento = {
  conta: string;
  classificacao: string;
  descricao: string;
  nivel: number;
  natureza: "D" | "C";
  grupo: "Ativo" | "Passivo e patrimônio líquido" | "Receitas acumuladas" | "Custos e despesas acumulados" | "Contas compensatórias";
};

const contasFechamento: ContaFechamento[] = [
  {
    conta: "25020",
    classificacao: "2.1.07.005.009",
    descricao: "Provisões para Custos",
    nivel: 5,
    natureza: "C",
    grupo: "Passivo e patrimônio líquido",
  },
  {
    conta: "4760",
    classificacao: "5.9.01.003.002",
    descricao: "Custo Vendas do Ativo Imobilizado",
    nivel: 5,
    natureza: "D",
    grupo: "Custos e despesas acumulados",
  },
];

/**
 * Contas oficiais usadas nos lançamentos de fechamento que não vieram na estrutura
 * reduzida originalmente carregada para as telas.
 *
 * IMPORTANTE: esta rotina NÃO reorganiza a hierarquia do Balancete, NÃO cria conta
 * sintética e NÃO altera níveis/classificações existentes. Ela somente mantém a
 * compatibilidade dos lançamentos já registrados até a estrutura ser substituída
 * integralmente pelo plano oficial importado.
 */
export function garantirPlanoFechamentoJunho() {
  for (const conta of contasFechamento) {
    if (!estruturaBalanceteNitaplast.some((linha) => linha.conta === conta.conta)) {
      estruturaBalanceteNitaplast.push({
        conta: conta.conta,
        tipo: "A",
        classificacao: conta.classificacao,
        descricao: conta.descricao,
        nivel: conta.nivel,
      });
    }

    if (!saldosImplantacao.some((linha) => linha.conta === conta.conta)) {
      saldosImplantacao.push({
        conta: conta.conta,
        classificacao: conta.classificacao,
        descricao: conta.descricao,
        saldo: 0,
        natureza: conta.natureza,
        grupo: conta.grupo,
      });
    }
  }
}
