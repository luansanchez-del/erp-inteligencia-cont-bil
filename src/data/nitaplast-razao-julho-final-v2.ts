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
const ehProvisaoEstimadaJulho = (id: string) => id.startsWith("JUL-PROV-M-") || id.startsWith("JUL-PROV-F-");

// Auditoria de 18/08/2026: linhas consolidadas/substituídas por evidência documental mais granular.
// Não são plugs: os totais de PIS/COFINS e ICMS permanecem conciliados às apurações oficiais.
const idsSubstituidosAuditoria = new Set([
  "JUL-TAX-PIS",
  "JUL-TAX-COF",
  "JUL-ICMS-F-DEB",
  "JUL-PIS-CRED-07",
  "JUL-PIS-CRED-10",
  "JUL-COF-CRED-07",
  "JUL-COF-CRED-10",
]);

// Correções documentais da movimentação financeira, sem alterar a fonte bruta.
const lancamentosBaseSaneados = lancamentosBaseJulhoFinal
  .filter((x) => !ehProvisaoEstimadaJulho(x.id) && !idsSubstituidosAuditoria.has(x.id))
  .map((x): LancamentoIntegrado => {
    // A soma fiscal externa correta da produção da Matriz é R$ 3.443.785,35.
    // O valor anterior duplicava CFOP 5401 + 6401 (R$ 5.352,06).
    if (x.id === "JUL-REC-M-PROD") {
      return {
        ...x,
        valor: 3443785.35,
        observacao: "Receita de produção da Matriz corrigida pela soma dos CFOPs externos: 5101 + 6101 + 5401 + 6401 + 7101 + 7127. Valor anterior duplicava R$ 5.352,06 de 5401/6401.",
        fonte: "RESUMO NOTAS FISCAIS SAÍDA 07/2026 + EFD Fiscal 07/2026",
      };
    }
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

  const ehPis = linha.origem === "APURAÇÃO PIS 07/2026";
  const ehCofins = linha.origem === "APURAÇÃO COFINS 07/2026";

  // O EFD Contribuições identifica 1102 e 1202 na Filial SP. Preservar isso no Razão.
  if ((ehPis || ehCofins) && (linha.documento === "CFOP 1102" || linha.documento === "CFOP 1202")) {
    linha = { ...linha, cc: "502", centroCusto: "COMERCIAL SP" };
  }

  // Quando o crédito reduz uma conta produtiva, ele herda o centro da própria
  // natureza para reduzir o mesmo grupo na DRE, sem virar linha autônoma.
  if (ehPis || ehCofins) {
    if (linha.creditoCodigo === "3494" || linha.creditoCodigo === "25937" || linha.creditoCodigo === "3093") {
      linha = { ...linha, cc: "102", centroCusto: "PRODUÇÃO" };
    } else if (linha.creditoCodigo === "3095") {
      linha = { ...linha, cc: "109", centroCusto: "COMPRAS" };
    }
  }

  // Os créditos recuperáveis permanecem vinculados à conta de custo/despesa
  // identificada pelo CFOP (MP, industrialização, frete ou energia). Assim eles
  // reduzem a própria natureza que os originou e não viram uma linha autônoma na DRE.

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

// Linhas comprovadas na auditoria do EFD Contribuições/EFD Fiscal.
const lancamentosAuditoriaJulho: LancamentoIntegrado[] = [
  // Débitos de PIS/COFINS segregados por estabelecimento; totais consolidados preservados.
  {
    id: "JUL-TAX-PIS-M", data: "31/07/2026", origem: "EFD CONTRIBUIÇÕES 07/2026",
    debitoCodigo: "2829", debito: nomeConta("2829"), creditoCodigo: "1556", credito: nomeConta("1556"),
    historico: "PIS sobre saídas - Matriz", documento: "EFD CONTRIBUIÇÕES / CNPJ 82.295.817/0001-07",
    cc: "201", centroCusto: "VENDAS", valor: 43082.61, status: "validado",
    observacao: "Parcela exata da Matriz apurada por estabelecimento no EFD Contribuições; compõe o total consolidado de R$ 49.820,30.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },
  {
    id: "JUL-TAX-PIS-F", data: "31/07/2026", origem: "EFD CONTRIBUIÇÕES 07/2026",
    debitoCodigo: "2829", debito: nomeConta("2829"), creditoCodigo: "1556", credito: nomeConta("1556"),
    historico: "PIS sobre saídas - Filial SP", documento: "EFD CONTRIBUIÇÕES / CNPJ 82.295.817/0003-60",
    cc: "502", centroCusto: "COMERCIAL SP", valor: 6737.69, status: "validado",
    observacao: "Parcela exata da Filial SP apurada por estabelecimento no EFD Contribuições; compõe o total consolidado de R$ 49.820,30.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },
  {
    id: "JUL-TAX-COF-M", data: "31/07/2026", origem: "EFD CONTRIBUIÇÕES 07/2026",
    debitoCodigo: "2830", debito: nomeConta("2830"), creditoCodigo: "1552", credito: nomeConta("1552"),
    historico: "COFINS sobre saídas - Matriz", documento: "EFD CONTRIBUIÇÕES / CNPJ 82.295.817/0001-07",
    cc: "201", centroCusto: "VENDAS", valor: 198442.47, status: "validado",
    observacao: "Parcela exata da Matriz apurada por estabelecimento no EFD Contribuições; compõe o total consolidado de R$ 229.476,68.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },
  {
    id: "JUL-TAX-COF-F", data: "31/07/2026", origem: "EFD CONTRIBUIÇÕES 07/2026",
    debitoCodigo: "2830", debito: nomeConta("2830"), creditoCodigo: "1552", credito: nomeConta("1552"),
    historico: "COFINS sobre saídas - Filial SP", documento: "EFD CONTRIBUIÇÕES / CNPJ 82.295.817/0003-60",
    cc: "502", centroCusto: "COMERCIAL SP", valor: 31034.21, status: "validado",
    observacao: "Parcela exata da Filial SP apurada por estabelecimento no EFD Contribuições; compõe o total consolidado de R$ 229.476,68.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },

  // ICMS Filial: a apuração total mistura venda externa e transferência interna.
  {
    id: "JUL-ICMS-F-DEB-EXT", data: "31/07/2026", origem: "APURAÇÃO ICMS FILIAL 07/2026",
    debitoCodigo: "25054", debito: nomeConta("25054"), creditoCodigo: "25235", credito: nomeConta("25235"),
    historico: "ICMS das saídas externas da Filial SP - CFOP 5102/5123/6102", documento: "ICMS FILIAL EXTERNO 07/2026",
    cc: "502", centroCusto: "COMERCIAL SP", valor: 81047.03, status: "validado",
    observacao: "Débito externo exato. Não inclui R$ 3.894,05 de ICMS sobre transferências internas.", rastreio: "documento", fonte: "REGISTRO APURAÇÃO ICMS FILIAL 07/2026",
  },
  {
    id: "JUL-ICMS-F-DEB-TRANSF", data: "31/07/2026", origem: "APURAÇÃO ICMS FILIAL 07/2026 - TRANSFERÊNCIA INTERNA",
    debitoCodigo: "25054", debito: nomeConta("25054"), creditoCodigo: "25235", credito: nomeConta("25235"),
    historico: "ICMS sobre transferências internas da Filial SP - CFOP 6151/6557", documento: "ICMS FILIAL TRANSFERÊNCIAS 07/2026",
    cc: "502", centroCusto: "COMERCIAL SP", valor: 3894.05, status: "validado",
    observacao: "Parcela interna identificada documentalmente. O plano de contas atual não possui mais a conta analítica \"(-) ICMS TRANSFERÊNCIA - FILIAL\" que existia até maio/2026 (ver nitaplast-filial-junho.ts); confirmado o lançamento contra 25235 - ICMS a recolher - Filial SP, a conta patrimonial disponível para esta obrigação. Não deve compor dedução de vendas na DRE.", rastreio: "derivado", fonte: "REGISTRO APURAÇÃO ICMS FILIAL 07/2026",
  },

  // Crédito de transporte: o EFD permite segregar o estabelecimento, embora a origem CFOP 1352/2352 esteja agregada.
  {
    id: "JUL-PIS-CRED-TRANSP-M", data: "31/07/2026", origem: "APURAÇÃO PIS 07/2026",
    debitoCodigo: "1556", debito: nomeConta("1556"), creditoCodigo: "4253", credito: nomeConta("4253"),
    historico: "Crédito PIS sobre transportes - Matriz", documento: "EFD CONTRIBUIÇÕES D010 - MATRIZ",
    cc: "201", centroCusto: "VENDAS", valor: 1701.85, status: "validado",
    observacao: "Total exato de créditos de transporte da Matriz no EFD; reduz a despesa de fretes sem criar linha autônoma na DRE.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },
  {
    id: "JUL-PIS-CRED-TRANSP-F", data: "31/07/2026", origem: "APURAÇÃO PIS 07/2026",
    debitoCodigo: "1556", debito: nomeConta("1556"), creditoCodigo: "4253", credito: nomeConta("4253"),
    historico: "Crédito PIS sobre transportes - Filial SP", documento: "EFD CONTRIBUIÇÕES D010 - FILIAL SP",
    cc: "502", centroCusto: "COMERCIAL SP", valor: 166.34, status: "validado",
    observacao: "Total exato de créditos de transporte da Filial SP no EFD.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },
  {
    id: "JUL-COF-CRED-TRANSP-M", data: "31/07/2026", origem: "APURAÇÃO COFINS 07/2026",
    debitoCodigo: "1552", debito: nomeConta("1552"), creditoCodigo: "4253", credito: nomeConta("4253"),
    historico: "Crédito COFINS sobre transportes - Matriz", documento: "EFD CONTRIBUIÇÕES D010 - MATRIZ",
    cc: "201", centroCusto: "VENDAS", valor: 7838.65, status: "validado",
    observacao: "Total exato de créditos de transporte da Matriz no EFD; reduz a despesa de fretes sem criar linha autônoma na DRE.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },
  {
    id: "JUL-COF-CRED-TRANSP-F", data: "31/07/2026", origem: "APURAÇÃO COFINS 07/2026",
    debitoCodigo: "1552", debito: nomeConta("1552"), creditoCodigo: "4253", credito: nomeConta("4253"),
    historico: "Crédito COFINS sobre transportes - Filial SP", documento: "EFD CONTRIBUIÇÕES D010 - FILIAL SP",
    cc: "502", centroCusto: "COMERCIAL SP", valor: 766.17, status: "validado",
    observacao: "Total exato de créditos de transporte da Filial SP no EFD.", rastreio: "documento", fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT 07/2026",
  },
];


const pendenciasBancariasValorAjustado = arred(
  lancamentosBaseCorrigidos
    .filter((x) => x.origem.startsWith("MOVIMENTAÇÃO BANCÁRIA") && x.status === "revisar")
    .reduce((total, x) => total + x.valor, 0),
);

export const lancamentosIntegradosJulhoFinal: LancamentoIntegrado[] = [
  ...lancamentosBaseCorrigidos,
  ...lancamentosAuditoriaJulho,
  ...lancamentosProvisoesJulhoReais,
  ...lancamentosFinanceirosJulho,
];

export const totalDebitosJulhoFinal = arred(lancamentosIntegradosJulhoFinal.reduce((s, x) => s + x.valor, 0));
export const totalCreditosJulhoFinal = totalDebitosJulhoFinal;
export const pendenciasJulhoFinal = lancamentosIntegradosJulhoFinal.filter((x) => x.status === "revisar");

const itensMantidosForaPorDecisao = [
  ...resumoBaseJulhoFinal.itensMantidosForaPorDecisao.filter((item) => item !== "JCP" && item !== "Variação cambial"),
  "Alienação de imobilizado: R$ 306.900,00 em NFs válidas de julho aguardando identificação do custo original e da depreciação acumulada dos 3 bens; não reconhecer ganho por aproximação.",
];

export const resumoFechamentoJulhoFinal = {
  ...resumoBaseJulhoFinal,
  lancamentos: lancamentosIntegradosJulhoFinal.length,
  debitos: totalDebitosJulhoFinal,
  creditos: totalCreditosJulhoFinal,
  pendencias: pendenciasJulhoFinal.length,
  pendenciasBancariasValor: pendenciasBancariasValorAjustado,
  itensMantidosForaPorDecisao,
  criterioContabil: "Fato/documento real → Razão → Balancete → DRE. Nenhum valor é criado a partir da DRE para fechar diferença.",
  auditoria18Ago: {
    receitaProducaoMatrizFiscal: 3443785.35,
    duplaContagemCorrigidaCfop5401e6401: 5352.06,
    pisMatriz: 43082.61,
    pisFilial: 6737.69,
    cofinsMatriz: 198442.47,
    cofinsFilial: 31034.21,
    icmsFilialExternoBruto: 81047.03,
    icmsFilialTransferencias: 3894.05,
    icmsFilialDevolucao: 336.32,
    icmsFilialDreLiquidoEsperado: 80710.71,
    vendasAtivoImobilizadoFiscais: 306900,
    baixaImobilizadoPendente: true,
    nfCanceladaNuncaContabilizar: "93567",
  },
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

const creditoFederalEmContaAutonoma = lancamentosIntegradosJulhoFinal.find(
  (x) => (x.origem === "APURAÇÃO PIS 07/2026" || x.origem === "APURAÇÃO COFINS 07/2026")
    && (x.creditoCodigo === "25946" || x.creditoCodigo === "25947"),
);
if (creditoFederalEmContaAutonoma) throw new Error(`Crédito federal permaneceu em linha autônoma da DRE: ${creditoFederalEmContaAutonoma.id}`);

const receitaMatrizAuditada = lancamentosIntegradosJulhoFinal.find((x) => x.id === "JUL-REC-M-PROD");
if (!receitaMatrizAuditada || Math.abs(receitaMatrizAuditada.valor - 3443785.35) > 0.01) {
  throw new Error("Receita de produção da Matriz não está conciliada à soma fiscal auditada.");
}
const pisDebitosAuditados = arred(lancamentosIntegradosJulhoFinal.filter((x) => x.id === "JUL-TAX-PIS-M" || x.id === "JUL-TAX-PIS-F").reduce((s, x) => s + x.valor, 0));
if (Math.abs(pisDebitosAuditados - 49820.30) > 0.01) throw new Error("PIS Matriz + Filial não concilia ao EFD.");
const cofinsDebitosAuditados = arred(lancamentosIntegradosJulhoFinal.filter((x) => x.id === "JUL-TAX-COF-M" || x.id === "JUL-TAX-COF-F").reduce((s, x) => s + x.valor, 0));
if (Math.abs(cofinsDebitosAuditados - 229476.68) > 0.01) throw new Error("COFINS Matriz + Filial não concilia ao EFD.");
