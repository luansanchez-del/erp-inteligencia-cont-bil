import { dreCompletaJunho } from "./nitaplast-dre-completa";
import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { lancamentosIntegrados } from "./nitaplast-razao-integrado";

export type ComposicaoDre = {
  chave: string;
  codigo: string;
  classificacao: string;
  descricao: string;
  cc: string;
  centroCusto: string;
  debitos: number;
  creditos: number;
  valorLinha: number;
  lancamentos: number;
  fonte: string;
  observacao?: string;
};

export type LinhaComparacaoDre = {
  id: string;
  descricao: string;
  nivel: 0 | 1 | 2;
  tipo: "grupo" | "detalhe" | "resultado" | "diagnostico";
  calculado: number;
  enviado: number;
  diferenca: number;
  composicao: ComposicaoDre[];
  criterio: string;
};

type MovimentoResultado = {
  codigo: string;
  classificacao: string;
  descricao: string;
  cc: string;
  centroCusto: string;
  debito: number;
  credito: number;
  efeitoResultado: number;
  fonte: string;
};

const plano = new Map(
  estruturaBalanceteNitaplast
    .filter((linha) => linha.tipo === "A")
    .map((linha) => [linha.conta, linha]),
);

const enviadoPorId = new Map(dreCompletaJunho.map((linha) => [linha.id, linha.valor]));
const enviado = (id: string) => enviadoPorId.get(id) ?? 0;
const arred = (valor: number) => Math.round(valor * 100) / 100;

const movimentosResultado: MovimentoResultado[] = [];
for (const lancamento of lancamentosIntegrados) {
  const contaDebito = plano.get(lancamento.debitoCodigo);
  if (contaDebito && (contaDebito.classificacao.startsWith("4") || contaDebito.classificacao.startsWith("5"))) {
    movimentosResultado.push({
      codigo: lancamento.debitoCodigo,
      classificacao: contaDebito.classificacao,
      descricao: contaDebito.descricao,
      cc: lancamento.cc,
      centroCusto: lancamento.centroCusto,
      debito: lancamento.valor,
      credito: 0,
      efeitoResultado: -lancamento.valor,
      fonte: lancamento.fonte,
    });
  }

  const contaCredito = plano.get(lancamento.creditoCodigo);
  if (contaCredito && (contaCredito.classificacao.startsWith("4") || contaCredito.classificacao.startsWith("5"))) {
    movimentosResultado.push({
      codigo: lancamento.creditoCodigo,
      classificacao: contaCredito.classificacao,
      descricao: contaCredito.descricao,
      cc: lancamento.cc,
      centroCusto: lancamento.centroCusto,
      debito: 0,
      credito: lancamento.valor,
      efeitoResultado: lancamento.valor,
      fonte: lancamento.fonte,
    });
  }
}

function selecionar(predicado: (movimento: MovimentoResultado) => boolean) {
  return movimentosResultado.filter(predicado);
}

function somaEfeito(movimentos: MovimentoResultado[]) {
  return arred(movimentos.reduce((total, movimento) => total + movimento.efeitoResultado, 0));
}

function somaDebitos(movimentos: MovimentoResultado[]) {
  return arred(movimentos.reduce((total, movimento) => total + movimento.debito, 0));
}

function somaCreditos(movimentos: MovimentoResultado[]) {
  return arred(movimentos.reduce((total, movimento) => total + movimento.credito, 0));
}

function compor(movimentos: MovimentoResultado[], multiplicador = 1, observacao?: string): ComposicaoDre[] {
  const mapa = new Map<string, ComposicaoDre>();
  for (const movimento of movimentos) {
    const chave = `${movimento.codigo}|${movimento.cc}`;
    const atual = mapa.get(chave) ?? {
      chave,
      codigo: movimento.codigo,
      classificacao: movimento.classificacao,
      descricao: movimento.descricao,
      cc: movimento.cc,
      centroCusto: movimento.centroCusto,
      debitos: 0,
      creditos: 0,
      valorLinha: 0,
      lancamentos: 0,
      fonte: movimento.fonte,
      observacao,
    };
    atual.debitos += movimento.debito;
    atual.creditos += movimento.credito;
    atual.valorLinha += movimento.efeitoResultado * multiplicador;
    atual.lancamentos += 1;
    mapa.set(chave, atual);
  }
  return [...mapa.values()]
    .map((linha) => ({
      ...linha,
      debitos: arred(linha.debitos),
      creditos: arred(linha.creditos),
      valorLinha: arred(linha.valorLinha),
    }))
    .filter((linha) => Math.abs(linha.debitos) > 0.004 || Math.abs(linha.creditos) > 0.004)
    .sort((a, b) => Math.abs(b.valorLinha) - Math.abs(a.valorLinha));
}

function composicaoManual(params: {
  codigo: string;
  cc: string;
  centroCusto: string;
  debitos: number;
  creditos: number;
  valorLinha: number;
  fonte: string;
  observacao: string;
}): ComposicaoDre[] {
  const conta = plano.get(params.codigo);
  return [{
    chave: `${params.codigo}|${params.cc}|manual`,
    codigo: params.codigo,
    classificacao: conta?.classificacao ?? "",
    descricao: conta?.descricao ?? "Conta a revisar",
    cc: params.cc,
    centroCusto: params.centroCusto,
    debitos: arred(params.debitos),
    creditos: arred(params.creditos),
    valorLinha: arred(params.valorLinha),
    lancamentos: 0,
    fonte: params.fonte,
    observacao: params.observacao,
  }];
}

function linha(params: {
  id: string;
  descricao?: string;
  nivel: 0 | 1 | 2;
  tipo: LinhaComparacaoDre["tipo"];
  calculado: number;
  enviadoId?: string;
  enviadoValor?: number;
  composicao?: ComposicaoDre[];
  criterio: string;
}): LinhaComparacaoDre {
  const valorEnviado = params.enviadoValor ?? enviado(params.enviadoId ?? params.id);
  const calculado = arred(params.calculado);
  return {
    id: params.id,
    descricao: params.descricao ?? dreCompletaJunho.find((item) => item.id === (params.enviadoId ?? params.id))?.descricao ?? params.id,
    nivel: params.nivel,
    tipo: params.tipo,
    calculado,
    enviado: arred(valorEnviado),
    diferenca: arred(calculado - valorEnviado),
    composicao: params.composicao ?? [],
    criterio: params.criterio,
  };
}

const prodMat = selecionar((m) => ["2606", "25025", "2629"].includes(m.codigo) && m.cc !== "502");
const revMat = selecionar((m) => ["2655", "2678"].includes(m.codigo) && m.cc !== "502");
const serv = selecionar((m) => m.codigo === "2703");
const prodFil = selecionar((m) => ["2606", "25025", "2629"].includes(m.codigo) && m.cc === "502");
const revFil = selecionar((m) => ["2655", "2678"].includes(m.codigo) && m.cc === "502");
const receitaBrutaMov = selecionar((m) => m.classificacao.startsWith("4.1.01") && m.codigo !== "25943");
const receitaMapeadaCodigos = new Set([...prodMat, ...revMat, ...serv, ...prodFil, ...revFil].map((m) => `${m.codigo}|${m.cc}|${m.debito}|${m.credito}|${m.fonte}`));
const receitaNaoMapeada = receitaBrutaMov.filter((m) => !receitaMapeadaCodigos.has(`${m.codigo}|${m.cc}|${m.debito}|${m.credito}|${m.fonte}`));

const devolucoes = selecionar((m) => m.codigo === "25943");
const ipiM = selecionar((m) => m.codigo === "2826");
const icmsM = selecionar((m) => m.codigo === "2827");
const icmsSt = selecionar((m) => m.codigo === "2832");
const icmsF = selecionar((m) => m.codigo === "25054");
const ipiF = selecionar((m) => m.codigo === "25055");
const pis = selecionar((m) => m.codigo === "2829");
const cofins = selecionar((m) => m.codigo === "2830");

// A apuração federal está contabilizada de forma consolidada nas contas 2829/2830.
// Para a abertura analítica Matriz x Filial NÃO é criado lançamento adicional.
// A parcela da filial é identificada documentalmente pelas saídas 5102/5123/6102 da filial,
// cruzadas com os registros PIS/COFINS do CNPJ 82.295.817/0003-60 e com as saídas da matriz.
export const tributosFederaisFilialDocumentados = {
  pisDebitoFilial: 4530.15,
  cofinsDebitoFilial: 20866.08,
  pisCreditoDevolucoesFilialIdentificado: 358.27,
  cofinsCreditoDevolucoesFilialIdentificado: 1650.21,
  fonte: "SAIDAS FILIAL(2).xlsx + SAIDAS - NITAPLAST(3).xlsx + REGISTRO APURAÇÃO PIS(6).pdf + REEGISTRO APURAÇÃO COFINS(1).pdf + ENTRADAS - NITAPLAST FILIAL(2).xlsx",
} as const;

const pisDeb = somaDebitos(pis);
const pisCred = somaCreditos(pis);
const cofDeb = somaDebitos(cofins);
const cofCred = somaCreditos(cofins);
const pisFilialCalc = Math.min(tributosFederaisFilialDocumentados.pisDebitoFilial, pisDeb);
const cofFilialCalc = Math.min(tributosFederaisFilialDocumentados.cofinsDebitoFilial, cofDeb);
const pisMatrizCalc = arred((pisDeb - pisFilialCalc) - pisCred);
const cofMatrizCalc = arred((cofDeb - cofFilialCalc) - cofCred);

const pisMComp = composicaoManual({
  codigo: "2829", cc: "201", centroCusto: "MATRIZ / VENDAS", debitos: pisDeb - pisFilialCalc, creditos: pisCred,
  valorLinha: pisMatrizCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "Abertura analítica: total contábil da conta PIS menos a parcela documental da filial. Os créditos já contabilizados na conta 2829 permanecem na matriz enquanto não houver CC próprio no lançamento original.",
});
const pisFComp = composicaoManual({
  codigo: "2829", cc: "502", centroCusto: "COMERCIAL SP", debitos: pisFilialCalc, creditos: 0,
  valorLinha: pisFilialCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "Parcela documental da filial dentro do débito consolidado de PIS. Informação analítica; não cria lançamento adicional nem altera o total do balancete.",
});
const cofMComp = composicaoManual({
  codigo: "2830", cc: "201", centroCusto: "MATRIZ / VENDAS", debitos: cofDeb - cofFilialCalc, creditos: cofCred,
  valorLinha: cofMatrizCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "Abertura analítica: total contábil da conta COFINS menos a parcela documental da filial. Os créditos já contabilizados na conta 2830 permanecem na matriz enquanto não houver CC próprio no lançamento original.",
});
const cofFComp = composicaoManual({
  codigo: "2830", cc: "502", centroCusto: "COMERCIAL SP", debitos: cofFilialCalc, creditos: 0,
  valorLinha: cofFilialCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "Parcela documental da filial dentro do débito consolidado de COFINS. Informação analítica; não cria lançamento adicional nem altera o total do balancete.",
});

const cpvM = selecionar((m) => m.codigo === "25944");
const cpvF = selecionar((m) => m.codigo === "25945");
const cmvM = selecionar((m) => m.classificacao.startsWith("5.1"));
const custosProducao = selecionar((m) => m.classificacao.startsWith("5.3"));
const outrosCustos = selecionar((m) => m.classificacao.startsWith("4.2") && !["25944", "25945"].includes(m.codigo));

const creditosPisDesp = selecionar((m) => m.codigo === "25946");
const creditosCofDesp = selecionar((m) => m.codigo === "25947");
const receitasFinanceiras = selecionar((m) => m.classificacao.startsWith("5.7.12") || m.classificacao.startsWith("4.1.05.001"));
const despesasFinanceiras = selecionar((m) => m.classificacao.startsWith("5.8"));

const operacionalBase = selecionar((m) =>
  m.classificacao.startsWith("5.7")
  && !m.classificacao.startsWith("5.7.12")
  && !["25946", "25947"].includes(m.codigo),
);

const ccProducao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10061", "19999"]);
const ccComercial = new Set(["201", "202", "203", "204", "205", "206", "207", "210"]);
const ccAdministrativo = new Set(["301", "302", "303", "304", "305", "306"]);

function contemTexto(m: MovimentoResultado, texto: string) {
  return `${m.descricao} ${m.fonte}`.toLocaleUpperCase("pt-BR").includes(texto);
}

const bucketsOperacionais: Record<string, MovimentoResultado[]> = {
  adm: [], nplog: [], comerciais: [], producao: [], veiculos: [], barracao: [], imobilizado: [], industrializacao: [], tributarias: [], "comercial-sp": [], "despesas-nao-mapeadas": [],
};

for (const movimento of operacionalBase) {
  if (movimento.cc === "502") bucketsOperacionais["comercial-sp"].push(movimento);
  else if (contemTexto(movimento, "NPLOG")) bucketsOperacionais.nplog.push(movimento);
  else if (movimento.classificacao.startsWith("5.7.05") || movimento.classificacao.startsWith("5.7.01.015")) bucketsOperacionais.veiculos.push(movimento);
  else if (movimento.classificacao.startsWith("5.7.01.009") || movimento.classificacao.startsWith("5.7.03.007")) bucketsOperacionais.barracao.push(movimento);
  else if (movimento.classificacao.startsWith("5.7.01.011")) bucketsOperacionais.imobilizado.push(movimento);
  else if (movimento.classificacao.startsWith("5.7.09")) bucketsOperacionais.tributarias.push(movimento);
  else if (movimento.codigo === "25937" || contemTexto(movimento, "INDUSTRIALIZA")) bucketsOperacionais.industrializacao.push(movimento);
  else if (ccProducao.has(movimento.cc)) bucketsOperacionais.producao.push(movimento);
  else if (ccComercial.has(movimento.cc)) bucketsOperacionais.comerciais.push(movimento);
  else if (movimento.classificacao.startsWith("5.7.03") || ccAdministrativo.has(movimento.cc)) bucketsOperacionais.adm.push(movimento);
  else bucketsOperacionais["despesas-nao-mapeadas"].push(movimento);
}

const naoOperacional = selecionar((m) => m.classificacao.startsWith("5.9"));
const alienacao = selecionar((m) => m.codigo === "4736");
const naoOperacionalOutros = naoOperacional.filter((m) => m.codigo !== "4736");

const todasReceitasBrutasCalc = somaEfeito(receitaBrutaMov);
const todasDeducoesMov = [...devolucoes, ...selecionar((m) => m.classificacao.startsWith("4.1.03"))];
const deducoesCalc = -somaEfeito(todasDeducoesMov);
const custosMov = [...selecionar((m) => m.classificacao.startsWith("4.2")), ...selecionar((m) => m.classificacao.startsWith("5.1") || m.classificacao.startsWith("5.3"))];
const custosCalc = -somaEfeito(custosMov);
const despesasOpBaseCalc = -somaEfeito(operacionalBase);
const receitasFinCalc = somaEfeito(receitasFinanceiras);
const despesasFinCalc = -somaEfeito(despesasFinanceiras);
const creditoPisCalc = -somaEfeito(creditosPisDesp);
const creditoCofCalc = -somaEfeito(creditosCofDesp);
const naoOpCalc = somaEfeito(naoOperacional);
const resultadoLiquidoCalc = somaEfeito(movimentosResultado);
const resultadoOperacionalCalc = arred(resultadoLiquidoCalc - naoOpCalc);
const despesasLiquidasCalc = arred(despesasOpBaseCalc + despesasFinCalc - receitasFinCalc + creditoPisCalc + creditoCofCalc);

const linhasReceita: LinhaComparacaoDre[] = [
  linha({ id: "receita", nivel: 0, tipo: "grupo", calculado: todasReceitasBrutasCalc, composicao: compor(receitaBrutaMov), criterio: "Movimento líquido das contas de receita bruta do balancete." }),
  linha({ id: "rec-matriz-prod", nivel: 1, tipo: "detalhe", calculado: somaEfeito(prodMat), composicao: compor(prodMat), criterio: "Contas de venda de produtos da matriz; CC 502 excluído." }),
  linha({ id: "rec-matriz-rev", nivel: 1, tipo: "detalhe", calculado: somaEfeito(revMat), composicao: compor(revMat), criterio: "Contas de venda de mercadorias/revenda da matriz; CC 502 excluído." }),
  linha({ id: "rec-serv", nivel: 1, tipo: "detalhe", calculado: somaEfeito(serv), composicao: compor(serv), criterio: "Prestação de serviços conforme conta 2703." }),
  linha({ id: "rec-filial-prod", nivel: 1, tipo: "detalhe", calculado: somaEfeito(prodFil), composicao: compor(prodFil), criterio: "Vendas de produtos no CC 502. Os documentos fiscais da filial indicam predominantemente revenda." }),
  linha({ id: "rec-filial-rev", nivel: 1, tipo: "detalhe", calculado: somaEfeito(revFil), composicao: compor(revFil), criterio: "Vendas de mercadorias/revenda no CC 502, alimentadas pelos arquivos fiscais da filial." }),
  linha({ id: "receita-nao-mapeada", descricao: "Receitas brutas não mapeadas nas linhas enviadas", nivel: 1, tipo: "diagnostico", calculado: somaEfeito(receitaNaoMapeada), enviadoValor: 0, composicao: compor(receitaNaoMapeada), criterio: "Conta de receita bruta existente no balancete sem linha correspondente na DRE enviada." }),
];

const linhasDeducoes: LinhaComparacaoDre[] = [
  linha({ id: "deducoes", nivel: 0, tipo: "grupo", calculado: deducoesCalc, composicao: compor(todasDeducoesMov, -1), criterio: "Débitos menos créditos das contas de dedução e devolução do balancete." }),
  linha({ id: "dev", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(devolucoes), composicao: compor(devolucoes, -1), criterio: "Devoluções contabilizadas na conta 25943." }),
  linha({ id: "ipi-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(ipiM), composicao: compor(ipiM, -1), criterio: "IPI da matriz líquido dos créditos/reversões existentes na própria conta de dedução." }),
  linha({ id: "icms-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(icmsM), composicao: compor(icmsM, -1), criterio: "ICMS da matriz líquido dos créditos/reversões existentes na própria conta de dedução." }),
  linha({ id: "pis-m", nivel: 1, tipo: "detalhe", calculado: pisMatrizCalc, composicao: pisMComp, criterio: "Total contábil PIS aberto analiticamente entre matriz e filial por documentos; sem lançamento adicional." }),
  linha({ id: "cofins-m", nivel: 1, tipo: "detalhe", calculado: cofMatrizCalc, composicao: cofMComp, criterio: "Total contábil COFINS aberto analiticamente entre matriz e filial por documentos; sem lançamento adicional." }),
  linha({ id: "icms-st", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(icmsSt), composicao: compor(icmsSt, -1), criterio: "ICMS-ST conforme conta específica do balancete." }),
  linha({ id: "icms-f", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(icmsF), composicao: compor(icmsF, -1), criterio: "ICMS sobre vendas da filial na conta analítica filial." }),
  linha({ id: "ipi-f", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(ipiF), composicao: compor(ipiF, -1), criterio: "IPI faturado da filial na conta analítica filial." }),
  linha({ id: "pis-f", nivel: 1, tipo: "detalhe", calculado: pisFilialCalc, composicao: pisFComp, criterio: "Parcela do débito consolidado de PIS pertencente à filial, apurada pelos documentos do CNPJ 0003-60." }),
  linha({ id: "cofins-f", nivel: 1, tipo: "detalhe", calculado: cofFilialCalc, composicao: cofFComp, criterio: "Parcela do débito consolidado de COFINS pertencente à filial, apurada pelos documentos do CNPJ 0003-60." }),
];

const linhasCustos: LinhaComparacaoDre[] = [
  linha({ id: "custos", nivel: 0, tipo: "grupo", calculado: custosCalc, composicao: compor(custosMov, -1), criterio: "Contas 4.2, 5.1 e 5.3 que permanecem no resultado do balancete. Não é forçado ao CPV enviado." }),
  linha({ id: "cpv-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(cpvM), composicao: compor(cpvM, -1), criterio: "Conta 25944 — CPV matriz." }),
  linha({ id: "cmv-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(cmvM), composicao: compor(cmvM, -1), criterio: "Contas 5.1 ainda no resultado. Se deveriam estar absorvidas no estoque/CPV, a diferença fica exposta." }),
  linha({ id: "cpv-f", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(cpvF), composicao: compor(cpvF, -1), criterio: "Conta 25945 — CPV filial." }),
  linha({ id: "cmv-f", nivel: 1, tipo: "detalhe", calculado: 0, composicao: [], criterio: "Não há conta de CMV filial distinta movimentada no razão atual; não é criado valor para fechar com a DRE enviada." }),
  linha({ id: "custos-producao-pendentes", descricao: "Custos de produção ainda no resultado (5.3)", nivel: 1, tipo: "diagnostico", calculado: -somaEfeito(custosProducao), enviadoValor: 0, composicao: compor(custosProducao, -1), criterio: "Contas 5.3 presentes no balancete. Essa linha explica grande parte da discrepância de custo enquanto não houver absorção/fechamento de estoque comprovado." }),
  linha({ id: "outros-custos", descricao: "Outros custos sem linha na DRE enviada", nivel: 1, tipo: "diagnostico", calculado: -somaEfeito(outrosCustos), enviadoValor: 0, composicao: compor(outrosCustos, -1), criterio: "Contas 4.2 de custo não contempladas em linha específica da DRE enviada." }),
];

const linhasOperacionais: LinhaComparacaoDre[] = [
  linha({ id: "despesas", nivel: 0, tipo: "grupo", calculado: arred(despesasOpBaseCalc + despesasFinCalc - receitasFinCalc), enviadoId: "despesas", composicao: compor([...operacionalBase, ...despesasFinanceiras, ...receitasFinanceiras], -1), criterio: "Despesas operacionais, financeiras e receitas financeiras conforme contas do balancete; créditos PIS/COFINS são comparados abaixo separadamente." }),
  ...(["adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp"] as const).map((id) => linha({
    id,
    nivel: 1,
    tipo: "detalhe",
    calculado: -somaEfeito(bucketsOperacionais[id]),
    composicao: compor(bucketsOperacionais[id], -1),
    criterio: id === "industrializacao"
      ? "Somente despesas operacionais 5.7 identificadas como industrialização. Valores em contas 5.3 permanecem no bloco de custos e não são deslocados para fazer a DRE bater."
      : `Classificação por conta contábil e centro de custo do balancete para ${id}.`,
  })),
  linha({ id: "despesas-nao-mapeadas", descricao: "Despesas operacionais sem linha correspondente", nivel: 1, tipo: "diagnostico", calculado: -somaEfeito(bucketsOperacionais["despesas-nao-mapeadas"]), enviadoValor: 0, composicao: compor(bucketsOperacionais["despesas-nao-mapeadas"], -1), criterio: "Movimentos 5.7 que não puderam ser atribuídos com segurança a uma linha da DRE enviada." }),
  linha({ id: "fin-desp", nivel: 1, tipo: "detalhe", calculado: despesasFinCalc, composicao: compor(despesasFinanceiras, -1), criterio: "Contas 5.8 — despesas financeiras." }),
  linha({ id: "fin-rec", nivel: 1, tipo: "detalhe", calculado: -receitasFinCalc, composicao: compor(receitasFinanceiras, -1), criterio: "Receitas financeiras existentes no balancete apresentadas com sinal redutor para comparar com a DRE enviada." }),
  linha({ id: "credito-pis", nivel: 1, tipo: "detalhe", calculado: creditoPisCalc, composicao: compor(creditosPisDesp, -1), criterio: "Efeito da conta 25946. Se a conta contém residual derivado sem documento específico, a diferença deve permanecer para revisão e não ser preenchida por ajuste." }),
  linha({ id: "credito-cofins", nivel: 1, tipo: "detalhe", calculado: creditoCofCalc, composicao: compor(creditosCofDesp, -1), criterio: "Efeito da conta 25947. Se a conta contém residual derivado sem documento específico, a diferença deve permanecer para revisão e não ser preenchida por ajuste." }),
  linha({ id: "despesas-liquidas", nivel: 0, tipo: "resultado", calculado: despesasLiquidasCalc, composicao: [], criterio: "Despesas operacionais + financeiras - receitas financeiras + créditos PIS/COFINS contabilizados." }),
];

const linhasResultado: LinhaComparacaoDre[] = [
  linha({ id: "resultado-op", nivel: 0, tipo: "resultado", calculado: resultadoOperacionalCalc, composicao: [], criterio: "Resultado de todas as contas 4/5 do balancete, excluído o bloco 5.9 não operacional." }),
  linha({ id: "nao-op", nivel: 0, tipo: "grupo", calculado: naoOpCalc, composicao: compor(naoOperacional), criterio: "Movimento líquido das contas 5.9 — outros resultados operacionais/não operacionais." }),
  linha({ id: "alienacao", nivel: 1, tipo: "detalhe", calculado: somaEfeito(alienacao), composicao: compor(alienacao), criterio: "Receita de venda do ativo contabilizada na conta 4736; não usa o valor enviado para criar lançamento." }),
  linha({ id: "nao-op-outros", descricao: "Outros resultados não operacionais sem linha enviada", nivel: 1, tipo: "diagnostico", calculado: somaEfeito(naoOperacionalOutros), enviadoValor: 0, composicao: compor(naoOperacionalOutros), criterio: "Demais contas 5.9 encontradas no balancete." }),
  linha({ id: "lucro-liq", nivel: 0, tipo: "resultado", calculado: resultadoLiquidoCalc, composicao: [], criterio: "Soma algébrica de todas as contas de resultado movimentadas no balancete." }),
];

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = [
  ...linhasReceita,
  ...linhasDeducoes,
  ...linhasCustos,
  ...linhasOperacionais,
  ...linhasResultado,
];

export const resumoDreDetalhada = {
  receitaCalculada: todasReceitasBrutasCalc,
  deducoesCalculadas: deducoesCalc,
  custosCalculados: custosCalc,
  despesasLiquidasCalculadas: despesasLiquidasCalc,
  resultadoOperacionalCalculado: resultadoOperacionalCalc,
  resultadoLiquidoCalculado: resultadoLiquidoCalc,
  resultadoLiquidoEnviado: enviado("lucro-liq"),
  diferencaResultado: arred(resultadoLiquidoCalc - enviado("lucro-liq")),
  linhasComDiferenca: comparacaoDreDetalhada.filter((item) => Math.abs(item.diferenca) > 0.01).length,
  totalLinhas: comparacaoDreDetalhada.length,
} as const;
