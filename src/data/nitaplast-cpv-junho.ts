import { saldosImplantacao } from "./nitaplast-implantacao";
import { lancamentosFiscaisJunho } from "./nitaplast-lancamentos-fiscais-junho";
import { entradasCcReconciliadasJunho } from "./nitaplast-entradas-cc-reconciliadas-junho";
import type { LancamentoIntegrado } from "./nitaplast-razao-integrado";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;
const arred = (valor: number) => Math.round(valor * 100) / 100;

function lancamento(params: {
  id: string;
  debitoCodigo: string;
  creditoCodigo: string;
  valor: number;
  historico: string;
  fonte: string;
  cc?: string;
  centroCusto?: string;
  rastreio?: LancamentoIntegrado["rastreio"];
  observacao: string;
}): LancamentoIntegrado {
  return {
    id: params.id,
    data: "30/06/2026",
    origem: "FECHAMENTO CPV 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: nomeConta(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nomeConta(params.creditoCodigo),
    historico: params.historico,
    documento: "CPV 06/2026",
    cc: params.cc ?? "0",
    centroCusto: params.centroCusto ?? "SEM CENTRO DE CUSTO",
    valor: arred(params.valor),
    status: "validado",
    rastreio: params.rastreio ?? "derivado",
    fonte: params.fonte,
    observacao: params.observacao,
  };
}

/**
 * O Razão de 05/2026 confirma o mecanismo periódico usado pela contabilidade anterior:
 * - compras de matéria-prima + créditos tributários formam a matéria-prima utilizada;
 * - estoque inicial/final é fechado contra CPV;
 * - transferências Matriz <-> Filial passam pela Conta Corrente Filial SP;
 * - ICMS das transferências é retirado de ICMS sobre vendas e apropriado no custo;
 * - perda de estoque é destacada em conta própria, não escondida dentro do CPV.
 *
 * Em junho não existe plug com a DRE enviada. Todos os valores abaixo vêm das bases de junho,
 * usando apenas o mecanismo contábil de maio como regra de fechamento autorizada.
 */

// Matéria-prima de junho pelo detalhamento do cliente (conta gerencial 11.01.003 / conta 3093).
const comprasMpBrutas = arred(
  entradasCcReconciliadasJunho
    .filter((linha) => linha.debitoCodigo === "3093")
    .reduce((total, linha) => total + linha.valor, 0),
);

// Créditos de ICMS/IPI/PIS/COFINS efetivamente vinculados à conta 3093 nas apurações de junho.
const creditosMp = arred(
  lancamentosFiscaisJunho
    .filter((linha) => linha.creditoCodigo === "3093")
    .reduce((total, linha) => total + linha.valor, 0),
);

const materiaPrimaLiquida = arred(comprasMpBrutas - creditosMp);

// Transferências documentadas no fiscal de cada estabelecimento.
const matrizParaFilialEmitido = 138885.12; // CFOP 6151 - matriz
const matrizParaFilialRecebido = 127501.63; // CFOP 2152 - filial
const filialParaMatrizEmitido = 23626.53; // CFOP 6151 - filial
const filialParaMatrizRecebido = 15345.75; // CFOP 2152 - matriz

// ICMS das transferências: mesma lógica do Razão de maio.
const icmsTransferenciaSaidaMatriz = 10885.47;
const icmsTransferenciaEntradaMatriz = 745.45;
const icmsTransferenciaSaidaFilial = 1595.34;
const icmsTransferenciaEntradaFilial = 10149.82;

// Baixa de estoque CFOP 5927 - deve aparecer em Perdas, não como ajuste oculto do CPV.
const perdaEstoqueMatriz = 595.38;

export const fechamentoCpvJunho: LancamentoIntegrado[] = [
  lancamento({
    id: "CPV-MP-001",
    debitoCodigo: "25944",
    creditoCodigo: "3093",
    valor: materiaPrimaLiquida,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    historico: "Apropriação da matéria-prima líquida utilizada no fechamento do CPV - junho/2026",
    fonte: "RLF447/RELAÇÃO NOTAS POR CENTRO DE CUSTO + apurações ICMS/IPI/PIS/COFINS 06/2026",
    observacao: `Compras MP brutas ${comprasMpBrutas.toFixed(2)} menos créditos tributários ${creditosMp.toFixed(2)} = ${materiaPrimaLiquida.toFixed(2)}. O saldo da conta 3093 é absorvido no CPV pelo mecanismo periódico usado no Razão anterior.`,
  }),

  // Matriz emite transferência: reduz custo da matriz e abre corrente com a filial.
  lancamento({
    id: "CPV-TR-MF-EMIT",
    debitoCodigo: "25215",
    creditoCodigo: "25944",
    valor: matrizParaFilialEmitido,
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    historico: "Transferências de produção emitidas pela matriz para a filial - CFOP 6151",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf + SAIDAS - NITAPLAST(3).xlsx",
    observacao: "A Conta Corrente Filial SP é a conta atual equivalente à antiga 58700, usada no Razão anterior para controlar o corte entre emissão e recebimento das transferências internas.",
  }),
  // Filial recebe: aumenta o custo/estoque consumido da filial e baixa a corrente interna.
  lancamento({
    id: "CPV-TR-MF-REC",
    debitoCodigo: "25945",
    creditoCodigo: "25215",
    valor: matrizParaFilialRecebido,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Transferências recebidas pela filial - CFOP 2152",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + RESUMO NOTAS FISCAIS ENTRADA(2).pdf",
    observacao: "Somente o que a filial efetivamente recebeu em junho entra no CPV da filial. A diferença para o emitido permanece na conta corrente interna como corte/em trânsito.",
  }),

  // Filial devolve/transfere para matriz: reduz o CPV da filial e abre corrente interna.
  lancamento({
    id: "CPV-TR-FM-EMIT",
    debitoCodigo: "25215",
    creditoCodigo: "25945",
    valor: filialParaMatrizEmitido,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Transferências emitidas pela filial para a matriz - CFOP 6151",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + RESUMO NOTAS FISCAIS SAIDA(2).pdf",
    observacao: "Reduz o custo da filial quando a mercadoria sai da filial. O recebimento na matriz é reconhecido separadamente para preservar o corte.",
  }),
  lancamento({
    id: "CPV-TR-FM-REC",
    debitoCodigo: "25944",
    creditoCodigo: "25215",
    valor: filialParaMatrizRecebido,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    historico: "Transferências da filial efetivamente recebidas pela matriz - CFOP 2152",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf",
    observacao: "O fiscal da matriz registra R$ 15.345,75 em CFOP 2152. O restante emitido pela filial permanece em trânsito na Conta Corrente Filial SP.",
  }),

  // Matriz: ICMS da saída interna não é dedução de receita externa; vai ao custo.
  lancamento({
    id: "CPV-ICMS-M-OUT",
    debitoCodigo: "25944",
    creditoCodigo: "2827",
    valor: icmsTransferenciaSaidaMatriz,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    historico: "Reclassificação do ICMS sobre transferência matriz -> filial para o CPV",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf - CFOP 6151",
    observacao: "O débito de ICMS da transferência está dentro da apuração total de ICMS. Como transferência interna não é receita externa, o valor sai da dedução da receita e compõe o custo, conforme o Razão de maio.",
  }),
  // Matriz: crédito de ICMS na transferência recebida da filial reduz o CPV.
  lancamento({
    id: "CPV-ICMS-M-IN",
    debitoCodigo: "1541",
    creditoCodigo: "25944",
    valor: icmsTransferenciaEntradaMatriz,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    historico: "Crédito de ICMS sobre transferência filial -> matriz apropriado no fechamento do CPV",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf - CFOP 2152",
    observacao: "Crédito real de R$ 745,45 da matriz. Substitui a antiga linha genérica TAX-CRED-013 e segue o tratamento de maio: reduz o custo das transferências, sem reduzir artificialmente o ICMS sobre vendas.",
  }),

  // Filial: saída interna também não é ICMS sobre venda externa.
  lancamento({
    id: "CPV-ICMS-F-OUT",
    debitoCodigo: "25945",
    creditoCodigo: "25054",
    valor: icmsTransferenciaSaidaFilial,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Reclassificação do ICMS sobre transferência filial -> matriz para o CPV filial",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf - CFOP 6151",
    observacao: "Retira R$ 1.595,34 de transferência interna da linha de ICMS sobre vendas da filial e leva ao custo, conforme o mecanismo do Razão anterior.",
  }),
  // Filial: crédito de ICMS das transferências recebidas reduz o custo da filial.
  lancamento({
    id: "CPV-ICMS-F-IN",
    debitoCodigo: "25140",
    creditoCodigo: "25945",
    valor: icmsTransferenciaEntradaFilial,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Crédito de ICMS sobre transferências matriz -> filial apropriado no CPV filial",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf - CFOP 2152",
    observacao: "Dos créditos de ICMS da filial já apropriados contra 25140, R$ 10.149,82 pertencem às transferências da matriz e reduzem o CPV da filial, repetindo o tratamento contábil de maio.",
  }),

  lancamento({
    id: "CPV-PERDA-001",
    debitoCodigo: "25069",
    creditoCodigo: "25944",
    valor: perdaEstoqueMatriz,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    historico: "Baixa de estoque por perda - CFOP 5927",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf - CFOP 5927",
    observacao: "A perda documentada de R$ 595,38 fica destacada em Perdas. Como o inventário final já incorpora a baixa física, a reclassificação evita deixar a mesma perda escondida dentro do CPV.",
  }),
];

const estoqueInicialMatriz = 5934857.03;
const estoqueFinalMatriz = 6079094.46;
const estoqueInicialFilial = 220860.25;
const estoqueFinalFilial = 254477.93;

const cpvMatrizCalculado = arred(
  estoqueInicialMatriz
  + materiaPrimaLiquida
  - estoqueFinalMatriz
  - matrizParaFilialEmitido
  + filialParaMatrizRecebido
  + icmsTransferenciaSaidaMatriz
  - icmsTransferenciaEntradaMatriz
  - perdaEstoqueMatriz,
);

const cpvFilialCalculado = arred(
  estoqueInicialFilial
  + matrizParaFilialRecebido
  - filialParaMatrizEmitido
  + icmsTransferenciaSaidaFilial
  - icmsTransferenciaEntradaFilial
  - estoqueFinalFilial,
);

const movimentoContaCorrenteFilial = arred(
  matrizParaFilialEmitido
  - matrizParaFilialRecebido
  + filialParaMatrizEmitido
  - filialParaMatrizRecebido,
);
const aberturaContaCorrenteFilial = 1410.70;

export const resumoCpvJunho = {
  materiaPrima: {
    comprasBrutas: comprasMpBrutas,
    creditosTributarios: creditosMp,
    liquidaApropriada: materiaPrimaLiquida,
  },
  transferencias: {
    matrizParaFilialEmitido,
    matrizParaFilialRecebido,
    filialParaMatrizEmitido,
    filialParaMatrizRecebido,
    emTransitoLiquidoJunho: movimentoContaCorrenteFilial,
    contaCorrenteFilialAbertura: aberturaContaCorrenteFilial,
    contaCorrenteFilialFechamento: arred(aberturaContaCorrenteFilial + movimentoContaCorrenteFilial),
  },
  icmsTransferencias: {
    saidaMatriz: icmsTransferenciaSaidaMatriz,
    entradaMatriz: icmsTransferenciaEntradaMatriz,
    efeitoCpvMatriz: arred(icmsTransferenciaSaidaMatriz - icmsTransferenciaEntradaMatriz),
    saidaFilial: icmsTransferenciaSaidaFilial,
    entradaFilial: icmsTransferenciaEntradaFilial,
    efeitoCpvFilial: arred(icmsTransferenciaSaidaFilial - icmsTransferenciaEntradaFilial),
  },
  perdaEstoqueMatriz,
  estoqueInicialMatriz,
  estoqueFinalMatriz,
  estoqueInicialFilial,
  estoqueFinalFilial,
  cpvMatrizCalculado,
  cpvFilialCalculado,
  cpvConsolidadoCalculado: arred(cpvMatrizCalculado + cpvFilialCalculado),
  regra: "Valores calculados pelas bases de junho e mecanismo contábil do Razão anterior. A DRE enviada é somente referência; nenhuma diferença gera lançamento de ajuste.",
} as const;
