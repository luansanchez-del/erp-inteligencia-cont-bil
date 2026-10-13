import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { resumoEntradasSetembro } from "./nitaplast-entradas-setembro";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Apuração de ICMS, IPI, PIS, COFINS e ICMS-ST de 09/2026 — mesmas contas de agosto
 * (nitaplast-provisao-impostos-agosto.ts):
 *   - débito das saídas: conta "sobre vendas" (dedução da receita) contra a conta "a recolher";
 *   - crédito das entradas: conta "a recolher" contra a conta de custo/despesa da própria nota.
 *
 * Totais: SPED do mês (EFD ICMS/IPI E110/E520 da Matriz e da Filial; EFD Contribuições M200/M600,
 * com Matriz e Filial separadas pelos C100 de cada CNPJ). Crédito por conta: impostos de cada nota
 * de entrada rateados pela conta da nota (scripts/gerar-entradas-setembro.mjs); a soma bate com o SPED.
 *
 * Transferências entre estabelecimentos (CFOP 6151/2151/2152): o ICMS sai e entra pela conta de
 * trânsito 25140 nos dois lados, que se anula; não passa pelo resultado. Em agosto o débito da Matriz
 * tinha ido para a dedução de vendas (2827); agosto fica como está.
 */
export const apuracaoImpostosSetembro = {
  matriz: {
    icms: { debito: 225_893.37, credito: 96_768.96, aRecolher: 129_124.41 },
    ipi: { debito: 165_834.08, credito: 66_852.56, aRecolher: 98_981.52 },
    pis: { debito: 42_035.73, credito: 26_482.53 },
    cofins: { debito: 193_617.83, credito: 121_917.81 },
    icmsSt: 886.14,
  },
  filial: {
    icms: { debito: 51_583.81, credito: 10_831.87, aRecolher: 40_751.94 },
    ipi: { debito: 16_498.72, credito: 30.38, aRecolher: 16_468.34 },
    pis: { debito: 4_063.43, credito: 247.9 },
    cofins: { debito: 18_716.17, credito: 1_141.72 },
  },
  // PIS/COFINS são apurados pela empresa toda (EFD Contribuições centralizada na Matriz).
  pisAPagar: 19_368.73,
  cofinsAPagar: 89_274.48,
} as const;

type Estab = "M" | "F";
type Imposto = "icms" | "ipi" | "pis" | "cofins";

const contas: Record<Estab, Record<Imposto, { sobreVendas: string; aRecolher: string }>> = {
  M: {
    icms: { sobreVendas: "2827", aRecolher: "1541" },
    ipi: { sobreVendas: "2826", aRecolher: "1543" },
    pis: { sobreVendas: "2829", aRecolher: "1556" },
    cofins: { sobreVendas: "2830", aRecolher: "1552" },
  },
  F: {
    icms: { sobreVendas: "25054", aRecolher: "25235" },
    ipi: { sobreVendas: "25055", aRecolher: "25236" },
    pis: { sobreVendas: "2829", aRecolher: "1556" },
    cofins: { sobreVendas: "2830", aRecolher: "1552" },
  },
};

const FONTE_SPED = {
  M: "ARQUIVO EFD FISCAL.TXT e ARQUIVO EFD CONTRIBUIÇÕES.TXT — NITAPLAST SET 26",
  F: "ARQUIVO EFD FISCAL.TXT — FILIAL SET 26 + ARQUIVO EFD CONTRIBUIÇÕES.TXT (C100 da Filial)",
};

const linha = (
  parcial: Omit<LancamentoIntegrado, "debito" | "credito" | "status" | "rastreio" | "data"> & { status?: LancamentoIntegrado["status"] },
): LancamentoIntegrado => ({
  ...parcial,
  data: "30/09/2026",
  debito: nome(parcial.debitoCodigo),
  credito: nome(parcial.creditoCodigo),
  status: parcial.status ?? "validado",
  rastreio: "documento",
});

// Débito das saídas por centro de custo (RESUMO NOTAS FISCAIS SAIDA.csv), sem as transferências.
const debitosPorCc: Record<Estab, { cc: string; centro: string; icms: number; ipi: number }[]> = {
  M: [
    { cc: "201", centro: "VENDAS", icms: 215_994.63, ipi: 165_834.08 },
    { cc: "102", centro: "PRODUÇÃO", icms: 1_806.17, ipi: 0 },
  ],
  F: [{ cc: "502", centro: "COMERCIAL SP", icms: 51_148.04, ipi: 16_498.72 }],
};
const transferenciaEnviada: Record<Estab, { valor: number; documento: string }> = {
  M: { valor: 8_092.57, documento: "38 NF-e CFOP 6151 da Matriz para a Filial" },
  F: { valor: 435.77, documento: "NF-e CFOP 6151 da Filial para a Matriz" },
};

const nomeEstab = { M: "Matriz", F: "Filial SP" } as const;
const ccEstab = { M: { cc: "0", centroCusto: "SEM CENTRO DE CUSTO" }, F: { cc: "502", centroCusto: "COMERCIAL SP" } } as const;

function lancamentosEstab(estab: Estab): LancamentoIntegrado[] {
  const apur = estab === "M" ? apuracaoImpostosSetembro.matriz : apuracaoImpostosSetembro.filial;
  const sigla = estab === "M" ? "M" : "F";
  const saida: LancamentoIntegrado[] = [];

  // Débitos de ICMS/IPI por CC.
  for (const imposto of ["icms", "ipi"] as const) {
    const { sobreVendas, aRecolher } = contas[estab][imposto];
    debitosPorCc[estab].forEach((d, i) => {
      if (d[imposto] < 0.005) return;
      saida.push(linha({
        id: `SET-TAX-${sigla}-SAI-${imposto.toUpperCase()}-${i + 1}`,
        origem: `APURAÇÃO ${imposto.toUpperCase()} ${nomeEstab[estab].toUpperCase()} 09/2026`,
        debitoCodigo: sobreVendas,
        creditoCodigo: aRecolher,
        historico: `${imposto.toUpperCase()} sobre vendas — ${nomeEstab[estab]} — CC ${d.cc} ${d.centro}`,
        documento: `APURAÇÃO ${imposto.toUpperCase()} 09/2026`,
        cc: d.cc,
        centroCusto: d.centro,
        valor: d[imposto],
        observacao: "Débito das saídas por CC, pelo relatório fiscal de saídas; a soma com a transferência bate com o SPED.",
        fonte: `RESUMO NOTAS FISCAIS SAIDA.csv + ${FONTE_SPED[estab]}`,
      }));
    });
  }
  // ICMS da transferência enviada ao outro estabelecimento: conta de trânsito.
  saida.push(linha({
    id: `SET-TAX-${sigla}-SAI-ICMS-TRANSF`,
    origem: `APURAÇÃO ICMS ${nomeEstab[estab].toUpperCase()} 09/2026`,
    debitoCodigo: "25140",
    creditoCodigo: contas[estab].icms.aRecolher,
    historico: "ICMS de transferência de mercadoria entre estabelecimentos (CFOP 6151)",
    documento: transferenciaEnviada[estab].documento,
    ...ccEstab[estab],
    valor: transferenciaEnviada[estab].valor,
    observacao: "Débito do ICMS na remessa; o outro estabelecimento credita o mesmo valor contra a 25140, que se anula.",
    fonte: `RESUMO NOTAS FISCAIS SAIDA.csv + ${FONTE_SPED[estab]}`,
  }));
  // Débitos de PIS/COFINS (sem CC no relatório fiscal).
  for (const imposto of ["pis", "cofins"] as const) {
    saida.push(linha({
      id: `SET-TAX-${sigla}-SAI-${imposto.toUpperCase()}`,
      origem: `APURAÇÃO ${imposto.toUpperCase()} 09/2026`,
      debitoCodigo: contas[estab][imposto].sobreVendas,
      creditoCodigo: contas[estab][imposto].aRecolher,
      historico: `${imposto.toUpperCase()} sobre vendas — ${nomeEstab[estab]}`,
      documento: `EFD CONTRIBUIÇÕES 09/2026 — C100 de saída do CNPJ ${estab === "M" ? "0001-07" : "0003-60"}`,
      ...ccEstab[estab],
      valor: apur[imposto].debito,
      observacao: "Soma dos C100 de saída do estabelecimento; Matriz + Filial = M210/M610 do SPED.",
      fonte: FONTE_SPED[estab],
    }));
  }
  // Créditos de entrada por conta.
  const creditos = resumoEntradasSetembro.creditosPorConta[estab] as Record<string, Record<Imposto, number>>;
  for (const imposto of ["icms", "ipi", "pis", "cofins"] as const) {
    const total = arred(Object.values(creditos).reduce((t, v) => t + v[imposto], 0));
    if (Math.abs(total - apur[imposto].credito) > 0.011) {
      throw new Error(`Crédito de ${imposto} ${estab}: notas ${total} x SPED ${apur[imposto].credito}`);
    }
    Object.entries(creditos).forEach(([conta, v], i) => {
      if (v[imposto] < 0.005) return;
      if (conta.startsWith("NOP")) throw new Error(`Crédito de ${imposto} em nota fora das entradas (${conta})`);
      saida.push(linha({
        id: `SET-TAX-${sigla}-ENT-${imposto.toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
        origem: `APURAÇÃO ${imposto.toUpperCase()} ${nomeEstab[estab].toUpperCase()} 09/2026`,
        debitoCodigo: contas[estab][imposto].aRecolher,
        creditoCodigo: conta,
        historico: `${imposto.toUpperCase()} sobre entradas — crédito das notas da conta ${conta}`,
        documento: `APURAÇÃO ${imposto.toUpperCase()} 09/2026`,
        ...ccEstab[estab],
        valor: v[imposto],
        observacao: conta === "25140"
          ? "Crédito do ICMS da transferência recebida do outro estabelecimento; anula a 25140."
          : conta === "25943"
            ? "Crédito das notas de devolução de venda; reduz a devolução."
            : "Crédito das notas de entrada da conta, rateado pela própria nota.",
        fonte: "Softdib ENTRADAS POR CENTRO DE CUSTO 092026 (impostos por nota) + SPED 09/2026",
      }));
    });
  }
  return saida;
}

const icmsSt = [
  { data: "01/09/2026", base: 1_730.66, valor: 267.72 },
  { data: "09/09/2026", base: 3_007.36, valor: 465.22 },
  { data: "11/09/2026", base: 881.73, valor: 136.39 },
  { data: "14/09/2026", base: 116.68, valor: 16.81 },
];

export const lancamentosIcmsStSetembro: LancamentoIntegrado[] = icmsSt.map((d, i) => ({
  id: `SET-ICMSST-${String(i + 1).padStart(2, "0")}`,
  data: d.data,
  origem: "APURAÇÃO ICMS-ST 09/2026",
  debitoCodigo: "2832",
  debito: nome("2832"),
  creditoCodigo: "1542",
  credito: nome("1542"),
  historico: "ICMS-ST sobre venda de produção — CFOP 6401",
  documento: `REGISTRO ICMS-ST ${d.data}`,
  cc: "201",
  centroCusto: "VENDAS",
  valor: d.valor,
  status: "validado",
  observacao: `Base de cálculo R$ ${d.base.toFixed(2)}.`,
  rastreio: "documento",
  fonte: "REGISTRO APURAÇÃO ICMS ST.pdf — NITAPLAST SET 26",
}));

export const lancamentosImpostosSetembro: LancamentoIntegrado[] = [
  ...lancamentosEstab("M"),
  ...lancamentosEstab("F"),
  ...lancamentosIcmsStSetembro,
];

// Conferência: saldo líquido do mês em cada conta "a recolher" = SPED.
const liquido = (conta: string) =>
  arred(lancamentosImpostosSetembro.reduce((t, l) => t + (l.creditoCodigo === conta ? l.valor : 0) - (l.debitoCodigo === conta ? l.valor : 0), 0));
const esperado: [string, number][] = [
  ["1541", 129_124.41],
  ["1543", 98_981.52],
  ["25235", 40_751.94],
  ["25236", 16_468.34],
  ["1556", 19_368.73],
  ["1552", 89_274.48],
  ["1542", 886.14],
  ["25140", 0],
];
for (const [conta, valor] of esperado) {
  if (Math.abs(liquido(conta) - valor) > 0.011) throw new Error(`Apuração 09/2026: conta ${conta} ${liquido(conta)} x SPED ${valor}`);
}
