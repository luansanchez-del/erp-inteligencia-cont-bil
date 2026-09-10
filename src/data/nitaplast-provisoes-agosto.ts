import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { folhaAgostoDetalhe } from "./nitaplast-folha-agosto";
import { documentosProvisoesAgosto } from "./nitaplast-provisoes-agosto-documentos";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const centros: Record<string, string> = {
  "201": "VENDAS", "203": "FATURAMENTO", "206": "EXPORTAÇÃO",
  "210": "MARKETING", "301": "RECEPÇÃO", "302": "FINANCEIRO",
  "304": "ADM GERAL", "502": "COMERCIAL SP",
};
function nomeConta(codigo: string): string {
  const descricao = descricaoContaJulho.get(codigo);
  if (!descricao) throw new Error(`Conta ${codigo} não encontrada no plano para provisões de agosto`);
  return `${codigo} - ${descricao}`;
}

/**
 * Apropriação da linha Provisão Mês, seguindo o critério documental de julho.
 * Saldos anteriores/finais não são fatos novos. Ajustes, pagamentos, diferenças
 * e adiantamentos estão preservados nos documentos para conciliação das baixas.
 * Encargos são os valores do PDF, sem aplicar uma alíquota estimada à filial.
 */
export const lancamentosProvisoesAgosto: LancamentoIntegrado[] = documentosProvisoesAgosto.flatMap((documento) =>
  documento.itens.flatMap((item, indice) => {
    const colaborador = folhaAgostoDetalhe.find((pessoa) => pessoa.matricula === item.matricula);
    const unidade = documento.unidade === "matriz" ? "Matriz" : "Filial SP";
    if (!colaborador || colaborador.unidade !== unidade) {
      throw new Error(`Colaborador ${item.matricula} sem vínculo com ${unidade} na folha de agosto`);
    }
    const centroCusto = centros[colaborador.cc];
    if (!centroCusto) throw new Error(`Centro de custo ${colaborador.cc} não identificado`);
    const ferias = documento.tipo === "ferias";
    const principal = arred(item.mensal.principal + ("terco" in item.mensal ? item.mensal.terco : 0));
    const encargos = arred(item.mensal.inss + item.mensal.fgts + item.mensal.pis);
    const natureza = ferias ? "férias + 1/3" : "13º salário";
    const contas = ferias
      ? [{ debito: "25057", credito: "25237", valor: principal, sufixo: "PRINCIPAL" }, { debito: "25058", credito: "25230", valor: encargos, sufixo: "ENCARGOS" }]
      : [{ debito: "25059", credito: "25238", valor: principal, sufixo: "PRINCIPAL" }, { debito: "25060", credito: "25229", valor: encargos, sufixo: "ENCARGOS" }];
    return contas.filter((conta) => conta.valor > 0).map((conta): LancamentoIntegrado => ({
      id: `AGO-PROV-${documento.unidade}-${documento.tipo}-${item.matricula}-${indice + 1}-${conta.sufixo}`,
      data: "31/08/2026",
      origem: `PROVISÃO ${natureza.toUpperCase()} ${unidade.toUpperCase()} 08/2026`,
      debitoCodigo: conta.debito,
      debito: nomeConta(conta.debito),
      creditoCodigo: conta.credito,
      credito: nomeConta(conta.credito),
      historico: `${colaborador.nome} — provisão mensal de ${natureza}${conta.sufixo === "ENCARGOS" ? " — INSS e FGTS" : ""}`,
      documento: `${documento.arquivo} / matrícula ${item.matricula} / página ${item.pagina}`,
      cc: colaborador.cc,
      centroCusto,
      valor: conta.valor,
      status: "validado",
      observacao: "Valor da linha Provisão Mês do relatório de 08/2026. Centro de custo vinculado à matrícula na folha de agosto. Saldos acumulados, Ajuste, Pago, Diferença Pgto e Adiantamento não são apropriados novamente nesta partida; permanecem na memória documental para conciliação com folha e bancos.",
      rastreio: "documento",
      fonte: `C:/082026/FOLHA/${documento.arquivo} — página ${item.pagina}`,
    }));
  }),
);

export const resumoProvisoesAgosto = documentosProvisoesAgosto.map((documento) => ({
  unidade: documento.unidade,
  tipo: documento.tipo,
  totalMensal: arred(Object.values(documento.total.mensal).reduce<number>((soma, valor) => soma + valor, 0)),
  fonte: documento.arquivo,
  paginaTotal: documento.total.pagina,
  controleRelatorio: documento.total,
}));
