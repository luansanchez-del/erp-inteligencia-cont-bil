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

export const lancamentosIntegradosJulhoFinal: LancamentoIntegrado[] = [
  ...lancamentosBaseSaneados,
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