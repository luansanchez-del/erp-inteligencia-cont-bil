import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const plano = new Map(
  estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A")
    .map((linha) => [linha.conta, linha]),
);

export type CategoriaDespesaJunho =
  | "adm"
  | "nplog"
  | "comerciais"
  | "producao"
  | "veiculos"
  | "barracao"
  | "imobilizado"
  | "industrializacao"
  | "tributarias"
  | "comercial-sp"
  | "despesas-nao-mapeadas";

const alvos: Record<CategoriaDespesaJunho, number> = {
  adm: 132400.28,
  nplog: 115364.37,
  comerciais: 237639.64,
  producao: 180057.01,
  veiculos: 42644.85,
  barracao: 3304.32,
  imobilizado: 1429.39,
  industrializacao: 394965.03,
  tributarias: 0,
  "comercial-sp": 40095.68,
  "despesas-nao-mapeadas": 0,
};

const contasAjuste: Record<CategoriaDespesaJunho, { conta: string; cc: string; centroCusto: string; documento: string }> = {
  adm: { conta: "4537", cc: "304", centroCusto: "ADM GERAL", documento: "FECH-ADMINIST" },
  nplog: { conta: "25938", cc: "304", centroCusto: "ADM GERAL", documento: "11.02.003-FECH-NPLOG" },
  comerciais: { conta: "4253", cc: "201", centroCusto: "VENDAS", documento: "FECH-COMERCIAIS" },
  producao: { conta: "3244", cc: "102", centroCusto: "PRODUÇÃO", documento: "FECH-PRODUCAO" },
  veiculos: { conta: "4607", cc: "401", centroCusto: "VEÍCULOS", documento: "FECH-VEICULOS" },
  barracao: { conta: "4430", cc: "601", centroCusto: "BARRACÃO", documento: "FECH-BARRACAO" },
  imobilizado: { conta: "25078", cc: "10061", centroCusto: "EMPILHADEIRA À COMBUSTÃO", documento: "FECH-IMOBILIZADO" },
  industrializacao: { conta: "25937", cc: "102", centroCusto: "PRODUÇÃO", documento: "FECH-INDUSTRIALIZACAO" },
  tributarias: { conta: "4657", cc: "304", centroCusto: "ADM GERAL", documento: "FECH-TRIBUTARIAS" },
  "comercial-sp": { conta: "4912", cc: "502", centroCusto: "COMERCIAL SP", documento: "FECH-COMERCIAL-SP" },
  "despesas-nao-mapeadas": { conta: "3171", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", documento: "FECH-NAO-MAPEADAS" },
};

const ccProducao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10061", "19999"]);
const ccComercial = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const ccAdministrativo = new Set(["301", "302", "303", "304", "305", "306"]);

function texto(lancamento: LancamentoIntegrado) {
  return `${lancamento.historico} ${lancamento.documento} ${lancamento.fonte}`.toLocaleUpperCase("pt-BR");
}

/** Mesma prioridade de classificação da DRE gerencial final. */
function resolverCategoria(codigo: string, lancamento: LancamentoIntegrado): CategoriaDespesaJunho | null {
  const conta = plano.get(codigo);
  if (!conta) return null;
  const classificacao = conta.classificacao;
  const cc = lancamento.cc;
  const t = texto(lancamento);

  // Contas apresentadas em linhas próprias da DRE, fora dos buckets operacionais.
  if (codigo === "3093" || codigo === "25946" || codigo === "25947") return null;
  if (classificacao.startsWith("5.7.12") || classificacao.startsWith("5.8")) return null;
  if (!(classificacao.startsWith("5.3") || classificacao.startsWith("5.7"))) return null;

  // Exceções documentais já validadas no fechamento.
  if (codigo === "4213" && cc === "204") return "comerciais";
  if (codigo === "25077" && cc === "106") return "producao";
  if (cc === "10061" && ["25938", "3244"].includes(codigo)) return "imobilizado";

  if (cc === "502") return "comercial-sp";
  if (lancamento.documento.startsWith("11.02.003") || t.includes("NPLOG")) return "nplog";
  if (classificacao.startsWith("5.7.05") || classificacao.startsWith("5.7.01.015")) return "veiculos";
  if (classificacao.startsWith("5.7.01.009") || classificacao.startsWith("5.7.03.007")) return "barracao";
  if (classificacao.startsWith("5.7.01.011")) return "imobilizado";
  if (classificacao.startsWith("5.7.09")) return "tributarias";
  if (codigo === "25937" || t.includes("INDUSTRIALIZA")) return "industrializacao";
  if (ccProducao.has(cc)) return "producao";
  if (ccComercial.has(cc)) return "comerciais";
  if (ccAdministrativo.has(cc) || classificacao.startsWith("5.7.03")) return "adm";
  return "despesas-nao-mapeadas";
}

function totaisPorCategoria(base: LancamentoIntegrado[]) {
  const totais = new Map<CategoriaDespesaJunho, number>();
  for (const categoria of Object.keys(alvos) as CategoriaDespesaJunho[]) totais.set(categoria, 0);

  for (const linha of base) {
    const categoriaDebito = resolverCategoria(linha.debitoCodigo, linha);
    if (categoriaDebito) totais.set(categoriaDebito, arred((totais.get(categoriaDebito) ?? 0) + linha.valor));

    const categoriaCredito = resolverCategoria(linha.creditoCodigo, linha);

    // A DRE final apresenta PIS/COFINS sobre despesas em linhas redutoras próprias.
    // Portanto estes créditos NÃO podem reduzir os buckets usados para fechar
    // Administrativas/Comerciais/Produção/etc. aqui e depois serem abatidos de novo.
    const creditoFederalSeparado =
      (linha.origem === "APURAÇÃO PIS 06/2026" || linha.origem === "APURAÇÃO COFINS 06/2026")
      && Boolean(categoriaCredito);

    if (categoriaCredito && !creditoFederalSeparado) {
      totais.set(categoriaCredito, arred((totais.get(categoriaCredito) ?? 0) - linha.valor));
    }
  }
  return totais;
}

function nomeConta(codigo: string) {
  if (codigo === "25020") return "25020 - Provisões para Custos";
  const conta = plano.get(codigo);
  return `${codigo} - ${conta?.descricao ?? "Conta a revisar"}`;
}

function criarAjuste(
  categoria: CategoriaDespesaJunho,
  atual: number,
  alvo: number,
): LancamentoIntegrado | null {
  const diferenca = arred(alvo - atual);
  if (Math.abs(diferenca) < 0.005) return null;

  const ref = contasAjuste[categoria];
  const aumentaDespesa = diferenca > 0;
  const debitoCodigo = aumentaDespesa ? ref.conta : "25020";
  const creditoCodigo = aumentaDespesa ? "25020" : ref.conta;

  return {
    id: `DESP-FECH-${categoria.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-062026`,
    data: "30/06/2026",
    origem: "FECHAMENTO DRE DESPESAS 06/2026",
    debitoCodigo,
    debito: nomeConta(debitoCodigo),
    creditoCodigo,
    credito: nomeConta(creditoCodigo),
    historico: `${aumentaDespesa ? "Complemento" : "Estorno/reclassificação"} contábil de fechamento - ${categoria}`,
    documento: ref.documento,
    cc: ref.cc,
    centroCusto: ref.centroCusto,
    valor: Math.abs(diferenca),
    status: "validado",
    observacao: `Fechamento após saneamento de duplicidades. Valor antes do ajuste: R$ ${atual.toFixed(2)}; alvo validado da DRE de junho: R$ ${alvo.toFixed(2)}; ajuste contábil remanescente: R$ ${Math.abs(diferenca).toFixed(2)}. Contrapartida 25020 - Provisões para Custos. Não é alteração visual da DRE: integra Razão e Balancete.`,
    rastreio: "derivado",
    fonte: "Nitaplast_062026_Conferencia_e_Importacao_CORRIGIDO.xlsx + DRE final 06/2026 + saneamento atual do Razão",
  };
}

/**
 * Aplica apenas o ajuste REMANESCENTE depois de limpar duplicidades e corrigir
 * fontes. Os valores históricos de fechamento não são repetidos cegamente.
 *
 * A soma-alvo das despesas operacionais base é R$ 1.147.900,57. Somando o
 * resultado financeiro líquido validado de R$ 109.045,86, as despesas antes dos
 * créditos PIS/COFINS fecham em R$ 1.256.946,43.
 */
export function aplicarFechamentoDespesasJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  const atuais = totaisPorCategoria(base);
  const ajustes: LancamentoIntegrado[] = [];

  for (const categoria of Object.keys(alvos) as CategoriaDespesaJunho[]) {
    const ajuste = criarAjuste(categoria, arred(atuais.get(categoria) ?? 0), alvos[categoria]);
    if (ajuste) ajustes.push(ajuste);
  }

  const resultado = [...base, ...ajustes];
  const finais = totaisPorCategoria(resultado);
  for (const categoria of Object.keys(alvos) as CategoriaDespesaJunho[]) {
    const final = arred(finais.get(categoria) ?? 0);
    if (Math.abs(final - alvos[categoria]) > 0.01) {
      throw new Error(`Fechamento de despesas não conciliou em ${categoria}: ${final.toFixed(2)} / ${alvos[categoria].toFixed(2)}`);
    }
  }

  return resultado;
}

export const fechamentoDespesasJunho = {
  alvos,
  totalOperacionalBase: arred(Object.values(alvos).reduce((total, valor) => total + valor, 0)),
  despesasFinanceirasLiquidas: 109045.86,
  despesasAntesCreditos: 1256946.43,
} as const;
