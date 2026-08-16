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
// O lançamento nasce diretamente na conta de revenda; não há reclassificação técnica posterior.
const receitaFilial = lancamento({
  id: "FIL-DOC-REV-001",
  debitoCodigo: "25111",
  creditoCodigo: "2655",
  valor: 350173.08,
  historico: "Receita de venda de mercadorias/revenda da filial - junho/2026",
  fonte: "SAIDAS FILIAL(2).xlsx + RESUMO NOTAS FISCAIS SAIDA(2).pdf",
  observacao: "Receita reconhecida diretamente pela natureza fiscal das saídas da filial, sem lançamento de reclassificação técnica.",
});

// Tributos estaduais da filial comprovados no resumo de notas fiscais de saída.
const icmsFilial = lancamento({
  id: "FIL-DOC-ICMS-001",
  debitoCodigo: "25054",
  creditoCodigo: "25235",
  valor: 56744.23,
  historico: "ICMS sobre vendas da filial - junho/2026",
  fonte: "RESUMO NOTAS FISCAIS SAIDA(2).pdf",
  observacao: "Valor de ICMS da filial conforme total do relatório fiscal de saídas.",
});

const ipiFilial = lancamento({
  id: "FIL-DOC-IPI-001",
  debitoCodigo: "25055",
  creditoCodigo: "25236",
  valor: 20469.32,
  historico: "IPI faturado da filial - junho/2026",
  fonte: "RESUMO NOTAS FISCAIS SAIDA(2).pdf + REGISTRO APURAÇAÕ IPI(1).pdf",
  observacao: "Valor de IPI da filial conforme total dos relatórios fiscais da filial.",
});

// Estoque da filial — fechamento periódico baseado no mesmo mecanismo contábil do Razão anterior:
// transfere o estoque de abertura para o CPV e reconhece o inventário final documentado.
// Isso NÃO força o CPV ao valor da DRE enviada. Compras, transferências e demais componentes
// continuam aparecendo separadamente; se ainda faltarem, a DRE calculada exibirá a diferença.
const estoqueAberturaFilial = 220860.25;
const estoqueFinalFilial = 254477.93;

const baixaEstoqueAberturaFilial = lancamento({
  id: "FIL-EST-ABERT-001",
  debitoCodigo: "25945",
  creditoCodigo: "25138",
  valor: estoqueAberturaFilial,
  historico: "Transferência do estoque de abertura da filial para apuração do CPV - junho/2026",
  fonte: "Saldo contábil de abertura 31/05/2026 + padrão do Razão 05/2026",
  observacao: "Movimento de fechamento periódico: utiliza exclusivamente o saldo de abertura já implantado. Não representa compra nem ajuste criado para fechar a DRE.",
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

// PIS e COFINS não recebem lançamento adicional de filial aqui.
// Os débitos federais já estão contabilizados pelo total consolidado das contas 2829/2830.
// A abertura Matriz x Filial é feita apenas na análise da DRE por documentos do CNPJ 0003-60,
// sem duplicar o total do balancete e sem criar reversão técnica.
export const ajustesFilialJunho: LancamentoIntegrado[] = [
  receitaFilial,
  icmsFilial,
  ipiFilial,
  baixaEstoqueAberturaFilial,
  reconhecimentoEstoqueFinalFilial,
];

export const resumoAjustesFilialJunho = {
  receitaDocumentada: 350173.08,
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
