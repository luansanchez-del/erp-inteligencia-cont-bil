import type { AchadoImportacao, LinhaPreviaImportacao, ResultadoLeituraDocumento } from "@/types/erp";
import { contaBancoPor } from "./bancos-plano";
import { CONTA_TRANSITORIA, TOLERANCIA_FECHAMENTO, brl, novaLinhaPrevia, parseValorBR } from "./constantes";
import { textoLinha, type LinhaPdf } from "./pdf-linhas";

type Banco = "bb" | "bradesco" | "itau" | "unipreme" | "desconhecido";

export function identificarBanco(linhas: LinhaPdf[]): Banco {
  const texto = linhas.slice(0, 20).map(textoLinha).join(" \n ");
  if (/Ag\.\s*origem|Dt\.\s*balancete|Banco do Brasil/i.test(texto)) return "bb";
  if (/Extrato Mensal \/ Por Per[íi]odo|LIQUIDACAO DE COBRANCA/i.test(texto)) return "bradesco";
  if (/Lan[çc]amentos do per[íi]odo|Limite da conta/i.test(texto)) return "itau";
  if (texto.trim().length === 0) return "unipreme"; // sem camada de texto — provável PDF escaneado
  return "desconhecido";
}

const NAO_SUPORTADO: Record<Exclude<Banco, "bb" | "itau">, string> = {
  bradesco: "Extrato Bradesco identificado, mas o layout (linhas multi-fragmento, crédito/débito por coluna) ainda não tem leitor automático — lance manualmente por enquanto.",
  unipreme: "Este PDF não tem camada de texto (provável digitalização/imagem) — não é possível ler automaticamente. Peça o extrato em outro formato ou lance manualmente.",
  desconhecido: "Não foi possível identificar o banco deste extrato a partir do layout — lance manualmente ou informe o formato pra eu adicionar um leitor.",
};

/** Lê extrato bancário em PDF já convertido em linhas (ver `pdf-extrator-navegador`). */
export function lerExtratoBancario(linhas: LinhaPdf[]): ResultadoLeituraDocumento {
  const banco = identificarBanco(linhas);
  if (banco === "bb") return lerExtratoBancoBrasil(linhas);
  if (banco === "itau") return lerExtratoItau(linhas);
  return { suportado: false, linhas: [], achados: [{ severidade: "impedimento", mensagem: NAO_SUPORTADO[banco] }] };
}

const LINHA_BB = /^(\d{2}\/\d{2}\/\d{4})\s+\d{4}\s+\d{4,5}\s+(\d{3})\s+(.+?)\s+([\d.]+\/?[\d.]*)\s+([\d.,]+)\s+([DC*])(?:\s+([\d.,]+)\s+([DC]))?$/;
const LINHA_BB_ESPECIAL = /^(\d{2}\/\d{2}\/\d{4})\s+\d{4}\s+\d{4,5}\s+(000|999)\s+(.+?)\s+([\d.,]+)\s+([DC])$/;

function lerExtratoBancoBrasil(linhasPdf: LinhaPdf[]): ResultadoLeituraDocumento {
  const linhasTexto = linhasPdf.map(textoLinha);
  const achadosDoc: AchadoImportacao[] = [];

  const cabecalho = linhasTexto.join(" ");
  const agencia = /Agência\s+([\d.-]+)/.exec(cabecalho)?.[1];
  const conta = /Conta corrente\s+([\d.-]+)/.exec(cabecalho)?.[1];
  const contaBanco = agencia && conta ? contaBancoPor("bb", agencia, conta) : undefined;
  if (!contaBanco) {
    achadosDoc.push({ severidade: "impedimento", mensagem: `Conta bancária BB agência ${agencia ?? "?"} / conta ${conta ?? "?"} não está mapeada em bancos-plano.ts — adicione o código da conta contábil antes de gerar lançamentos.` });
  }

  const linhas: LinhaPreviaImportacao[] = [];
  let saldoAnterior: number | null = null;
  let ultimoSaldoConhecido: number | null = null;
  let ultimaLinha: LinhaPreviaImportacao | null = null;

  for (const texto of linhasTexto) {
    const especial = LINHA_BB_ESPECIAL.exec(texto);
    if (especial) {
      const [, data, codigo, , valorStr, sinal] = especial;
      const valor = parseValorBR(valorStr!) * (sinal === "D" ? -1 : 1);
      if (codigo === "000") { saldoAnterior = valor; ultimoSaldoConhecido = valor; }
      else if (codigo === "999") {
        if (ultimoSaldoConhecido !== null && Math.abs(valor - ultimoSaldoConhecido) > TOLERANCIA_FECHAMENTO) {
          achadosDoc.push({ severidade: "impedimento", mensagem: `Extrato não fecha: saldo final impresso (${brl(valor)}) não bate com o saldo apurado a partir dos lançamentos lidos (${brl(ultimoSaldoConhecido)}). Não gerar lançamentos até revisar.` });
        }
        ultimaLinha = null; // fim da lista de lançamentos — texto de rodapé abaixo não pertence a nenhum lançamento
      }
      continue;
    }
    const m = LINHA_BB.exec(texto);
    if (!m) {
      if (ultimaLinha && !/^\d{2}\/\d{2}\/\d{4}/.test(texto)) ultimaLinha.historico = `${ultimaLinha.historico} — ${texto}`.slice(0, 240);
      continue;
    }
    const [, data, , historico, documento, valorStr, sinal, saldoStr, saldoSinal] = m;
    if (sinal === "*") {
      achadosDoc.push({ severidade: "informacao", mensagem: `${data}: "${historico}" (${valorStr}) tem compensação pendente (marcador *) no extrato — não entra automaticamente como lançamento; confira se já foi lançado quando compensar.` });
      continue;
    }
    const valorAssinado = parseValorBR(valorStr!) * (sinal === "D" ? -1 : 1);
    const debitoCodigo = sinal === "C" ? (contaBanco?.codigo ?? "") : CONTA_TRANSITORIA;
    const creditoCodigo = sinal === "C" ? CONTA_TRANSITORIA : (contaBanco?.codigo ?? "");
    const achadosLinha: AchadoImportacao[] = [{ severidade: "alerta", mensagem: "Contrapartida sugerida automaticamente como 4859 - Conta Transitória. Ajuste a conta correta antes de aprovar." }];
    if (!contaBanco) achadosLinha.push({ severidade: "impedimento", mensagem: "Conta bancária não mapeada — ver achado geral do documento." });
    ultimaLinha = novaLinhaPrevia({ data: paraIso(data!), debitoCodigo, creditoCodigo, historico: `${historico} (extrato BB)`, documento: documento!, valor: Math.abs(valorAssinado), achados: achadosLinha });
    linhas.push(ultimaLinha);
    if (saldoStr && saldoSinal) {
      const saldoLinha = parseValorBR(saldoStr) * (saldoSinal === "D" ? -1 : 1);
      if (ultimoSaldoConhecido !== null) {
        const esperado = ultimoSaldoConhecido + valorAssinado;
        if (Math.abs(esperado - saldoLinha) > TOLERANCIA_FECHAMENTO) {
          achadosDoc.push({ severidade: "impedimento", mensagem: `${data}: saldo do extrato (${brl(saldoLinha)}) não bate com saldo anterior + movimento (${brl(esperado)}). Não gerar lançamentos até revisar.` });
        }
      }
      ultimoSaldoConhecido = saldoLinha;
    } else if (ultimoSaldoConhecido !== null) {
      ultimoSaldoConhecido += valorAssinado;
    }
  }

  if (saldoAnterior === null) achadosDoc.push({ severidade: "alerta", mensagem: "Não encontrei a linha 'Saldo Anterior' — não foi possível conferir o fechamento do extrato." });
  return { suportado: true, linhas, achados: achadosDoc };
}

const LINHA_ITAU = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)(?:\s+(\d{2,3}\.\d{3}\.\d{3}[/-]\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}))?\s+(-?[\d.]+,\d{2})$/;
// Layout Itaú às vezes quebra "data + descrição" e "valor" em duas linhas visuais distintas
// (ex.: rendimento diário de aplicação automática) — a descrição some numa linha própria e
// sobra só "data + valor" na linha seguinte, sem bater com LINHA_ITAU.
const LINHA_ITAU_SEM_DESCRICAO = /^(\d{2}\/\d{2}\/\d{4})\s+(-?[\d.]+,\d{2})$/;

function lerExtratoItau(linhasPdf: LinhaPdf[]): ResultadoLeituraDocumento {
  const linhasTexto = linhasPdf.map(textoLinha);
  const achadosDoc: AchadoImportacao[] = [];
  const cabecalho = linhasTexto.join(" ");

  const agencia = /Ag[êe]ncia\s+(\d+)/.exec(cabecalho)?.[1];
  const conta = /Conta\s+([\d-]+)/.exec(cabecalho)?.[1];
  const contaBanco = agencia && conta ? contaBancoPor("itau", agencia, conta) : undefined;
  if (!contaBanco) {
    achadosDoc.push({ severidade: "impedimento", mensagem: `Conta bancária Itaú agência ${agencia ?? "?"} / conta ${conta ?? "?"} não está mapeada em bancos-plano.ts — adicione o código da conta contábil antes de gerar lançamentos.` });
  }
  const linhaValoresTopo = linhasTexto.find((l) => /^R\$\s/.test(l));
  const saldoTotalStr = linhaValoresTopo ? /^R\$\s*([\d.,]+)/.exec(linhaValoresTopo)?.[1] : undefined;
  const saldoTotalInformado = saldoTotalStr ? parseValorBR(saldoTotalStr) : null;

  const linhas: LinhaPreviaImportacao[] = [];
  let saldoAnterior: number | null = null;
  let acumulado = 0;
  let ultimoSaldoDiario: number | null = null;

  function registrarLinha(data: string, descricao: string, documento: string | undefined, valor: number) {
    acumulado += valor;
    const debitoCodigo = valor >= 0 ? (contaBanco?.codigo ?? "") : CONTA_TRANSITORIA;
    const creditoCodigo = valor >= 0 ? CONTA_TRANSITORIA : (contaBanco?.codigo ?? "");
    const achadosLinha: AchadoImportacao[] = [{ severidade: "alerta", mensagem: "Contrapartida sugerida automaticamente como 4859 - Conta Transitória. Ajuste a conta correta antes de aprovar." }];
    if (!contaBanco) achadosLinha.push({ severidade: "impedimento", mensagem: "Conta bancária não mapeada — ver achado geral do documento." });
    linhas.push(novaLinhaPrevia({
      data: paraIso(data),
      debitoCodigo,
      creditoCodigo,
      historico: `${descricao}${documento ? ` — ${documento}` : ""} (extrato Itaú)`,
      documento: documento ?? "",
      valor: Math.abs(valor),
      achados: achadosLinha,
    }));
  }

  for (const texto of linhasTexto) {
    const m = LINHA_ITAU.exec(texto);
    if (!m) {
      // Layout às vezes separa "data + valor" da descrição (ex.: rendimento diário de aplicação
      // automática) em duas linhas visuais — captura o valor mesmo sem a descrição, pra não
      // perder centavos e deixar o extrato sem fechar.
      const semDesc = LINHA_ITAU_SEM_DESCRICAO.exec(texto);
      if (semDesc) {
        const [, data, valorStr] = semDesc;
        registrarLinha(data!, "Lançamento sem descrição capturada pelo layout do PDF (provável rendimento de aplicação automática)", undefined, parseValorBR(valorStr!));
      }
      continue;
    }
    const [, data, descricao, documento, valorStr] = m;
    const valor = parseValorBR(valorStr!);
    if (/^SALDO ANTERIOR$/i.test(descricao!.trim())) { saldoAnterior = valor; acumulado = valor; continue; }
    // Linhas de resumo diário ("SALDO TOTAL DISPONÍVEL DIA") não são movimento — mas servem de
    // checkpoint pra conferir o fechamento real do período (o "Saldo total" do cabeçalho é o saldo
    // atual/do dia da extração, não o saldo em 31 do mês, então não pode ser usado pra isso).
    if (!documento && /^SALDO\b/i.test(descricao!.trim())) {
      if (/^SALDO TOTAL DISPON/i.test(descricao!.trim())) ultimoSaldoDiario = valor;
      continue;
    }
    registrarLinha(data!, descricao!.trim(), documento, valor);
  }

  const saldoReferenciaFechamento = ultimoSaldoDiario ?? saldoTotalInformado;
  if (saldoAnterior === null) {
    achadosDoc.push({ severidade: "alerta", mensagem: "Não encontrei a linha 'SALDO ANTERIOR' — não foi possível conferir o fechamento do extrato." });
  } else if (saldoReferenciaFechamento === null) {
    achadosDoc.push({ severidade: "alerta", mensagem: "Não encontrei nem o 'Saldo total' do cabeçalho nem um checkpoint 'SALDO TOTAL DISPONÍVEL DIA' — não foi possível conferir o fechamento do extrato." });
  } else if (Math.abs(acumulado - saldoReferenciaFechamento) > TOLERANCIA_FECHAMENTO) {
    achadosDoc.push({ severidade: "impedimento", mensagem: `Extrato não fecha: ${ultimoSaldoDiario !== null ? "último checkpoint diário do período" : "saldo total informado no cabeçalho"} (${brl(saldoReferenciaFechamento)}) não bate com saldo anterior + soma dos lançamentos lidos (${brl(acumulado)}). Não gerar lançamentos até revisar.` });
  }
  return { suportado: true, linhas, achados: achadosDoc };
}

function paraIso(dataBr: string) {
  const [d, m, a] = dataBr.split("/");
  return `${a}-${m}-${d}`;
}
