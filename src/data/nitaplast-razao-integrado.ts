import { lancamentosIntegrados as lancamentosBase } from "./nitaplast-razao-base";
import { saldosImplantacao } from "./nitaplast-implantacao";
import { fechamentoCpvJunho } from "./nitaplast-cpv-junho";
import { corrigirMapeamentosJunho } from "./nitaplast-correcoes-mapeamento-junho";
import { ajusteEstoqueResultadoJunho } from "./nitaplast-ajuste-estoque-junho";
import { gerarFechamentoEstoqueMatrizJunho } from "./nitaplast-fechamento-estoque-matriz-junho";
import { aplicarFechamentoImportacoesJunho } from "./nitaplast-fechamento-importacoes-junho";
import { aplicarFechamentoFinanceiroJunho } from "./nitaplast-fechamento-financeiro-junho";
import { aplicarFechamentoCpvFinalJunho } from "./nitaplast-fechamento-cpv-final-junho";
import { aplicarFechamentoCreditosFederaisJunho } from "./nitaplast-fechamento-creditos-federais-junho";
import { aplicarFechamentoDespesasJunho } from "./nitaplast-fechamento-despesas-junho";
import { aplicarFechamentoAlienacaoJunho } from "./nitaplast-fechamento-alienacao-junho";
import { garantirPlanoFechamentoJunho } from "./nitaplast-plano-fechamento-junho";

export type { LancamentoIntegrado } from "./nitaplast-razao-base";
export { contaPorBanco, depreciacoes } from "./nitaplast-razao-base";

garantirPlanoFechamentoJunho();

/**
 * Razão definitivo de junho/2026.
 * REGRA DE GOVERNANÇA: Razão -> Balancete -> DRE.
 * A DRE enviada é somente controle de comparação e jamais pode gerar receita,
 * custo ou despesa usada pela própria DRE calculada.
 */
const lancamentosBaseSaneados = lancamentosBase.filter((linha) => {
  const icmsAntigoValido = linha.origem !== "APURAÇÃO ICMS 06/2026" || linha.id === "TAX-SAI-ICMS";
  const cartaoIndividualAindaNaoValidado = linha.id.startsWith("CAR-LOTE-");
  const depreciacaoProvisoriaSemFichaJunho = linha.id.startsWith("PON-DEP-");
  const receitaFilialCircular = linha.id === "FIL-DOC-PROD-001";
  const estoqueLegadoSubstituido = linha.id.startsWith("EST-REV-") || linha.id.startsWith("EST-FIN-");

  return icmsAntigoValido
    && !cartaoIndividualAindaNaoValidado
    && !depreciacaoProvisoriaSemFichaJunho
    && !receitaFilialCircular
    && !estoqueLegadoSubstituido;
});

const receitasFilialDocumentadas = [
  {
    id: "FIL-REC-PROD-FISCAL-062026",
    data: "30/06/2026",
    origem: "SAÍDAS FISCAIS FILIAL 06/2026",
    debitoCodigo: "25111",
    debito: "25111 - Clientes Diversos",
    creditoCodigo: "2606",
    credito: "2606 - Vendas de Produtos a Prazo",
    historico: "Receita de produção/operação triangular da filial - CFOP 5123",
    documento: "CFOP 5123 - FILIAL 06/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 15294.75,
    status: "validado" as const,
    observacao: "Valor apurado diretamente nas notas fiscais da filial. Não utiliza a DRE enviada como fonte.",
    rastreio: "documento" as const,
    fonte: "SAIDAS FILIAL(2).xlsx + RESUMO NOTAS FISCAIS SAIDA(2).pdf",
  },
  {
    id: "FIL-REC-REV-FISCAL-062026",
    data: "30/06/2026",
    origem: "SAÍDAS FISCAIS FILIAL 06/2026",
    debitoCodigo: "25111",
    debito: "25111 - Clientes Diversos",
    creditoCodigo: "2655",
    credito: "2655 - Vendas de Mercadorias a Prazo",
    historico: "Receita de revenda da filial - CFOP 5102/6102",
    documento: "CFOP 5102/6102 - FILIAL 06/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 334878.33,
    status: "validado" as const,
    observacao: "CFOP 5102 R$ 290.427,01 + CFOP 6102 R$ 44.451,32. Não utiliza a DRE enviada como fonte.",
    rastreio: "documento" as const,
    fonte: "SAIDAS FILIAL(2).xlsx + RESUMO NOTAS FISCAIS SAIDA(2).pdf",
  },
];

const fechamentoCpvSemIcmsMatrizObsoleto = fechamentoCpvJunho.filter(
  (linha) => !["CPV-ICMS-M-OUT", "CPV-ICMS-M-IN"].includes(linha.id),
);

const baseDocumentalJunho = [
  ...lancamentosBaseSaneados,
  ...receitasFilialDocumentadas,
  ...fechamentoCpvSemIcmsMatrizObsoleto,
  ajusteEstoqueResultadoJunho,
];

// Importação e financeiro nascem no Razão antes do Balancete/DRE.
const baseComImportacoesFechadas = aplicarFechamentoImportacoesJunho(baseDocumentalJunho);
const baseComFechamentoFinanceiro = aplicarFechamentoFinanceiroJunho(baseComImportacoesFechadas);
const baseCorrigida = corrigirMapeamentosJunho(baseComFechamentoFinanceiro);
const baseComCreditosFederaisFechados = aplicarFechamentoCreditosFederaisJunho(baseCorrigida);
const baseComDespesasFechadas = aplicarFechamentoDespesasJunho(baseComCreditosFederaisFechados);
const fechamentoEstoqueMatriz = gerarFechamentoEstoqueMatrizJunho(baseComDespesasFechadas);

const baseComEstoqueFechado = [
  ...baseComDespesasFechadas,
  ...fechamentoEstoqueMatriz,
];

const baseComCpvFinal = aplicarFechamentoCpvFinalJunho(baseComEstoqueFechado);
const lancamentosIntegradosFinais = aplicarFechamentoAlienacaoJunho(baseComCpvFinal);

/**
 * Validação anticircularidade.
 * Nunca derruba a aplicação em import-time. A inconsistência fica disponível
 * como bloqueio contábil para ser exibida nas telas de fechamento/validação.
 */
const classificacaoPorConta = new Map(saldosImplantacao.map((conta) => [conta.conta, conta.classificacao]));
const receitaCircular = lancamentosIntegradosFinais.find((linha) => {
  const classificacaoCredito = classificacaoPorConta.get(linha.creditoCodigo) ?? "";
  if (!classificacaoCredito.startsWith("4.1.01")) return false;
  const proveniencia = `${linha.origem} ${linha.fonte}`.toLocaleUpperCase("pt-BR");
  return proveniencia.includes("DRE");
});

export const bloqueioReceitaCircular = receitaCircular
  ? {
      bloqueado: true,
      lancamentoId: receitaCircular.id,
      mensagem: `Receita ${receitaCircular.id} está sendo alimentada pela própria DRE (${receitaCircular.fonte}).`,
    }
  : {
      bloqueado: false,
      lancamentoId: null,
      mensagem: null,
    };

export const lancamentosIntegrados = lancamentosIntegradosFinais;

export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;

export const lancamentosPorRastreio = {
  documento: lancamentosIntegrados.filter((linha) => linha.rastreio === "documento").length,
  derivado: lancamentosIntegrados.filter((linha) => linha.rastreio === "derivado").length,
  sugerido: lancamentosIntegrados.filter((linha) => linha.rastreio === "sugerido").length,
};
