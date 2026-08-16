import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

/**
 * Correções de mapeamento identificadas durante a conferência da DRE de 06/2026.
 *
 * 11.01.001 - COMPRAS PROD REVENDA/MAT DIRETOS foi inicialmente direcionada à conta
 * 3035 (CMV). A conciliação detalhada 06/07 identifica esses documentos na conta 25135,
 * Estoque Final Matéria Prima. Os créditos fiscais vinculados à mesma base precisam acompanhar
 * a conta de estoque para não deixar um CMV credor artificial.
 *
 * A camada é aplicada no Razão definitivo sem apagar os IDs, fontes ou documentos originais.
 */
export function corrigirMapeamentosJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  return base.map((linha) => {
    const compraDiretaMapeadaComoCmv =
      linha.origem === "ENTRADAS CLIENTE POR CENTRO DE CUSTO 06/2026"
      && linha.debitoCodigo === "3035"
      && Math.abs(linha.valor - 58551.20) < 0.005;

    if (compraDiretaMapeadaComoCmv) {
      return {
        ...linha,
        debitoCodigo: "25135",
        debito: nomeConta("25135"),
        observacao: `${linha.observacao} Correção de mapeamento: 11.01.001 pertence ao estoque 25135, conforme conciliação de entradas 06/07; não reconhecer diretamente em CMV.`,
        fonte: `${linha.fonte} + CONCILIACAO_ENTRADAS_CC_CONTABIL_NITAPLAST_06_07_2026.xlsx`,
      };
    }

    const creditoFiscalDaCompraDireta =
      linha.origem.startsWith("APURAÇÃO ")
      && linha.creditoCodigo === "3035"
      && [3539.19, 6350.22, 5632.77, 768.38].some((valor) => Math.abs(linha.valor - valor) < 0.005);

    if (creditoFiscalDaCompraDireta) {
      return {
        ...linha,
        creditoCodigo: "25135",
        credito: nomeConta("25135"),
        observacao: `${linha.observacao} Crédito fiscal reclassificado junto à compra direta para a conta 25135, evitando CMV artificial antes da apuração do custo.`,
        fonte: `${linha.fonte} + conferência DRE/Razão 06/2026`,
      };
    }

    return linha;
  });
}
