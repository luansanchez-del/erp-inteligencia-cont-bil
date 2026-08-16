import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;
const arred = (valor: number) => Math.round(valor * 100) / 100;

/** Posição física definitiva do inventário da matriz em 30/06/2026. */
export const estoqueFinalMatrizJunhoPorConta = {
  "25133": 4351381.88, // PA - Produto Acabado
  "25134": 29965.54,  // LX + RF + RT = lixo/refugo/retalho
  "25135": 1422698.10, // MP - Matéria Prima
  "25136": 109261.88, // Produtos em elaboração
  "25137": 165787.06, // PI - Produto Intermediário
} as const;

export const estoqueFinalMatrizJunhoTotal = arred(
  Object.values(estoqueFinalMatrizJunhoPorConta).reduce((total, valor) => total + valor, 0),
);

function saldoInicial(codigo: string) {
  const saldo = saldosImplantacao.find((linha) => linha.conta === codigo);
  if (!saldo) return 0;
  return saldo.natureza === "C" ? -Math.abs(saldo.saldo) : Math.abs(saldo.saldo);
}

function movimentoConta(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.debitoCodigo === codigo) total += linha.valor;
    if (linha.creditoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

/**
 * Gera somente o ajuste necessário para cada conta patrimonial terminar no inventário físico.
 * Assim, compras/créditos já contabilizados no mês são respeitados e não são contados duas vezes.
 */
export function gerarFechamentoEstoqueMatrizJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  return Object.entries(estoqueFinalMatrizJunhoPorConta).flatMap(([codigo, alvo], index) => {
    const abertura = saldoInicial(codigo);
    const movimentoAntesFechamento = movimentoConta(base, codigo);
    const saldoAntesFechamento = arred(abertura + movimentoAntesFechamento);
    const ajuste = arred(alvo - saldoAntesFechamento);

    if (Math.abs(ajuste) < 0.005) return [];

    const aumentaEstoque = ajuste > 0;
    const valor = Math.abs(ajuste);
    return [{
      id: `CPV-EST-M-${String(index + 1).padStart(3, "0")}`,
      data: "30/06/2026",
      origem: "FECHAMENTO ESTOQUE MATRIZ 06/2026",
      debitoCodigo: aumentaEstoque ? codigo : "25944",
      debito: nomeConta(aumentaEstoque ? codigo : "25944"),
      creditoCodigo: aumentaEstoque ? "25944" : codigo,
      credito: nomeConta(aumentaEstoque ? "25944" : codigo),
      historico: `Ajuste do estoque ${codigo} ao inventário físico de 30/06/2026`,
      documento: "INVENTÁRIO 30/06/2026",
      cc: "102",
      centroCusto: "PRODUÇÃO",
      valor,
      status: "validado",
      rastreio: "derivado",
      fonte: "REGISTRO INVENTARIO ESTOQUE ATUALIZADO 12082026.pdf",
      observacao: `Saldo 31/05 ${abertura.toFixed(2)} + movimento de junho antes do fechamento ${movimentoAntesFechamento.toFixed(2)} = ${saldoAntesFechamento.toFixed(2)}. Inventário físico final ${alvo.toFixed(2)}. Ajuste ${ajuste.toFixed(2)}. Não utiliza a DRE enviada como alvo.`,
    } satisfies LancamentoIntegrado];
  });
}
