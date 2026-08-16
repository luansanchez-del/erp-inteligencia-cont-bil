import { lancamentosIntegrados as lancamentosBase } from "./nitaplast-razao-base";
import { fechamentoCpvJunho } from "./nitaplast-cpv-junho";
import { corrigirMapeamentosJunho } from "./nitaplast-correcoes-mapeamento-junho";
import { ajusteEstoqueResultadoJunho } from "./nitaplast-ajuste-estoque-junho";
import { gerarFechamentoEstoqueMatrizJunho } from "./nitaplast-fechamento-estoque-matriz-junho";
import { aplicarFechamentoFinanceiroJunho } from "./nitaplast-fechamento-financeiro-junho";
import { aplicarFechamentoCpvFinalJunho } from "./nitaplast-fechamento-cpv-final-junho";
import { aplicarFechamentoFolhaJunho } from "./nitaplast-fechamento-folha-junho";
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
 * 2. saneamento de fontes duplicadas/provisórias;
 * 3. reconstrução da folha oficial de junho por CC;
 * 4. fechamento de CPV e ajuste de estoque já validado;
 * 5. fechamento financeiro validado no próprio Razão;
 * 6. correções de mapeamento comprovadas;
 * 7. fechamento físico final das contas de estoque;
 * 8. reconciliação final do CPV ao Razão real Questor + ajuste autorizado.
 *
 * Balancete e DRE leem este mesmo conjunto. Portanto nenhuma linha da DRE é
 * alterada manualmente para "bater": o resultado nasce dos lançamentos.
 */

/**
 * Fontes retiradas do fechamento oficial:
 *
 * - APURAÇÃO ICMS antiga da matriz: os créditos daquela versão foram invalidados;
 *   permanece somente TAX-SAI-ICMS, débito das saídas de R$ 239.206,46.
 *
 * - CAR-LOTE: a planilha de cartão é meio de pagamento/conciliação. As despesas
 *   fiscais correspondentes já estão registradas pelas notas/entradas. Somar o
 *   cartão novamente criava R$ 48.548,03 de despesa em duplicidade. O cartão deve
 *   ser usado na baixa da obrigação, não para reconhecer uma segunda despesa.
 *
 * - PON-DEP: depreciações replicadas do padrão do Razão de maio, sem ficha de bens
 *   de junho. O lote somava R$ 57.861,02 e estava sendo tratado como fato de junho
 *   mesmo com a própria fonte marcada como "falta ficha de bens de junho". Sai do
 *   fechamento oficial até existir suporte do período.
 */
const lancamentosBaseSaneados = lancamentosBase.filter((linha) => {
  const icmsAntigoValido = linha.origem !== "APURAÇÃO ICMS 06/2026" || linha.id === "TAX-SAI-ICMS";
  const naoEhCartaoDuplicado = !linha.id.startsWith("CAR-LOTE-");
  const naoEhDepreciacaoProvisoria = !linha.id.startsWith("PON-DEP-");
  return icmsAntigoValido && naoEhCartaoDuplicado && naoEhDepreciacaoProvisoria;
});

// A função remove a montagem FOL-* anterior e substitui por uma apropriação que
// fecha em R$ 72.685,80 conforme o relatório real de junho, inclusive CC 502.
const baseComFolhaOficial = aplicarFechamentoFolhaJunho(lancamentosBaseSaneados);

const baseComFechamentoFinanceiro = aplicarFechamentoFinanceiroJunho([
  ...baseComFolhaOficial,
  ...fechamentoCpvJunho,
  ajusteEstoqueResultadoJunho,
]);

const baseCorrigida = corrigirMapeamentosJunho(baseComFechamentoFinanceiro);
const fechamentoEstoqueMatriz = gerarFechamentoEstoqueMatrizJunho(baseCorrigida);

// Primeiro fechamos o patrimônio ao inventário físico oficial. Só depois
// reconciliamos o movimento das contas de CPV com o Razão real do Questor e
// registramos o ajuste autorizado de R$ 150 mil. Assim o estoque oficial não é
// usado como contrapartida artificial para forçar a DRE.
const baseComEstoqueFechado = [
  ...baseCorrigida,
  ...fechamentoEstoqueMatriz,
];

export const lancamentosIntegrados = aplicarFechamentoCpvFinalJunho(baseComEstoqueFechado);

export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;

export const lancamentosPorRastreio = {
  documento: lancamentosIntegrados.filter((linha) => linha.rastreio === "documento").length,
  derivado: lancamentosIntegrados.filter((linha) => linha.rastreio === "derivado").length,
  sugerido: lancamentosIntegrados.filter((linha) => linha.rastreio === "sugerido").length,
};
