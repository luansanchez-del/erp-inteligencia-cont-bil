import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-integrado";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

function ajuste(params: {
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
    origem: "CORREÇÃO DE CONSOLIDAÇÃO FILIAL 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: nomeConta(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nomeConta(params.creditoCodigo),
    historico: params.historico,
    documento: "CONSOLIDAÇÃO FILIAL 06/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: params.valor,
    status: "validado",
    observacao: params.observacao,
    rastreio: "documento",
    fonte: params.fonte,
  };
}

// O lote fiscal antigo registrou a receita da filial como venda de produto (2606).
// Os arquivos fiscais da filial mostram que a receita externa é integralmente revenda/mercadoria:
// CFOP 5102 = 290.427,01; 5123 = 15.294,75; 6102 = 44.451,32; total = 350.173,08.
const reclassificacaoReceita = ajuste({
  id: "FIL-CONS-REV-001",
  debitoCodigo: "2606",
  creditoCodigo: "2655",
  valor: 350173.08,
  historico: "Reclassificação da receita da filial de produtos para mercadorias/revenda",
  fonte: "SAIDAS FILIAL(2).xlsx + RESUMO NOTAS FISCAIS SAIDA(2).pdf",
  observacao: "Reclassificação sem efeito no total da receita consolidada; corrige apenas a natureza da receita da filial conforme CFOPs 5102, 5123 e 6102.",
});

// PIS e COFINS dos relatórios federais já são consolidados (matriz + filial).
// O módulo antigo adicionava valores da filial novamente, duplicando essas deduções.
const reversaoPisDuplicado = ajuste({
  id: "FIL-CONS-PIS-001",
  debitoCodigo: "1556",
  creditoCodigo: "2829",
  valor: 4361.70,
  historico: "Reversão de PIS da filial duplicado na consolidação",
  fonte: "REGISTRO APURAÇÃO PIS(6).pdf",
  observacao: "A apuração federal já totaliza R$ 47.548,49 de débito de PIS incluindo as operações da filial; este ajuste neutraliza o lançamento adicional antigo da filial.",
});

const reversaoCofinsDuplicada = ajuste({
  id: "FIL-CONS-COF-001",
  debitoCodigo: "1552",
  creditoCodigo: "2830",
  valor: 20090.42,
  historico: "Reversão de COFINS da filial duplicada na consolidação",
  fonte: "REEGISTRO APURAÇÃO COFINS(1).pdf",
  observacao: "A apuração federal já totaliza R$ 219.011,34 de débito de COFINS incluindo as operações da filial; este ajuste neutraliza o lançamento adicional antigo da filial.",
});

export const ajustesFilialJunho: LancamentoIntegrado[] = [
  reclassificacaoReceita,
  reversaoPisDuplicado,
  reversaoCofinsDuplicada,
];

export const resumoAjustesFilialJunho = {
  receitaReclassificada: 350173.08,
  pisDuplicadoRevertido: 4361.70,
  cofinsDuplicadaRevertida: 20090.42,
  quantidade: ajustesFilialJunho.length,
} as const;
