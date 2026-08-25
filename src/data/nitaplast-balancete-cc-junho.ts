import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { saldosImplantacao } from "./nitaplast-implantacao";
import { aberturasCcFonte1 } from "./nitaplast-balancete-cc-maio-1";
import { aberturasCcFonte2 } from "./nitaplast-balancete-cc-maio-2";
import { aberturasCcFonte3 } from "./nitaplast-balancete-cc-maio-3";
import { aberturasCcFonte4 } from "./nitaplast-balancete-cc-maio-4";
import { aberturasCcFonte5 } from "./nitaplast-balancete-cc-maio-5";
import { nomesCcFonte } from "./nitaplast-centros-custo-fonte";

const arred = (v:number) => Math.round(v*100)/100;
type AberturaCcFonte = readonly [conta:string,cc:string,saldo:number];
export const aberturasCcImplantacaoMaio:ReadonlyArray<AberturaCcFonte> = [
  ...aberturasCcFonte1,...aberturasCcFonte2,...aberturasCcFonte3,...aberturasCcFonte4,...aberturasCcFonte5,
];

export type LinhaBalanceteCcJunho = {
  chave:string;cc:string;centroCusto:string;conta:string;classificacao:string;descricao:string;grupo:string;
  saldoAnterior:number;debitos:number;creditos:number;movimento:number;saldoAtual:number;lancamentos:number;aberturaRateada:boolean;
};
export type CentroCustoReportJunho = {codigo:string;descricao:string;grupo:string};

export function grupoCentroCustoNitaplast(cc:string) {
  if(cc==="0") return "Sem centro de custo";
  if(/^1\d{4}$/.test(cc)||/^2000\d$/.test(cc)) return "Imobilizado";
  if(/^1\d{2}$/.test(cc)||cc==="541") return "Industrial";
  if(/^2\d{2}$/.test(cc)) return "Comercial";
  if(/^3\d{2}$/.test(cc)) return "Administrativo";
  if(/^4\d{2}$/.test(cc)) return "Veículos";
  if(/^(501|502|503|504|505)$/.test(cc)) return "Despesas Comercial SP";
  if(/^5\d{2}$/.test(cc)) return "Nita SP";
  if(/^6\d{2}$/.test(cc)) return "Barracão";
  if(/^9\d{2}$/.test(cc)) return "Financeiro";
  return "Outros";
}

const estruturaPorConta=new Map(estruturaBalanceteNitaplast.filter(x=>x.tipo==="A").map(x=>[x.conta,x]));
const saldoPorConta=new Map(saldosImplantacao.map(x=>[x.conta,x]));
function saldoImplantadoAssinado(conta:string){const s=saldoPorConta.get(conta);return s?(s.natureza==="C"?-Math.abs(s.saldo):Math.abs(s.saldo)):0;}

const aberturaFontePorConta=new Map<string,AberturaCcFonte[]>();
for(const r of aberturasCcImplantacaoMaio){const a=aberturaFontePorConta.get(r[0])??[];a.push(r);aberturaFontePorConta.set(r[0],a);}

function calcularAberturaPorCc(){
  const valores=new Map<string,number>();const rateadas=new Set<string>();const falhas:string[]=[];
  for(const saldo of saldosImplantacao){
    const alvo=saldoImplantadoAssinado(saldo.conta);const fonte=aberturaFontePorConta.get(saldo.conta);
    if(fonte?.length){
      const totalFonte=arred(fonte.reduce((s,r)=>s+r[2],0));
      if(Math.abs(totalFonte-alvo)<0.02){
        for(const [,cc,valor] of fonte){const k=`${saldo.conta}|${cc}`;valores.set(k,arred((valores.get(k)??0)+valor));}
        rateadas.add(saldo.conta);continue;
      }
      falhas.push(saldo.conta);
    }
    if(Math.abs(alvo)>=0.005) valores.set(`${saldo.conta}|0`,alvo);
  }
  return {valores,rateadas,falhas};
}

export function calcularBalanceteCcJunho(lancamentos:LancamentoIntegrado[]){
  const abertura=calcularAberturaPorCc();
  const movimentos=new Map<string,{debitos:number;creditos:number;lancamentos:number}>();
  const nomesCc=new Map<string,string>(Object.entries(nomesCcFonte));

  for(const x of lancamentos){
    const cc=x.cc||"0";
    if(!nomesCc.has(cc)&&x.centroCusto&&x.centroCusto!=="SEM CENTRO DE CUSTO") nomesCc.set(cc,x.centroCusto);
    const kd=`${x.debitoCodigo}|${cc}`;const d=movimentos.get(kd)??{debitos:0,creditos:0,lancamentos:0};d.debitos+=x.valor;d.lancamentos++;movimentos.set(kd,d);
    const kc=`${x.creditoCodigo}|${cc}`;const c=movimentos.get(kc)??{debitos:0,creditos:0,lancamentos:0};c.creditos+=x.valor;c.lancamentos++;movimentos.set(kc,c);
  }

  const linhas:LinhaBalanceteCcJunho[]=[];
  for(const chave of new Set([...abertura.valores.keys(),...movimentos.keys()])){
    const [conta="",cc="0"]=chave.split("|");const est=estruturaPorConta.get(conta);const saldo=saldoPorConta.get(conta);const m=movimentos.get(chave)??{debitos:0,creditos:0,lancamentos:0};
    const saldoAnterior=arred(abertura.valores.get(chave)??0);const debitos=arred(m.debitos);const creditos=arred(m.creditos);const movimento=arred(debitos-creditos);
    linhas.push({chave,cc,centroCusto:nomesCc.get(cc)??"SEM CENTRO DE CUSTO",conta,classificacao:est?.classificacao??saldo?.classificacao??"",descricao:est?.descricao??saldo?.descricao??"Conta não encontrada no plano",grupo:grupoCentroCustoNitaplast(cc),saldoAnterior,debitos,creditos,movimento,saldoAtual:arred(saldoAnterior+movimento),lancamentos:m.lancamentos,aberturaRateada:abertura.rateadas.has(conta)});
  }
  linhas.sort((a,b)=>a.cc.localeCompare(b.cc,"pt-BR",{numeric:true})||a.classificacao.localeCompare(b.classificacao,"pt-BR",{numeric:true})||a.conta.localeCompare(b.conta,"pt-BR",{numeric:true}));

  const centros:CentroCustoReportJunho[]=[...new Set(linhas.map(x=>x.cc))].map(codigo=>({codigo,descricao:nomesCc.get(codigo)??"SEM CENTRO DE CUSTO",grupo:grupoCentroCustoNitaplast(codigo)})).sort((a,b)=>a.grupo.localeCompare(b.grupo,"pt-BR")||a.codigo.localeCompare(b.codigo,"pt-BR",{numeric:true}));
  const soma=(fn:(x:LinhaBalanceteCcJunho)=>number)=>arred(linhas.reduce((s,x)=>s+fn(x),0));
  const aberturaLedger=arred(saldosImplantacao.reduce((s,x)=>s+(x.natureza==="C"?-Math.abs(x.saldo):Math.abs(x.saldo)),0));
  const aberturaReport=soma(x=>x.saldoAnterior);const totalLanc=arred(lancamentos.reduce((s,x)=>s+x.valor,0));

  return {linhas,centros,resumo:{centros:centros.length,contas:[...new Set(linhas.map(x=>x.conta))].length,debitos:soma(x=>x.debitos),creditos:soma(x=>x.creditos),saldoAnterior:aberturaReport,saldoAtual:soma(x=>x.saldoAtual),contasComAberturaCc:abertura.rateadas.size,contasSemAberturaCc:saldosImplantacao.filter(x=>Math.abs(saldoImplantadoAssinado(x.conta))>=0.005&&!abertura.rateadas.has(x.conta)).length,falhasReconciliacaoAbertura:abertura.falhas,aberturaReconciliada:Math.abs(aberturaReport-aberturaLedger)<0.02,movimentoReconciliado:Math.abs(soma(x=>x.debitos)-totalLanc)<0.02&&Math.abs(soma(x=>x.creditos)-totalLanc)<0.02}} as const;
}
