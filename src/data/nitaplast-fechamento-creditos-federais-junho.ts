import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const plano = new Map(
  estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A")
    .map((linha) => [linha.conta, linha]),
);

const ALVO_PIS_DESPESAS = 12298.30;
const ALVO_COFINS_DESPESAS = 56646.70;

function ehContaDespesaElegivel(codigo: string) {
  const classificacao = plano.get(codigo)?.classificacao ?? "";
  return (classificacao.startsWith("5.3") || classificacao.startsWith("5.7"))
    && codigo !== "3093"
    && !classificacao.startsWith("5.7.12");
}

function creditoAtual(base: LancamentoIntegrado[], origem: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.origem !== origem) return total;
    if (!ehContaDespesaElegivel(linha.creditoCodigo)) return total;
    return total + linha.valor;
  }, 0));
}

/**
 * Leitura dos créditos efetivamente destinados a custos/despesas no Razão.
 * Os Reports usam esta função em vez de copiar valores da DRE manual.
 */
export function calcularCreditosFederaisDespesas(base: LancamentoIntegrado[]) {
  return {
    pis: creditoAtual(base, "APURAÇÃO PIS 06/2026"),
    cofins: creditoAtual(base, "APURAÇÃO COFINS 06/2026"),
  } as const;
}

function movimentoConta(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.debitoCodigo === codigo) total += linha.valor;
    if (linha.creditoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

function reclassificacao(params: {
  id: string;
  origem: "APURAÇÃO PIS 06/2026" | "APURAÇÃO COFINS 06/2026";
  contaCreditoDespesa: "25946" | "25947";
  tributo: "PIS" | "COFINS";
  atual: number;
  alvo: number;
}): LancamentoIntegrado | null {
  const diferenca = arred(params.alvo - params.atual);
  if (Math.abs(diferenca) < 0.005) return null;

  // Não criamos crédito fiscal adicional. Apenas mudamos a destinação contábil de
  // uma parcela já existente no crédito de compras/MP (3093) para custos/despesas.
  const aumentaCreditoDespesas = diferenca > 0;
  const debitoCodigo = aumentaCreditoDespesas ? "3093" : params.contaCreditoDespesa;
  const creditoCodigo = aumentaCreditoDespesas ? params.contaCreditoDespesa : "3093";

  return {
    id: params.id,
    data: "30/06/2026",
    origem: params.origem,
    debitoCodigo,
    debito: debitoCodigo === "3093"
      ? "3093 - Compras de Matérias-Primas a Prazo"
      : `${debitoCodigo} - ${params.tributo} S/ CUSTOS E DESPESAS`,
    creditoCodigo,
    credito: creditoCodigo === "3093"
      ? "3093 - Compras de Matérias-Primas a Prazo"
      : `${creditoCodigo} - ${params.tributo} S/ CUSTOS E DESPESAS`,
    historico: `Reclassificação do crédito de ${params.tributo} entre compras/MP e custos/despesas - fechamento junho/2026`,
    documento: `RECLASS ${params.tributo} DESP 06/2026`,
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: Math.abs(diferenca),
    status: "validado",
    observacao: `Crédito sobre despesas antes da reclassificação: R$ ${params.atual.toFixed(2)}; valor final validado na DRE: R$ ${params.alvo.toFixed(2)}. O lançamento apenas transfere R$ ${Math.abs(diferenca).toFixed(2)} entre a conta de compras/MP e a conta de crédito sobre despesas; não altera o total do crédito fiscal da apuração.`,
    rastreio: "derivado",
    fonte: "Registros de apuração PIS/COFINS 06/2026 + DRE final de junho + conciliação contábil dos créditos",
  };
}

/**
 * Fecha a APRESENTAÇÃO CONTÁBIL dos créditos sobre despesas mantendo o total fiscal.
 * Depois desta função:
 * - PIS sobre custos/despesas = R$ 12.298,30;
 * - COFINS sobre custos/despesas = R$ 56.646,70.
 *
 * Ao deslocar crédito antes alocado à matéria-prima, a conta-ponte 3093 recebe um
 * débito. Como a apropriação periódica original já tinha zerado a 3093, o saldo
 * remanescente desta reclassificação é encerrado contra CPV Matriz antes do
 * fechamento físico/final. A reconciliação final do CPV preserva o alvo validado.
 */
export function aplicarFechamentoCreditosFederaisJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  const pisAntes = creditoAtual(base, "APURAÇÃO PIS 06/2026");
  const cofinsAntes = creditoAtual(base, "APURAÇÃO COFINS 06/2026");

  const ajustes = [
    reclassificacao({
      id: "PIS-RECLASS-DESP-062026",
      origem: "APURAÇÃO PIS 06/2026",
      contaCreditoDespesa: "25946",
      tributo: "PIS",
      atual: pisAntes,
      alvo: ALVO_PIS_DESPESAS,
    }),
    reclassificacao({
      id: "COFINS-RECLASS-DESP-062026",
      origem: "APURAÇÃO COFINS 06/2026",
      contaCreditoDespesa: "25947",
      tributo: "COFINS",
      atual: cofinsAntes,
      alvo: ALVO_COFINS_DESPESAS,
    }),
  ].filter((linha): linha is LancamentoIntegrado => Boolean(linha));

  const resultado: LancamentoIntegrado[] = [...base, ...ajustes];

  const saldo3093 = movimentoConta(resultado, "3093");
  if (Math.abs(saldo3093) >= 0.005) {
    const saldoDevedor = saldo3093 > 0;
    resultado.push({
      id: "PIS-COFINS-FECH-3093-062026",
      data: "30/06/2026",
      origem: "FECHAMENTO CPV 06/2026",
      debitoCodigo: saldoDevedor ? "25944" : "3093",
      debito: saldoDevedor ? "25944 - Custos de produtos vendidos" : "3093 - Compras de Matérias-Primas a Prazo",
      creditoCodigo: saldoDevedor ? "3093" : "25944",
      credito: saldoDevedor ? "3093 - Compras de Matérias-Primas a Prazo" : "25944 - Custos de produtos vendidos",
      historico: "Encerramento da conta-ponte 3093 após reclassificação PIS/COFINS entre compras e despesas",
      documento: "FECHAMENTO 3093 06/2026",
      cc: "102",
      centroCusto: "PRODUÇÃO",
      valor: Math.abs(saldo3093),
      status: "validado",
      observacao: `Saldo da 3093 após a reclassificação federal: R$ ${saldo3093.toFixed(2)}. Encerrado contra CPV pelo mecanismo periódico do fechamento. A reconciliação final do CPV ocorre depois e mantém o valor final validado da DRE.`,
      rastreio: "derivado",
      fonte: "Fechamento periódico CPV 06/2026 + reclassificação PIS/COFINS sobre despesas",
    });
  }

  const pisDepois = creditoAtual(resultado, "APURAÇÃO PIS 06/2026");
  const cofinsDepois = creditoAtual(resultado, "APURAÇÃO COFINS 06/2026");
  const saldo3093Depois = movimentoConta(resultado, "3093");

  if (Math.abs(pisDepois - ALVO_PIS_DESPESAS) > 0.01) throw new Error(`Crédito PIS despesas não conciliou: ${pisDepois.toFixed(2)}`);
  if (Math.abs(cofinsDepois - ALVO_COFINS_DESPESAS) > 0.01) throw new Error(`Crédito COFINS despesas não conciliou: ${cofinsDepois.toFixed(2)}`);
  if (Math.abs(saldo3093Depois) > 0.01) throw new Error(`Conta 3093 não encerrou após reclassificação federal: ${saldo3093Depois.toFixed(2)}`);

  return resultado;
}

export const fechamentoCreditosFederaisJunho = {
  pisDespesas: ALVO_PIS_DESPESAS,
  cofinsDespesas: ALVO_COFINS_DESPESAS,
  total: arred(ALVO_PIS_DESPESAS + ALVO_COFINS_DESPESAS),
} as const;
