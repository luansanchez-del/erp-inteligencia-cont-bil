import { lancamentosBancariosSegurosAgosto } from "./nitaplast-bancos-agosto";
import { lancamentosProvisaoImpostosAgosto } from "./nitaplast-provisao-impostos-agosto";
import { lancamentosRecebimentosClientesAgosto } from "./nitaplast-recebimentos-clientes-agosto";
import { lancamentosIcmsStAgosto } from "./nitaplast-icms-st-agosto";
import { lancamentosBradescoInvestFacilAgosto } from "./nitaplast-aplicacoes-bradesco-agosto";
import { lancamentosCambioAgosto } from "./nitaplast-cambio-agosto";
import { lancamentosVersaoJulho } from "./nitaplast-razao-julho-final-v2";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import {
  lancamentosAmortizacaoAgosto,
  lancamentosComprasCpvAgosto,
  lancamentosDepreciacaoAgosto,
  lancamentosFechamentoEstoqueAgosto,
  lancamentosImobilizadoAgosto,
} from "./nitaplast-cpv-depreciacao-agosto";
export { saldoAberturaAgostoPorConta } from "./nitaplast-saldos-agosto";

/**
 * Estorno, em agosto, das cinco partidas de versão temporárias contabilizadas
 * em julho por decisão do contador. A inversão é exata e mantém referência ao
 * lançamento original; não é uma nova estimativa nem um ajuste de encaixe.
 */
export const estornosVersaoJulhoEmAgosto: LancamentoIntegrado[] = lancamentosVersaoJulho.map((original) => ({
  ...original,
  id: `AGO-EST-${original.id}`,
  data: "01/08/2026",
  origem: "ESTORNO LANÇAMENTO DE VERSÃO 07/2026",
  debitoCodigo: original.creditoCodigo,
  debito: original.credito,
  creditoCodigo: original.debitoCodigo,
  credito: original.debito,
  historico: `Estorno programado de ${original.id} — ${original.historico}`,
  documento: `ESTORNO ${original.documento}`,
  status: "validado",
  observacao: `Estorno integral e exato do lançamento temporário ${original.id}, conforme decisão do contador registrada em 24/08/2026.`,
  rastreio: "derivado",
  fonte: `Referência contábil: ${original.id} / ${original.fonte}`,
}));

/**
 * Fonte contábil única de 08/2026. Toda tela do período deve derivar desta base,
 * acrescida apenas dos lançamentos manuais/importados auditáveis do usuário.
 * Linhas com status "revisar" continuam no Razão como fatos identificados, sem
 * serem apresentadas como pendências já resolvidas.
 */
export const lancamentosIntegradosAgosto: LancamentoIntegrado[] = [
  ...estornosVersaoJulhoEmAgosto,
  ...lancamentosBancariosSegurosAgosto,
  ...lancamentosProvisaoImpostosAgosto,
  ...lancamentosIcmsStAgosto,
  ...lancamentosBradescoInvestFacilAgosto,
  ...lancamentosCambioAgosto,
  ...lancamentosRecebimentosClientesAgosto,
  ...lancamentosComprasCpvAgosto,
  ...lancamentosFechamentoEstoqueAgosto,
  ...lancamentosImobilizadoAgosto,
  ...lancamentosDepreciacaoAgosto,
  ...lancamentosAmortizacaoAgosto,
];

export const resumoRazaoAgosto = {
  partidas: lancamentosIntegradosAgosto.length,
  debitos: lancamentosIntegradosAgosto.reduce((total, linha) => total + linha.valor, 0),
  creditos: lancamentosIntegradosAgosto.reduce((total, linha) => total + linha.valor, 0),
  emRevisao: lancamentosIntegradosAgosto.filter((linha) => linha.status === "revisar").length,
} as const;
