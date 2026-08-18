import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { entradasCcAgregadasJulho, resumoEntradasCcAgregadasJulho, type EntradaCcAgregadaJulho } from "./nitaplast-entradas-cc-julho-fonte";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { lancamentosBancariosSegurosJulho, resumoIntegracaoBancariaJulho } from "./nitaplast-bancos-julho-completo";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const arred = (valor: number) => Math.round(valor * 100) / 100;

const ccProducao = new Set(["101","102","103","104","105","106","107","108","109","110","111","503","10014","10032","10058","19999"]);
const ccComercial = new Set(["201","202","203","204","205","206","207","209","210"]);
const ccAdministrativo = new Set(["301","302","303","304","305","306"]);

type MapeamentoEntrada = { debitoCodigo: string; creditoCodigo: string; status: "validado" | "revisar"; observacao?: string };

/**
 * A fonte Softdib permanece bruta. Esta camada saneia somente os lançamentos contábeis,
 * usando CFOP/documento para impedir retorno, transferência e entrada sem valor comercial
 * de virarem nova despesa ou nova obrigação com fornecedor.
 */
function sanearEntradaCcJulho(linha: EntradaCcAgregadaJulho): EntradaCcAgregadaJulho | null {
  if (linha.gerencial === "11.01.002" && linha.cc === "102") return null;
  if (linha.gerencial === "15.02.015" && linha.cc === "102") return null;
  if (linha.gerencial === "11.02.001" && linha.cc === "101") return null;
  if (linha.gerencial === "11.02.001" && linha.cc === "503") return { ...linha, valor: 973.00, documentos: 1 };
  if (linha.gerencial === "11.01.003" && linha.cc === "102") return { ...linha, valor: 1225461.78, documentos: 9 };
  if (linha.gerencial === "15.02.015" && linha.cc === "101") return { ...linha, valor: 5082.80, documentos: 1 };
  if (linha.gerencial === "15.02.015" && linha.cc === "305") return { ...linha, valor: 680.73, documentos: 4 };
  return linha;
}

function mapearEntrada(gerencial: string, cc: string): MapeamentoEntrada | null | "duplicado-fiscal" {
  if (gerencial === "11.01.008") return "duplicado-fiscal";
  if (gerencial === "11.01.001" && cc === "201") return { debitoCodigo: "25135", creditoCodigo: "1496", status: "revisar", observacao: "Mesmo gerencial/CC corrigido para estoque no fechamento de junho; fornecedor analítico ainda precisa ser confirmado em julho." };
  if (gerencial === "11.01.002") {
    if (cc === "201") return { debitoCodigo: "25135", creditoCodigo: "1496", status: "revisar", observacao: "Mesmo gerencial/CC corrigido para estoque em junho; manter em revisão documental." };
    return null;
  }
  if (gerencial === "11.01.003") return { debitoCodigo: "3093", creditoCodigo: "1496", status: "revisar", observacao: "Matéria-prima/insumos comerciais; a amostra grátis CFOP 2911 foi excluída da obrigação com fornecedor." };
  if (gerencial === "11.02.001") return { debitoCodigo: "25937", creditoCodigo: "1496", status: "validado", observacao: "Somente industrialização onerosa; retornos CFOP 1903/1916 foram retirados do custo e do fornecedor." };
  if (gerencial === "11.02.002" || gerencial === "11.02.003") return { debitoCodigo: "25938", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "11.04.014") return { debitoCodigo: "25070", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "11.90.001") return { debitoCodigo: "3095", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "11.90.004") return { debitoCodigo: "25070", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "12.03.001") {
    if (ccComercial.has(cc)) return { debitoCodigo: "4028", creditoCodigo: "1496", status: "validado" };
    if (ccAdministrativo.has(cc)) return { debitoCodigo: "4342", creditoCodigo: "1496", status: "validado" };
    return null;
  }
  if (gerencial === "12.03.002") {
    if (ccProducao.has(cc)) return { debitoCodigo: "3203", creditoCodigo: "1496", status: "validado" };
    if (ccComercial.has(cc)) return { debitoCodigo: "4023", creditoCodigo: "1496", status: "validado" };
    if (ccAdministrativo.has(cc)) return { debitoCodigo: "4337", creditoCodigo: "1496", status: "validado" };
    return null;
  }
  if (gerencial === "12.03.003") return { debitoCodigo: "5799", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "12.03.005") return { debitoCodigo: "4250", creditoCodigo: "1496", status: "revisar", observacao: "Conta gerencial mapeada em junho, mas o CC 20002 é novo e exige revisão." };
  if (gerencial === "12.03.007") return { debitoCodigo: "4038", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "12.03.008") return { debitoCodigo: "25056", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "13.02.001") return { debitoCodigo: "4189", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "13.02.007") return { debitoCodigo: "25071", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "13.03.013") return { debitoCodigo: "25061", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "14.03.001" || gerencial === "14.03.006") return { debitoCodigo: "4253", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.01.001") return { debitoCodigo: "4115", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.01.002") return { debitoCodigo: "4405", creditoCodigo: "1496", status: "revisar", observacao: "Despesas de viagem/hospedagem; conta 4405 usada no mapeamento vigente, com revisão por existir histórico também em 4113." };
  if (gerencial === "15.01.005") return { debitoCodigo: "25063", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.01.008") return { debitoCodigo: "4085", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.01.011") {
    if (cc === "313") return { debitoCodigo: "4431", creditoCodigo: "1496", status: "validado", observacao: "Apartamento Sette Casa: Manutenção e Reparos, mesmo padrão histórico do CC 313." };
    if (cc === "204") return { debitoCodigo: "25064", creditoCodigo: "1496", status: "revisar", observacao: "Madeireira Base Sólida no CC Adm de Vendas; material/consumo mantido em revisão documental." };
    return null;
  }
  if (gerencial === "15.02.012") return { debitoCodigo: "4546", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.02.015") {
    if (ccProducao.has(cc)) return { debitoCodigo: "3244", creditoCodigo: "1496", status: "validado" };
    if (cc === "204" || cc === "205") return { debitoCodigo: "25064", creditoCodigo: "1496", status: "validado" };
    if (cc === "304" || cc === "305") return { debitoCodigo: "4912", creditoCodigo: "1496", status: "validado" };
    if (cc === "442") return { debitoCodigo: "25028", creditoCodigo: "1496", status: "validado", observacao: "Material de uso/consumo vinculado ao veículo BYD KING GS; classificado em Despesas com Veículos." };
    return null;
  }
  if (gerencial === "15.02.016") return { debitoCodigo: "4189", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.02.020") {
    if (ccProducao.has(cc)) return { debitoCodigo: "3494", creditoCodigo: "25218", status: "validado" };
    if (ccComercial.has(cc)) return { debitoCodigo: "4185", creditoCodigo: "25218", status: "validado" };
    if (ccAdministrativo.has(cc)) return { debitoCodigo: "4477", creditoCodigo: "25218", status: "validado" };
    return null;
  }
  if (gerencial === "15.02.034") return { debitoCodigo: "4546", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.02.050") return { debitoCodigo: "25074", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.03.001") return { debitoCodigo: "4213", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.03.002") return { debitoCodigo: "4215", creditoCodigo: "1496", status: "validado" };
  if (gerencial === "15.03.006") return { debitoCodigo: "4544", creditoCodigo: "1496", status: "validado" };
  return null;
}

const entradasCcSaneadasJulho = entradasCcAgregadasJulho.flatMap((linha) => {
  const saneada = sanearEntradaCcJulho(linha);
  return saneada ? [saneada] : [];
});

const lancamentosEntradasCcJulho: LancamentoIntegrado[] = entradasCcAgregadasJulho.flatMap((linha, index) => {
  const saneada = sanearEntradaCcJulho(linha);
  if (!saneada) return [];
  const mapa = mapearEntrada(saneada.gerencial, saneada.cc);
  if (!mapa || mapa === "duplicado-fiscal") return [];
  return [{
    id: `JUL-ENT-CC-${String(index + 1).padStart(3, "0")}`,
    data: "31/07/2026",
    origem: "ENTRADAS POR CENTRO DE CUSTO 07/2026",
    debitoCodigo: mapa.debitoCodigo,
    debito: nomeConta(mapa.debitoCodigo),
    creditoCodigo: mapa.creditoCodigo,
    credito: nomeConta(mapa.creditoCodigo),
    historico: `${saneada.descricaoGerencial} - CC ${saneada.cc} ${saneada.centroCusto}`,
    documento: `${saneada.gerencial} / ${saneada.documentos} doc(s)`,
    cc: saneada.cc,
    centroCusto: saneada.centroCusto,
    valor: saneada.valor,
    status: mapa.status,
    observacao: mapa.observacao ?? "Mapeamento por gerencial/CC validado; valor conforme relatório Softdib de julho.",
    rastreio: mapa.status === "validado" ? "documento" : "derivado",
    fonte: "ENTRADAS POR CENTRO DE CUSTO 072026 SISTEMA SOFTDIB - Data de Recepção 07/2026",
  }];
});

export const lancamentosAtivoImobilizadoJulho: LancamentoIntegrado[] = [
  {
    id: "JUL-ATIVO-LENOVO-1383812", data: "16/07/2026", origem: "ENTRADAS FISCAIS 07/2026",
    debitoCodigo: "1083", debito: nomeConta("1083"), creditoCodigo: "1496", credito: nomeConta("1496"),
    historico: "Compra de ativo imobilizado - LENOVO TECNOLOGIA (BRASIL) LIMITADA", documento: "NF 1383812 / CFOP 2551",
    cc: "305", centroCusto: "TI - TECNOLOGIA DA INFORMAÇÃO", valor: 3000.52, status: "validado",
    observacao: "CFOP 2551 confirma ativo imobilizado. Conciliação de entradas identifica débito 1083; retirado de Material Uso e Consumo.",
    rastreio: "documento", fonte: "SOFTDIB 07/2026 + RESUMO NOTAS FISCAIS ENTRADA(4).pdf + conciliação de entradas",
  },
  {
    id: "JUL-ATIVO-DOBRATEC-4340", data: "31/07/2026", origem: "ENTRADAS FISCAIS 07/2026",
    debitoCodigo: "1083", debito: nomeConta("1083"), creditoCodigo: "1496", credito: nomeConta("1496"),
    historico: "Compra para ativo imobilizado - DOBRATEC", documento: "NF 4340 / CFOP 1551",
    cc: "101", centroCusto: "ALMOXARIFADO", valor: 656.00, status: "revisar",
    observacao: "CFOP 1551 confirma imobilizado; conta 1083 provisória até validar o subgrupo específico do bem. Retirado de Materiais Auxiliares e de Consumo.",
    rastreio: "documento", fonte: "SOFTDIB 07/2026 + RESUMO NOTAS FISCAIS ENTRADA 07/2026",
  },
];

export const movimentosFiscaisSemEfeitoResultadoJulho = [
  { gerencial:"11.01.002", cc:"102", cfop:"1902", documento:"29 documentos", valor:1087030.41, tratamento:"retorno de industrialização - excluído de custo e fornecedor" },
  { gerencial:"11.01.002", cc:"102", cfop:"1949", documento:"NF 78161", valor:12728.30, tratamento:"entrada sem valor comercial - excluída de custo e fornecedor" },
  { gerencial:"15.02.015", cc:"102", cfop:"retorno", documento:"17 documentos", valor:9668.11, tratamento:"retorno - excluído de custo e fornecedor, sem lançamento de compensação" },
  { gerencial:"11.01.002", cc:"102", cfop:"2557", documento:"1 documento", valor:750.00, tratamento:"transferência - excluída de custo e fornecedor" },
  { gerencial:"11.02.001", cc:"101", cfop:"1903", documento:"24 documentos", valor:123388.52, tratamento:"retorno de mercadoria não aplicada - excluído de custo e fornecedor" },
  { gerencial:"11.02.001", cc:"503", cfop:"1916", documento:"NF 1532", valor:9080.00, tratamento:"retorno de conserto - excluído de custo e fornecedor" },
  { gerencial:"11.01.003", cc:"102", cfop:"2911", documento:"NF 15073", valor:1631.35, tratamento:"amostra grátis sem valor comercial - excluída da obrigação com fornecedor" },
  { gerencial:"01.01.001", cc:"503", cfop:"1916", documento:"1 documento", valor:58000.00, tratamento:"retorno de conserto - já não integrava o Razão" },
  { gerencial:"01.01.001", cc:"101", cfop:"2152", documento:"1 documento", valor:26643.78, tratamento:"transferência - já não integrava o Razão" },
  { gerencial:"01.01.001", cc:"201", cfop:"2152", documento:"5 documentos", valor:21645.05, tratamento:"transferência - já não integrava o Razão" },
  { gerencial:"11.01.002", cc:"205", cfop:"2557", documento:"1 documento", valor:1140.00, tratamento:"transferência - já não integrava o Razão" },
] as const;

const receitasEDeducoesJulho: LancamentoIntegrado[] = [
  { id:"JUL-REC-M-PROD", data:"31/07/2026", origem:"SAÍDAS FISCAIS MATRIZ 07/2026", debitoCodigo:"25111", debito:nomeConta("25111"), creditoCodigo:"2606", credito:nomeConta("2606"), historico:"Receita de produção da matriz - CFOPs externos de julho", documento:"FISCAL MATRIZ 07/2026", cc:"201", centroCusto:"VENDAS", valor:3449137.41, status:"validado", observacao:"Reconstruída por CFOP/documentos, sem usar DRE como fonte.", rastreio:"documento", fonte:"RESUMO NOTAS FISCAIS SAÍDA MATRIZ 07/2026" },
  { id:"JUL-REC-M-REV", data:"31/07/2026", origem:"SAÍDAS FISCAIS MATRIZ 07/2026", debitoCodigo:"25111", debito:nomeConta("25111"), creditoCodigo:"2655", credito:nomeConta("2655"), historico:"Receita de revenda da matriz - CFOP 6102", documento:"FISCAL MATRIZ 07/2026", cc:"201", centroCusto:"VENDAS", valor:173371.51, status:"validado", observacao:"Reconstruída por CFOP/documentos, sem usar DRE como fonte.", rastreio:"documento", fonte:"RESUMO NOTAS FISCAIS SAÍDA MATRIZ 07/2026" },
  { id:"JUL-REC-F-PROD", data:"31/07/2026", origem:"SAÍDAS FISCAIS FILIAL 07/2026", debitoCodigo:"25111", debito:nomeConta("25111"), creditoCodigo:"2606", credito:nomeConta("2606"), historico:"Receita de produção/operação triangular da filial - CFOP 5123", documento:"CFOP 5123 FILIAL 07/2026", cc:"502", centroCusto:"COMERCIAL SP", valor:4264.28, status:"validado", observacao:"Valor fiscal documentado da filial.", rastreio:"documento", fonte:"RESUMO NOTAS FISCAIS SAÍDA FILIAL 07/2026" },
  { id:"JUL-REC-F-REV", data:"31/07/2026", origem:"SAÍDAS FISCAIS FILIAL 07/2026", debitoCodigo:"25111", debito:nomeConta("25111"), creditoCodigo:"2655", credito:nomeConta("2655"), historico:"Receita de revenda da filial - CFOP 5102/6102", documento:"CFOP 5102/6102 FILIAL 07/2026", cc:"502", centroCusto:"COMERCIAL SP", valor:517128.58, status:"validado", observacao:"Valor fiscal documentado da filial.", rastreio:"documento", fonte:"RESUMO NOTAS FISCAIS SAÍDA FILIAL 07/2026" },
  { id:"JUL-DEV-M", data:"31/07/2026", origem:"DEVOLUÇÕES MATRIZ 07/2026", debitoCodigo:"25943", debito:nomeConta("25943"), creditoCodigo:"25111", credito:nomeConta("25111"), historico:"Devoluções de vendas da matriz", documento:"DEVOLUÇÕES MATRIZ 07/2026", cc:"201", centroCusto:"VENDAS", valor:36450.71, status:"validado", observacao:"Fonte fiscal; não duplicar o gerencial 11.01.008 do relatório por CC.", rastreio:"documento", fonte:"RELATÓRIO DE DEVOLUÇÕES MATRIZ 07/2026" },
  { id:"JUL-DEV-F", data:"31/07/2026", origem:"DEVOLUÇÕES FILIAL 07/2026", debitoCodigo:"25943", debito:nomeConta("25943"), creditoCodigo:"25111", credito:nomeConta("25111"), historico:"Devoluções de vendas da filial", documento:"CFOP 1202 FILIAL 07/2026", cc:"502", centroCusto:"COMERCIAL SP", valor:1956.51, status:"validado", observacao:"Fonte fiscal da filial.", rastreio:"documento", fonte:"RELATÓRIO DE DEVOLUÇÕES FILIAL 07/2026" },
  { id:"JUL-TAX-ICMS-M-EXT", data:"31/07/2026", origem:"APURAÇÃO ICMS MATRIZ 07/2026", debitoCodigo:"2827", debito:nomeConta("2827"), creditoCodigo:"1541", credito:nomeConta("1541"), historico:"ICMS incidente sobre vendas externas da matriz", documento:"ICMS MATRIZ 07/2026", cc:"201", centroCusto:"VENDAS", valor:230381.99, status:"validado", observacao:"Parcela externa usada na DRE fiscal; diferença para o relatório total permanece em diagnóstico, sem plug.", rastreio:"derivado", fonte:"APURAÇÃO ICMS MATRIZ + composição de CFOPs externos 07/2026" },
  { id:"JUL-TAX-ICMS-F-EXT", data:"31/07/2026", origem:"APURAÇÃO ICMS FILIAL 07/2026", debitoCodigo:"25054", debito:nomeConta("25054"), creditoCodigo:"25235", credito:nomeConta("25235"), historico:"ICMS incidente sobre vendas externas da filial - CFOP 5102/5123/6102", documento:"ICMS FILIAL 07/2026", cc:"502", centroCusto:"COMERCIAL SP", valor:81047.03, status:"validado", observacao:"Débito externo documentado; parcela de transferências permanece pendente de classificação contábil.", rastreio:"documento", fonte:"REGISTRO APURAÇÃO ICMS FILIAL 07/2026" },
  { id:"JUL-TAX-ICMSST", data:"31/07/2026", origem:"APURAÇÃO ICMS-ST 07/2026", debitoCodigo:"2832", debito:nomeConta("2832"), creditoCodigo:"1542", credito:nomeConta("1542"), historico:"ICMS-ST sobre saídas de julho", documento:"ICMS-ST 07/2026", cc:"201", centroCusto:"VENDAS", valor:1024.72, status:"validado", observacao:"Conforme relatório fiscal de julho.", rastreio:"documento", fonte:"REGISTRO APURAÇÃO ICMS-ST 07/2026" },
  { id:"JUL-TAX-IPI-M", data:"31/07/2026", origem:"APURAÇÃO IPI MATRIZ 07/2026", debitoCodigo:"2826", debito:nomeConta("2826"), creditoCodigo:"1543", credito:nomeConta("1543"), historico:"IPI sobre vendas externas da matriz", documento:"IPI MATRIZ 07/2026", cc:"201", centroCusto:"VENDAS", valor:163767.46, status:"revisar", observacao:"Valor residual para fechar o total fiscal externo de R$ 195.769,63; relatório da matriz possui diferença de R$ 26,21 a conciliar.", rastreio:"derivado", fonte:"APURAÇÃO IPI MATRIZ/FILIAL + saídas fiscais externas 07/2026" },
  { id:"JUL-TAX-IPI-F", data:"31/07/2026", origem:"APURAÇÃO IPI FILIAL 07/2026", debitoCodigo:"25055", debito:nomeConta("25055"), creditoCodigo:"25236", credito:nomeConta("25236"), historico:"IPI da filial em julho", documento:"IPI FILIAL 07/2026", cc:"502", centroCusto:"COMERCIAL SP", valor:32002.17, status:"validado", observacao:"Conforme relatório fiscal da filial.", rastreio:"documento", fonte:"REGISTRO APURAÇÃO IPI FILIAL 07/2026" },
  { id:"JUL-TAX-PIS", data:"31/07/2026", origem:"APURAÇÃO PIS 07/2026", debitoCodigo:"2829", debito:nomeConta("2829"), creditoCodigo:"1556", credito:nomeConta("1556"), historico:"PIS sobre saídas - apuração consolidada matriz + filial", documento:"PIS 07/2026", cc:"201", centroCusto:"VENDAS", valor:49820.30, status:"validado", observacao:"Contabilização consolidada; não duplicar parcela da filial.", rastreio:"documento", fonte:"REGISTRO APURAÇÃO PIS 07/2026" },
  { id:"JUL-TAX-COF", data:"31/07/2026", origem:"APURAÇÃO COFINS 07/2026", debitoCodigo:"2830", debito:nomeConta("2830"), creditoCodigo:"1552", credito:nomeConta("1552"), historico:"COFINS sobre saídas - apuração consolidada matriz + filial", documento:"COFINS 07/2026", cc:"201", centroCusto:"VENDAS", valor:229476.68, status:"validado", observacao:"Contabilização consolidada; não duplicar parcela da filial.", rastreio:"documento", fonte:"REGISTRO APURAÇÃO COFINS 07/2026" },
  { id:"JUL-ICMS-F-CRED-ENT", data:"31/07/2026", origem:"APURAÇÃO ICMS FILIAL 07/2026", debitoCodigo:"25235", debito:nomeConta("25235"), creditoCodigo:"25140", credito:nomeConta("25140"), historico:"Créditos de ICMS da filial em compras, fretes e transferências recebidas", documento:"ICMS FILIAL CRÉDITOS 07/2026", cc:"502", centroCusto:"COMERCIAL SP", valor:96584.89, status:"validado", observacao:"R$ 80.876,62 compras + R$ 1.095,30 fretes + R$ 14.612,97 transferências; mesma estrutura de conta validada em junho.", rastreio:"derivado", fonte:"REGISTRO APURAÇÃO ICMS FILIAL 07/2026" },
  { id:"JUL-ICMS-F-CRED-DEV", data:"31/07/2026", origem:"APURAÇÃO ICMS FILIAL 07/2026", debitoCodigo:"25235", debito:nomeConta("25235"), creditoCodigo:"25054", credito:nomeConta("25054"), historico:"Crédito/estorno de ICMS por devolução da filial - CFOP 1202", documento:"CFOP 1202 FILIAL 07/2026", cc:"502", centroCusto:"COMERCIAL SP", valor:336.32, status:"validado", observacao:"Crédito identificado no relatório fiscal da filial.", rastreio:"documento", fonte:"REGISTRO APURAÇÃO ICMS FILIAL 07/2026" },
];

export const lancamentosIntegradosJulho: LancamentoIntegrado[] = [
  ...receitasEDeducoesJulho,
  ...lancamentosEntradasCcJulho,
  ...lancamentosAtivoImobilizadoJulho,
  ...lancamentosBancariosSegurosJulho,
];

const pendenciasEntrada = entradasCcSaneadasJulho.filter((linha) => !mapearEntrada(linha.gerencial, linha.cc));
const duplicadoFiscal = entradasCcAgregadasJulho.filter((linha) => mapearEntrada(linha.gerencial, linha.cc) === "duplicado-fiscal");
export const valorEntradasMapeadasJulho = arred([...lancamentosEntradasCcJulho, ...lancamentosAtivoImobilizadoJulho].reduce((t, l) => t + l.valor, 0));
export const valorEntradasPendentesMapeamentoJulho = arred(pendenciasEntrada.reduce((t, l) => t + l.valor, 0));
export const valorEntradaDuplicadaFiscalJulho = arred(duplicadoFiscal.reduce((t, l) => t + l.valor, 0));

const valorMovimentosSemEfeitoResultadoAuditados = arred(movimentosFiscaisSemEfeitoResultadoJulho.reduce((t, l) => t + l.valor, 0));

/**
 * Retornos de julho excluídos de custo e de fornecedor, sem lançamento de compensação:
 * R$ 1.100.508,71 (11.01.002 / CC 102) + R$ 9.668,11 (15.02.015 / CC 102) = R$ 1.110.176,82.
 */
export const totalRetornosExcluidosJulho = 1110176.82;
export const composicaoRetornosExcluidosJulho = [
  { gerencial: "11.01.002", cc: "102", valor: 1100508.71 },
  { gerencial: "15.02.015", cc: "102", valor: 9668.11 },
] as const;
const valorMovimentosCorrigidosNestaVarredura = 1234608.58;
const valorImobilizadoReclassificado = arred(lancamentosAtivoImobilizadoJulho.reduce((t, l) => t + l.valor, 0));
const valorDespesasAntesOmitidasIntegradas = 8935.70;

export const diagnosticoFechamentoJulho = {
  valorEntradasDistribuidoCc: resumoEntradasCcAgregadasJulho.valorDistribuido,
  valorEntradasMapeadasRazao: valorEntradasMapeadasJulho,
  valorEntradasPendentesMapeamento: valorEntradasPendentesMapeamentoJulho,
  valorEntradaDuplicadaFiscal: valorEntradaDuplicadaFiscalJulho,
  valorSemCcCompleto: resumoEntradasCcAgregadasJulho.valorPendenteCc,
  valorMovimentosSemEfeitoResultadoAuditados,
  valorMovimentosCorrigidosNestaVarredura,
  valorImobilizadoReclassificado,
  valorDespesasAntesOmitidasIntegradas,
  criterioVarredura: "CFOP + documento + conta gerencial + centro de custo; fonte Softdib preservada sem alteração",
  pisCreditosPendentesAbertura: 33908.91,
  cofinsCreditosPendentesAbertura: 156119.80,
  icmsMatrizPendenteClassificacao: 13870.47,
  icmsFilialPendenteClassificacao: 3894.05,
  ipiMatrizDiferencaFonte: 26.21,
  saldoCredorIcmsFilialEsperadoAposClassificacao: 11980.13,
  folha: "pendente de documento 07/2026",
  bancosArAp: resumoIntegracaoBancariaJulho.situacao,
  fontesBancariasRecebidas: resumoIntegracaoBancariaJulho.fontesRecebidas.length,
  movimentosBancariosSegurosIntegrados: resumoIntegracaoBancariaJulho.movimentosPatrimoniaisIntegrados,
  estoque: "alvo 31/07 carregado; ajuste técnico bloqueado até completar movimentos reais",
  itensManuaisExcluidos: ["JCP", "Depreciação", "Juros ativos", "Juros passivos", "Variação cambial"],
} as const;

export const totalDebitosJulho = arred(lancamentosIntegradosJulho.reduce((t, l) => t + l.valor, 0));
export const totalCreditosJulho = totalDebitosJulho;
export const pendenciasRazaoJulho = lancamentosIntegradosJulho.filter((l) => l.status === "revisar").length;

const dataForaJulho = lancamentosIntegradosJulho.find((l) => !/^\d{2}\/07\/2026$/.test(l.data));
const receitaCircular = lancamentosIntegradosJulho.find((l) => ["2606","2655"].includes(l.creditoCodigo) && `${l.origem} ${l.fonte}`.toLocaleUpperCase("pt-BR").includes("DRE"));
const termoExcluido = /(JCP|DEPRECIA|JUROS ATIV|JUROS PASSIV|VARIAÇÃO CAMBIAL|VARIACAO CAMBIAL)/i;
const lancamentoExcluido = lancamentosIntegradosJulho.find((l) => termoExcluido.test(`${l.id} ${l.origem} ${l.historico}`));
const aberturaIndevida = lancamentosIntegradosJulho.find((l) => /ABERTURA|IMPLANTAÇÃO|IMPLANTACAO/i.test(`${l.id} ${l.origem}`));

if (dataForaJulho) throw new Error(`Razão julho contém data fora da competência: ${dataForaJulho.id}`);
if (receitaCircular) throw new Error(`Receita de julho alimentada por DRE: ${receitaCircular.id}`);
if (lancamentoExcluido) throw new Error(`Item manual indevidamente lançado em julho: ${lancamentoExcluido.id}`);
if (aberturaIndevida) throw new Error(`Abertura gerencial indevidamente lançada no Razão de julho: ${aberturaIndevida.id}`);
