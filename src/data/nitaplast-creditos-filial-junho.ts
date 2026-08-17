import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-integrado";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

function credito(params: {
  id: string;
  debitoCodigo: string;
  creditoCodigo: string;
  valor: number;
  historico: string;
  fonte: string;
  observacao: string;
}): LancamentoIntegrado {
  return {
    id: params.id,
    data: "30/06/2026",
    origem: "APURAÇÕES TRIBUTÁRIAS FILIAL 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: nomeConta(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nomeConta(params.creditoCodigo),
    historico: params.historico,
    documento: "APURAÇÃO FILIAL 06/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: params.valor,
    status: "validado",
    observacao: params.observacao,
    rastreio: "documento",
    fonte: params.fonte,
  };
}

// PIS/COFINS da filial: os débitos abaixo são fatos contábeis reais identificados
// nas apurações fiscais do estabelecimento e não vêm da DRE de controle.
// Os créditos de compras e devoluções permanecem lançados separadamente.
const pisDebitoFilial = credito({
  id: "FIL-DEB-PIS-SAI",
  debitoCodigo: "2829",
  creditoCodigo: "1556",
  valor: 4361.70,
  historico: "Débito de PIS sobre vendas da filial - competência 06/2026",
  fonte: "REGISTRO APURAÇÃO PIS(6).pdf",
  observacao: "Fato contábil real da apuração fiscal da filial. D 2829 / C 1556, CC 502. Não deriva da DRE de controle.",
});

const cofinsDebitoFilial = credito({
  id: "FIL-DEB-COF-SAI",
  debitoCodigo: "2830",
  creditoCodigo: "1552",
  valor: 20090.42,
  historico: "Débito de COFINS sobre vendas da filial - competência 06/2026",
  fonte: "REEGISTRO APURAÇÃO COFINS(1).pdf",
  observacao: "Fato contábil real da apuração fiscal da filial. D 2830 / C 1552, CC 502. Não deriva da DRE de controle.",
});

const pisComprasFilial = credito({
  id: "FIL-CRED-PIS-COMP",
  debitoCodigo: "1556",
  creditoCodigo: "25139",
  valor: 824.82,
  historico: "Crédito de PIS sobre compras da filial - CFOP 1101/1102",
  fonte: "REGISTRO APURAÇÃO PIS(6).pdf + RESUMO NOTAS FISCAIS ENTRADA(2).pdf",
  observacao: "Composição documentada: R$ 518,98 (1101) + R$ 305,84 (1102). Substitui parte do antigo residual, sem alterar o crédito federal total de R$ 32.907,70.",
});

const pisDevolucoesFilial = credito({
  id: "FIL-CRED-PIS-DEV",
  debitoCodigo: "1556",
  creditoCodigo: "2829",
  valor: 358.27,
  historico: "Reversão de PIS sobre devoluções de vendas da filial - CFOP 1202/2202",
  fonte: "REGISTRO APURAÇÃO PIS(6).pdf + RELATORIO DEVOLUÇÕES(5).pdf",
  observacao: "Composição documentada: R$ 289,88 (1202) + R$ 68,39 (2202). É crédito real de devolução e reduz a dedução de PIS na DRE calculada.",
});

const cofinsComprasFilial = credito({
  id: "FIL-CRED-COF-COMP",
  debitoCodigo: "1552",
  creditoCodigo: "25139",
  valor: 3799.12,
  historico: "Crédito de COFINS sobre compras da filial - CFOP 1101/1102",
  fonte: "REEGISTRO APURAÇÃO COFINS(1).pdf + RESUMO NOTAS FISCAIS ENTRADA(2).pdf",
  observacao: "Composição documentada: R$ 2.390,36 (1101) + R$ 1.408,76 (1102). Substitui parte do antigo residual, sem alterar o crédito federal total de R$ 151.385,76.",
});

const cofinsDevolucoesFilial = credito({
  id: "FIL-CRED-COF-DEV",
  debitoCodigo: "1552",
  creditoCodigo: "2830",
  valor: 1650.21,
  historico: "Reversão de COFINS sobre devoluções de vendas da filial - CFOP 1202/2202",
  fonte: "REEGISTRO APURAÇÃO COFINS(1).pdf + RELATORIO DEVOLUÇÕES(5).pdf",
  observacao: "Composição documentada: R$ 1.335,22 (1202) + R$ 314,99 (2202). É crédito real de devolução e reduz a dedução de COFINS na DRE calculada.",
});

// ICMS filial: débito R$ 56.744,23 e créditos R$ 24.776,51 conforme apuração do CNPJ 0003-60.
// A parcela de devoluções reduz diretamente a conta de ICMS sobre vendas; os demais créditos
// permanecem no grupo de estoque/compra da filial, preservando a abertura analítica existente.
const icmsDevolucoesFilial = credito({
  id: "FIL-CRED-ICMS-DEV",
  debitoCodigo: "25235",
  creditoCodigo: "25054",
  valor: 4282.57,
  historico: "Reversão de ICMS sobre devoluções de vendas da filial - CFOP 1202/2202",
  fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + RELATORIO DEVOLUÇÕES(5).pdf",
  observacao: "Composição documentada: R$ 4.109,88 (1202) + R$ 172,69 (2202). Reduz o ICMS sobre vendas da filial na DRE calculada.",
});

const icmsEntradasFilial = credito({
  id: "FIL-CRED-ICMS-ENT",
  debitoCodigo: "25235",
  creditoCodigo: "25140",
  valor: 20493.94,
  historico: "Créditos de ICMS de entradas da filial - compras, transferências e fretes",
  fonte: "REGISTRO APURAÇÃO ICMS(3).pdf + RESUMO NOTAS FISCAIS ENTRADA(2).pdf",
  observacao: "Composição: compras 1101/1102 R$ 9.740,31 + transferências 2152 R$ 10.149,82 + fretes 1352/2352 R$ 603,81. Total com as devoluções = R$ 24.776,51 da apuração.",
});

// IPI filial: débito R$ 20.469,32 e créditos R$ 3.457,11.
const ipiDevolucoesFilial = credito({
  id: "FIL-CRED-IPI-DEV",
  debitoCodigo: "25236",
  creditoCodigo: "25055",
  valor: 1409.10,
  historico: "Reversão de IPI sobre devoluções de vendas da filial - CFOP 1202",
  fonte: "REGISTRO APURAÇAÕ IPI(1).pdf + RELATORIO DEVOLUÇÕES(5).pdf",
  observacao: "Crédito documentado de R$ 1.409,10 relativo à devolução CFOP 1202; reduz o IPI faturado da filial na DRE calculada.",
});

const ipiComprasFilial = credito({
  id: "FIL-CRED-IPI-COMP",
  debitoCodigo: "25236",
  creditoCodigo: "25139",
  valor: 2048.01,
  historico: "Crédito de IPI sobre compras para industrialização da filial - CFOP 1101",
  fonte: "REGISTRO APURAÇAÕ IPI(1).pdf + RESUMO NOTAS FISCAIS ENTRADA(2).pdf",
  observacao: "Crédito documentado de R$ 2.048,01. Somado à devolução R$ 1.409,10, totaliza os R$ 3.457,11 da apuração de IPI da filial.",
});

export const creditosFilialJunho: LancamentoIntegrado[] = [
  pisDebitoFilial,
  cofinsDebitoFilial,
  pisComprasFilial,
  pisDevolucoesFilial,
  cofinsComprasFilial,
  cofinsDevolucoesFilial,
  icmsDevolucoesFilial,
  icmsEntradasFilial,
  ipiDevolucoesFilial,
  ipiComprasFilial,
];

export const resumoCreditosFilialJunho = {
  pis: { compras: 824.82, devolucoes: 358.27, total: 1183.09 },
  cofins: { compras: 3799.12, devolucoes: 1650.21, total: 5449.33 },
  icms: { entradas: 20493.94, devolucoes: 4282.57, total: 24776.51 },
  ipi: { compras: 2048.01, devolucoes: 1409.10, total: 3457.11 },
} as const;