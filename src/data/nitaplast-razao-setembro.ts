import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { lancamentosProvisaoReceitaAgosto } from "./nitaplast-provisao-receita-agosto";
import { lancamentosFolhaSetembro } from "./nitaplast-folha-setembro";
import { lancamentosProvisoesSetembro } from "./nitaplast-provisoes-setembro";
import { lancamentosAcertosBancosSetembro } from "./nitaplast-acertos-bancos-setembro";
import { lancamentosItauSetembro } from "./nitaplast-itau-setembro";
import { lancamentosBradesco6349Setembro } from "./nitaplast-bradesco-6349-setembro";
import { lancamentosBancosSetembro } from "./nitaplast-bancos-setembro";
import { lancamentosDepreciacaoSetembro, lancamentosJcpSetembro } from "./nitaplast-depreciacao-jcp-setembro";
import { lancamentosDevolucoesVendasSetembro, lancamentosReceitasSetembro } from "./nitaplast-receitas-setembro";
import { lancamentosEntradasSetembro } from "./nitaplast-entradas-setembro";
import { lancamentosImpostosSetembro } from "./nitaplast-impostos-setembro";
import { lancamentosCpvFilialSetembro, lancamentosTransferenciasSetembro } from "./nitaplast-cpv-setembro";
import { lancamentosAjustesSetembro } from "./nitaplast-ajustes-setembro";
import { lancamentosCartaoFaturaAgosto, lancamentosCartaoFaturaJulho, lancamentosCartaoSetembro } from "./nitaplast-cartao-setembro";
import { lancamentosTransitoriaSetembro } from "./nitaplast-transitoria-setembro";
import { lancamentosJurosDescontosSetembro } from "./nitaplast-juros-descontos-setembro";

/**
 * Estorno, em setembro, da provisão de receita não operacional de R$ 400.000,00
 * lançada em 31/08/2026 (AGO-PROV-RECEITA-NAO-OPER-400K) — estorno integral
 * programado desde o lançamento, sem documento definitivo de receita.
 */
export const estornoProvisaoReceitaSetembro: LancamentoIntegrado[] = lancamentosProvisaoReceitaAgosto.map((original) => ({
  ...original,
  id: `SET-EST-${original.id}`,
  data: "01/09/2026",
  origem: "ESTORNO PROVISÃO DE RECEITA 08/2026",
  debitoCodigo: original.creditoCodigo,
  debito: original.credito,
  creditoCodigo: original.debitoCodigo,
  credito: original.debito,
  historico: `Estorno de ${original.id} — provisão de receita da competência 08/2026`,
  documento: `ESTORNO ${original.documento}`,
  status: "validado",
  observacao: `Estorno integral e exato da provisão ${original.id} (R$ ${original.valor.toFixed(2)}), programado desde o lançamento em agosto.`,
  rastreio: "derivado",
  fonte: `Referência contábil: ${original.id}`,
}));

/**
 * Base contábil de 09/2026 (Nitaplast Matriz). Começa só com o que decorre de agosto;
 * o movimento do mês entra conforme os documentos de setembro forem recebidos.
 * Pendente: CPV da Matriz (inventário de 30/09), câmbio da importação Licharz e LALUR.
 */
export const lancamentosIntegradosSetembro: LancamentoIntegrado[] = [
  ...estornoProvisaoReceitaSetembro,
  ...lancamentosFolhaSetembro,
  ...lancamentosProvisoesSetembro,
  ...lancamentosAcertosBancosSetembro,
  ...lancamentosItauSetembro,
  ...lancamentosBradesco6349Setembro,
  ...lancamentosBancosSetembro,
  ...lancamentosDepreciacaoSetembro,
  ...lancamentosJcpSetembro,
  ...lancamentosReceitasSetembro,
  ...lancamentosDevolucoesVendasSetembro,
  ...lancamentosEntradasSetembro,
  ...lancamentosImpostosSetembro,
  ...lancamentosTransferenciasSetembro,
  ...lancamentosCpvFilialSetembro,
  ...lancamentosAjustesSetembro,
  ...lancamentosCartaoSetembro,
  ...lancamentosCartaoFaturaAgosto,
  ...lancamentosCartaoFaturaJulho,
  ...lancamentosTransitoriaSetembro,
  ...lancamentosJurosDescontosSetembro,
];
