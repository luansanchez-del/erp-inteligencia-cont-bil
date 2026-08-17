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
  status: "pronto" | "alerta" | "pendente";
  pendencias: string[];
  alertas: string[];
};

export type LoteContabilCalculado = {
  linhas: LinhaLoteContabil[];
  prontas: LinhaLoteContabil[];
  pendentes: LinhaLoteContabil[];
  alertas: LinhaLoteContabil[];
  resumo: {
    totalPartidas: number;
    prontas: number;
    alertas: number;
    pendentes: number;
    valorTotal: number;
    valorAlerta: number;
    valorPendente: number;
    podeFinalizar: boolean;
  };
};

const plano = new Map(saldosImplantacao.map((conta) => [conta.conta, conta]));
const CONTAS_TRANSITORIAS_COM_ALERTA = new Set(["4859"]);

const ehResultado = (codigo: string) => {
  const classificacao = plano.get(codigo)?.classificacao ?? "";
  return classificacao.startsWith("4.") || classificacao.startsWith("5.") || classificacao.startsWith("6.");
};

function resultadoTemDestinoNaDre(codigo: string) {
  const c = plano.get(codigo)?.classificacao ?? "";
  if (!ehResultado(codigo)) return true;
  return [
    "4.1.01",
    "4.1.03.005",
    "4.2.",
    "5.1.",
    "5.3.",
    "4.1.05",
    "5.7.12",
    "5.8.",
    "5.9.",
    "5.7.01",
    "5.7.03",
    "5.7.05",
    "5.7.09",
  ].some((prefixo) => c.startsWith(prefixo));
}

function centroDeCustoDaPartida(linha: LancamentoIntegrado) {
  const cc = linha.cc && linha.cc !== "0" ? linha.cc : "";
  if (!cc) return { ccDebito: "", ccCredito: "" };

  const debitoResultado = ehResultado(linha.debitoCodigo);
  const creditoResultado = ehResultado(linha.creditoCodigo);

  if (debitoResultado && creditoResultado) return { ccDebito: cc, ccCredito: cc };
  if (debitoResultado) return { ccDebito: cc, ccCredito: "" };
  if (creditoResultado) return { ccDebito: "", ccCredito: cc };
  return { ccDebito: "", ccCredito: "" };
}

function normalizarData(data: string) {
  const iso = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return data;
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return data;
}

/**
 * PENDÊNCIA = impede escrituração/exportação.
 * ALERTA = permite escrituração, mas exige revisão posterior.
 *
 * A conta 4859 existe no plano e pode ser usada como transitória. Portanto,
 * movimentos nela são exportáveis e permanecem sinalizados para saneamento futuro.
 */
function validar(linha: LancamentoIntegrado) {
  const pendencias: string[] = [];
  const alertas: string[] = [];

  if (!plano.has(linha.debitoCodigo)) pendencias.push(`Conta débito ${linha.debitoCodigo} não existe no plano implantado`);
  if (!plano.has(linha.creditoCodigo)) pendencias.push(`Conta crédito ${linha.creditoCodigo} não existe no plano implantado`);

  if (plano.has(linha.debitoCodigo) && !resultadoTemDestinoNaDre(linha.debitoCodigo)) {
    pendencias.push(`Conta débito ${linha.debitoCodigo} é de resultado mas ainda não possui destino na DRE`);
  }
  if (plano.has(linha.creditoCodigo) && !resultadoTemDestinoNaDre(linha.creditoCodigo)) {
    pendencias.push(`Conta crédito ${linha.creditoCodigo} é de resultado mas ainda não possui destino na DRE`);
  }

  if (CONTAS_TRANSITORIAS_COM_ALERTA.has(linha.debitoCodigo)) {
    alertas.push(`Conta débito ${linha.debitoCodigo} é transitória; escriturar agora e reclassificar depois`);
  }
  if (CONTAS_TRANSITORIAS_COM_ALERTA.has(linha.creditoCodigo)) {
    alertas.push(`Conta crédito ${linha.creditoCodigo} é transitória; escriturar agora e reclassificar depois`);
  }

  if (linha.status === "revisar") alertas.push("Lançamento marcado para revisão posterior");
  if (linha.rastreio === "sugerido") alertas.push("Classificação sugerida; revisar posteriormente");

  if (!linha.data) pendencias.push("Data não informada");
  if (!linha.historico.trim()) pendencias.push("Histórico não informado");
  if (!(linha.valor > 0)) pendencias.push("Valor inválido");

  return { pendencias, alertas };
}

export function montarLoteContabilJunho(base: LancamentoIntegrado[]): LoteContabilCalculado {
  const linhas = base
    .map((linha, index) => {
      const { pendencias, alertas } = validar(linha);
      const cc = centroDeCustoDaPartida(linha);
      const status = pendencias.length ? "pendente" as const : alertas.length ? "alerta" as const : "pronto" as const;
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
        status,
        pendencias,
        alertas,
      } satisfies LinhaLoteContabil;
    })
    .sort((a, b) => a.data.localeCompare(b.data) || a.seq - b.seq)
    .map((linha, index) => ({ ...linha, seq: index + 1 }));

  const prontas = linhas.filter((linha) => linha.status !== "pendente");
  const pendentes = linhas.filter((linha) => linha.status === "pendente");
  const alertas = linhas.filter((linha) => linha.status === "alerta");

  return {
    linhas,
    prontas,
    pendentes,
    alertas,
    resumo: {
      totalPartidas: linhas.length,
      prontas: linhas.filter((linha) => linha.status === "pronto").length,
      alertas: alertas.length,
      pendentes: pendentes.length,
      valorTotal: linhas.reduce((total, linha) => total + linha.valor, 0),
      valorAlerta: alertas.reduce((total, linha) => total + linha.valor, 0),
      valorPendente: pendentes.reduce((total, linha) => total + linha.valor, 0),
      podeFinalizar: pendentes.length === 0,
    },
  };
}

// Compatibilidade para telas antigas. As telas de fechamento/exportação devem preferir
// montarLoteContabilJunho com o Razão já acrescido das reclassificações do usuário.
const loteBase = montarLoteContabilJunho(lancamentosIntegrados);
export const loteContabilJunho = loteBase.linhas;
export const loteContabilJunhoPronto = loteBase.prontas;
export const loteContabilJunhoPendente = loteBase.pendentes;
export const loteContabilJunhoAlerta = loteBase.alertas;
export const resumoLoteContabilJunho = loteBase.resumo;

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
