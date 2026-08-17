import { saldosImplantacao } from "./nitaplast-implantacao";
import { lancamentosIntegradosJulhoFinal, resumoFechamentoJulhoFinal } from "./nitaplast-razao-julho-final";

const arred=(v:number)=>Math.round(v*100)/100;
const classificacaoPorConta=new Map(saldosImplantacao.map(c=>[c.conta,c.classificacao]));
const descricaoPorConta=new Map(saldosImplantacao.map(c=>[c.conta,c.descricao]));

function mov(codigo:string){return arred(lancamentosIntegradosJulhoFinal.reduce((s,l)=>s+(l.debitoCodigo===codigo?l.valor:0)-(l.creditoCodigo===codigo?l.valor:0),0));}
function creditoLiquido(codigo:string){return arred(-mov(codigo));}

const receitaProducao=creditoLiquido("2606");
const receitaRevenda=creditoLiquido("2655");
const receitaBruta=arred(receitaProducao+receitaRevenda);
const devolucoes=Math.max(0,mov("25943"));
const icms=arred(Math.max(0,mov("2827"))+Math.max(0,mov("25054")));
const icmsSt=Math.max(0,mov("2832"));
const ipi=arred(Math.max(0,mov("2826"))+Math.max(0,mov("25055")));
const pis=Math.max(0,mov("2829"));
const cofins=Math.max(0,mov("2830"));
const deducoes=arred(devolucoes+icms+icmsSt+ipi+pis+cofins);
const receitaLiquida=arred(receitaBruta-deducoes);

type Acc={codigo:string;classificacao:string;descricao:string;cc:string;centroCusto:string;debitos:number;creditos:number;valor:number;status:"validado"|"revisar";fonte:string};
const mapa=new Map<string,Acc>();
for(const l of lancamentosIntegradosJulhoFinal){
  for(const lado of ["D","C"] as const){
    const codigo=lado==="D"?l.debitoCodigo:l.creditoCodigo;
    const classificacao=classificacaoPorConta.get(codigo)??"";
    if(!(classificacao.startsWith("4.2")||classificacao.startsWith("5."))) continue;
    const chave=`${codigo}|${l.cc}`;
    const atual=mapa.get(chave)??{codigo,classificacao,descricao:descricaoPorConta.get(codigo)??"Conta a revisar",cc:l.cc,centroCusto:l.centroCusto,debitos:0,creditos:0,valor:0,status:"validado",fonte:l.fonte};
    if(lado==="D")atual.debitos+=l.valor; else atual.creditos+=l.valor;
    atual.valor=arred(atual.debitos-atual.creditos);
    if(l.status==="revisar")atual.status="revisar";
    mapa.set(chave,atual);
  }
}
export const composicaoResultadoJulhoFinal=[...mapa.values()].filter(x=>Math.abs(x.valor)>=0.005).map((x,i)=>({id:`DRE-JUL-${i+1}`,conta:x.codigo,classificacao:x.classificacao,descricao:x.descricao,cc:x.cc,centroCusto:x.centroCusto,valor:x.valor,status:x.status,fonte:x.fonte,debitos:arred(x.debitos),creditos:arred(x.creditos)}));

const custos=arred(composicaoResultadoJulhoFinal.filter(x=>x.classificacao.startsWith("4.2")||x.classificacao.startsWith("5.1")).reduce((s,x)=>s+x.valor,0));
const despesas=arred(composicaoResultadoJulhoFinal.filter(x=>x.classificacao.startsWith("5.")&&!x.classificacao.startsWith("5.1")).reduce((s,x)=>s+x.valor,0));
const receitasFinanceiras=Math.max(0,creditoLiquido("25098"));
const resultado=arred(receitaLiquida-custos-despesas+receitasFinanceiras);

export const dreJulhoFinal={
  receitaProducao,receitaRevenda,receitaBruta,devolucoes,icms,icmsSt,ipi,pis,cofins,deducoes,receitaLiquida,
  custosReconhecidos:custos,despesasReconhecidas:despesas,receitasFinanceiras,resultado,
  status:"em_fechamento" as const,
  resumoRazao:resumoFechamentoJulhoFinal,
  itensSemFonte:["Folha/provisões 07/2026"]
} as const;