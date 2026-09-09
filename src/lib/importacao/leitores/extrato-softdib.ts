import type { AchadoImportacao, LinhaPreviaImportacao, ResultadoLeituraDocumento } from "@/types/erp";
import { contaSoftdibPor } from "./bancos-plano";
import { CONTA_TRANSITORIA, brl, novaLinhaPrevia, parseValorBR } from "./constantes";

const COLUNAS_ESPERADAS = ["DATA", "DESC BANCO", "TIPO-MOVTO", "VALOR-DEB-AUX", "VALOR-CRED-AUX", "DESC-HISTORICO"];

function parseCsv(texto: string): { colunas: string[]; linhas: string[][] } {
  const linhasBrutas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const colunas = (linhasBrutas[0] ?? "").split(";").map((c) => c.trim());
  const linhas = linhasBrutas.slice(1).map((l) => l.split(";").map((c) => c.trim()));
  return { colunas, linhas };
}

/**
 * Lê o CSV "EXTRATO MOVIMENTO — SISTEMA CLIENTE SOFTDIB" (ERP interno da
 * Nitaplast que consolida todos os bancos num arquivo só). Ao contrário dos
 * extratos em PDF banco a banco, esse layout já traz débito/crédito,
 * histórico e uma classificação gerencial sugerida por linha — mas o arquivo
 * termina com um bloco de resumo (totais por histórico) que não é
 * movimento; linhas fora do padrão data + TIPO-MOVTO C/D são ignoradas.
 */
export function lerExtratoSoftdib(texto: string): ResultadoLeituraDocumento {
  const { colunas, linhas: linhasCsv } = parseCsv(texto);
  const faltando = COLUNAS_ESPERADAS.filter((c) => !colunas.includes(c));
  if (faltando.length) {
    return { suportado: false, linhas: [], achados: [{ severidade: "impedimento", mensagem: `Este CSV não parece o extrato SOFTDIB esperado (faltam colunas: ${faltando.join(", ")}).` }] };
  }
  const idx = (nome: string) => colunas.indexOf(nome);
  const iData = idx("DATA"), iBanco = idx("DESC BANCO"), iTipo = idx("TIPO-MOVTO"), iDeb = idx("VALOR-DEB-AUX"), iCred = idx("VALOR-CRED-AUX");
  const iHist = idx("DESC-HISTORICO"), iHistCompl = idx("HISTORICO-COMPL"), iContaGer = idx("CONTA GERENCIAL"), iDescContaGer = idx("DESC CONTA GERENCIAL");
  const iCc = idx("CENTRO CUSTO"), iDescCc = idx("DESC CENTRO CUSTO"), iDescricao = idx("DESCRICAO"), iDocumento = idx("DOCUMENTO"), iParcela = idx("PARCELA");

  const linhas: LinhaPreviaImportacao[] = [];
  const bancosNaoMapeados = new Map<string, number>();
  const movimentoPorBanco = new Map<string, number>();
  const dataValida = /^\d{2}\/\d{2}\/\d{4}$/;

  for (const c of linhasCsv) {
    const tipo = c[iTipo];
    const data = c[iData];
    if ((tipo !== "C" && tipo !== "D") || !data || !dataValida.test(data)) continue; // linha de resumo/rodapé, não é movimento

    const descBanco = c[iBanco] ?? "";
    const debStr = c[iDeb] ?? "0";
    const credStr = c[iCred] ?? "0";
    const valorAssinado = tipo === "D" ? -Math.abs(parseValorBR(debStr) || parseValorBR(credStr)) : Math.abs(parseValorBR(credStr) || parseValorBR(debStr));
    if (!Number.isFinite(valorAssinado) || valorAssinado === 0) continue;

    movimentoPorBanco.set(descBanco, (movimentoPorBanco.get(descBanco) ?? 0) + valorAssinado);
    const codigoBanco = contaSoftdibPor(descBanco);
    if (!codigoBanco) bancosNaoMapeados.set(descBanco, (bancosNaoMapeados.get(descBanco) ?? 0) + 1);

    const debitoCodigo = tipo === "C" ? (codigoBanco ?? "") : CONTA_TRANSITORIA;
    const creditoCodigo = tipo === "C" ? CONTA_TRANSITORIA : (codigoBanco ?? "");
    const contaGer = c[iContaGer]?.trim();
    const descContaGer = c[iDescContaGer]?.trim();
    const cc = c[iCc]?.trim();
    const descCc = c[iDescCc]?.trim();
    const sugestao = contaGer ? `SOFTDIB classifica como ${contaGer}${descContaGer ? ` - ${descContaGer}` : ""}${cc ? `, CC ${cc}${descCc ? ` - ${descCc}` : ""}` : ""}.` : "";
    const achadosLinha: AchadoImportacao[] = [{ severidade: "alerta", mensagem: `${sugestao} Contrapartida sugerida automaticamente como 4859 - Conta Transitória. Ajuste a conta correta antes de aprovar.`.trim() }];
    if (!codigoBanco) achadosLinha.push({ severidade: "impedimento", mensagem: `Banco "${descBanco}" não está mapeado em bancos-plano.ts (contaSoftdibPor) — adicione o código da conta contábil antes de gerar este lançamento.` });

    const contraparte = c[iDescricao]?.trim();
    const doc = [c[iDocumento]?.trim(), c[iParcela]?.trim()].filter(Boolean).join("/");
    const historico = [c[iHist]?.trim(), c[iHistCompl]?.trim() || contraparte].filter(Boolean).join(" — ") + ` (SOFTDIB ${descBanco})`;

    linhas.push(novaLinhaPrevia({ data: paraIso(data), debitoCodigo, creditoCodigo, historico, documento: doc, valor: Math.abs(valorAssinado), achados: achadosLinha }));
  }

  const achadosDoc: AchadoImportacao[] = [];
  if (linhas.length === 0) achadosDoc.push({ severidade: "impedimento", mensagem: "Nenhuma linha de movimento reconhecida neste CSV." });
  for (const [banco, qtd] of bancosNaoMapeados) achadosDoc.push({ severidade: "impedimento", mensagem: `${qtd} movimento(s) do banco "${banco}" sem conta contábil mapeada — não vão gerar lançamento até isso ser resolvido.` });
  for (const [banco, total] of movimentoPorBanco) achadosDoc.push({ severidade: "informacao", mensagem: `Movimento líquido lido para "${banco}": ${brl(total)}. Confira contra o saldo anterior/final real desse banco antes de aprovar.` });

  return { suportado: true, linhas, achados: achadosDoc };
}

function paraIso(dataBr: string) {
  const [d, m, a] = dataBr.split("/");
  return `${a}-${m}-${d}`;
}
