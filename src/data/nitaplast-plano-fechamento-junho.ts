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

const estruturasExtras: LinhaEstruturaBalancete[] = [
  {
    conta: "4758",
    tipo: "S",
    classificacao: "5.9.01.003",
    descricao: "CUSTO NA BAIXA/ALIENAÇÃO DO ATIVO IMOBILIZADO",
    nivel: 4,
  },
];

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

function compararClassificacao(a: string, b: string) {
  const pa = a.split(".").map((parte) => Number(parte));
  const pb = b.split(".").map((parte) => Number(parte));
  const tamanho = Math.max(pa.length, pb.length);
  for (let i = 0; i < tamanho; i += 1) {
    if (pa[i] === undefined) return -1;
    if (pb[i] === undefined) return 1;
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function inserirEstruturaNaPosicao(linha: LinhaEstruturaBalancete) {
  if (estruturaBalanceteNitaplast.some((item) => item.conta === linha.conta)) return;
  const indice = estruturaBalanceteNitaplast.findIndex(
    (item) => compararClassificacao(item.classificacao, linha.classificacao) > 0,
  );
  if (indice < 0) estruturaBalanceteNitaplast.push(linha);
  else estruturaBalanceteNitaplast.splice(indice, 0, linha);
}

/**
 * Algumas contas oficiais do plano da Nitaplast não vieram na estrutura reduzida
 * originalmente montada para as telas. O fechamento de junho precisa delas no
 * Razão/Balancete/DRE:
 * - 25020: provisão/ponte dos ajustes de fechamento;
 * - 4758/4760: grupo e conta do custo na baixa do imobilizado.
 *
 * As contas são inseridas na posição contábil correta da estrutura, evitando que
 * apareçam soltas no fim do Balancete.
 */
export function garantirPlanoFechamentoJunho() {
  for (const estrutura of estruturasExtras) inserirEstruturaNaPosicao(estrutura);

  for (const conta of contasFechamento) {
    inserirEstruturaNaPosicao({
      conta: conta.conta,
      tipo: "A",
      classificacao: conta.classificacao,
      descricao: conta.descricao,
      nivel: conta.nivel,
    });

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
