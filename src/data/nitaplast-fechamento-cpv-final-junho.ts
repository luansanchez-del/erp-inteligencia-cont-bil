import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

const CPV_MATRIZ_RAZAO_QUESTOR = 1225274.84;
const AJUSTE_AUTORIZADO_CPV_MATRIZ = 150000.00;
const CPV_MATRIZ_FINAL_DRE = 1075274.84;
const CPV_FILIAL_FINAL_DRE = 113234.66;
const CUSTO_TOTAL_FINAL_DRE = 1188509.50;

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
 * O estoque físico oficial já foi fechado antes desta etapa e NÃO é alterado aqui.
 * Esta camada reconcilia o Razão reconstruído com os valores de CPV validados no
 * Razão real do Questor e registra separadamente o ajuste de R$ 150.000,00
 * autorizado no fechamento. O ajuste de estoque de R$ 82.536,10 continua sendo
 * um lançamento próprio e já está dentro da base recebida por esta função.
 *
 * Sequência da Matriz:
 * 1. CPV reconstruído após estoque/ajuste de R$ 82.536,10;
 * 2. reconciliação ao CPV do Razão real Questor: R$ 1.225.274,84;
 * 3. ajuste autorizado: crédito no CPV de R$ 150.000,00;
 * 4. CPV final da DRE: R$ 1.075.274,84.
 *
 * Filial:
 * - reconciliação do Razão reconstruído diretamente ao CPV real validado de
 *   R$ 113.234,66.
 *
 * A Conta Transitória 4859 é usada SOMENTE como contrapartida de reconciliação
 * enquanto a abertura analítica das contrapartidas originais do Questor não for
 * reconstruída. Isso preserva estoque, Balancete e trilha de auditoria sem
 * inventar fornecedor, estoque ou outra conta patrimonial.
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
    observacao: `CPV antes da reconciliação: R$ ${cpvMatrizAntes.toFixed(2)}. CPV real do Razão Questor antes do ajuste autorizado: R$ ${CPV_MATRIZ_RAZAO_QUESTOR.toFixed(2)}. Diferença contabilizada contra 4859 para preservar a trilha enquanto a contrapartida analítica original não estiver aberta.`,
  });
  if (recMatriz) lancamentos.push(recMatriz);

  const ajuste150 = ajusteCpv({
    id: "CPV-AJUSTE-150K-M-062026",
    contaCpv: "25944",
    valor: AJUSTE_AUTORIZADO_CPV_MATRIZ,
    aumentaCpv: false,
    historico: "Ajuste autorizado de fechamento do CPV Matriz - junho/2026",
    documento: "AJUSTE CPV MATRIZ 150.000,00",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    fonte: "Orientação de fechamento 06/2026 + DRE enviada de junho",
    observacao: `Ajuste de R$ ${AJUSTE_AUTORIZADO_CPV_MATRIZ.toFixed(2)} autorizado no fechamento: D 4859 / C 25944. Após a reconciliação ao Razão real, leva o CPV Matriz de R$ ${CPV_MATRIZ_RAZAO_QUESTOR.toFixed(2)} para R$ ${CPV_MATRIZ_FINAL_DRE.toFixed(2)}. Não confundir com o ajuste de estoque de R$ 82.536,10, que possui lançamento próprio.`,
  });
  if (ajuste150) lancamentos.push(ajuste150);

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
  ajusteAutorizadoCpvMatriz: AJUSTE_AUTORIZADO_CPV_MATRIZ,
  cpvMatrizFinal: CPV_MATRIZ_FINAL_DRE,
  cpvFilialFinal: CPV_FILIAL_FINAL_DRE,
  custoTotalFinal: CUSTO_TOTAL_FINAL_DRE,
} as const;
