import { lancamentosIntegrados as lancamentosBase } from "./nitaplast-razao-base";
import { fechamentoCpvJunho } from "./nitaplast-cpv-junho";
import { corrigirMapeamentosJunho } from "./nitaplast-correcoes-mapeamento-junho";
import { ajusteEstoqueResultadoJunho } from "./nitaplast-ajuste-estoque-junho";
import { gerarFechamentoEstoqueMatrizJunho } from "./nitaplast-fechamento-estoque-matriz-junho";
import { aplicarFechamentoFinanceiroJunho } from "./nitaplast-fechamento-financeiro-junho";
import { aplicarFechamentoCpvFinalJunho } from "./nitaplast-fechamento-cpv-final-junho";
import { aplicarFechamentoCreditosFederaisJunho } from "./nitaplast-fechamento-creditos-federais-junho";
import { aplicarFechamentoDespesasJunho } from "./nitaplast-fechamento-despesas-junho";
import { aplicarFechamentoAlienacaoJunho } from "./nitaplast-fechamento-alienacao-junho";
import { garantirPlanoFechamentoJunho } from "./nitaplast-plano-fechamento-junho";

export type { LancamentoIntegrado } from "./nitaplast-razao-base";
export { contaPorBanco, depreciacoes } from "./nitaplast-razao-base";

// Garante que contas oficiais usadas nos ajustes apareçam também no plano exibido
// pelo Razão/Balancete, antes do cálculo das movimentações.
garantirPlanoFechamentoJunho();

/**
 * Razão definitivo de junho/2026.
 *
 * Ordem contábil obrigatória:
 * 1. fatos/documentos de junho;
 * 2. saneamento de fontes não validadas/obsoletas;
 * 3. fechamento de CPV e ajuste de estoque já validado;
 * 4. fechamento financeiro validado no próprio Razão;
 * 5. correções de mapeamento comprovadas;
 * 6. reclassificação PIS/COFINS entre compras e despesas, sem criar crédito novo;
 * 7. ajuste contábil REMANESCENTE das despesas contra 25020;
 * 8. fechamento físico final das contas de estoque;
 * 9. reconciliação final do CPV ao Razão real Questor + ajuste autorizado;
 * 10. alienações do imobilizado e ganho líquido de R$ 7.295,86.
 *
 * Balancete e DRE leem este mesmo conjunto. Portanto nenhuma linha da DRE é
 * alterada manualmente para "bater": o resultado nasce dos lançamentos.
 */

/**
 * Fontes fora do fechamento oficial enquanto não houver validação individual:
 *
 * - APURAÇÃO ICMS antiga da matriz: os créditos daquela versão foram invalidados;
 *   permanece somente TAX-SAI-ICMS, débito das saídas de R$ 239.206,46.
 *
 * - CAR-LOTE: os lançamentos agregados do cartão estão marcados para revisão e não
 *   possuem, nesta base, vínculo documento a documento que permita separar gasto
 *   exclusivo de eventual nota já contabilizada. Eles não entram no fechamento
 *   oficial até a conciliação individual; os pagamentos bancários permanecem no
 *   Razão. Assim não presumimos que todo cartão seja despesa nova nem duplicada.
 *
 * - PON-DEP: depreciações replicadas do padrão do Razão de maio, sem ficha de bens
 *   de junho. O lote não é usado como fato de junho até existir suporte do período.
 *
 * A folha documental FOL-* permanece como veio da base de junho. Não substituímos
 * por valores de planilhas provisórias geradas durante a conferência.
 */
const lancamentosBaseSaneados = lancamentosBase.filter((linha) => {
  const icmsAntigoValido = linha.origem !== "APURAÇÃO ICMS 06/2026" || linha.id === "TAX-SAI-ICMS";
  const cartaoIndividualAindaNaoValidado = linha.id.startsWith("CAR-LOTE-");
  const depreciacaoProvisoriaSemFichaJunho = linha.id.startsWith("PON-DEP-");
  return icmsAntigoValido && !cartaoIndividualAindaNaoValidado && !depreciacaoProvisoriaSemFichaJunho;
});

// Duas reclassificações antigas do CPV Matriz dependiam diretamente dos créditos
// da apuração de ICMS invalidada. Elas também saem da base oficial. Os demais fatos
// de estoque/transferência permanecem e o CPV final é reconciliado depois.
const fechamentoCpvSemIcmsMatrizObsoleto = fechamentoCpvJunho.filter(
  (linha) => !["CPV-ICMS-M-OUT", "CPV-ICMS-M-IN"].includes(linha.id),
);

const baseComFechamentoFinanceiro = aplicarFechamentoFinanceiroJunho([
  ...lancamentosBaseSaneados,
  ...fechamentoCpvSemIcmsMatrizObsoleto,
  ajusteEstoqueResultadoJunho,
]);

const baseCorrigida = corrigirMapeamentosJunho(baseComFechamentoFinanceiro);

// A parcela PIS/COFINS sobre despesas é reclassificada dentro do MESMO crédito
// fiscal consolidado. Não existe aumento do crédito da apuração.
const baseComCreditosFederaisFechados = aplicarFechamentoCreditosFederaisJunho(baseCorrigida);

// Recalcula os buckets após TODA a limpeza acima e contabiliza somente a diferença
// ainda necessária por categoria. Quando um documento definitivo for incluído no
// Razão, a diferença contra 25020 diminui automaticamente.
const baseComDespesasFechadas = aplicarFechamentoDespesasJunho(baseComCreditosFederaisFechados);
const fechamentoEstoqueMatriz = gerarFechamentoEstoqueMatrizJunho(baseComDespesasFechadas);

// Primeiro fechamos o patrimônio ao inventário físico oficial. Só depois
// reconciliamos o movimento das contas de CPV com o Razão real do Questor e
// registramos o ajuste autorizado de R$ 150 mil. Assim o estoque oficial não é
// usado como contrapartida artificial para forçar a DRE.
const baseComEstoqueFechado = [
  ...baseComDespesasFechadas,
  ...fechamentoEstoqueMatriz,
];

const baseComCpvFinal = aplicarFechamentoCpvFinalJunho(baseComEstoqueFechado);

// A última camada reconhece as vendas de ativo, baixa patrimonial conhecida do
// compressor e o custo contábil agregado das alienações. O ganho líquido nasce
// no próprio Razão (R$ 15.000,00 - R$ 7.704,14 = R$ 7.295,86).
export const lancamentosIntegrados = aplicarFechamentoAlienacaoJunho(baseComCpvFinal);

export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;

export const lancamentosPorRastreio = {
  documento: lancamentosIntegrados.filter((linha) => linha.rastreio === "documento").length,
  derivado: lancamentosIntegrados.filter((linha) => linha.rastreio === "derivado").length,
  sugerido: lancamentosIntegrados.filter((linha) => linha.rastreio === "sugerido").length,
};
