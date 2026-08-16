import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-integrado";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

/**
 * Conciliação documental das aplicações de junho/2026.
 *
 * Itaú Trust DI (conta 25002):
 * - saldo bruto anterior: 837.809,76
 * - aplicações: 761.270,00
 * - resgates líquidos já refletidos no movimento bancário: 1.147.300,00
 * - rendimento bruto do período: 8.739,98
 * - rendimento já capturado no movimento financeiro: 5.486,23
 * - complemento de rendimento: 3.253,75
 * - IOF retido: 2.339,19
 * - IRRF retido: 1.416,13
 * - saldo bruto final conciliado: 456.764,42
 *
 * Não há lançamento de ajuste de saldo. Os lançamentos abaixo reproduzem
 * exclusivamente componentes identificados nos extratos das aplicações.
 */
export const ajustesAplicacoesJunho: LancamentoIntegrado[] = [
  {
    id: "APL-ITAU-TRUST-REND-001",
    data: "30/06/2026",
    origem: "EXTRATO ITAÚ TRUST DI 06/2026",
    debitoCodigo: "25002",
    debito: nomeConta("25002"),
    creditoCodigo: "25098",
    credito: nomeConta("25098"),
    historico: "Complemento do rendimento bruto Itaú Trust DI - junho/2026",
    documento: "TRUST DI 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 3253.75,
    status: "validado",
    observacao: "Rendimento bruto do extrato (R$ 8.739,98) menos rendimento já capturado no movimento financeiro (R$ 5.486,23).",
    rastreio: "documento",
    fonte: "Nita fundo.pdf - Itaú Trust DI, período 01/06/2026 a 30/06/2026",
  },
  {
    id: "APL-ITAU-TRUST-IOF-001",
    data: "30/06/2026",
    origem: "EXTRATO ITAÚ TRUST DI 06/2026",
    debitoCodigo: "25105",
    debito: nomeConta("25105"),
    creditoCodigo: "25002",
    credito: nomeConta("25002"),
    historico: "IOF retido nos resgates do Itaú Trust DI - junho/2026",
    documento: "TRUST DI 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 2339.19,
    status: "validado",
    observacao: "IOF retido no período conforme extrato da aplicação.",
    rastreio: "documento",
    fonte: "Nita fundo.pdf - Itaú Trust DI, período 01/06/2026 a 30/06/2026",
  },
  {
    id: "APL-ITAU-TRUST-IRRF-001",
    data: "30/06/2026",
    origem: "EXTRATO ITAÚ TRUST DI 06/2026",
    debitoCodigo: "25118",
    debito: nomeConta("25118"),
    creditoCodigo: "25002",
    credito: nomeConta("25002"),
    historico: "IRRF sobre aplicações financeiras - Itaú Trust DI - junho/2026",
    documento: "TRUST DI 06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 1416.13,
    status: "validado",
    observacao: "IRRF retido no período reconhecido em IRRF s/ Aplicações Financeiras.",
    rastreio: "documento",
    fonte: "Nita fundo.pdf - Itaú Trust DI, período 01/06/2026 a 30/06/2026",
  },
];
