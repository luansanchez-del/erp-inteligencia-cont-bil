import type { LancamentoIntegrado } from "./nitaplast-razao-base";

export type EstabelecimentoNitaplast = "Matriz" | "Filial SP" | "Matriz ↔ Filial";
export type EscopoContaNitaplast = "Matriz" | "Filial SP" | "Matriz + Filial SP";

const contasFilial = new Set([
  "25215", // conta corrente filial SP
  "25138", "25139", "25140", // estoques/compras/créditos filial
  "25054", "25055", // ICMS/IPI vendas filial
  "25945", // CPV filial
  "25154", "25155", "25156", "25157", "25158", "25159", "25160", // imobilizado filial
  "25195", "25196", "25197", "25198", "25199", "25200", "25201", // depreciação acumulada filial
  "25088", "25089", "25090", "25092", "25093", "25094", // despesas depreciação filial
  "25235", "25236", // apuração ICMS/IPI filial
]);

const normalizar = (valor?: string) => (valor ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toUpperCase();

export function contaDedicadaFilialNitaplast(codigo: string, descricao?: string) {
  const texto = normalizar(descricao);
  return contasFilial.has(codigo)
    || texto.includes("FILIAL")
    || texto.includes("COMERCIAL SP")
    || texto.includes("COMERCIAL SAO PAULO");
}

export function estabelecimentoLancamentoNitaplast(linha: LancamentoIntegrado): EstabelecimentoNitaplast {
  const texto = normalizar([
    linha.origem,
    linha.historico,
    linha.documento,
    linha.centroCusto,
    linha.fonte,
    linha.debito,
    linha.credito,
  ].join(" "));

  const contaFilial = contaDedicadaFilialNitaplast(linha.debitoCodigo, linha.debito)
    || contaDedicadaFilialNitaplast(linha.creditoCodigo, linha.credito);
  const ccFilial = linha.cc === "501" || linha.cc === "502";
  const naturezaFilial = texto.includes("FILIAL")
    || texto.includes("COMERCIAL SP")
    || texto.includes("COMERCIAL SAO PAULO")
    || linha.documento?.startsWith("14.03.006");
  const transferenciaEntreEstabelecimentos = naturezaFilial
    && texto.includes("MATRIZ")
    && (texto.includes("TRANSFER") || texto.includes("REMESSA"));

  if (transferenciaEntreEstabelecimentos) return "Matriz ↔ Filial";
  if (contaFilial || ccFilial || naturezaFilial) return "Filial SP";
  return "Matriz";
}

/**
 * Classificação usada no lado de resultado da partida. Transferências entre
 * estabelecimentos não podem transformar conta de resultado da matriz em filial
 * sem evidência do próprio lado; por isso contas/CC/documentos dedicados prevalecem.
 */
export function estabelecimentoResultadoNitaplast(linha: LancamentoIntegrado, codigoConta: string): "Matriz" | "Filial SP" {
  const descricaoLado = codigoConta === linha.debitoCodigo ? linha.debito : linha.credito;
  if (contaDedicadaFilialNitaplast(codigoConta, descricaoLado)) return "Filial SP";
  if (linha.cc === "501" || linha.cc === "502") return "Filial SP";
  if (linha.documento?.startsWith("14.03.006")) return "Filial SP";

  const texto = normalizar([linha.origem, linha.historico, linha.documento, linha.centroCusto, linha.fonte].join(" "));
  if ((texto.includes("FILIAL") || texto.includes("COMERCIAL SP") || texto.includes("COMERCIAL SAO PAULO")) && !texto.includes("MATRIZ")) return "Filial SP";
  return "Matriz";
}

export function escopoContaBalanceteNitaplast(
  codigo: string,
  descricao: string,
  estabelecimentosMovimento: Iterable<EstabelecimentoNitaplast>,
): EscopoContaNitaplast {
  if (contaDedicadaFilialNitaplast(codigo, descricao)) return "Filial SP";

  let matriz = false;
  let filial = false;
  for (const estabelecimento of estabelecimentosMovimento) {
    if (estabelecimento === "Matriz") matriz = true;
    else if (estabelecimento === "Filial SP") filial = true;
    else {
      matriz = true;
      filial = true;
    }
  }
  if (matriz && filial) return "Matriz + Filial SP";
  if (filial) return "Filial SP";
  return "Matriz";
}
