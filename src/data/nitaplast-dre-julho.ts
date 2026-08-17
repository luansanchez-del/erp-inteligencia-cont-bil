import { saldosImplantacao } from "./nitaplast-implantacao";
import {
  diagnosticoFechamentoJulho,
  lancamentosIntegradosJulho,
} from "./nitaplast-razao-julho";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const classificacaoPorConta = new Map(saldosImplantacao.map((conta) => [conta.conta, conta.classificacao]));

function somaIds(ids: string[]) {
  const conjunto = new Set(ids);
  return arred(
    lancamentosIntegradosJulho
      .filter((lancamento) => conjunto.has(lancamento.id))
      .reduce((total, lancamento) => total + lancamento.valor, 0),
  );
}

const idsReceita = ["JUL-REC-M-PROD", "JUL-REC-M-REV", "JUL-REC-F-PROD", "JUL-REC-F-REV"];
const idsDevolucoes = ["JUL-DEV-M", "JUL-DEV-F"];
const idsIcms = ["JUL-TAX-ICMS-M-EXT", "JUL-TAX-ICMS-F-EXT"];
const idsIpi = ["JUL-TAX-IPI-M", "JUL-TAX-IPI-F"];

const entradasResultado = lancamentosIntegradosJulho.filter((lancamento) => {
  if (!lancamento.id.startsWith("JUL-ENT-CC-")) return false;
  const classificacao = classificacaoPorConta.get(lancamento.debitoCodigo) ?? "";
  return classificacao.startsWith("5.") || classificacao.startsWith("4.2");
});

const custosReconhecidos = arred(
  entradasResultado
    .filter((lancamento) => {
      const classificacao = classificacaoPorConta.get(lancamento.debitoCodigo) ?? "";
      return classificacao.startsWith("5.1") || classificacao.startsWith("4.2");
    })
    .reduce((total, lancamento) => total + lancamento.valor, 0),
);

const despesasReconhecidas = arred(
  entradasResultado
    .filter((lancamento) => {
      const classificacao = classificacaoPorConta.get(lancamento.debitoCodigo) ?? "";
      return classificacao.startsWith("5.") && !classificacao.startsWith("5.1");
    })
    .reduce((total, lancamento) => total + lancamento.valor, 0),
);

const receitaBruta = somaIds(idsReceita);
const devolucoes = somaIds(idsDevolucoes);
const icms = somaIds(idsIcms);
const icmsSt = somaIds(["JUL-TAX-ICMSST"]);
const ipi = somaIds(idsIpi);
const pis = somaIds(["JUL-TAX-PIS"]);
const cofins = somaIds(["JUL-TAX-COF"]);
const deducoes = arred(devolucoes + icms + icmsSt + ipi + pis + cofins);
const receitaLiquida = arred(receitaBruta - deducoes);
const custosDespesasReconhecidos = arred(custosReconhecidos + despesasReconhecidas);
const resultadoParcial = arred(receitaLiquida - custosDespesasReconhecidos);

/**
 * DRE PARCIAL 07/2026.
 * Nasce exclusivamente do Razão de julho já documentado. Não existe DRE enviada
 * de julho alimentando o cálculo. Estoque/CPV, folha, bancos/AR/AP, créditos
 * federais ainda não abertos e itens financeiros manuais permanecem pendentes.
 */
export const dreParcialJulho = {
  receitaBruta,
  devolucoes,
  icms,
  icmsSt,
  ipi,
  pis,
  cofins,
  deducoes,
  receitaLiquida,
  custosReconhecidos,
  despesasReconhecidas,
  custosDespesasReconhecidos,
  resultadoParcial,
  quantidadeLancamentosResultado: entradasResultado.length,
  status: "parcial" as const,
  pendencias: diagnosticoFechamentoJulho,
} as const;

export const composicaoResultadoJulho = entradasResultado.map((lancamento) => ({
  id: lancamento.id,
  conta: lancamento.debitoCodigo,
  descricao: lancamento.debito,
  classificacao: classificacaoPorConta.get(lancamento.debitoCodigo) ?? "",
  cc: lancamento.cc,
  centroCusto: lancamento.centroCusto,
  valor: lancamento.valor,
  status: lancamento.status,
  fonte: lancamento.fonte,
}));
