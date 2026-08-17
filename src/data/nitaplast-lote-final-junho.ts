import { lancamentosIntegrados, type LancamentoIntegrado } from "./nitaplast-razao-integrado";
import { saldosImplantacao } from "./nitaplast-implantacao";

export type LinhaLoteContabil = {
  seq: number;
  data: string;
  debito: string;
  ccDebito: string;
  credito: string;
  ccCredito: string;
  documento: string;
  valor: number;
  historico: string;
  lancamentoId: string;
  origem: string;
  status: "pronto" | "pendente";
  pendencias: string[];
};

const plano = new Map(saldosImplantacao.map((conta) => [conta.conta, conta]));
const ehResultado = (codigo: string) => {
  const classificacao = plano.get(codigo)?.classificacao ?? "";
  return classificacao.startsWith("4.") || classificacao.startsWith("5.") || classificacao.startsWith("6.");
};

function resultadoTemDestinoNaDre(codigo: string) {
  const c = plano.get(codigo)?.classificacao ?? "";
  if (!ehResultado(codigo)) return true;
  return [
    "4.1.01",       // receita bruta
    "4.1.03.005",   // deduções
    "4.2.",         // CPV/CMV
    "5.1.",         // custos
    "5.3.",         // custos industriais
    "4.1.05",       // receitas financeiras históricas
    "5.7.12",       // receitas financeiras / recuperações
    "5.8.",         // despesas financeiras
    "5.9.",         // outros resultados
    "5.7.01",       // despesas operacionais
    "5.7.03",       // despesas operacionais
    "5.7.09",       // despesas operacionais
  ].some((prefixo) => c.startsWith(prefixo));
}

function centroDeCustoDaPartida(linha: LancamentoIntegrado) {
  const cc = linha.cc && linha.cc !== "0" ? linha.cc : "";
  if (!cc) return { ccDebito: "", ccCredito: "" };

  const debitoResultado = ehResultado(linha.debitoCodigo);
  const creditoResultado = ehResultado(linha.creditoCodigo);

  // O centro de custo acompanha a conta de resultado. Isso reproduz o modelo de
  // importação já usado na Nitaplast: despesa no débito recebe CC; receita no
  // crédito recebe CC. Reclassificação entre duas contas de resultado mantém o CC
  // nos dois lados para não perder o rastreio gerencial.
  if (debitoResultado && creditoResultado) return { ccDebito: cc, ccCredito: cc };
  if (debitoResultado) return { ccDebito: cc, ccCredito: "" };
  if (creditoResultado) return { ccDebito: "", ccCredito: cc };

  // Partidas exclusivamente patrimoniais não recebem CC automaticamente porque o
  // modelo atual do Razão ainda possui apenas um campo de centro de custo, e não a
  // informação de qual lado ele pertence. O lançamento continua exportável sem CC.
  return { ccDebito: "", ccCredito: "" };
}

function normalizarData(data: string) {
  const iso = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return data;
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return data;
}

function validar(linha: LancamentoIntegrado) {
  const pendencias: string[] = [];
  if (!plano.has(linha.debitoCodigo)) pendencias.push(`Conta débito ${linha.debitoCodigo} não existe no plano implantado`);
  if (!plano.has(linha.creditoCodigo)) pendencias.push(`Conta crédito ${linha.creditoCodigo} não existe no plano implantado`);
  if (plano.has(linha.debitoCodigo) && !resultadoTemDestinoNaDre(linha.debitoCodigo)) pendencias.push(`Conta débito ${linha.debitoCodigo} é de resultado mas ainda não possui destino na DRE`);
  if (plano.has(linha.creditoCodigo) && !resultadoTemDestinoNaDre(linha.creditoCodigo)) pendencias.push(`Conta crédito ${linha.creditoCodigo} é de resultado mas ainda não possui destino na DRE`);
  if (!linha.data) pendencias.push("Data não informada");
  if (!linha.historico.trim()) pendencias.push("Histórico não informado");
  if (!(linha.valor > 0)) pendencias.push("Valor inválido");
  if (linha.status !== "validado") pendencias.push("Lançamento ainda marcado para revisão");
  if (linha.rastreio === "sugerido") pendencias.push("Classificação sem lastro documental suficiente");
  return pendencias;
}

export const loteContabilJunho: LinhaLoteContabil[] = lancamentosIntegrados
  .map((linha, index) => {
    const pendencias = validar(linha);
    const cc = centroDeCustoDaPartida(linha);
    return {
      seq: index + 1,
      data: normalizarData(linha.data),
      debito: linha.debitoCodigo,
      ccDebito: cc.ccDebito,
      credito: linha.creditoCodigo,
      ccCredito: cc.ccCredito,
      documento: linha.documento ?? "",
      valor: Math.round(linha.valor * 100) / 100,
      historico: linha.historico,
      lancamentoId: linha.id,
      origem: linha.origem,
      status: pendencias.length ? "pendente" as const : "pronto" as const,
      pendencias,
    };
  })
  .sort((a, b) => a.data.localeCompare(b.data) || a.seq - b.seq)
  .map((linha, index) => ({ ...linha, seq: index + 1 }));

export const loteContabilJunhoPronto = loteContabilJunho.filter((linha) => linha.status === "pronto");
export const loteContabilJunhoPendente = loteContabilJunho.filter((linha) => linha.status === "pendente");

export const resumoLoteContabilJunho = {
  totalPartidas: loteContabilJunho.length,
  prontas: loteContabilJunhoPronto.length,
  pendentes: loteContabilJunhoPendente.length,
  valorTotal: loteContabilJunho.reduce((total, linha) => total + linha.valor, 0),
  valorPendente: loteContabilJunhoPendente.reduce((total, linha) => total + linha.valor, 0),
  podeFinalizar: loteContabilJunhoPendente.length === 0,
} as const;

const cabecalho = ["SEQ", "DATA", "DEBITO", "CC DEBITO", "CREDITO", "CC CREDITO", "N. DOCTO", "VALOR", "HISTÓRICO"];
const csv = (valor: string | number) => `"${String(valor ?? "").replaceAll('"', '""')}"`;

export function gerarCsvLoteContabilJunho(linhas: LinhaLoteContabil[] = loteContabilJunhoPronto) {
  return [
    cabecalho.map(csv).join(";"),
    ...linhas.map((linha) => [
      linha.seq,
      linha.data,
      linha.debito,
      linha.ccDebito,
      linha.credito,
      linha.ccCredito,
      linha.documento,
      linha.valor.toFixed(2).replace(".", ","),
      linha.historico,
    ].map(csv).join(";")),
  ].join("\r\n");
}
