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

const comprasMpBrutas = arred(
  entradasCcReconciliadasJunho
    .filter((linha) => linha.debitoCodigo === "3093")
    .reduce((total, linha) => total + linha.valor, 0),
);

const creditosMp = arred(
  lancamentosFiscaisJunho
    .filter((linha) => linha.creditoCodigo === "3093")
    .reduce((total, linha) => total + linha.valor, 0),
);

const materiaPrimaLiquida = arred(comprasMpBrutas - creditosMp);

const matrizParaFilialEmitido = 138885.12;
const matrizParaFilialRecebido = 127501.63;
const filialParaMatrizEmitido = 23626.53;
const filialParaMatrizRecebido = 15345.75;

const icmsTransferenciaSaidaMatriz = 10885.47;
const icmsTransferenciaEntradaMatriz = 745.45;
const icmsTransferenciaSaidaFilial = 1595.34;
const icmsTransferenciaEntradaFilial = 10149.82;

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
  lancamento({
    id: "CPV-TR-MF-EMIT",
    debitoCodigo: "25215",
    creditoCodigo: "25944",
    valor: matrizParaFilialEmitido,
    historico: "Transferências de produção emitidas pela matriz para a filial - CFOP 6151",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf + SAIDAS - NITAPLAST(3).xlsx",
    observacao: "A Conta Corrente Filial SP controla o corte entre emissão e recebimento das transferências internas.",
  }),
  lancamento({
    id: "CPV-TR-MF-REC",
    debitoCodigo: "25945",
    creditoCodigo: "25215",
    valor: matrizParaFilialRecebido,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Transferências recebidas pela filial - CFOP 2152",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + RESUMO NOTAS FISCAIS ENTRADA(2).pdf",
    observacao: "Somente o efetivamente recebido pela filial entra no fechamento; diferenças permanecem em trânsito.",
  }),
  lancamento({
    id: "CPV-TR-FM-EMIT",
    debitoCodigo: "25215",
    creditoCodigo: "25945",
    valor: filialParaMatrizEmitido,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Transferências emitidas pela filial para a matriz - CFOP 6151",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + RESUMO NOTAS FISCAIS SAIDA(2).pdf",
    observacao: "Reduz o custo da filial quando a mercadoria sai da filial; o recebimento na matriz é reconhecido separadamente.",
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
    observacao: "O fiscal da matriz registra R$ 15.345,75 em CFOP 2152; o restante permanece em trânsito.",
  }),
  lancamento({
    id: "CPV-ICMS-M-OUT",
    debitoCodigo: "25944",
    creditoCodigo: "2827",
    valor: icmsTransferenciaSaidaMatriz,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    historico: "Reclassificação do ICMS sobre transferência matriz -> filial para o CPV",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf - CFOP 6151",
    observacao: "Transferência interna não é receita externa; o ICMS correspondente sai da dedução da receita e compõe o custo.",
  }),
  lancamento({
    id: "CPV-ICMS-M-IN",
    debitoCodigo: "1541",
    creditoCodigo: "25944",
    valor: icmsTransferenciaEntradaMatriz,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    historico: "Crédito de ICMS sobre transferência filial -> matriz apropriado no fechamento do CPV",
    fonte: "REGISTRO APURAÇÃO ICMS ATUALIZADO(4).pdf - CFOP 2152",
    observacao: "Crédito real da matriz reduz o custo das transferências sem reduzir artificialmente o ICMS sobre vendas.",
  }),
  lancamento({
    id: "CPV-ICMS-F-OUT",
    debitoCodigo: "25945",
    creditoCodigo: "25054",
    valor: icmsTransferenciaSaidaFilial,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Reclassificação do ICMS sobre transferência filial -> matriz para o CPV filial",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf - CFOP 6151",
    observacao: "Retira o ICMS de transferência interna da linha de ICMS sobre vendas da filial e leva ao custo.",
  }),
  lancamento({
    id: "CPV-ICMS-F-IN",
    debitoCodigo: "25140",
    creditoCodigo: "25945",
    valor: icmsTransferenciaEntradaFilial,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    historico: "Crédito de ICMS sobre transferências matriz -> filial apropriado no CPV filial",
    fonte: "REGISTRO APURAÇÃO ICMS(3).pdf - CFOP 2152",
    observacao: "Crédito de ICMS das transferências recebidas reduz o CPV da filial, repetindo o tratamento contábil de maio.",
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
    observacao: "A perda documentada fica destacada em Perdas e não escondida dentro do CPV.",
  }),
];

const estoqueInicialMatriz = 5934857.03;
// Inventário OFICIAL de 30/06/2026. O total inclui o ajuste de matéria-prima de
// aproximadamente R$ 82,5 mil já incorporado ao fechamento final de junho.
// Não gerar um segundo ajuste de resultado por esse valor.
const estoqueFinalMatriz = 6161633.99;
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
    estoqueFinalOficial: 1505234.19,
    ajusteEstoqueJaIncorporadoAoFechamento: 82536.09,
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
  regra: "CPV calculado pelas bases de junho e inventário oficial de 30/06/2026. O ajuste de estoque de aproximadamente R$ 82,5 mil já está incorporado ao estoque final e ao lucro final enviado; não gerar ajuste adicional no resultado.",
} as const;
