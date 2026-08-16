import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { saldosImplantacao } from "./nitaplast-implantacao";

/**
 * A conta 25020 existe no plano oficial da Nitaplast, porém não veio na estrutura
 * reduzida originalmente montada para a tela do Balancete. O fechamento da folha
 * utiliza esta conta como provisão/ponte para obrigações ainda sem abertura analítica.
 *
 * Como os arrays de plano já são a fonte compartilhada das telas, incluímos a conta
 * uma única vez antes de Razão/Balancete/DRE consumirem os lançamentos integrados.
 */
export function garantirPlanoFechamentoJunho() {
  if (!estruturaBalanceteNitaplast.some((linha) => linha.conta === "25020")) {
    estruturaBalanceteNitaplast.push({
      conta: "25020",
      tipo: "A",
      classificacao: "2.1.07.005.009",
      descricao: "Provisões para Custos",
      nivel: 5,
    });
  }

  if (!saldosImplantacao.some((linha) => linha.conta === "25020")) {
    saldosImplantacao.push({
      conta: "25020",
      classificacao: "2.1.07.005.009",
      descricao: "Provisões para Custos",
      saldo: 0,
      natureza: "C",
      grupo: "Passivo e patrimônio líquido",
    });
  }
}
