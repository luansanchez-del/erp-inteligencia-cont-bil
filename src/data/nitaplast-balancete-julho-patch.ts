import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";

export function garantirEstruturaBalanceteJulho() {
  if (estruturaBalanceteNitaplast.some((linha) => linha.conta === "4760")) return;

  estruturaBalanceteNitaplast.push({
    conta: "4760",
    tipo: "A",
    classificacao: "5.9.01.003.002",
    descricao: "Custo Vendas do Ativo Imobilizado",
    nivel: 5,
  });
}
