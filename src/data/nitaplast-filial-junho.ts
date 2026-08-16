import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-integrado";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

function lancamento(params: {
  id: string;
  debitoCodigo: string;
  creditoCodigo: string;
  valor: number;
  historico: string;
  fonte: string;
  observacao: string;
  rastreio?: LancamentoIntegrado["rastreio"];
}): LancamentoIntegrado {
  return {
    id: params.id,
    data: "30/06/2026",
    origem: "DOCUMENTOS FILIAL 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: nomeConta(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nomeConta(params.creditoCodigo),
    historico: params.historico,
    documento: "FILIAL 06/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: params.valor,
    status: "validado",
    observacao: params.observacao,
    rastreio: params.rastreio ?? "documento",
    fonte: params.fonte,
  };
}

// Receita externa da filial conforme os arquivos fiscais de saídas:
// CFOP 5102 = 290.427,01; 5123 = 15.294,75; 6102 = 44.451,32; total = 350.173,08.
// Para apresentação gerencial e contábil do fechamento de 06/2026, o total da filial
// foi reclassificado para Receita Venda Produção Filial, conforme a DRE enviada pelo cliente.
const receitaFilial = lancamento({
  id: "FIL-DOC-PROD-001",
  debitoCodigo: "25111",
  creditoCodigo: "2606",
  valor: 350173.08,
  historico: "Receita Venda Produção Filial - junho/2026",
  fonte: "SAIDAS FILIAL(2).xlsx + RESUMO NOTAS FISCAIS SAIDA(2).pdf + DRE JUN 26",
  observacao: "Reclassificação solicitada no fechamento de 06/2026: R$ 350.173,08 apresentados em Receita Venda Produção Filial, zerando Receita Revenda Filial. A alteração é feita na origem para refletir igualmente no Razão, Balancete e DRE.",
});

// Compras externas da filial. O Razão de maio mantinha as compras de mercadorias para revenda
// em conta própria de estoque (antiga 63290; atual 25139), separada do estoque final transferido da matriz.
const comprasFilial = lancamento({
  id: "FIL-DOC-COMP-001",
  debitoCodigo: "25139",
  creditoCodigo: "1496",
  valor: 57614.21,
  historico: "Compras externas da filial - CFOP 1101/1102",
  fonte: "RESUMO NOTAS FISCAIS ENTRADA(2).pdf + ENTRADAS - NITAPLAST FILIAL(2).xlsx",
  observacao: "Total fiscal documentado: CFOP 1101 R$ 33.555,81 + CFOP 1102 R$ 24.058,40. Mantido no estoque de compras para revenda da filial conforme a prática do Razão anterior; créditos tributários são tratados separadamente.",
});

// Fretes adquiridos pela filial eram reconhecidos em Fretes e Carretos no Razão anterior.
const fretesFilial = lancamento({
  id: "FIL-DOC-FRETE-001",
  debitoCodigo: "4253",
  creditoCodigo: "1496",
  valor: 6219.30,
  historico: "Fretes adquiridos pela filial - CFOP 1352/2352",
  fonte: "RESUMO CTES(5).pdf",
  observacao: "23 CT-e de junho, total R$ 6.219,30. O relatório informa ICMS de R$ 603,81, apropriado na apuração da filial em lançamento tributário separado.",
});

const freteAdicionalFilial = lancamento({
  id: "FIL-DOC-FRETE-002",
  debitoCodigo: "4253",
  creditoCodigo: "1496",
  valor: 112.64,
  historico: "Frete adicional escriturado na filial - natureza 1353001",
  fonte: "ENTRADAS - NITAPLAST FILIAL(2).xlsx",
  observacao: "Documento 458096, escrituração 08/06/2026. Consta no detalhe de entradas da filial e não integra o total de 23 CT-e do RESUMO CTES(5).pdf; mantido separado para rastreabilidade.",
});

const usoConsumoFilial = lancamento({
  id: "FIL-DOC-USO-001",
  debitoCodigo: "4912",
  creditoCodigo: "1496",
  valor: 295.20,
  historico: "Material de uso e consumo da filial - CFOP 1556",
  fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + ENTRADAS - NITAPLAST FILIAL(2).xlsx",
  observacao: "Valor contábil total do CFOP 1556 na apuração da filial. Classificado como Material Uso e Consumo no CC 502.",
});

// Tributos estaduais da filial comprovados no resumo e nas apurações fiscais.
const icmsFilial = lancamento({
  id: "FIL-DOC-ICMS-001",
  debitoCodigo: "25054",
  creditoCodigo: "25235",
  valor: 56744.23,
  historico: "ICMS sobre vendas da filial - junho/2026",
  fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + RESUMO NOTAS FISCAIS SAIDA(2).pdf",
  observacao: "Débito de ICMS da filial conforme apuração do CNPJ 82.295.817/0003-60. Os créditos de R$ 24.776,51 são apropriados separadamente em nitaplast-creditos-filial-junho.ts.",
});

const ipiFilial = lancamento({
  id: "FIL-DOC-IPI-001",
  debitoCodigo: "25055",
  creditoCodigo: "25236",
  valor: 20469.32,
  historico: "IPI faturado da filial - junho/2026",
  fonte: "RESUMO NOTAS FISCAIS SAIDA(2).pdf + REGISTRO APURAÇAÕ IPI(1).pdf",
  observacao: "Débito de IPI da filial conforme apuração. Os créditos de R$ 3.457,11 são apropriados separadamente.",
});

// Estoque físico da filial. O inventário de 31/05/2026 totalizava exatamente R$ 220.860,25,
// o mesmo saldo da conta de estoque final da filial no Razão anterior. Em 30/06/2026 o inventário
// documentado totaliza R$ 254.477,93 (PA 230.563,35 + PI 23.914,58).
const estoqueAberturaFilial = 220860.25;
const estoqueFinalFilial = 254477.93;

const baixaEstoqueAberturaFilial = lancamento({
  id: "FIL-EST-ABERT-001",
  debitoCodigo: "25945",
  creditoCodigo: "25138",
  valor: estoqueAberturaFilial,
  historico: "Transferência do estoque de abertura da filial para apuração do CPV - junho/2026",
  fonte: "Saldo contábil de abertura 31/05/2026 + REGISTRO INVENTARIO ESTOQUE maio + padrão do Razão 05/2026",
  observacao: "Movimento de fechamento periódico: utiliza o saldo de abertura já implantado e comprovado pelo inventário de maio. Não representa compra nem ajuste para fechar a DRE.",
  rastreio: "derivado",
});

const reconhecimentoEstoqueFinalFilial = lancamento({
  id: "FIL-EST-FINAL-001",
  debitoCodigo: "25138",
  creditoCodigo: "25945",
  valor: estoqueFinalFilial,
  historico: "Reconhecimento do estoque final inventariado da filial em 30/06/2026",
  fonte: "REGISTRO INVENTARIO ESTOQUE(6).pdf",
  observacao: "Inventário final documentado: produtos acabados R$ 230.563,35 + produtos intermediários R$ 23.914,58 = R$ 254.477,93.",
});

// Conciliação de corte das transferências Matriz -> Filial:
// - saídas da matriz CFOP 6151 em junho: R$ 138.885,12;
// - entrada 92957, R$ 747,28, veio de competência de saída anterior e foi recebida em junho;
// - NFs 93428 e 93432, R$ 12.130,77, foram emitidas em 30/06 e não aparecem no resumo fiscal de entradas da filial de junho;
// - 138.885,12 + 747,28 - 12.130,77 = 127.501,63, exatamente o CFOP 2152 da apuração da filial.
// Este quadro é diagnóstico de corte. Não gera lançamento técnico de compensação.
export const conciliacaoTransferenciasFilialJunho = {
  saidasMatrizCfop6151: 138885.12,
  recebimentoCompetenciaAnteriorNf92957: 747.28,
  emTransitoFimMesNf93428e93432: 12130.77,
  entradasFilialCfop2152: 127501.63,
  confere: Math.round((138885.12 + 747.28 - 12130.77) * 100) / 100 === 127501.63,
} as const;

// O componente físico do CPV da filial, seguindo o mecanismo observado no Razão de maio, pode ser
// reconciliado com estoque inicial/final e transferências. Ele é mantido como diagnóstico enquanto
// não houver no plano atual uma conta analítica equivalente à antiga "(-) ICMS TRANSFERÊNCIA - FILIAL".
// A DRE enviada continua sendo apenas referência e não é utilizada como contrapartida ou plug.
export const diagnosticoCpvFilialJunho = {
  estoqueInicial: 220860.25,
  transferenciasRecebidas: 127501.63,
  transferenciasParaMatriz: 23626.53,
  icmsTransferenciasRecebidas: 10149.82,
  estoqueFinal: 254477.93,
  componenteFisicoCalculado: 60107.60,
  dreEnviadaCpvFilial: 113234.660835063,
  diferencaAindaAExplicar: 53127.060835063,
  regra: "Não gerar lançamento para a diferença. A diferença permanece visível até ser explicada por custo de mercadorias de compra direta/itens de estoque da filial.",
} as const;

// PIS e COFINS não recebem um segundo débito de filial aqui. As apurações emitidas para o CNPJ 0003-60
// repetem os totais consolidados; apenas a abertura documental dos créditos da filial é feita separadamente.
export const ajustesFilialJunho: LancamentoIntegrado[] = [
  receitaFilial,
  comprasFilial,
  fretesFilial,
  freteAdicionalFilial,
  usoConsumoFilial,
  icmsFilial,
  ipiFilial,
  baixaEstoqueAberturaFilial,
  reconhecimentoEstoqueFinalFilial,
];

export const resumoAjustesFilialJunho = {
  receitaDocumentada: 350173.08,
  comprasExternasDocumentadas: 57614.21,
  fretesDocumentados: 6331.94,
  usoConsumoDocumentado: 295.20,
  icmsDocumentado: 56744.23,
  ipiDocumentado: 20469.32,
  estoqueAbertura: estoqueAberturaFilial,
  estoqueFinalDocumentado: estoqueFinalFilial,
  estoqueFinalProdutosAcabados: 230563.35,
  estoqueFinalProdutosIntermediarios: 23914.58,
  variacaoLiquidaEstoqueFinal: estoqueFinalFilial - estoqueAberturaFilial,
  reversoesTecnicas: 0,
  quantidade: ajustesFilialJunho.length,
} as const;
