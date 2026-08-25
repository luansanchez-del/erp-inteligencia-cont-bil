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
  id: string;
  codigo: string;
  classificacao: string;
  descricao: string;
  cc: string;
  centroCusto: string;
  debito: number;
  credito: number;
  efeitoResultado: number;
  origem: string;
  historico: string;
  documento: string;
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
      id: lancamento.id,
      codigo: lancamento.debitoCodigo,
      classificacao: contaDebito.classificacao,
      descricao: contaDebito.descricao,
      cc: lancamento.cc,
      centroCusto: lancamento.centroCusto,
      debito: lancamento.valor,
      credito: 0,
      efeitoResultado: -lancamento.valor,
      origem: lancamento.origem,
      historico: lancamento.historico,
      documento: lancamento.documento,
      fonte: lancamento.fonte,
    });
  }

  const contaCredito = plano.get(lancamento.creditoCodigo);
  if (contaCredito && (contaCredito.classificacao.startsWith("4") || contaCredito.classificacao.startsWith("5"))) {
    movimentosResultado.push({
      id: lancamento.id,
      codigo: lancamento.creditoCodigo,
      classificacao: contaCredito.classificacao,
      descricao: contaCredito.descricao,
      cc: lancamento.cc,
      centroCusto: lancamento.centroCusto,
      debito: 0,
      credito: lancamento.valor,
      efeitoResultado: lancamento.valor,
      origem: lancamento.origem,
      historico: lancamento.historico,
      documento: lancamento.documento,
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
      fonte: `${movimento.origem} · ${movimento.fonte}`,
      ...(observacao === undefined ? {} : { observacao }),
    };
    atual.debitos += movimento.debito;
    atual.creditos += movimento.credito;
    atual.valorLinha += movimento.efeitoResultado * multiplicador;
    atual.lancamentos += 1;
    mapa.set(chave, atual);
  }
  return [...mapa.values()]
    .map((item) => ({
      ...item,
      debitos: arred(item.debitos),
      creditos: arred(item.creditos),
      valorLinha: arred(item.valorLinha),
    }))
    .filter((item) => Math.abs(item.debitos) > 0.004 || Math.abs(item.creditos) > 0.004)
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

// ---------------- RECEITA ----------------
const prodMat = selecionar((m) => ["2606", "25025", "2629"].includes(m.codigo) && m.cc !== "502");
const revMat = selecionar((m) => ["2655", "2678"].includes(m.codigo) && m.cc !== "502");
const serv = selecionar((m) => m.codigo === "2703");
const prodFil = selecionar((m) => ["2606", "25025", "2629"].includes(m.codigo) && m.cc === "502");
const revFil = selecionar((m) => ["2655", "2678"].includes(m.codigo) && m.cc === "502");
const receitaBrutaMov = selecionar((m) => m.classificacao.startsWith("4.1.01") && m.codigo !== "25943");
const receitaMapeada = new Set([...prodMat, ...revMat, ...serv, ...prodFil, ...revFil].map((m) => m.id));
const receitaNaoMapeada = receitaBrutaMov.filter((m) => !receitaMapeada.has(m.id));
const receitaCalc = somaEfeito(receitaBrutaMov);

// ---------------- DEDUÇÕES ----------------
const devolucoes = selecionar((m) => m.codigo === "25943");
const ipiM = selecionar((m) => m.codigo === "2826");
const icmsM = selecionar((m) => m.codigo === "2827");
const icmsSt = selecionar((m) => m.codigo === "2832");
const icmsF = selecionar((m) => m.codigo === "25054");
const ipiF = selecionar((m) => m.codigo === "25055");
const pis = selecionar((m) => m.codigo === "2829");
const cofins = selecionar((m) => m.codigo === "2830");

export const tributosFederaisFilialDocumentados = {
  pisDebitoFilial: 4530.15,
  cofinsDebitoFilial: 20866.08,
  pisCreditoDevolucoesFilialIdentificado: 358.27,
  cofinsCreditoDevolucoesFilialIdentificado: 1650.21,
  pisLiquidoFilial: 4171.88,
  cofinsLiquidoFilial: 19215.87,
  fonte: "REGISTRO APURAÇÃO PIS(6).pdf + REEGISTRO APURAÇÃO COFINS(1).pdf + RELATORIO DEVOLUÇÕES(5).pdf",
} as const;

const pisDeb = somaDebitos(pis);
const pisCred = somaCreditos(pis);
const cofDeb = somaDebitos(cofins);
const cofCred = somaCreditos(cofins);
const pisFilialCalc = arred(tributosFederaisFilialDocumentados.pisDebitoFilial - tributosFederaisFilialDocumentados.pisCreditoDevolucoesFilialIdentificado);
const cofFilialCalc = arred(tributosFederaisFilialDocumentados.cofinsDebitoFilial - tributosFederaisFilialDocumentados.cofinsCreditoDevolucoesFilialIdentificado);
const pisMatrizDeb = arred(pisDeb - tributosFederaisFilialDocumentados.pisDebitoFilial);
const pisMatrizCred = arred(pisCred - tributosFederaisFilialDocumentados.pisCreditoDevolucoesFilialIdentificado);
const cofMatrizDeb = arred(cofDeb - tributosFederaisFilialDocumentados.cofinsDebitoFilial);
const cofMatrizCred = arred(cofCred - tributosFederaisFilialDocumentados.cofinsCreditoDevolucoesFilialIdentificado);
const pisMatrizCalc = arred(pisMatrizDeb - pisMatrizCred);
const cofMatrizCalc = arred(cofMatrizDeb - cofMatrizCred);

const pisMComp = composicaoManual({
  codigo: "2829", cc: "201", centroCusto: "MATRIZ / VENDAS", debitos: pisMatrizDeb, creditos: pisMatrizCred,
  valorLinha: pisMatrizCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "Parcela da matriz dentro da conta consolidada: débito total menos débito documental da filial; créditos de devolução também separados pela origem documental.",
});
const pisFComp = composicaoManual({
  codigo: "2829", cc: "502", centroCusto: "COMERCIAL SP", debitos: tributosFederaisFilialDocumentados.pisDebitoFilial, creditos: tributosFederaisFilialDocumentados.pisCreditoDevolucoesFilialIdentificado,
  valorLinha: pisFilialCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "PIS líquido da filial = débito fiscal da filial menos crédito real das devoluções. Não existe segundo lançamento técnico de PIS.",
});
const cofMComp = composicaoManual({
  codigo: "2830", cc: "201", centroCusto: "MATRIZ / VENDAS", debitos: cofMatrizDeb, creditos: cofMatrizCred,
  valorLinha: cofMatrizCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "Parcela da matriz dentro da conta consolidada: débito total menos débito documental da filial; créditos de devolução separados pela origem documental.",
});
const cofFComp = composicaoManual({
  codigo: "2830", cc: "502", centroCusto: "COMERCIAL SP", debitos: tributosFederaisFilialDocumentados.cofinsDebitoFilial, creditos: tributosFederaisFilialDocumentados.cofinsCreditoDevolucoesFilialIdentificado,
  valorLinha: cofFilialCalc, fonte: tributosFederaisFilialDocumentados.fonte,
  observacao: "COFINS líquido da filial = débito fiscal da filial menos crédito real das devoluções. Não existe segundo lançamento técnico de COFINS.",
});

const todasDeducoesMov = [...devolucoes, ...selecionar((m) => m.classificacao.startsWith("4.1.03"))];
const deducoesCalc = -somaEfeito(todasDeducoesMov);

// ---------------- CUSTOS / CPV / CMV ----------------
const cpvM = selecionar((m) => m.codigo === "25944");
const cpvF = selecionar((m) => m.codigo === "25945");
const cmvM = selecionar((m) => m.classificacao.startsWith("5.1") && m.cc !== "502");
const cmvF = selecionar((m) => m.classificacao.startsWith("5.1") && m.cc === "502");
const outrosCustos = selecionar((m) => m.classificacao.startsWith("4.2") && !["25944", "25945"].includes(m.codigo));
const custosMov = [...cpvM, ...cpvF, ...cmvM, ...cmvF, ...outrosCustos];
const custosCalc = -somaEfeito(custosMov);
const lucroBrutoCalc = arred(receitaCalc - deducoesCalc - custosCalc);

// ---------------- DESPESAS OPERACIONAIS ----------------
// 3093 é conta-ponte de matéria-prima e foi zerada no fechamento contra CPV; não é despesa operacional.
const operacionalPotencial = selecionar((m) =>
  (m.classificacao.startsWith("5.3") || m.classificacao.startsWith("5.7"))
  && m.codigo !== "3093"
  && !m.classificacao.startsWith("5.7.12"),
);

// A DRE enviada apresenta os créditos não cumulativos de PIS/COFINS sobre despesas em linhas próprias.
// Por isso retiramos somente essas pontas credoras dos buckets de despesa e as mostramos separadamente.
const creditosPisDesp = operacionalPotencial.filter((m) => m.origem === "APURAÇÃO PIS 06/2026" && m.credito > 0);
const creditosCofDesp = operacionalPotencial.filter((m) => m.origem === "APURAÇÃO COFINS 06/2026" && m.credito > 0);
const idsCreditosFederaisDesp = new Set([...creditosPisDesp, ...creditosCofDesp].map((m) => `${m.id}|${m.codigo}`));
const operacionalAntesCreditos = operacionalPotencial.filter((m) => !idsCreditosFederaisDesp.has(`${m.id}|${m.codigo}`));

const receitasFinanceiras = selecionar((m) => m.classificacao.startsWith("5.7.12") || m.classificacao.startsWith("4.1.05.001"));
const despesasFinanceiras = selecionar((m) => m.classificacao.startsWith("5.8"));

const ccProducao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10061", "19999"]);
const ccComercial = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const ccAdministrativo = new Set(["301", "302", "303", "304", "305", "306"]);

function texto(m: MovimentoResultado) {
  return `${m.descricao} ${m.historico} ${m.documento} ${m.fonte}`.toLocaleUpperCase("pt-BR");
}
function contem(m: MovimentoResultado, valor: string) {
  return texto(m).includes(valor);
}

const bucketsOperacionais: Record<string, MovimentoResultado[]> = {
  adm: [], nplog: [], comerciais: [], producao: [], veiculos: [], barracao: [], imobilizado: [], industrializacao: [], tributarias: [], "comercial-sp": [], "despesas-nao-mapeadas": [],
};

const bucket = (id: string): MovimentoResultado[] => (bucketsOperacionais[id] ??= []);

for (const movimento of operacionalAntesCreditos) {
  if (movimento.cc === "502") bucket("comercial-sp").push(movimento);
  else if (movimento.documento.startsWith("11.02.003") || contem(movimento, "NPLOG")) bucket("nplog").push(movimento);
  else if (movimento.classificacao.startsWith("5.7.05") || movimento.classificacao.startsWith("5.7.01.015")) bucket("veiculos").push(movimento);
  else if (movimento.classificacao.startsWith("5.7.01.009") || movimento.classificacao.startsWith("5.7.03.007")) bucket("barracao").push(movimento);
  else if (movimento.classificacao.startsWith("5.7.01.011")) bucket("imobilizado").push(movimento);
  else if (movimento.classificacao.startsWith("5.7.09")) bucket("tributarias").push(movimento);
  else if (movimento.codigo === "25937" || contem(movimento, "INDUSTRIALIZA")) bucket("industrializacao").push(movimento);
  else if (ccProducao.has(movimento.cc)) bucket("producao").push(movimento);
  else if (ccComercial.has(movimento.cc)) bucket("comerciais").push(movimento);
  else if (ccAdministrativo.has(movimento.cc) || movimento.classificacao.startsWith("5.7.03")) bucket("adm").push(movimento);
  else bucket("despesas-nao-mapeadas").push(movimento);
}

const despesasOpAntesCreditosCalc = -somaEfeito(operacionalAntesCreditos);
const receitasFinCalc = somaEfeito(receitasFinanceiras);
const despesasFinCalc = -somaEfeito(despesasFinanceiras);
const creditoPisCalc = -somaCreditos(creditosPisDesp);
const creditoCofCalc = -somaCreditos(creditosCofDesp);
const despesasAntesCreditosCalc = arred(despesasOpAntesCreditosCalc + despesasFinCalc - receitasFinCalc);
const despesasLiquidasCalc = arred(despesasAntesCreditosCalc + creditoPisCalc + creditoCofCalc);
const resultadoOperacionalCalc = arred(lucroBrutoCalc - despesasLiquidasCalc);

// ---------------- NÃO OPERACIONAL ----------------
const naoOperacional = selecionar((m) => m.classificacao.startsWith("5.9"));
const alienacao = naoOperacional.filter((m) => m.codigo === "4736" || contem(m, "ALIENA"));
const baixa = naoOperacional.filter((m) => !alienacao.includes(m) && (contem(m, "BAIXA") || contem(m, "CUSTO") && contem(m, "ALIENA")));
const recVinter = naoOperacional.filter((m) => !alienacao.includes(m) && !baixa.includes(m) && contem(m, "VINTER"));
const sinistros = naoOperacional.filter((m) => !alienacao.includes(m) && !baixa.includes(m) && contem(m, "SINISTR"));
const equivalencia = naoOperacional.filter((m) => contem(m, "EQUIVAL"));
const mapeadosNaoOp = new Set([...alienacao, ...baixa, ...recVinter, ...sinistros, ...equivalencia].map((m) => `${m.id}|${m.codigo}`));
const outrasNaoOp = naoOperacional.filter((m) => !mapeadosNaoOp.has(`${m.id}|${m.codigo}`));
const naoOpCalc = somaEfeito(naoOperacional);
const resultadoLiquidoCalc = arred(resultadoOperacionalCalc + naoOpCalc);

// ---------------- LINHAS ----------------
const linhasReceita: LinhaComparacaoDre[] = [
  linha({ id: "receita", nivel: 0, tipo: "grupo", calculado: receitaCalc, composicao: compor(receitaBrutaMov), criterio: "Movimento líquido das contas de receita bruta do Balancete 06/2026." }),
  linha({ id: "rec-matriz-prod", nivel: 1, tipo: "detalhe", calculado: somaEfeito(prodMat), composicao: compor(prodMat), criterio: "Contas de venda de produtos da matriz; CC 502 excluído." }),
  linha({ id: "rec-matriz-rev", nivel: 1, tipo: "detalhe", calculado: somaEfeito(revMat), composicao: compor(revMat), criterio: "Contas de venda de mercadorias/revenda da matriz; CC 502 excluído." }),
  linha({ id: "rec-serv", nivel: 1, tipo: "detalhe", calculado: somaEfeito(serv), composicao: compor(serv), criterio: "Prestação de serviços conforme conta de serviços do Balancete." }),
  linha({ id: "rec-filial-prod", nivel: 1, tipo: "detalhe", calculado: somaEfeito(prodFil), composicao: compor(prodFil), criterio: "Venda de produtos no CC 502. Se a DRE enviada classificou como produção e o fiscal como revenda, a diferença fica visível." }),
  linha({ id: "rec-filial-rev", nivel: 1, tipo: "detalhe", calculado: somaEfeito(revFil), composicao: compor(revFil), criterio: "Venda de mercadorias/revenda da filial conforme arquivos fiscais da filial." }),
  linha({ id: "receita-nao-mapeada", descricao: "Receitas brutas sem linha correspondente na DRE enviada", nivel: 1, tipo: "diagnostico", calculado: somaEfeito(receitaNaoMapeada), enviadoValor: 0, composicao: compor(receitaNaoMapeada), criterio: "Receitas existentes no Balancete sem linha específica no controle enviado." }),
];

const linhasDeducoes: LinhaComparacaoDre[] = [
  linha({ id: "deducoes", nivel: 0, tipo: "grupo", calculado: deducoesCalc, composicao: compor(todasDeducoesMov, -1), criterio: "Débitos menos créditos/reclassificações reais das contas de dedução do Balancete." }),
  linha({ id: "dev", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(devolucoes), composicao: compor(devolucoes, -1), criterio: "Devoluções documentadas na conta 25943." }),
  linha({ id: "desc", nivel: 1, tipo: "detalhe", calculado: 0, composicao: [], criterio: "Nenhum desconto concedido identificado nas contas movimentadas de junho." }),
  linha({ id: "ipi-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(ipiM), composicao: compor(ipiM, -1), criterio: "IPI da matriz líquido das devoluções documentadas." }),
  linha({ id: "icms-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(icmsM), composicao: compor(icmsM, -1), criterio: "ICMS da matriz líquido de devoluções e do ICMS de transferências internas reclassificado para CPV." }),
  linha({ id: "pis-m", nivel: 1, tipo: "detalhe", calculado: pisMatrizCalc, composicao: pisMComp, criterio: "Parcela líquida da matriz dentro da conta consolidada de PIS, separada documentalmente da filial." }),
  linha({ id: "cofins-m", nivel: 1, tipo: "detalhe", calculado: cofMatrizCalc, composicao: cofMComp, criterio: "Parcela líquida da matriz dentro da conta consolidada de COFINS, separada documentalmente da filial." }),
  linha({ id: "icms-st", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(icmsSt), composicao: compor(icmsSt, -1), criterio: "ICMS-ST conforme conta específica do Balancete." }),
  linha({ id: "icms-f", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(icmsF), composicao: compor(icmsF, -1), criterio: "ICMS da filial líquido de devoluções e do ICMS de transferência interna filial→matriz, que foi reclassificado para CPV." }),
  linha({ id: "ipi-f", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(ipiF), composicao: compor(ipiF, -1), criterio: "IPI da filial líquido dos créditos reais de devolução." }),
  linha({ id: "pis-f", nivel: 1, tipo: "detalhe", calculado: pisFilialCalc, composicao: pisFComp, criterio: "PIS da filial líquido do crédito de devoluções da própria filial." }),
  linha({ id: "cofins-f", nivel: 1, tipo: "detalhe", calculado: cofFilialCalc, composicao: cofFComp, criterio: "COFINS da filial líquido do crédito de devoluções da própria filial." }),
];

const linhasCustos: LinhaComparacaoDre[] = [
  linha({ id: "custos", nivel: 0, tipo: "grupo", calculado: custosCalc, composicao: compor(custosMov, -1), criterio: "Somente CPV/CMV e demais contas de custo efetivamente remanescentes. Contas 5.3 de despesa por CC não são mais misturadas no CPV." }),
  linha({ id: "cpv-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(cpvM), composicao: compor(cpvM, -1), criterio: "CPV Matriz calculado pelo estoque inicial + matéria-prima líquida + transferências/ICMS de transferência - estoque final - perda destacada. Não usa a DRE enviada como plug." }),
  linha({ id: "cmv-m", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(cmvM), composicao: compor(cmvM, -1), criterio: "Movimento líquido das contas 5.1 da matriz. Se a DRE enviada informa zero, a discrepância permanece para análise." }),
  linha({ id: "cpv-f", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(cpvF), composicao: compor(cpvF, -1), criterio: "CPV Filial pelo estoque inicial/final, transferências efetivamente recebidas/emitidas e ICMS das transferências." }),
  linha({ id: "cmv-f", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(cmvF), composicao: compor(cmvF, -1), criterio: "Movimento das contas 5.1 no CC 502, se houver." }),
  linha({ id: "outros-custos", descricao: "Outros custos sem linha específica na DRE enviada", nivel: 1, tipo: "diagnostico", calculado: -somaEfeito(outrosCustos), enviadoValor: 0, composicao: compor(outrosCustos, -1), criterio: "Demais contas 4.2 existentes no Balancete, sem reclassificação para forçar o controle." }),
  linha({ id: "lucro-bruto", nivel: 0, tipo: "resultado", calculado: lucroBrutoCalc, composicao: [], criterio: "Receita calculada - deduções calculadas - custos calculados." }),
];

const linhasOperacionais: LinhaComparacaoDre[] = [
  linha({ id: "despesas", nivel: 0, tipo: "grupo", calculado: despesasAntesCreditosCalc, composicao: compor([...operacionalAntesCreditos, ...despesasFinanceiras, ...receitasFinanceiras], -1), criterio: "Despesas operacionais antes dos créditos PIS/COFINS, incluindo resultado financeiro líquido, conforme estrutura da DRE enviada." }),
  ...(["adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp"] as const).map((id) => linha({
    id,
    nivel: 1,
    tipo: "detalhe",
    calculado: -somaEfeito(bucketsOperacionais[id]),
    composicao: compor(bucketsOperacionais[id], -1),
    criterio: id === "industrializacao"
      ? "Industrialização identificada pela conta 25937/natureza documental. Créditos PIS/COFINS são mostrados abaixo, não escondidos dentro da despesa."
      : `Contas e centros de custo do Balancete classificados na linha ${id}; créditos PIS/COFINS são apresentados separadamente.`,
  })),
  linha({ id: "despesas-nao-mapeadas", descricao: "Despesas operacionais sem linha correspondente", nivel: 1, tipo: "diagnostico", calculado: -somaEfeito(bucketsOperacionais["despesas-nao-mapeadas"]), enviadoValor: 0, composicao: compor(bucketsOperacionais["despesas-nao-mapeadas"], -1), criterio: "Movimentos 5.3/5.7 que ainda não têm linha segura no formato da DRE enviada." }),
  linha({ id: "fin-liq", nivel: 1, tipo: "detalhe", calculado: arred(despesasFinCalc - receitasFinCalc), composicao: compor([...despesasFinanceiras, ...receitasFinanceiras], -1), criterio: "Despesas financeiras menos receitas financeiras do Balancete." }),
  linha({ id: "fin-desp", nivel: 2, tipo: "detalhe", calculado: despesasFinCalc, composicao: compor(despesasFinanceiras, -1), criterio: "Contas 5.8 — despesas financeiras, incluindo JCP quando contabilizado em conta financeira." }),
  linha({ id: "fin-rec", nivel: 2, tipo: "detalhe", calculado: -receitasFinCalc, composicao: compor(receitasFinanceiras, -1), criterio: "Receitas financeiras do Balancete apresentadas como redutoras das despesas financeiras." }),
  linha({ id: "credito-pis", nivel: 1, tipo: "detalhe", calculado: creditoPisCalc, composicao: compor(creditosPisDesp, -1), criterio: "Somente créditos reais de PIS das apurações que reduziram contas 5.3/5.7 de despesas. Não usa residual técnico." }),
  linha({ id: "credito-cofins", nivel: 1, tipo: "detalhe", calculado: creditoCofCalc, composicao: compor(creditosCofDesp, -1), criterio: "Somente créditos reais de COFINS das apurações que reduziram contas 5.3/5.7 de despesas. Não usa residual técnico." }),
  linha({ id: "despesas-liquidas", nivel: 0, tipo: "resultado", calculado: despesasLiquidasCalc, composicao: [], criterio: "Despesas antes dos créditos + créditos PIS/COFINS apresentados com sinal redutor." }),
  linha({ id: "resultado-op", nivel: 0, tipo: "resultado", calculado: resultadoOperacionalCalc, composicao: [], criterio: "Lucro bruto calculado - despesas operacionais líquidas calculadas." }),
];

const linhasNaoOperacionais: LinhaComparacaoDre[] = [
  linha({ id: "nao-op", nivel: 0, tipo: "grupo", calculado: naoOpCalc, composicao: compor(naoOperacional), criterio: "Movimento líquido das contas 5.9 do Balancete." }),
  linha({ id: "alienacao", nivel: 1, tipo: "detalhe", calculado: somaEfeito(alienacao), composicao: compor(alienacao), criterio: "Receita de alienação efetivamente contabilizada. Não é usado o valor enviado para criar lançamento." }),
  linha({ id: "baixa", nivel: 1, tipo: "detalhe", calculado: -somaEfeito(baixa), composicao: compor(baixa, -1), criterio: "Custo/baixa de imobilizado encontrado nas contas 5.9, se houver." }),
  linha({ id: "prov-ant", nivel: 1, tipo: "detalhe", calculado: 0, composicao: [], criterio: "Nenhum lançamento de junho identificado com essa natureza; não criar provisão pela DRE de controle." }),
  linha({ id: "prov-abr", nivel: 1, tipo: "detalhe", calculado: 0, composicao: [], criterio: "Nenhum lançamento de junho identificado com essa natureza; não criar provisão pela DRE de controle." }),
  linha({ id: "rec-vinter", nivel: 1, tipo: "detalhe", calculado: somaEfeito(recVinter), composicao: compor(recVinter), criterio: "Recuperação Vinter somente se houver conta/lancamento de junho identificado." }),
  linha({ id: "sinistros", nivel: 1, tipo: "detalhe", calculado: somaEfeito(sinistros), composicao: compor(sinistros), criterio: "Ganhos/perdas com sinistros somente quando existentes no Balancete." }),
  linha({ id: "outras", nivel: 1, tipo: "detalhe", calculado: somaEfeito(outrasNaoOp), composicao: compor(outrasNaoOp), criterio: "Demais contas não operacionais reais não enquadradas nas linhas anteriores." }),
  linha({ id: "equiv", nivel: 1, tipo: "detalhe", calculado: somaEfeito(equivalencia), composicao: compor(equivalencia), criterio: "Equivalência patrimonial somente quando houver movimento na conta correspondente." }),
  linha({ id: "lucro-liq", nivel: 0, tipo: "resultado", calculado: resultadoLiquidoCalc, composicao: [], criterio: "Resultado operacional calculado + resultado não operacional calculado." }),
  linha({ id: "base-ir", nivel: 0, tipo: "diagnostico", calculado: 0, composicao: [], criterio: "Base de IRPJ/CSLL não é saldo direto da DRE contábil: depende dos ajustes fiscais/LALUR. A referência enviada não gera lançamento contábil." }),
  linha({ id: "ajuste-jul", nivel: 0, tipo: "diagnostico", calculado: 0, composicao: [], criterio: "Ajuste indicado para 07/2026 não pertence ao Razão de junho e não é trazido para o Balancete 30/06." }),
];

export const comparacaoDreDetalhada: LinhaComparacaoDre[] = [
  ...linhasReceita,
  ...linhasDeducoes,
  ...linhasCustos,
  ...linhasOperacionais,
  ...linhasNaoOperacionais,
];

export const resumoDreDetalhada = {
  receitaCalculada: receitaCalc,
  deducoesCalculadas: deducoesCalc,
  custosCalculados: custosCalc,
  despesasAntesCreditosCalculadas: despesasAntesCreditosCalc,
  creditoPisDespesas: creditoPisCalc,
  creditoCofinsDespesas: creditoCofCalc,
  despesasLiquidasCalculadas: despesasLiquidasCalc,
  resultadoOperacionalCalculado: resultadoOperacionalCalc,
  resultadoLiquidoCalculado: resultadoLiquidoCalc,
  resultadoLiquidoEnviado: enviado("lucro-liq"),
  diferencaResultado: arred(resultadoLiquidoCalc - enviado("lucro-liq")),
  linhasComDiferenca: comparacaoDreDetalhada.filter((item) => Math.abs(item.diferenca) > 0.01).length,
  totalLinhas: comparacaoDreDetalhada.length,
} as const;
