import { lancamentosIntegradosAgosto } from "../src/data/nitaplast-razao-agosto";
import {
  calcularResultadoAgosto,
  categorizarDespesasAgosto,
  categoriasDespesasAgostoDefs,
  descricaoPorContaCompleta,
} from "../src/components/nitaplast/contabil-agosto-completo";
import { writeFileSync } from "node:fs";

const contasDeducoes = new Set(["25943", "2826", "2827", "2829", "2830", "2832", "25054", "25055"]);
const contasReceitasFinanceiras = new Set(["4927", "25095", "25096", "25097", "25098", "25099", "25100", "25101"]);
const ccFilial = new Set(["501", "502", "503", "504", "505"]);

const lancamentos = lancamentosIntegradosAgosto.map((linha) => ({
  id: linha.id,
  empresaId: "nitaplast-matriz",
  competenciaId: "2026-08",
  data: linha.data.split("/").reverse().join("-"),
  debitoCodigo: linha.debitoCodigo,
  creditoCodigo: linha.creditoCodigo,
  historico: linha.historico,
  documento: linha.documento,
  cc: linha.cc,
  centroCusto: linha.centroCusto,
  valor: linha.valor,
  criadoEm: "2026-08-31T23:59:59.000Z",
  origem: "importado" as const,
  status: linha.status,
  observacao: linha.observacao,
  fonte: linha.fonte,
}));

const r = calcularResultadoAgosto(lancamentos as any);
const custosSet = new Set(r.custos);
const financeirasSet = new Set(r.financeiras);
const operacionaisSet = new Set(r.operacionais);

const categoriasDespesas = categorizarDespesasAgosto(lancamentos as any, r.operacionais);
// mapa conta -> categoria de despesa (reconstituído a partir dos itens já calculados)
const categoriaPorContaDespesa = new Map<string, string>();
for (const [id, descricaoCategoria] of categoriasDespesasAgostoDefs) {
  for (const item of categoriasDespesas.itens(id)) {
    categoriaPorContaDespesa.set(item.conta, descricaoCategoria);
  }
}

function ehNplog(l: { debitoCodigo: string; historico?: string }) {
  return l.debitoCodigo === "25938" && /TRANSPORTE E LOG[IÍ]STICA/i.test(l.historico ?? "");
}

type Linha = {
  linhaDre: string;
  categoria: string;
  conta: string;
  descricaoConta: string;
  lado: "Débito" | "Crédito";
  valor: number;
  data: string;
  documento: string;
  historico: string;
  status: string;
  fonte: string;
  id: string;
};

const linhas: Linha[] = [];

function classificarConta(conta: string, cc: string, ladoDebito: boolean): { linhaDre: string; categoria: string } | null {
  if (conta === "2606") return { linhaDre: "(+) Receita Operacional Bruta", categoria: ccFilial.has(cc) ? "Receita Venda Produção Filial" : "Receita Venda Produção Matriz" };
  if (conta === "2655") return { linhaDre: "(+) Receita Operacional Bruta", categoria: ccFilial.has(cc) ? "Receita Revenda Filial" : "Receita Revenda Matriz" };
  if (contasDeducoes.has(conta)) {
    const nomes: Record<string, string> = {
      "25943": "Devoluções", "2826": "IPI", "2827": "ICMS", "2829": "PIS", "2830": "COFINS",
      "2832": "ICMS ST", "25054": "ICMS s/ Vendas Filial", "25055": "IPI Faturado Filial",
    };
    return { linhaDre: "(-) Deduções da Receita Bruta", categoria: nomes[conta] ?? conta };
  }
  if (custosSet.has(conta)) return { linhaDre: "(-) CPV / CMV", categoria: descricaoPorContaCompleta.get(conta) ?? conta };
  if (contasReceitasFinanceiras.has(conta)) return { linhaDre: "(+) Receitas Financeiras", categoria: descricaoPorContaCompleta.get(conta) ?? conta };
  if (financeirasSet.has(conta)) return { linhaDre: "(-) Despesas Financeiras", categoria: descricaoPorContaCompleta.get(conta) ?? conta };
  if (conta === "4736") return { linhaDre: "Resultado Não Operacional", categoria: "Receita de Alienação de Imobilizado" };
  if (conta === "4760") return { linhaDre: "Resultado Não Operacional", categoria: "Custo na Baixa de Imobilizado" };
  if (operacionaisSet.has(conta)) {
    const categoria = ladoDebito ? undefined : undefined; // resolvido abaixo via ehNplog/categoriaPorConta
    return { linhaDre: "(-) Despesas Operacionais", categoria: "" };
  }
  return null;
}

for (const l of lancamentos) {
  for (const [conta, isDebito] of [[l.debitoCodigo, true], [l.creditoCodigo, false]] as const) {
    const base = classificarConta(conta, l.cc ?? "0", isDebito);
    if (!base) continue;
    let categoria = base.categoria;
    if (base.linhaDre === "(-) Despesas Operacionais") {
      if (ehNplog(l) && isDebito) categoria = "Despesas com Serviço - NPLog";
      else categoria = categoriaPorContaDespesa.get(conta) ?? "Outras despesas operacionais sem classificação gerencial";
    }
    linhas.push({
      linhaDre: base.linhaDre,
      categoria,
      conta,
      descricaoConta: descricaoPorContaCompleta.get(conta) ?? "Conta não encontrada no plano",
      lado: isDebito ? "Débito" : "Crédito",
      valor: isDebito ? l.valor : -l.valor,
      data: l.data,
      documento: l.documento ?? "",
      historico: l.historico ?? "",
      status: l.status ?? "validado",
      fonte: l.fonte ?? "",
      id: l.id,
    });
  }
}

// Só padroniza quando dá pra extrair um fornecedor de verdade e uma NF de verdade —
// nunca em cima de apurações/rateios agregados (achado: gerava "fornecedor rateado
// por conta real...", que não é fornecedor nenhum).
const SUFIXO_EMPRESA = /\b(LTDA|S\/?A|EIRELI|ME|EPP|COOPERATIVA|CIA\.?|COMPANY|LIMITED|CO\.)\b/i;
function extrairFornecedor(historico: string): string | null {
  // Padrão Questor: "... - F##### -NOME FORNECEDOR"
  const comCodigo = historico.match(/-\s*[A-Z]\d{4,6}\s*-\s*(.+)$/);
  if (comCodigo) {
    const nome = comCodigo[1].trim();
    return nome.length > 2 ? nome : null;
  }
  const ultimoSegmento = historico.split(" - ").pop()?.trim() ?? "";
  if (SUFIXO_EMPRESA.test(ultimoSegmento) && ultimoSegmento !== historico.trim()) return ultimoSegmento;
  return null;
}
function extrairNf(documento: string): string | null {
  const m = (documento ?? "").match(/\bNF\s*(\d{2,8})\b/i) || (documento ?? "").match(/^(\d{2,8})(\/\d+)?$/);
  return m ? m[1] : null;
}
function historicoPadrao(l: { documento: string; historico: string }): string {
  const nf = extrairNf(l.documento ?? "");
  const fornecedor = extrairFornecedor(l.historico ?? "");
  if (nf && fornecedor) return `Valor ref NF ${nf}, fornecedor ${fornecedor}`;
  if (fornecedor) return `Fornecedor ${fornecedor}`;
  return l.historico ?? "";
}

const fmt = (n: number) => n.toFixed(2).replace(".", ",");
const csvEscape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
const header = ["Linha DRE", "Categoria", "Conta", "Descrição Conta", "Lado", "Valor", "Data", "Documento", "Histórico Padrão", "Histórico Original", "Status", "Fonte", "ID"];
const linhasOrdenadas = linhas.sort((a, b) => a.linhaDre.localeCompare(b.linhaDre) || a.categoria.localeCompare(b.categoria) || a.data.localeCompare(b.data));
const csv = [
  header.join(";"),
  ...linhasOrdenadas.map((l) =>
    [
      csvEscape(l.linhaDre),
      csvEscape(l.categoria),
      csvEscape(l.conta),
      csvEscape(l.descricaoConta),
      csvEscape(l.lado),
      fmt(l.valor),
      csvEscape(l.data),
      csvEscape(l.documento),
      csvEscape(historicoPadrao(l)),
      csvEscape(l.historico),
      csvEscape(l.status),
      csvEscape(l.fonte),
      csvEscape(l.id),
    ].join(";"),
  ),
].join("\r\n");

const destino = "C:/Users/Luan Sanchez/Downloads/DRE-Nota-a-Nota-Agosto-2026-v3.csv";
writeFileSync(destino, "\uFEFF" + csv, "utf-8");
console.log("Gerado:", destino);
console.log("Total de linhas (lançamentos x lado classificado):", linhasOrdenadas.length);

const porSecao = new Map<string, number>();
for (const l of linhasOrdenadas) porSecao.set(l.linhaDre, (porSecao.get(l.linhaDre) ?? 0) + l.valor);
console.log("\nConferência por seção da DRE:");
for (const [secao, valor] of porSecao) console.log(" ", secao.padEnd(35), valor.toFixed(2));
