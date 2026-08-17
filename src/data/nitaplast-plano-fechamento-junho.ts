import { estruturaBalanceteNitaplast, type LinhaEstruturaBalancete } from "./nitaplast-balancete-estrutura";
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

const grupoCustoAlienacao: LinhaEstruturaBalancete = {
  conta: "4758",
  tipo: "S",
  classificacao: "5.9.01.003",
  descricao: "CUSTOS",
  nivel: 4,
};

function inserirAntesDe(contaAncora: string, linha: LinhaEstruturaBalancete) {
  if (estruturaBalanceteNitaplast.some((item) => item.conta === linha.conta)) return;
  const indice = estruturaBalanceteNitaplast.findIndex((item) => item.conta === contaAncora);
  if (indice >= 0) estruturaBalanceteNitaplast.splice(indice, 0, linha);
  else estruturaBalanceteNitaplast.push(linha);
}

function inserirDepoisDe(contaAncora: string, linha: LinhaEstruturaBalancete) {
  if (estruturaBalanceteNitaplast.some((item) => item.conta === linha.conta)) return;
  const indice = estruturaBalanceteNitaplast.findIndex((item) => item.conta === contaAncora);
  if (indice >= 0) estruturaBalanceteNitaplast.splice(indice + 1, 0, linha);
  else estruturaBalanceteNitaplast.push(linha);
}

/**
 * Complementa SOMENTE contas oficiais do plano que são usadas no fechamento e que
 * ficaram fora da estrutura reduzida carregada inicialmente.
 *
 * A posição é definida por âncoras do próprio plano oficial, sem ordenar ou
 * reestruturar o Balancete inteiro:
 * - 25020 pertence a PROVISÕES (2.1.07.005) e entra antes de OUTRAS OBRIGAÇÕES (1710);
 * - 4758 é o grupo oficial de CUSTOS da baixa/alienação em 5.9.01.003;
 * - 4760 é a conta analítica oficial de Custo Vendas do Ativo Imobilizado.
 */
export function garantirPlanoFechamentoJunho() {
  inserirAntesDe("1710", {
    conta: "25020",
    tipo: "A",
    classificacao: "2.1.07.005.009",
    descricao: "Provisões para Custos",
    nivel: 5,
  });

  inserirDepoisDe("4736", grupoCustoAlienacao);
  inserirDepoisDe("4758", {
    conta: "4760",
    tipo: "A",
    classificacao: "5.9.01.003.002",
    descricao: "Custo Vendas do Ativo Imobilizado",
    nivel: 5,
  });

  for (const conta of contasFechamento) {
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
