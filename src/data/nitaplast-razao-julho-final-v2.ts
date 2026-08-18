import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import {
  lancamentosIntegradosJulhoFinal as lancamentosBaseJulhoFinal,
  totalDebitosJulhoFinal as totalDebitosBaseJulhoFinal,
  totalCreditosJulhoFinal as totalCreditosBaseJulhoFinal,
  pendenciasJulhoFinal as pendenciasBaseJulhoFinal,
  resumoFechamentoJulhoFinal as resumoBaseJulhoFinal,
} from "./nitaplast-razao-julho-final-base";
import { lancamentosFinanceirosJulho, resumoFinanceiroJulho } from "./nitaplast-financeiro-julho";
import { lancamentosProvisoesJulhoReais, resumoProvisoesJulhoReais } from "./nitaplast-provisoes-julho-reais";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const arred = (v: number) => Math.round(v * 100) / 100;
const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

// A primeira versão da folha de julho calculava férias/13º por salário ÷ 12.
// Com os relatórios contínuos reais recebidos, essas estimativas não podem permanecer no Razão.
// Mantemos todos os demais fatos da folha e substituímos somente as apropriações estimadas.
const ehProvisaoEstimadaJulho = (id: string) => id.startsWith("JUL-PROV-M-") || id.startsWith("JUL-PROV-F-");

// Correções documentais da movimentação financeira, sem alterar a fonte bruta:
// - conta 4548 não existe no plano: seguro HDI permanece na Conta Transitória 4859 para revisão;
// - R$ 25.000,00 identificado pelo usuário como Adiantamento de Lucros MVS deixa a transitória e vai para 4898.
const lancamentosBaseSaneados = lancamentosBaseJulhoFinal
  .filter((x) => !ehProvisaoEstimadaJulho(x.id))
  .map((x): LancamentoIntegrado => {
    if (x.id === "JUL-BAN-OP-048") {
      return {
        ...x,
        debitoCodigo: "4859",
        debito: nomeConta("4859"),
        historico: "SEGURO HDI - CONTA TRANSITÓRIA",
        status: "revisar",
        observacao: "A conta 4548 indicada na base auxiliar não existe no plano contábil. Valor mantido em 4859 - Conta Transitória até definição da conta analítica de seguros, preservando a origem bancária.",
        rastreio: "sugerido",
      };
    }
    if (x.id === "JUL-BAN-OP-050") {
      return {
        ...x,
        debitoCodigo: "4898",
        debito: nomeConta("4898"),
        historico: "ADIANTAMENTO DE LUCROS MVS - TRANSFERÊNCIA DE R$ 25.000,00",
        status: "validado",
        observacao: "Movimento identificado na movimentação financeira como operação com MVS. Classificado em Adiantamento de Lucros; transferências e estornos permanecem rastreáveis na fonte bancária. Sem efeito na DRE.",
        rastreio: "documento",
      };
    }
    return x;
  });

/*
 * Saneamento estrutural de julho.
 * Esta camada corrige a classificação ANTES do Balancete/DRE. Nenhum valor nasce
 * na apresentação gerencial: primeiro corrigimos o Razão e só depois os relatórios
 * consomem o mesmo conjunto de partidas.
 */
const centrosNormalizados: Record<string, { cc: string; centroCusto: string }> = {
  "10058": { cc: "10057", centroCusto: "COMPRESSOR 03 PUMA 30HP" },
  "10061": { cc: "10060", centroCusto: "EMPILHADEIRA A COMBUSTÃO DE 2,5 TON" },
};
const contasCreditoFederalCustosDespesas = new Set(["3093", "25937", "3095", "3494"]);

function sanearRazaoJulho(x: LancamentoIntegrado): LancamentoIntegrado {
  let linha: LancamentoIntegrado = { ...x };

  const centro = centrosNormalizados[linha.cc];
  if (centro) linha = { ...linha, cc: centro.cc, centroCusto: centro.centroCusto };

  // Despachantes aduaneiros: a natureza documental prevalece sobre uma conta genérica.
  if (linha.documento?.startsWith("11.04.014") && linha.cc === "206") {
    linha = {
      ...linha,
      debitoCodigo: "25072",
      debito: nomeConta("25072"),
      historico: `${linha.historico} - EXPORTAÇÃO`,
      observacao: `${linha.observacao ?? ""} Classificado em Despesas com Exportação pelo gerencial 11.04.014 / CC 206.`.trim(),
    };
  } else if (linha.documento?.startsWith("11.04.014") && linha.cc === "209") {
    linha = {
      ...linha,
      debitoCodigo: "25070",
      debito: nomeConta("25070"),
      observacao: `${linha.observacao ?? ""} Classificado em Despesas com Importação pelo gerencial 11.04.014 / CC 209.`.trim(),
    };
  }

  // PIS/COFINS sobre custos e despesas: o crédito fiscal continua exatamente o
  // mesmo, mas deixa de gerar saldos credores artificiais em MP/industrialização/
  // fretes/energia e passa às contas redutoras próprias do plano.
  const ehPis = linha.origem === "APURAÇÃO PIS 07/2026";
  const ehCofins = linha.origem === "APURAÇÃO COFINS 07/2026";
  if ((ehPis || ehCofins) && contasCreditoFederalCustosDespesas.has(linha.creditoCodigo)) {
    const contaRedutora = ehPis ? "25946" : "25947";
    const tributo = ehPis ? "PIS" : "COFINS";
    linha = {
      ...linha,
      creditoCodigo: contaRedutora,
      credito: nomeConta(contaRedutora),
      historico: `Crédito ${tributo} sobre custos e despesas - ${linha.documento}`,
      cc: "0",
      centroCusto: "SEM CENTRO DE CUSTO",
      observacao: `Reclassificação do mesmo crédito fiscal para ${contaRedutora} - ${nomeConta(contaRedutora)}. Sem criação de crédito e sem distribuição de CC por aproximação. Origem anterior: ${x.creditoCodigo}.`,
      rastreio: "derivado",
    };
  }

  // 11.90.001 possui casos em que a conciliação é apenas inferida. Não tratar
  // como frete de matéria-prima validado quando a evidência documental é insuficiente.
  if (linha.documento?.startsWith("11.90.001")) {
    linha = {
      ...linha,
      status: "revisar",
      rastreio: "sugerido",
      observacao: `${linha.observacao ?? ""} Frete compras mantido em revisão: não forçar natureza de matéria-prima sem vínculo documental suficiente.`.trim(),
    };
  }

  return linha;
}

const lancamentosBaseCorrigidos = lancamentosBaseSaneados.map(sanearRazaoJulho);

const pendenciasBancariasValorAjustado = arred(
  lancamentosBaseCorrigidos
    .filter((x) => x.origem.startsWith("MOVIMENTAÇÃO BANCÁRIA") && x.status === "revisar")
    .reduce((total, x) => total + x.valor, 0),
);

export const lancamentosIntegradosJulhoFinal: LancamentoIntegrado[] = [
  ...lancamentosBaseCorrigidos,
  ...lancamentosProvisoesJulhoReais,
  ...lancamentosFinanceirosJulho,
];

export const totalDebitosJulhoFinal = arred(lancamentosIntegradosJulhoFinal.reduce((s, x) => s + x.valor, 0));
export const totalCreditosJulhoFinal = totalDebitosJulhoFinal;
export const pendenciasJulhoFinal = lancamentosIntegradosJulhoFinal.filter((x) => x.status === "revisar");

const itensMantidosForaPorDecisao = resumoBaseJulhoFinal.itensMantidosForaPorDecisao.filter(
  (item) => item !== "JCP" && item !== "Variação cambial",
);

export const resumoFechamentoJulhoFinal = {
  ...resumoBaseJulhoFinal,
  lancamentos: lancamentosIntegradosJulhoFinal.length,
  debitos: totalDebitosJulhoFinal,
  creditos: totalCreditosJulhoFinal,
  pendencias: pendenciasJulhoFinal.length,
  pendenciasBancariasValor: pendenciasBancariasValorAjustado,
  itensMantidosForaPorDecisao,
  criterioContabil: "Fato/documento real → Razão → Balancete → DRE. Nenhum valor é criado a partir da DRE para fechar diferença.",
  financeiro: resumoFinanceiroJulho,
  folhaJulho: {
    ...resumoBaseJulhoFinal.folhaJulho,
    provisoes: {
      ferias: resumoProvisoesJulhoReais.consolidado.feriasPrincipal,
      encargosFerias: resumoProvisoesJulhoReais.consolidado.feriasEncargos,
      decimoTerceiro: resumoProvisoesJulhoReais.consolidado.decimoPrincipal,
      encargosDecimoTerceiro: resumoProvisoesJulhoReais.consolidado.decimoEncargos,
      totalFerias: resumoProvisoesJulhoReais.consolidado.feriasTotal,
      totalDecimoTerceiro: resumoProvisoesJulhoReais.consolidado.decimoTotal,
      metodo: resumoProvisoesJulhoReais.metodo,
      fonte: resumoProvisoesJulhoReais.fonte,
      matriz: resumoProvisoesJulhoReais.matriz,
      filial: resumoProvisoesJulhoReais.filial,
    },
  },
  baseAnterior: {
    debitos: totalDebitosBaseJulhoFinal,
    creditos: totalCreditosBaseJulhoFinal,
    pendencias: pendenciasBaseJulhoFinal.length,
  },
} as const;

const provisaoEstimadaRestante = lancamentosIntegradosJulhoFinal.find((x) => ehProvisaoEstimadaJulho(x.id));
if (provisaoEstimadaRestante) throw new Error(`Provisão estimada indevida permaneceu no Razão de julho: ${provisaoEstimadaRestante.id}`);

const contaInexistente4548 = lancamentosIntegradosJulhoFinal.find((x) => x.debitoCodigo === "4548" || x.creditoCodigo === "4548");
if (contaInexistente4548) throw new Error(`Conta inexistente 4548 permaneceu no Razão de julho: ${contaInexistente4548.id}`);

const cambioSemRastreio = lancamentosIntegradosJulhoFinal.find(
  (x) => x.origem.startsWith("CONTRATO DE CÂMBIO") && (!x.documento || !x.fonte),
);
if (cambioSemRastreio) throw new Error(`Lançamento cambial sem documento/fonte: ${cambioSemRastreio.id}`);

const exportacaoEmImportacao = lancamentosIntegradosJulhoFinal.find(
  (x) => x.documento?.startsWith("11.04.014") && x.cc === "206" && x.debitoCodigo === "25070",
);
if (exportacaoEmImportacao) throw new Error(`Despachante de exportação permaneceu em importação: ${exportacaoEmImportacao.id}`);

const creditoFederalEmContaOrigem = lancamentosIntegradosJulhoFinal.find(
  (x) => (x.origem === "APURAÇÃO PIS 07/2026" || x.origem === "APURAÇÃO COFINS 07/2026")
    && contasCreditoFederalCustosDespesas.has(x.creditoCodigo),
);
if (creditoFederalEmContaOrigem) throw new Error(`Crédito federal de custo/despesa permaneceu em conta de origem: ${creditoFederalEmContaOrigem.id}`);
