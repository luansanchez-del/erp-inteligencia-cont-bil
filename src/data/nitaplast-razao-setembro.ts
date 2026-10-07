import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { lancamentosProvisaoReceitaAgosto } from "./nitaplast-provisao-receita-agosto";
import { lancamentosFolhaSetembro } from "./nitaplast-folha-setembro";
import { lancamentosProvisoesSetembro } from "./nitaplast-provisoes-setembro";
import { lancamentosAcertosBancosSetembro } from "./nitaplast-acertos-bancos-setembro";

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
 * Pendente: pagamento do DARF de IRPJ/CSLL de agosto (R$ 35.567,01), quando sair do banco.
 */
export const lancamentosIntegradosSetembro: LancamentoIntegrado[] = [
  ...estornoProvisaoReceitaSetembro,
  ...lancamentosFolhaSetembro,
  ...lancamentosProvisoesSetembro,
  ...lancamentosAcertosBancosSetembro,
];
