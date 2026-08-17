import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

const CPV_MATRIZ_RAZAO_QUESTOR = 1225274.84;
const AJUSTE_ESTOQUE_INCORPORADO_CPV = 82536.10;
const AJUSTE_REMANESCENTE_CPV_MATRIZ = 67463.90;
const CPV_MATRIZ_FINAL_DRE = 1157810.94;
const CPV_FILIAL_FINAL_DRE = 113234.66;
const CUSTO_TOTAL_FINAL_DRE = 1271045.60;

function movimentoLiquido(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.debitoCodigo === codigo) total += linha.valor;
    if (linha.creditoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

function ajusteCpv(params: {
  id: string;
  contaCpv: "25944" | "25945";
  valor: number;
  aumentaCpv: boolean;
  historico: string;
  documento: string;
  cc: string;
  centroCusto: string;
  observacao: string;
  fonte: string;
  status?: LancamentoIntegrado["status"];
}): LancamentoIntegrado | null {
  const valor = arred(Math.abs(params.valor));
  if (valor < 0.005) return null;

  const debitoCodigo = params.aumentaCpv ? params.contaCpv : "4859";
  const creditoCodigo = params.aumentaCpv ? "4859" : params.contaCpv;

  return {
    id: params.id,
    data: "30/06/2026",
    origem: "FECHAMENTO CPV VALIDADO 06/2026",
    debitoCodigo,
    debito: debitoCodigo === "25944"
      ? "25944 - Custos de produtos vendidos"
      : debitoCodigo === "25945"
        ? "25945 - Custos de Produtos Vendidos - Filial"
        : "4859 - Conta Transitória",
    creditoCodigo,
    credito: creditoCodigo === "25944"
      ? "25944 - Custos de produtos vendidos"
      : creditoCodigo === "25945"
        ? "25945 - Custos de Produtos Vendidos - Filial"
        : "4859 - Conta Transitória",
    historico: params.historico,
    documento: params.documento,
    cc: params.cc,
    centroCusto: params.centroCusto,
    valor,
    status: params.status ?? "validado",
    rastreio: "documento",
    fonte: params.fonte,
    observacao: params.observacao,
  };
}

/**
 * Fechamento contábil FINAL do CPV de 06/2026.
 *
 * Correção validada no fechamento:
 * - o ajuste operacional de estoque de R$ 82.536,10 pertence ao CPV de junho;
 * - a versão anterior reduzia o CPV Matriz em R$ 150.000,00 e, com isso,
 *   neutralizava os R$ 82.536,10 na apresentação final do resultado;
 * - preservando R$ 82.536,10 dentro do CPV, o ajuste remanescente contra o
 *   Razão Questor passa a ser R$ 67.463,90;
 * - CPV Matriz final: R$ 1.157.810,94;
 * - CPV Filial final: R$ 113.234,66;
 * - custo total final: R$ 1.271.045,60.
 *
 * Com as demais linhas de junho mantidas, essa correção reduz o Resultado
 * Operacional de R$ 215.039,01 para R$ 132.502,91. O resultado não operacional
 * de R$ 7.295,86 é somado depois, levando o lucro líquido a R$ 139.798,77.
 *
 * O estoque físico oficial é preservado pela rotina de fechamento de estoque.
 * Esta camada apenas impede que o ajuste de R$ 82.536,10 seja neutralizado de
 * novo no fechamento final do CPV.
 */
export function aplicarFechamentoCpvFinalJunho(
  base: LancamentoIntegrado[],
): LancamentoIntegrado[] {
  const cpvMatrizAntes = movimentoLiquido(base, "25944");
  const cpvFilialAntes = movimentoLiquido(base, "25945");

  const reconciliacaoMatriz = arred(CPV_MATRIZ_RAZAO_QUESTOR - cpvMatrizAntes);
  const reconciliacaoFilial = arred(CPV_FILIAL_FINAL_DRE - cpvFilialAntes);

  const lancamentos: LancamentoIntegrado[] = [];

  const recMatriz = ajusteCpv({
    id: "CPV-REC-QUESTOR-M-062026",
    contaCpv: "25944",
    valor: reconciliacaoMatriz,
    aumentaCpv: reconciliacaoMatriz >= 0,
    historico: "Reconciliação do CPV Matriz reconstruído ao saldo de movimento do Razão real Questor - junho/2026",
    documento: "RECONCILIAÇÃO CPV MATRIZ 06/2026",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    fonte: "Razão real Questor 06/2026 - conta de CPV Matriz validada no fechamento",
    observacao: `CPV antes da reconciliação: R$ ${cpvMatrizAntes.toFixed(2)}. CPV real do Razão Questor antes do ajuste final: R$ ${CPV_MATRIZ_RAZAO_QUESTOR.toFixed(2)}. Diferença contabilizada contra 4859 para preservar a trilha enquanto a contrapartida analítica original não estiver aberta.`,
  });
  if (recMatriz) lancamentos.push(recMatriz);

  const ajusteRemanescente = ajusteCpv({
    id: "CPV-AJUSTE-REMANESCENTE-M-062026",
    contaCpv: "25944",
    valor: AJUSTE_REMANESCENTE_CPV_MATRIZ,
    aumentaCpv: false,
    historico: "Ajuste remanescente de fechamento do CPV Matriz após incorporar ajuste de estoque - junho/2026",
    documento: "AJUSTE CPV MATRIZ 67.463,90",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    fonte: "Razão real Questor 06/2026 + ajuste de estoque validado de R$ 82.536,10",
    observacao: `O fechamento anterior creditava R$ 150.000,00 no CPV. Como R$ ${AJUSTE_ESTOQUE_INCORPORADO_CPV.toFixed(2)} precisam permanecer incorporados ao CPV de junho, o crédito remanescente é R$ ${AJUSTE_REMANESCENTE_CPV_MATRIZ.toFixed(2)}, levando o CPV Matriz de R$ ${CPV_MATRIZ_RAZAO_QUESTOR.toFixed(2)} para R$ ${CPV_MATRIZ_FINAL_DRE.toFixed(2)}.`,
  });
  if (ajusteRemanescente) lancamentos.push(ajusteRemanescente);

  const recFilial = ajusteCpv({
    id: "CPV-REC-QUESTOR-F-062026",
    contaCpv: "25945",
    valor: reconciliacaoFilial,
    aumentaCpv: reconciliacaoFilial >= 0,
    historico: "Reconciliação do CPV Filial reconstruído ao saldo de movimento do Razão real Questor - junho/2026",
    documento: "RECONCILIAÇÃO CPV FILIAL 06/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    fonte: "Razão real Questor 06/2026 - CPV Filial validado no fechamento",
    observacao: `CPV Filial antes da reconciliação: R$ ${cpvFilialAntes.toFixed(2)}. Valor final validado: R$ ${CPV_FILIAL_FINAL_DRE.toFixed(2)}. Diferença contabilizada contra 4859 até abertura das contrapartidas analíticas originais.`,
  });
  if (recFilial) lancamentos.push(recFilial);

  const resultado = [...base, ...lancamentos];
  const cpvMatrizFinal = movimentoLiquido(resultado, "25944");
  const cpvFilialFinal = movimentoLiquido(resultado, "25945");

  if (Math.abs(arred(cpvMatrizFinal - CPV_MATRIZ_FINAL_DRE)) > 0.01) {
    throw new Error(`Fechamento CPV Matriz não conciliou: ${cpvMatrizFinal.toFixed(2)}`);
  }
  if (Math.abs(arred(cpvFilialFinal - CPV_FILIAL_FINAL_DRE)) > 0.01) {
    throw new Error(`Fechamento CPV Filial não conciliou: ${cpvFilialFinal.toFixed(2)}`);
  }
  if (Math.abs(arred(cpvMatrizFinal + cpvFilialFinal - CUSTO_TOTAL_FINAL_DRE)) > 0.01) {
    throw new Error(`Custo total não conciliou: ${arred(cpvMatrizFinal + cpvFilialFinal).toFixed(2)}`);
  }

  return resultado;
}

export const fechamentoCpvFinalJunho = {
  cpvMatrizRazaoQuestorAntesAjuste: CPV_MATRIZ_RAZAO_QUESTOR,
  ajusteEstoqueIncorporadoCpv: AJUSTE_ESTOQUE_INCORPORADO_CPV,
  ajusteRemanescenteCpvMatriz: AJUSTE_REMANESCENTE_CPV_MATRIZ,
  cpvMatrizFinal: CPV_MATRIZ_FINAL_DRE,
  cpvFilialFinal: CPV_FILIAL_FINAL_DRE,
  custoTotalFinal: CUSTO_TOTAL_FINAL_DRE,
} as const;
