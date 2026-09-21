/**
 * REGRA ABSOLUTA (ver nota técnica "nitaplast-estabelecimento-por-fonte-nao-por-cc"
 * em notas-tecnicas.ts): o centro de custo (`cc`) sozinho NUNCA decide Matriz x
 * Filial — o mesmo número de CC é reaproveitado nos dois estabelecimentos em
 * relatórios diferentes. Quem decide é o documento/relatório de origem: se a
 * fonte é exclusiva de um estabelecimento (ex.: qualquer relatório "NITAPLAST
 * SAO PAULO", ou arquivo da pasta "FILIAL - AGO/JUL nn"), todo lançamento dali
 * é daquele estabelecimento, mesmo com CC estranho, repetido ou desconhecido.
 */
type LinhaEstabelecimento = {
  origem?: string | undefined;
  historico?: string | undefined;
  documento?: string | undefined;
  centroCusto?: string | undefined;
  fonte?: string | undefined;
  debitoCodigo: string;
  creditoCodigo: string;
  cc?: string | undefined;
  debito?: string | undefined;
  credito?: string | undefined;
};

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

/** Centros de custo 501 a 505 representam despesas da Filial SP. */
export function centroCustoFilialNitaplast(cc?: string) {
  return /^(501|502|503|504|505)$/.test((cc ?? "").trim());
}

export function contaDedicadaFilialNitaplast(codigo: string, descricao?: string) {
  const texto = normalizar(descricao);
  return contasFilial.has(codigo)
    || texto.includes("FILIAL")
    || texto.includes("COMERCIAL SP")
    || texto.includes("COMERCIAL SAO PAULO");
}

export function estabelecimentoLancamentoNitaplast(linha: LinhaEstabelecimento): EstabelecimentoNitaplast {
  const texto = normalizar([
    linha.origem,
    linha.historico,
    linha.documento,
    linha.centroCusto,
    linha.fonte,
    linha.debito ?? "",
    linha.credito ?? "",
  ].join(" "));

  const contaFilial = contaDedicadaFilialNitaplast(linha.debitoCodigo, linha.debito)
    || contaDedicadaFilialNitaplast(linha.creditoCodigo, linha.credito);
  const ccFilial = centroCustoFilialNitaplast(linha.cc);
  const documentoFilialDedicado = linha.documento?.startsWith("14.03.006") ?? false;
  const mencionaFilial = texto.includes("FILIAL")
    || texto.includes("COMERCIAL SP")
    || texto.includes("COMERCIAL SAO PAULO");
  const mencionaMatriz = texto.includes("MATRIZ");
  const transferenciaEntreEstabelecimentos = mencionaFilial
    && mencionaMatriz
    && (texto.includes("TRANSFER") || texto.includes("REMESSA"));

  if (transferenciaEntreEstabelecimentos) return "Matriz ↔ Filial";
  if (contaFilial || ccFilial || documentoFilialDedicado) return "Filial SP";
  // Achado em 21/09/2026: um texto que cita "FILIAL" e "MATRIZ" ao mesmo tempo
  // sem ser transferência (ex.: fonte de folha compartilhada "RELAÇÃO DE
  // CÁLCULO FOLHA - MATRIZ E FILIAL") não é evidência de qual dos dois é —
  // só conta/CC dedicados decidem nesse caso. Sem essa guarda, toda a folha da
  // Matriz caía em "Filial SP" só pelo nome do relatório de origem mencionar
  // os dois estabelecimentos.
  if (mencionaFilial && !mencionaMatriz) return "Filial SP";
  return "Matriz";
}

/**
 * Classificação usada no lado de resultado da partida. Transferências entre
 * estabelecimentos não podem transformar conta de resultado da matriz em filial
 * sem evidência do próprio lado; por isso contas/CC/documentos dedicados prevalecem.
 */
export function estabelecimentoResultadoNitaplast(linha: LinhaEstabelecimento, codigoConta: string): "Matriz" | "Filial SP" {
  const descricaoLado = codigoConta === linha.debitoCodigo ? linha.debito : linha.credito;
  if (contaDedicadaFilialNitaplast(codigoConta, descricaoLado)) return "Filial SP";
  if (centroCustoFilialNitaplast(linha.cc)) return "Filial SP";
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
