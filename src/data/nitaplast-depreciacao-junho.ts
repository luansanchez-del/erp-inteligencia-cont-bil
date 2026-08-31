import { regrasImobilizadoNitaplast } from "./nitaplast-imobilizado-regras";
import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (v: number) => Math.round(v * 100) / 100;
const saldoPorConta = new Map(saldosImplantacao.map((l) => [l.conta, l.saldo]));
const descricaoPorConta = new Map(saldosImplantacao.map((l) => [l.conta, l.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

/**
 * O balancete real do Domínio de 06/2026 lançou a depreciação do mês
 * (R$ 53.782,84) inteira na conta sintética 1.2.03.03 (-)DEPRECIAÇÕES
 * ACUMULADAS, sem abrir por conta analítica — prática irregular (sintética
 * não deveria receber lançamento direto; decisão do contador: não replicar
 * isso, abrir por conta). Replicamos aqui a MESMA lógica já validada em
 * julho (calcularPosicoesImobilizado em nitaplast-imobilizado.ts:
 * depreciação mensal limitada ao saldo residual de cada grupo), partindo
 * da abertura de 31/05/2026 (implantação), já que em julho o ponto de
 * partida é o fechamento de 30/06.
 *
 * A referência mensal de veículos usada aqui é R$ 19.762,52 (valor
 * histórico integral, mesmo da tabela anterior do Razão) e NÃO os
 * R$ 14.298,16 de regrasImobilizadoNitaplast — aquele valor já está
 * ajustado para excluir Mini Cooper e Corolla, alienados em julho/2026,
 * e em junho os dois veículos ainda estavam em uso.
 *
 * O cálculo bruto (teto pelo residual, mesma regra de julho) dá
 * R$ 57.702,32 — R$ 3.919,48 acima do R$ 53.782,84 que o Domínio lançou
 * de fato. Sem ficha/memória de cálculo do cliente para justificar por
 * que algum grupo específico depreciou menos, os valores por conta abaixo
 * são o cálculo bruto RATEADO proporcionalmente para fechar exatamente em
 * R$ 53.782,84 (o valor real, já refletido no Lucro Líquido de junho
 * validado contra a planilha do cliente) — evita tanto duplicar despesa
 * (lançar os R$ 57.702,32 cheios) quanto inventar qual conta ficaria de
 * fora. Rateio documentado por conta no campo `observacao` de cada
 * lançamento.
 */
const VALOR_MENSAL_VEICULOS_JUNHO = 19762.52;
const TOTAL_REAL_DOMINIO_JUNHO = 53782.84;

function residualGrupo(regra: (typeof regrasImobilizadoNitaplast)[number]) {
  const bruto = arred(regra.contasAtivo.reduce((s, c) => s + Math.max(0, saldoPorConta.get(c) ?? 0), 0));
  const saldoAcumulada = regra.contaDepreciacaoAcumulada ? (saldoPorConta.get(regra.contaDepreciacaoAcumulada) ?? 0) : 0;
  const depreciacaoAcumulada = arred(Math.max(0, -saldoAcumulada));
  return arred(bruto - depreciacaoAcumulada);
}

export const posicoesDepreciacaoJunho = regrasImobilizadoNitaplast.map((regra) => {
  const mensalReferencia = regra.id === "veiculos" ? VALOR_MENSAL_VEICULOS_JUNHO : (regra.valorMensalReferencia ?? 0);
  const residual = residualGrupo(regra);
  const calculavel = !regra.naoDepreciavel && mensalReferencia > 0 && Boolean(regra.contaDespesa) && Boolean(regra.contaDepreciacaoAcumulada);
  const depreciacaoCalculada = calculavel ? arred(Math.min(mensalReferencia, Math.max(0, residual))) : 0;
  return { ...regra, mensalReferencia, residual, calculavel, depreciacaoCalculada };
});

export const totalDepreciacaoCalculadaBrutaJunho = arred(
  posicoesDepreciacaoJunho.reduce((s, g) => s + g.depreciacaoCalculada, 0),
);

export const totalDepreciacaoLancadaPeloClienteJunho = TOTAL_REAL_DOMINIO_JUNHO;

const fatorRateio = TOTAL_REAL_DOMINIO_JUNHO / totalDepreciacaoCalculadaBrutaJunho;

const gruposRateados = posicoesDepreciacaoJunho
  .filter((g) => g.calculavel && g.depreciacaoCalculada > 0)
  .map((g) => ({ ...g, depreciacaoRateada: arred(g.depreciacaoCalculada * fatorRateio) }));

// Ajusta a última linha para a soma bater exatamente com TOTAL_REAL_DOMINIO_JUNHO
// (arredondamento por conta pode deixar centavos de diferença).
const somaRateada = arred(gruposRateados.reduce((s, g) => s + g.depreciacaoRateada, 0));
const diferencaArredondamento = arred(TOTAL_REAL_DOMINIO_JUNHO - somaRateada);
if (gruposRateados.length > 0) {
  const ultimo = gruposRateados[gruposRateados.length - 1]!;
  ultimo.depreciacaoRateada = arred(ultimo.depreciacaoRateada + diferencaArredondamento);
}

export const totalDepreciacaoRateadaJunho = arred(gruposRateados.reduce((s, g) => s + g.depreciacaoRateada, 0));

export const lancamentosDepreciacaoJunho: LancamentoIntegrado[] = gruposRateados.map((g, index) => ({
  id: `JUN-DEP-${String(index + 1).padStart(2, "0")}`,
  data: "30/06/2026",
  origem: "DEPRECIAÇÃO IMOBILIZADO 06/2026",
  debitoCodigo: g.contaDespesa!,
  debito: nomeConta(g.contaDespesa!),
  creditoCodigo: g.contaDepreciacaoAcumulada!,
  credito: nomeConta(g.contaDepreciacaoAcumulada!),
  historico: `Depreciação mensal - ${g.nome}`,
  documento: "DEP 06/2026",
  cc: "0",
  centroCusto: "SEM CENTRO DE CUSTO",
  valor: g.depreciacaoRateada,
  status: "revisar",
  observacao: `Aberto por conta analítica (decisão do contador: não deixar na conta sintética 1.2.03.03, como o Domínio fez). Cálculo bruto pela regra de residual de julho: R$ ${g.depreciacaoCalculada.toFixed(2)}; rateado proporcionalmente para o total do mês fechar em R$ ${TOTAL_REAL_DOMINIO_JUNHO.toFixed(2)} (valor real lançado pelo Domínio, mesmo já refletido no Lucro Líquido validado). Fator de rateio: ${(fatorRateio * 100).toFixed(2)}%.`,
  rastreio: "derivado",
  fonte: g.id === "veiculos"
    ? "Saldo de abertura 31/05/2026 (implantação) + referência mensal histórica de R$ 19.762,52 (antes da alienação de Mini Cooper/Corolla em julho), rateada para fechar com o total real do Domínio"
    : "Saldo de abertura 31/05/2026 (implantação) + recorrência mensal de regrasImobilizadoNitaplast, limitada ao saldo residual, rateada para fechar com o total real do Domínio",
}));
