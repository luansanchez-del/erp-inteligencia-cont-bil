import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { lancamentosIntegradosJulho as baseJulho } from "./nitaplast-razao-julho";
import { lancamentosBancariosOperacionaisJulho, resumoLancamentosBancariosOperacionaisJulho } from "./nitaplast-lancamentos-bancarios-julho";
import { descricaoContaJulho, saldoAberturaJulhoPorConta } from "./nitaplast-saldos-julho";
import { calcularDepreciacaoImobilizado } from "./nitaplast-imobilizado";
import { lancamentosFolhaJulho, resumoFolhaJulho } from "./nitaplast-folha-julho";

const nome = (c:string) => `${c} - ${descricaoContaJulho.get(c) ?? "Conta a revisar"}`;
const arred = (v:number) => Math.round(v*100)/100;
const l = (p: Omit<LancamentoIntegrado,"debito"|"credito"|"status"|"rastreio"> & {status?:LancamentoIntegrado["status"];rastreio?:LancamentoIntegrado["rastreio"]}): LancamentoIntegrado => ({...p,debito:nome(p.debitoCodigo),credito:nome(p.creditoCodigo),status:p.status??"validado",rastreio:p.rastreio??"documento"});

// Linhas provisórias substituídas abaixo pelas apurações oficiais completas.
const idsSubstituidos = new Set([
  "JUL-TAX-ICMS-M-EXT","JUL-TAX-ICMS-F-EXT","JUL-TAX-IPI-M",
  "JUL-ICMS-F-CRED-ENT","JUL-ICMS-F-CRED-DEV",
]);
const baseSaneada = baseJulho.filter(x => !idsSubstituidos.has(x.id));

const impostosEstaduaisFederais: LancamentoIntegrado[] = [
  // ICMS MATRIZ: débitos 244.252,46 + outros débitos 25.878,39 - créditos 171.118,47 = 99.012,38 a recolher.
  l({id:"JUL-ICMS-M-EXT",data:"31/07/2026",origem:"APURAÇÃO ICMS MATRIZ 07/2026",debitoCodigo:"2827",creditoCodigo:"1541",historico:"ICMS sobre saídas externas da matriz",documento:"ICMS MATRIZ 07/2026",cc:"201",centroCusto:"VENDAS",valor:230381.99,observacao:"Parcela das saídas externas; transferências internas são separadas para não inflar a DRE.",fonte:"REGISTRO APURAÇÃO ICMS ATUALIZADO(5).pdf + saídas fiscais"}),
  l({id:"JUL-ICMS-M-TRANSF",data:"31/07/2026",origem:"APURAÇÃO ICMS MATRIZ 07/2026",debitoCodigo:"25140",creditoCodigo:"1541",historico:"ICMS de transferências internas Matriz → Filial",documento:"ICMS MATRIZ 07/2026",cc:"0",centroCusto:"SEM CENTRO DE CUSTO",valor:13870.47,observacao:"Parcela interna do débito total de R$ 244.252,46. Mantida patrimonial; não entra como dedução de receita externa.",fonte:"REGISTRO APURAÇÃO ICMS ATUALIZADO(5).pdf + saídas/entradas Matriz/Filial",rastreio:"derivado"}),
  l({id:"JUL-ICMS-M-OUTROS-DEB",data:"31/07/2026",origem:"APURAÇÃO ICMS MATRIZ 07/2026",debitoCodigo:"4657",creditoCodigo:"1541",historico:"Outros débitos ICMS - estorno crédito presumido FCI + DIFAL uso/consumo",documento:"ICMS MATRIZ 07/2026",cc:"0",centroCusto:"SEM CENTRO DE CUSTO",valor:25878.39,observacao:"R$ 25.216,72 estorno FCI + R$ 661,67 DIFAL.",fonte:"REGISTRO APURAÇÃO ICMS ATUALIZADO(5).pdf"}),
  l({id:"JUL-ICMS-M-CRED-COMP",data:"31/07/2026",origem:"APURAÇÃO ICMS MATRIZ 07/2026",debitoCodigo:"1541",creditoCodigo:"3093",historico:"Créditos ICMS sobre aquisições",documento:"ICMS MATRIZ 07/2026",cc:"102",centroCusto:"PRODUÇÃO",valor:137075.65,observacao:"Créditos de entradas conforme apuração oficial; reduz custo de aquisição.",fonte:"REGISTRO APURAÇÃO ICMS ATUALIZADO(5).pdf"}),
  l({id:"JUL-ICMS-M-CRED-ENERG",data:"31/07/2026",origem:"APURAÇÃO ICMS MATRIZ 07/2026",debitoCodigo:"1541",creditoCodigo:"3494",historico:"Crédito ICMS energia elétrica",documento:"ICMS MATRIZ 07/2026",cc:"102",centroCusto:"PRODUÇÃO",valor:17146.20,observacao:"Crédito de energia conforme apuração.",fonte:"REGISTRO APURAÇÃO ICMS ATUALIZADO(5).pdf"}),
  l({id:"JUL-ICMS-M-CRED-PRES",data:"31/07/2026",origem:"APURAÇÃO ICMS MATRIZ 07/2026",debitoCodigo:"1541",creditoCodigo:"4657",historico:"Crédito presumido ICMS",documento:"ICMS MATRIZ 07/2026",cc:"0",centroCusto:"SEM CENTRO DE CUSTO",valor:16896.62,observacao:"Crédito presumido oficial; contraposto ao grupo fiscal, sem usar DRE como alvo.",fonte:"REGISTRO APURAÇÃO ICMS ATUALIZADO(5).pdf"}),

  // ICMS FILIAL: débito 84.941,08; créditos 96.584,89 + devoluções 336,32; saldo credor 11.980,13.
  l({id:"JUL-ICMS-F-DEB",data:"31/07/2026",origem:"APURAÇÃO ICMS FILIAL 07/2026",debitoCodigo:"25054",creditoCodigo:"25235",historico:"ICMS debitado nas saídas da filial",documento:"ICMS FILIAL 07/2026",cc:"502",centroCusto:"COMERCIAL SP",valor:84941.08,observacao:"Débito integral conforme apuração da filial.",fonte:"REGISTRO APURAÇÃO ICMS FILIAL 07/2026"}),
  l({id:"JUL-ICMS-F-CRED",data:"31/07/2026",origem:"APURAÇÃO ICMS FILIAL 07/2026",debitoCodigo:"25235",creditoCodigo:"25140",historico:"Créditos ICMS filial - compras, fretes e transferências",documento:"ICMS FILIAL 07/2026",cc:"502",centroCusto:"COMERCIAL SP",valor:96584.89,observacao:"R$ 80.876,62 compras + R$ 1.095,30 fretes + R$ 14.612,97 transferências.",fonte:"REGISTRO APURAÇÃO ICMS FILIAL 07/2026"}),
  l({id:"JUL-ICMS-F-DEV",data:"31/07/2026",origem:"APURAÇÃO ICMS FILIAL 07/2026",debitoCodigo:"25235",creditoCodigo:"25054",historico:"Crédito ICMS devoluções filial",documento:"CFOP 1202",cc:"502",centroCusto:"COMERCIAL SP",valor:336.32,observacao:"Crédito por devoluções.",fonte:"REGISTRO APURAÇÃO ICMS FILIAL 07/2026"}),
  l({id:"JUL-ICMS-F-SALDO",data:"31/07/2026",origem:"APURAÇÃO ICMS FILIAL 07/2026",debitoCodigo:"25040",creditoCodigo:"25235",historico:"Transferência do saldo credor ICMS da filial para ativo",documento:"ICMS FILIAL 07/2026",cc:"502",centroCusto:"COMERCIAL SP",valor:11980.13,observacao:"Zera a conta de apuração e reconhece o crédito fiscal a recuperar; não existe ICMS filial a recolher em julho.",fonte:"REGISTRO APURAÇÃO ICMS FILIAL 07/2026",rastreio:"derivado"}),

  // IPI matriz e filial.
  l({id:"JUL-IPI-M-DEB",data:"31/07/2026",origem:"APURAÇÃO IPI MATRIZ 07/2026",debitoCodigo:"2826",creditoCodigo:"1543",historico:"IPI debitado nas saídas da matriz",documento:"IPI MATRIZ 07/2026",cc:"201",centroCusto:"VENDAS",valor:163781.72,observacao:"Débito oficial da apuração.",fonte:"REGISTRO APURAÇÃO IPI(6).pdf"}),
  l({id:"JUL-IPI-M-CRED",data:"31/07/2026",origem:"APURAÇÃO IPI MATRIZ 07/2026",debitoCodigo:"1543",creditoCodigo:"3093",historico:"Créditos IPI sobre entradas da matriz",documento:"IPI MATRIZ 07/2026",cc:"102",centroCusto:"PRODUÇÃO",valor:81678.38,observacao:"Créditos oficiais; saldo líquido a recolher R$ 82.103,34.",fonte:"REGISTRO APURAÇÃO IPI(6).pdf"}),
  l({id:"JUL-IPI-F-CRED",data:"31/07/2026",origem:"APURAÇÃO IPI FILIAL 07/2026",debitoCodigo:"25236",creditoCodigo:"25055",historico:"Crédito IPI devolução filial",documento:"IPI FILIAL 07/2026",cc:"502",centroCusto:"COMERCIAL SP",valor:88.04,observacao:"Crédito oficial; débito da filial R$ 32.002,17 já está na base, saldo líquido R$ 31.914,13.",fonte:"REGISTRO APURAÇÃO IPI FILIAL 07/2026"}),
];

type Cred = [string,number,string];
const pis:Cred[] = [["3093",10191.55,"1101"],["25139",6079.23,"1102"],["25937",5543.71,"1124"],["2829",55.11,"1201"],["2829",25.29,"1202"],["3494",508.74,"1252"],["3095",262.88,"1352"],["3093",3095.20,"2101"],["2829",440.05,"2201"],["3095",1605.31,"2352"],["2829",25.03,"2911"],["3093",6076.81,"3101"]];
const cof:Cred[] = [["3093",46942.87,"1101"],["25139",28001.26,"1102"],["25937",25534.08,"1124"],["2830",253.83,"1201"],["2830",116.45,"1202"],["3494",2343.27,"1252"],["3095",1210.84,"1352"],["3093",14256.67,"2101"],["2830",2026.88,"2201"],["3095",7393.98,"2352"],["2830",115.28,"2911"],["3093",27924.39,"3101"]];
const creditosPisCofins: LancamentoIntegrado[] = [
  ...pis.map(([creditoCodigo,valor,cfop],i)=>l({id:`JUL-PIS-CRED-${String(i+1).padStart(2,"0")}`,data:"31/07/2026",origem:"APURAÇÃO PIS 07/2026",debitoCodigo:"1556",creditoCodigo,historico:`Crédito PIS CFOP ${cfop}`,documento:`CFOP ${cfop}`,cc:"0",centroCusto:"SEM CENTRO DE CUSTO",valor,observacao:"Crédito fiscal aberto pela natureza da entrada; não é lançamento de ajuste por alvo.",fonte:"REGISTRO APURAÇÃO PIS(8).pdf"})),
  ...cof.map(([creditoCodigo,valor,cfop],i)=>l({id:`JUL-COF-CRED-${String(i+1).padStart(2,"0")}`,data:"31/07/2026",origem:"APURAÇÃO COFINS 07/2026",debitoCodigo:"1552",creditoCodigo,historico:`Crédito COFINS CFOP ${cfop}`,documento:`CFOP ${cfop}`,cc:"0",centroCusto:"SEM CENTRO DE CUSTO",valor,observacao:"Crédito fiscal aberto pela natureza da entrada; não é lançamento de ajuste por alvo.",fonte:"REGISTRO APURAÇÃO COFINS(4).pdf"})),
];

const filialCompras: LancamentoIntegrado[] = [
  l({id:"JUL-FIL-COMP-1102",data:"31/07/2026",origem:"ENTRADAS FILIAL 07/2026",debitoCodigo:"25139",creditoCodigo:"1496",historico:"Compras externas da filial - mercadorias para revenda",documento:"CFOP 1102",cc:"502",centroCusto:"COMERCIAL SP",valor:493098.04,observacao:"Compra externa documentada da filial. Créditos tributários são contabilizados separadamente.",fonte:"RESUMO NOTAS FISCAIS ENTRADA FILIAL 07/2026"}),
];

// Folha matriz + filial e suas provisões entram no Razão antes do fechamento de estoque/depreciação.
const antesEstoque = [...baseSaneada,...lancamentosBancariosOperacionaisJulho,...impostosEstaduaisFederais,...creditosPisCofins,...filialCompras,...lancamentosFolhaJulho];
function movConta(c:string,base:LancamentoIntegrado[]) { return arred(base.reduce((s,x)=>s+(x.debitoCodigo===c?x.valor:0)-(x.creditoCodigo===c?x.valor:0),0)); }

const estoqueMatriz:Record<string,number>={"25133":4207698.55,"25134":39464.14,"25135":1443376.19,"25136":107919.59,"25137":5285.59};
const fechamentoEstoqueMatriz: LancamentoIntegrado[] = Object.entries(estoqueMatriz).flatMap(([contaEstoque, saldoFinal], indice) => {
  const saldoAntesFechamento = arred((saldoAberturaJulhoPorConta.get(contaEstoque) ?? 0) + movConta(contaEstoque, antesEstoque));
  const lancamentos: LancamentoIntegrado[] = [];
  if (Math.abs(saldoAntesFechamento) >= 0.005) {
    lancamentos.push(l({
      id: `JUL-CPV-M-BAIXA-${String(indice + 1).padStart(2, "0")}`,
      data: "31/07/2026",
      origem: "FECHAMENTO ESTOQUE MATRIZ 07/2026",
      debitoCodigo: "25944",
      creditoCodigo: contaEstoque,
      historico: `Baixa integral do saldo de estoque ${contaEstoque} antes do inventario de 31/07`,
      documento: "INVENTARIO 31/07/2026",
      cc: "102",
      centroCusto: "PRODUCAO",
      valor: Math.abs(saldoAntesFechamento),
      observacao: `Saldo zerado no fechamento: ${saldoAntesFechamento.toFixed(2)} antes do inventario final.`,
      fonte: "SALDO DE ABERTURA + RAZAO JULHO 2026",
      rastreio: "derivado",
    }));
  }
  if (Math.abs(saldoFinal) >= 0.005) {
    lancamentos.push(l({
      id: `JUL-CPV-M-FINAL-${String(indice + 1).padStart(2, "0")}`,
      data: "31/07/2026",
      origem: "FECHAMENTO ESTOQUE MATRIZ 07/2026",
      debitoCodigo: contaEstoque,
      creditoCodigo: "25944",
      historico: `Reconhecimento do inventario final do estoque ${contaEstoque} em 31/07`,
      documento: "INVENTARIO 31/07/2026",
      cc: "102",
      centroCusto: "PRODUCAO",
      valor: Math.abs(saldoFinal),
      observacao: `Saldo final mantido no estoque pelo inventario fisico: ${saldoFinal.toFixed(2)}.`,
      fonte: "REGISTRO INVENTARIO ESTOQUE ATUALIZADO 31/07/2026",
      rastreio: "derivado",
    }));
  }
  return lancamentos;
});

// Filial: o inventário oficial de 31/07 contém Produto Acabado (PA),
// R$ 577.396,32. A conta 25139 também possui saldo patrimonial transportado de
// junho, mas esse saldo anterior não pode virar custo de julho sem documento de
// venda/baixa. Por isso somente o movimento líquido das compras de julho é
// encerrado no CPV; o saldo anterior permanece destacado para conciliação.
const aberturaFilial = saldoAberturaJulhoPorConta.get("25138") ?? 254477.93;
const comprasLiquidasFilialJulho = movConta("25139", antesEstoque);
const fechamentoEstoqueFilial: LancamentoIntegrado[] = [
  l({id:"JUL-CPV-F-ABERT",data:"31/07/2026",origem:"FECHAMENTO ESTOQUE FILIAL 07/2026",debitoCodigo:"25945",creditoCodigo:"25138",historico:"Baixa do estoque inicial da filial para apuração do CPV de julho",documento:"SALDO 30/06 + INVENTÁRIO",cc:"502",centroCusto:"COMERCIAL SP",valor:Math.abs(aberturaFilial),observacao:"Fechamento periódico do estoque; não é lançamento de abertura gerencial.",fonte:"Saldo contábil fechado 30/06/2026",rastreio:"derivado"}),
  l({id:"JUL-CPV-F-COMP",data:"31/07/2026",origem:"FECHAMENTO ESTOQUE FILIAL 07/2026",debitoCodigo:"25945",creditoCodigo:"25139",historico:"Encerramento das compras líquidas de julho da filial no CPV",documento:"CFOP 1102 + CRÉDITOS 07/2026",cc:"502",centroCusto:"COMERCIAL SP",valor:Math.abs(comprasLiquidasFilialJulho),observacao:`Somente as compras líquidas da competência foram encerradas: R$ ${comprasLiquidasFilialJulho.toFixed(2)}. O saldo anterior de R$ ${(saldoAberturaJulhoPorConta.get("25139") ?? 0).toFixed(2)} permanece patrimonial até conciliação, sem contaminar o resultado de julho.`,fonte:"RESUMO NOTAS FISCAIS ENTRADA FILIAL 07/2026 + EFD Contribuições",rastreio:"derivado"}),
  l({id:"JUL-CPV-F-FINAL",data:"31/07/2026",origem:"FECHAMENTO ESTOQUE FILIAL 07/2026",debitoCodigo:"25138",creditoCodigo:"25945",historico:"Reconhecimento do estoque físico final da filial em 31/07",documento:"INVENTÁRIO FILIAL 31/07/2026",cc:"502",centroCusto:"COMERCIAL SP",valor:577396.32,observacao:"Inventário oficial: 6.629 peças / 38.778,209 kg / R$ 577.396,32.",fonte:"REGISTRO INVENTARIO ESTOQUE FILIAL 31/07/2026"}),
];

const antesDepreciacao: LancamentoIntegrado[] = [...antesEstoque,...fechamentoEstoqueMatriz,...fechamentoEstoqueFilial];
export const calculoDepreciacaoJulho = calcularDepreciacaoImobilizado(antesDepreciacao, "31/07/2026");
export const posicoesImobilizadoJulho = calculoDepreciacaoJulho;

export const lancamentosIntegradosJulhoFinal: LancamentoIntegrado[] = [...antesDepreciacao,...calculoDepreciacaoJulho.lancamentos];
export const totalDebitosJulhoFinal=arred(lancamentosIntegradosJulhoFinal.reduce((s,x)=>s+x.valor,0));
export const totalCreditosJulhoFinal=totalDebitosJulhoFinal;
export const pendenciasJulhoFinal=lancamentosIntegradosJulhoFinal.filter(x=>x.status==="revisar");
export const resumoFechamentoJulhoFinal={
  lancamentos:lancamentosIntegradosJulhoFinal.length,
  debitos:totalDebitosJulhoFinal,
  creditos:totalCreditosJulhoFinal,
  movimentosBancariosFonte:resumoLancamentosBancariosOperacionaisJulho.movimentosFonteUnicos,
  gruposBancarios:resumoLancamentosBancariosOperacionaisJulho.gruposContabeis,
  pendenciasBancariasValor:resumoLancamentosBancariosOperacionaisJulho.valorEmRevisao,
  pisCreditos:arred(pis.reduce((s,x)=>s+x[1],0)),cofinsCreditos:arred(cof.reduce((s,x)=>s+x[1],0)),
  icmsMatrizRecolher:99012.38,icmsFilialCredito:11980.13,ipiMatrizRecolher:82103.34,ipiFilialRecolher:31914.13,
  estoqueMatrizFinal:5803744.06,estoqueFilialFinal:577396.32,
  imobilizadoBruto:calculoDepreciacaoJulho.totalBruto,
  depreciacaoAcumulada:calculoDepreciacaoJulho.totalDepreciacaoAcumulada,
  saldoResidualImobilizado:calculoDepreciacaoJulho.totalResidual,
  depreciacaoJulho:calculoDepreciacaoJulho.totalDepreciacaoCalculada,
  gruposDepreciacaoCalculados:calculoDepreciacaoJulho.gruposCalculaveis,
  gruposImobilizadoSemRegra:calculoDepreciacaoJulho.gruposSemRegra,
  folhaJulho:resumoFolhaJulho,
  itensSemFonteJulho:[],
  itensMantidosForaPorDecisao:["JCP","Juros de mora/ativos não suportados","Juros passivos","Variação cambial"],
} as const;

const foraJulho=lancamentosIntegradosJulhoFinal.find(x=>!/^\d{2}\/07\/2026$/.test(x.data));
const receitaCircular=lancamentosIntegradosJulhoFinal.find(x=>["2606","2655"].includes(x.creditoCodigo)&&`${x.origem} ${x.fonte}`.toUpperCase().includes("DRE"));
const aberturaGerencial=lancamentosIntegradosJulhoFinal.find(x=>/ABERTURA GERENCIAL|IMPLANTAÇÃO GERENCIAL/i.test(`${x.origem} ${x.historico}`));
if(foraJulho)throw new Error(`Razão julho contém data fora da competência: ${foraJulho.id}`);
if(receitaCircular)throw new Error(`Receita circular alimentada pela DRE: ${receitaCircular.id}`);
if(aberturaGerencial)throw new Error(`Abertura gerencial indevida no Razão: ${aberturaGerencial.id}`);
