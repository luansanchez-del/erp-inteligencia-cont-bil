import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { folhaSetembroDetalhe } from "./nitaplast-folha-setembro";
import { documentosProvisoesSetembro } from "./nitaplast-provisoes-setembro-documentos";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const centros: Record<string, string> = {
  "201": "VENDAS", "203": "FATURAMENTO", "206": "EXPORTAÇÃO",
  "210": "MARKETING", "301": "RECEPÇÃO", "302": "FINANCEIRO",
  "304": "ADM GERAL", "502": "COMERCIAL SP",
};
function nomeConta(codigo: string): string {
  const descricao = descricaoContaJulho.get(codigo);
  if (!descricao) throw new Error(`Conta ${codigo} não encontrada no plano para provisões de setembro`);
  return `${codigo} - ${descricao}`;
}
const pasta = "C:/092026/FOLHA MATRIZ E FILIAL";
const contasPorTipo = {
  ferias: { natureza: "férias + 1/3", principal: ["25057", "25237"], encargos: ["25058", "25230"] },
  decimo: { natureza: "13º salário", principal: ["25059", "25238"], encargos: ["25060", "25229"] },
} as const;

type Partida = { chave: string; cc: string; historico: string; documento: string; principal: number; encargos: number; derivado: boolean };

function colaboradorDa(matricula: string, unidade: "Matriz" | "Filial SP") {
  const colaborador = folhaSetembroDetalhe.find((pessoa) => pessoa.matricula === matricula);
  if (!colaborador || colaborador.unidade !== unidade) throw new Error(`Colaborador ${matricula} sem vínculo com ${unidade} na folha de setembro`);
  return colaborador;
}

/** Rateia um total por centro de custo conforme os pesos; o resíduo de arredondamento fica no maior peso. */
function ratear(total: number, pesos: Map<string, number>) {
  const somaPesos = [...pesos.values()].reduce((soma, peso) => soma + peso, 0);
  const partes = new Map([...pesos].map(([cc, peso]) => [cc, arred((total * peso) / somaPesos)]));
  const maior = [...pesos].sort((a, b) => b[1] - a[1])[0]![0];
  partes.set(maior, arred(partes.get(maior)! + total - [...partes.values()].reduce((soma, valor) => soma + valor, 0)));
  return partes;
}

const decimoPorUnidade = (unidade: "matriz" | "filial") => documentosProvisoesSetembro.find((documento) => documento.unidade === unidade && documento.tipo === "decimo")!;

/**
 * Apropriação da linha Provisão Mês de 09/2026, no critério de julho/agosto: Ajuste, Pago e
 * Diferença Pgto ficam na memória documental. O 13º vem por funcionário. O relatório de
 * férias de setembro veio só com o total da empresa: na Filial todo o quadro é do CC 502; na
 * Matriz o total é rateado por CC na proporção da Provisão Mês de 13º de cada funcionário.
 */
export const lancamentosProvisoesSetembro: LancamentoIntegrado[] = documentosProvisoesSetembro.flatMap((documento) => {
  const unidade = documento.unidade === "matriz" ? "Matriz" : "Filial SP";
  const tipo = contasPorTipo[documento.tipo];
  const partidas: Partida[] = [];
  if (documento.tipo === "decimo") {
    documento.itens.forEach((item, indice) => {
      const colaborador = colaboradorDa(item.matricula, unidade);
      partidas.push({
        chave: `${item.matricula}-${indice + 1}`,
        cc: colaborador.cc,
        historico: colaborador.nome,
        documento: `${documento.arquivo} / matrícula ${item.matricula} / página ${item.pagina}`,
        principal: item.mensal.principal,
        encargos: arred(item.mensal.inss + item.mensal.fgts + item.mensal.pis),
        derivado: false,
      });
    });
  } else {
    const mensal = documento.total.mensal;
    const principal = arred(mensal.principal + ("terco" in mensal ? mensal.terco : 0));
    const encargos = arred(mensal.inss + mensal.fgts + mensal.pis);
    const pesos = new Map<string, number>();
    for (const item of decimoPorUnidade(documento.unidade).itens) {
      const cc = colaboradorDa(item.matricula, unidade).cc;
      pesos.set(cc, (pesos.get(cc) ?? 0) + item.mensal.principal);
    }
    const principais = ratear(principal, pesos);
    const encargosPorCc = ratear(encargos, pesos);
    for (const cc of pesos.keys()) {
      partidas.push({
        chave: `CC${cc}`,
        cc,
        historico: `quadro ${unidade} CC ${cc}`,
        documento: `${documento.arquivo} / total da empresa / página ${documento.total.pagina}`,
        principal: principais.get(cc)!,
        encargos: encargosPorCc.get(cc)!,
        derivado: pesos.size > 1,
      });
    }
  }
  return partidas.flatMap((partida) =>
    ([["PRINCIPAL", tipo.principal, partida.principal], ["ENCARGOS", tipo.encargos, partida.encargos]] as const)
      .filter(([, , valor]) => valor > 0)
      .map(([sufixo, [debito, credito], valor]): LancamentoIntegrado => ({
        id: `SET-PROV-${documento.unidade}-${documento.tipo}-${partida.chave}-${sufixo}`,
        data: "30/09/2026",
        origem: `PROVISÃO ${tipo.natureza.toUpperCase()} ${unidade.toUpperCase()} 09/2026`,
        debitoCodigo: debito,
        debito: nomeConta(debito),
        creditoCodigo: credito,
        credito: nomeConta(credito),
        historico: `${partida.historico} — provisão mensal de ${tipo.natureza}${sufixo === "ENCARGOS" ? " — INSS e FGTS" : ""}`,
        documento: partida.documento,
        cc: partida.cc,
        centroCusto: centros[partida.cc] ?? "SEM CENTRO DE CUSTO",
        valor,
        status: partida.derivado ? "revisar" : "validado",
        observacao: partida.derivado
          ? "Total da linha Provisão Mês do relatório de férias 09/2026 (sem quebra por funcionário), rateado por CC na proporção da Provisão Mês de 13º de cada funcionário."
          : "Valor da linha Provisão Mês do relatório de 09/2026. Ajuste, Pago e Diferença Pgto não são apropriados nesta partida; permanecem na memória documental.",
        rastreio: partida.derivado ? "derivado" : "documento",
        fonte: `${pasta}/${documento.arquivo} — página ${documento.total.pagina}`,
      })),
  );
});

export const resumoProvisoesSetembro = documentosProvisoesSetembro.map((documento) => ({
  unidade: documento.unidade,
  tipo: documento.tipo,
  totalMensal: arred(Object.values(documento.total.mensal).reduce<number>((soma, valor) => soma + valor, 0)),
  totalAjuste: arred(Object.values(documento.total.ajuste).reduce<number>((soma, valor) => soma + valor, 0)),
  fonte: documento.arquivo,
  controleRelatorio: documento.total,
}));

for (const resumo of resumoProvisoesSetembro) {
  const lancado = arred(lancamentosProvisoesSetembro.filter((linha) => linha.id.startsWith(`SET-PROV-${resumo.unidade}-${resumo.tipo}-`)).reduce((soma, linha) => soma + linha.valor, 0));
  if (lancado !== resumo.totalMensal) throw new Error(`Provisão ${resumo.tipo} ${resumo.unidade} de setembro divergente do relatório`);
}
