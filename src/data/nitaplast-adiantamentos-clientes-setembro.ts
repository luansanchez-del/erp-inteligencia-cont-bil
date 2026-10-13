import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Compensação de adiantamentos de clientes em 09/2026: duplicatas liquidadas sem entrada de dinheiro
 * (Títulos Liquidados, Vlr.Rec 0,00) porque o cliente pagou antes. O adiantamento foi creditado em 1712
 * quando entrou no banco; a liquidação da duplicata baixa a 1712 contra Duplicatas a Receber (25111).
 * Valor: o da duplicata. Diferença pequena entre adiantamento e duplicata fica na 1712.
 * Fora daqui: duplicatas abatidas por devolução de venda (Athos, Brudden, Coman, Sulferraco,
 * Com. e Ind. de Metais, Fluid Feeder), já baixadas pelas notas de devolução.
 */
const compensacoes: { cliente: string; titulo: string; data: string; valor: number; adiantamento: string }[] = [
  { cliente: "C04415 FAYO EQUIPAMENTOS", titulo: "8936/NE", data: "02/09/2026", valor: 4_873.62, adiantamento: "FAYO EHPL R$ 3.566,90 (27/08) + R$ 1.319,41 (31/08), Itaú" },
  { cliente: "C00855 TORNADO IND COMERCIO", titulo: "8940/NE", data: "03/09/2026", valor: 699.48, adiantamento: "TORNADO R$ 699,48, Itaú" },
  { cliente: "C03827 PROTECFRAN DO BRASIL", titulo: "94510/NE", data: "03/09/2026", valor: 481.23, adiantamento: "PROTECFRAN R$ 481,39, Itaú" },
  { cliente: "C04062 50.621.360 EVERTON", titulo: "94479/NE", data: "03/09/2026", valor: 2_341.93, adiantamento: "GUILHERME AUGUSTO R$ 2.341,93, Itaú (mesmo valor)" },
  { cliente: "C00953 HELIBOMBAS IND. E COM", titulo: "8946/NE", data: "04/09/2026", valor: 1_835.07, adiantamento: "HELIOBOM R$ 1.994,00, Itaú" },
  { cliente: "C02040 ORLANDO FRANCISCO", titulo: "8947/NE", data: "04/09/2026", valor: 1_575.42, adiantamento: "CASA DAS FERRAMENTAS R$ 1.575,42, Itaú (mesmo valor)" },
  { cliente: "C01067 ISOLUTION - SOLUCOES", titulo: "8949/NE", data: "08/09/2026", valor: 3_218.31, adiantamento: "Isolution Soluções Termo R$ 3.218,31" },
  { cliente: "C04417 ELIZA MARTA DANSI", titulo: "94545/NE", data: "08/09/2026", valor: 13_126.34, adiantamento: "ELIZA MARTA R$ 3.141,42 + R$ 10.000,00, Itaú" },
  { cliente: "C04373 WS SPORTS COMERCIO", titulo: "8955/NE", data: "09/09/2026", valor: 5_101.44, adiantamento: "WS SPORTS R$ 5.100,00, Itaú" },
  { cliente: "C04215 A M M COMERCIO", titulo: "94599/NE", data: "11/09/2026", valor: 3_215.1, adiantamento: "SANDRA REGINA R$ 3.215,10, Itaú (mesmo valor)" },
  { cliente: "C03693 BELTEX INDUSTRIA", titulo: "94648/NE", data: "15/09/2026", valor: 441.57, adiantamento: "BELTEX R$ 441,57, Itaú" },
  { cliente: "C04417 ELIZA MARTA DANSI", titulo: "94665/NE", data: "15/09/2026", valor: 14_002.65, adiantamento: "ELIZA MARTA R$ 14.002,65, Itaú" },
  { cliente: "C04301 MAQUINAS RIBEIRO", titulo: "8981/NE", data: "16/09/2026", valor: 1_408.74, adiantamento: "MAQUINAS RIBEIRO R$ 1.405,00, Itaú" },
  { cliente: "C01379 EXCALIBUR - USINAGEM", titulo: "94765/NE", data: "22/09/2026", valor: 1_845.79, adiantamento: "EXCALIBUR R$ 1.845,79, Itaú" },
  { cliente: "C00929 GEORGE E FILHO IND", titulo: "8997/NE", data: "23/09/2026", valor: 2_233.36, adiantamento: "GEORGE FHI R$ 2.233,36, Itaú" },
  { cliente: "C03607 R. J. NEVES DA ROCHA", titulo: "94837/NE", data: "24/09/2026", valor: 6_235.4, adiantamento: "RJ NEVES R$ 3.000,00 + RONEY R$ 3.235,40, Itaú" },
  { cliente: "C04422 45.005.860 ISABELL", titulo: "9009/NE", data: "24/09/2026", valor: 1_090.02, adiantamento: "ANA BEATRI R$ 1.090,00, Itaú" },
  { cliente: "C03976 JEFLEX COMERCIO", titulo: "9016/NE", data: "25/09/2026", valor: 1_710.61, adiantamento: "JEFLEX R$ 1.710,61, Itaú" },
  { cliente: "C04424 E M DE SOUSA VASCO", titulo: "94900/NE", data: "29/09/2026", valor: 10_030.4, adiantamento: "E M DE SOUZA R$ 10.030,40, Itaú" },
];

export const lancamentosAdiantamentosClientesSetembro: LancamentoIntegrado[] = compensacoes.map((c, i) => ({
  id: `SET-ADIANT-CLI-${String(i + 1).padStart(2, "0")}`,
  data: c.data,
  origem: "COMPENSAÇÃO DE ADIANTAMENTO DE CLIENTE 09/2026",
  debitoCodigo: "1712",
  debito: nome("1712"),
  creditoCodigo: "25111",
  credito: nome("25111"),
  historico: `Liquidação da duplicata ${c.titulo} com adiantamento — ${c.cliente}`,
  documento: `Duplicata ${c.titulo}`,
  cc: "0",
  centroCusto: "SEM CENTRO DE CUSTO",
  valor: c.valor,
  status: "validado",
  observacao: `Duplicata liquidada sem entrada de dinheiro (Títulos Liquidados). Adiantamento: ${c.adiantamento}.`,
  rastreio: "documento",
  fonte: "C:/092026/EXTRATOS 092026/Recebidos 01-09 a 30-09.pdf + adiantamentos de clientes nos extratos",
}));
