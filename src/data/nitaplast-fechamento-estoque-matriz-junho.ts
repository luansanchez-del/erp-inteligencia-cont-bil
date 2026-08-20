import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;
const arred = (valor: number) => Math.round(valor * 100) / 100;

/** Inventario fisico oficial da Matriz com referencia em 30/06/2026. */
export const estoqueFinalMatrizJunhoPorConta = {
  "25133": 4351382.34,
  "25134": 29965.54,
  "25135": 1505234.19,
  "25136": 109261.91,
  "25137": 165790.01,
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

/** Fecha cada conta: baixa o saldo anterior e reconhece o inventario final. */
export function gerarFechamentoEstoqueMatrizJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  return Object.entries(estoqueFinalMatrizJunhoPorConta).flatMap(([codigo, saldoFinal], index) => {
    const abertura = saldoInicial(codigo);
    const movimentoAntesFechamento = movimentoConta(base, codigo);
    const saldoAntesFechamento = arred(abertura + movimentoAntesFechamento);
    const lancamentos: LancamentoIntegrado[] = [];

    if (Math.abs(saldoAntesFechamento) >= 0.005) {
      lancamentos.push({
        id: `CPV-EST-M-BAIXA-${String(index + 1).padStart(3, "0")}`,
        data: "30/06/2026",
        origem: "FECHAMENTO ESTOQUE MATRIZ 06/2026",
        debitoCodigo: "25944",
        debito: nomeConta("25944"),
        creditoCodigo: codigo,
        credito: nomeConta(codigo),
        historico: `Baixa integral do saldo de estoque ${codigo} antes do inventario de 30/06/2026`,
        documento: "INVENTARIO OFICIAL 30/06/2026",
        cc: "102",
        centroCusto: "PRODUCAO",
        valor: Math.abs(saldoAntesFechamento),
        status: "validado",
        rastreio: "derivado",
        fonte: "SALDO DE ABERTURA + RAZAO JUNHO 2026",
        observacao: `Saldo zerado no fechamento: ${saldoAntesFechamento.toFixed(2)} antes do inventario final.`,
      });
    }

    if (Math.abs(saldoFinal) >= 0.005) {
      lancamentos.push({
        id: `CPV-EST-M-FINAL-${String(index + 1).padStart(3, "0")}`,
        data: "30/06/2026",
        origem: "FECHAMENTO ESTOQUE MATRIZ 06/2026",
        debitoCodigo: codigo,
        debito: nomeConta(codigo),
        creditoCodigo: "25944",
        credito: nomeConta("25944"),
        historico: `Reconhecimento do inventario final do estoque ${codigo} em 30/06/2026`,
        documento: "INVENTARIO OFICIAL 30/06/2026",
        cc: "102",
        centroCusto: "PRODUCAO",
        valor: Math.abs(saldoFinal),
        status: "validado",
        rastreio: "derivado",
        fonte: "REGISTRO INVENTARIO ESTOQUE OFICIAL.pdf",
        observacao: `Saldo final mantido no estoque pelo inventario fisico: ${saldoFinal.toFixed(2)}.`,
      });
    }

    return lancamentos;
  });
}
