import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;
const arred = (valor: number) => Math.round(valor * 100) / 100;

/** Inventário físico oficial da Matriz com referência em 30/06/2026. */
export const inventarioFisicoMatrizJunhoPorConta = {
  "25133": 4351381.98,
  "25134": 29965.54,
  "25135": 1355234.20,
  "25136": 109251.52,
  "25137": 165789.83,
} as const;

/** Ajuste contábil confirmado pelo usuário; não pertence à contagem física. */
export const ajusteContabilMateriaPrimaJunho = 150000 as const;

export const estoqueFinalMatrizJunhoPorConta = {
  ...inventarioFisicoMatrizJunhoPorConta,
  "25135": arred(inventarioFisicoMatrizJunhoPorConta["25135"] + ajusteContabilMateriaPrimaJunho),
} as const;

export const inventarioFisicoMatrizJunhoTotal = arred(
  Object.values(inventarioFisicoMatrizJunhoPorConta).reduce((total, valor) => total + valor, 0),
);

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
 * Reproduz o fechamento periódico observado em maio:
 * 1. baixa integralmente o saldo contábil anterior de cada linha contra o CPV;
 * 2. reconhece o inventário físico final conta a conta;
 * 3. registra o ajuste contábil de R$ 150 mil em linha própria.
 */
export function gerarFechamentoEstoqueMatrizJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  const fechamentoFisico = Object.entries(inventarioFisicoMatrizJunhoPorConta).flatMap(([codigo, saldoFinal], index) => {
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
        documento: "INVENTÁRIO FÍSICO 30/06/2026",
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
        fonte: "REGISTRO INVENTARIO ESTOQUE.pdf — estabelecimento Matriz 001/001",
        observacao: `Inventário físico reconhecido sem incorporar ajuste contábil: ${saldoFinal.toFixed(2)}.`,
      });
    }

    return lancamentos;
  });

  const ajusteContabil: LancamentoIntegrado = {
    id: "CPV-EST-M-AJUSTE-150K",
    data: "30/06/2026",
    origem: "FECHAMENTO ESTOQUE MATRIZ 06/2026",
    debitoCodigo: "25135",
    debito: nomeConta("25135"),
    creditoCodigo: "25944",
    credito: nomeConta("25944"),
    historico: "Ajuste contábil do estoque de matéria-prima separado do inventário físico",
    documento: "AJUSTE ESTOQUE 06/2026 — 150.000,00",
    cc: "102",
    centroCusto: "PRODUCAO",
    valor: ajusteContabilMateriaPrimaJunho,
    status: "revisar",
    rastreio: "derivado",
    fonte: "Confirmação operacional do usuário em 21/08/2026; documento contábil de suporte pendente",
    observacao: "Linha contábil separada da contagem física. Manter em revisão documental, sem repetir ou incorporar silenciosamente ao inventário.",
  };

  return [...fechamentoFisico, ajusteContabil];
}
