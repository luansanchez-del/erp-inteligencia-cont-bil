import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

/**
 * Ajuste operacional do fechamento FINAL de 06/2026.
 *
 * O valor de R$ 82.536,10 foi informado na DRE enviada como ajuste de estoque
 * necessário para preservar o resultado final de junho após a correção da
 * receita financeira. O inventário oficial de 30/06/2026 já incorpora esse
 * ajuste na matéria-prima.
 *
 * IMPORTANTE:
 * - este lançamento precisa aparecer no Razão para manter a trilha contábil;
 * - ele NÃO deve ser lançado novamente em julho;
 * - o fechamento automático do estoque é calculado depois deste lançamento e
 *   ajusta apenas o residual necessário para chegar ao inventário oficial;
 * - o centavo entre R$ 82.536,10 informado e R$ 82.536,09 observado na variação
 *   do inventário é absorvido pelo fechamento físico oficial.
 */
export const ajusteEstoqueResultadoJunho: LancamentoIntegrado = {
  id: "AJ-EST-RESULT-062026",
  data: "30/06/2026",
  origem: "AJUSTE OPERACIONAL FECHAMENTO 06/2026",
  debitoCodigo: "25135",
  debito: nomeConta("25135"),
  creditoCodigo: "25944",
  credito: nomeConta("25944"),
  historico: "Ajuste de estoque de matéria-prima incorporado ao resultado final da DRE de junho/2026",
  documento: "AJUSTE DRE 06/2026 - 82.536,10",
  cc: "102",
  centroCusto: "PRODUÇÃO",
  valor: 82536.10,
  status: "validado",
  rastreio: "documento",
  fonte: "DRE ENVIADA 06/2026 + REGISTRO INVENTARIO ESTOQUE OFICIAL.pdf",
  observacao: "D Estoque de Matéria-Prima (25135) / C CPV Matriz (25944). Ajuste já incorporado ao lucro final de junho informado na DRE enviada. Não repetir em 07/2026.",
};
