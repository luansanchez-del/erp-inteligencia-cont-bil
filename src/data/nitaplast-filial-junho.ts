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
    rastreio: "documento",
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
  fonte: "RESUMO NOTAS FISCAIS SAIDA(2).pdf",
  observacao: "Valor de IPI da filial conforme total do relatório fiscal de saídas.",
});

// PIS e COFINS não recebem lançamento adicional de filial aqui.
// Os valores utilizados no razão vêm diretamente das apurações federais de junho já incorporadas no lote fiscal.
// Não existe lançamento de reversão técnica para neutralizar duplicidade criada pelo próprio sistema.
export const ajustesFilialJunho: LancamentoIntegrado[] = [
  receitaFilial,
  icmsFilial,
  ipiFilial,
];

export const resumoAjustesFilialJunho = {
  receitaDocumentada: 350173.08,
  icmsDocumentado: 56744.23,
  ipiDocumentado: 20469.32,
  reversoesTecnicas: 0,
  quantidade: ajustesFilialJunho.length,
} as const;
