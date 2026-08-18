import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { lancamentosIntegradosJulhoFinal, resumoFechamentoJulhoFinal } from "./nitaplast-razao-julho-final-v2";
import { resumoFinanceiroJulho } from "./nitaplast-financeiro-julho";
import { estabelecimentoResultadoNitaplast } from "./nitaplast-estabelecimento";

const arred=(v:number)=>Math.round(v*100)/100;
const classificacaoPorConta=new Map(saldosImplantacao.map(c=>[c.conta,c.classificacao]));
const descricaoPorConta=new Map(saldosImplantacao.map(c=>[c.conta,c.descricao]));

type EstabelecimentoResultado="Matriz"|"Filial SP";
type Acc={codigo:string;classificacao:string;descricao:string;cc:string;centroCusto:string;estabelecimento:EstabelecimentoResultado;debitos:number;creditos:number;valor:number;status:"validado"|"revisar";fonte:string};
export type ComposicaoResultadoJulho = {
  id:string;conta:string;classificacao:string;descricao:string;cc:string;centroCusto:string;estabelecimento:EstabelecimentoResultado;
  valor:number;status:"validado"|"revisar";fonte:string;debitos:number;creditos:number;
};

/*
 * Regra estrutural: o Razão forma o Balancete e o Balancete forma a DRE.
 * A DRE não cria valor. O estabelecimento também é herdado da evidência do
 * lançamento (conta dedicada, CC, origem/documento/fonte) antes da apresentação.
 */
const contasCustoOperacionalJulho=new Set(["3093","3095"]);
export const contasReceitasFinanceirasJulho=new Set([
  "4927", // Descontos obtidos
  "25095", // Juros ativos
  "25096", // Variações cambiais ativas
  "25097", // Receitas eventuais
  "25098", // Aplicações financeiras
  "25099", // Recuperação de despesas
  "25100", // Amostra grátis recebida
  "25101", // Atualização pela SELIC
]);

export function ehCustoDreJulho(x:Pick<ComposicaoResultadoJulho,"conta"|"classificacao">){
  return x.classificacao.startsWith("4.2")||x.classificacao.startsWith("5.1")||contasCustoOperacionalJulho.has(x.conta);
}
export function ehDespesaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"classificacao">){return x.classificacao.startsWith("5.8");}
export function ehReceitaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){return contasReceitasFinanceirasJulho.has(x.conta);}
export function ehDespesaOperacionalDreJulho(x:Pick<ComposicaoResultadoJulho,"conta"|"classificacao">){
  return x.classificacao.startsWith("5.")&&!ehCustoDreJulho(x)&&!ehDespesaFinanceiraDreJulho(x)&&!ehReceitaFinanceiraDreJulho(x);
}

export function calcularDreJulhoFinal(base: LancamentoIntegrado[]) {
  function mov(codigo:string){return arred(base.reduce((s,l)=>s+(l.debitoCodigo===codigo?l.valor:0)-(l.creditoCodigo===codigo?l.valor:0),0));}
  function movEstabelecimento(codigo:string,estabelecimento:EstabelecimentoResultado){
    return arred(base.reduce((s,l)=>{
      const est=estabelecimentoResultadoNitaplast(l,codigo);
      if(est!==estabelecimento)return s;
      return s+(l.debitoCodigo===codigo?l.valor:0)-(l.creditoCodigo===codigo?l.valor:0);
    },0));
  }
  function creditoLiquido(codigo:string){return arred(-mov(codigo));}
  function creditoLiquidoEstab(codigo:string,estabelecimento:EstabelecimentoResultado){return arred(-movEstabelecimento(codigo,estabelecimento));}

  const receitaProducao=creditoLiquido("2606");
  const receitaRevenda=creditoLiquido("2655");
  const receitaBruta=arred(receitaProducao+receitaRevenda);
  const devolucoes=Math.max(0,mov("25943"));
  const icmsMatriz=Math.max(0,mov("2827"));
  const icmsFilial=Math.max(0,mov("25054"));
  const icms=arred(icmsMatriz+icmsFilial);
  const icmsSt=Math.max(0,mov("2832"));
  const ipiMatriz=Math.max(0,mov("2826"));
  const ipiFilial=Math.max(0,mov("25055"));
  const ipi=arred(ipiMatriz+ipiFilial);
  const pis=Math.max(0,mov("2829"));
  const cofins=Math.max(0,mov("2830"));
  const deducoes=arred(devolucoes+icms+icmsSt+ipi+pis+cofins);
  const receitaLiquida=arred(receitaBruta-deducoes);

  // Abertura Matriz/Filial de contas compartilhadas: somente a parcela identificada
  // documentalmente como Filial é destacada; o restante permanece Matriz.
  const devolucoesFilial=Math.max(0,movEstabelecimento("25943","Filial SP"));
  const devolucoesMatriz=arred(devolucoes-devolucoesFilial);
  const pisFilial=Math.max(0,movEstabelecimento("2829","Filial SP"));
  const pisMatriz=arred(pis-pisFilial);
  const cofinsFilial=Math.max(0,movEstabelecimento("2830","Filial SP"));
  const cofinsMatriz=arred(cofins-cofinsFilial);
  const icmsStFilial=Math.max(0,movEstabelecimento("2832","Filial SP"));
  const icmsStMatriz=arred(icmsSt-icmsStFilial);

  const mapa=new Map<string,Acc>();
  for(const l of base){
    for(const lado of ["D","C"] as const){
      const codigo=lado==="D"?l.debitoCodigo:l.creditoCodigo;
      const classificacao=classificacaoPorConta.get(codigo)??"";
      if(!(classificacao.startsWith("4.2")||classificacao.startsWith("5.")))continue;
      const estabelecimento=estabelecimentoResultadoNitaplast(l,codigo);
      const chave=`${codigo}|${l.cc}|${estabelecimento}`;
      const atual=mapa.get(chave)??{codigo,classificacao,descricao:descricaoPorConta.get(codigo)??"Conta a revisar",cc:l.cc,centroCusto:l.centroCusto,estabelecimento,debitos:0,creditos:0,valor:0,status:"validado",fonte:l.fonte};
      if(lado==="D")atual.debitos+=l.valor;else atual.creditos+=l.valor;
      atual.valor=arred(atual.debitos-atual.creditos);
      if(l.status==="revisar")atual.status="revisar";
      mapa.set(chave,atual);
    }
  }

  const composicao:ComposicaoResultadoJulho[]=[...mapa.values()]
    .filter(x=>Math.abs(x.valor)>=0.005)
    .map((x,i)=>({id:`DRE-JUL-${i+1}`,conta:x.codigo,classificacao:x.classificacao,descricao:x.descricao,cc:x.cc,centroCusto:x.centroCusto,estabelecimento:x.estabelecimento,valor:x.valor,status:x.status,fonte:x.fonte,debitos:arred(x.debitos),creditos:arred(x.creditos)}));

  const custosItens=composicao.filter(ehCustoDreJulho);
  const custos=arred(custosItens.reduce((s,x)=>s+x.valor,0));
  const custosMatriz=arred(custosItens.filter(x=>x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const custosFilial=arred(custosItens.filter(x=>x.estabelecimento==="Filial SP").reduce((s,x)=>s+x.valor,0));
  const cpvMatriz=arred(custosItens.filter(x=>x.conta==="25944").reduce((s,x)=>s+x.valor,0));
  const cpvFilial=arred(custosItens.filter(x=>x.conta==="25945").reduce((s,x)=>s+x.valor,0));
  const outrosCustosMatriz=arred(custosMatriz-cpvMatriz);
  const outrosCustosFilial=arred(custosFilial-cpvFilial);
  if(Math.abs(arred(custosMatriz+custosFilial)-custos)>0.01)throw new Error("Custos Matriz + Filial não conciliam com o Razão.");
  if(Math.abs(arred(cpvMatriz+cpvFilial+outrosCustosMatriz+outrosCustosFilial)-custos)>0.01)throw new Error("Abertura CPV Matriz/Filial não concilia com custos.");

  const despesasOperacionaisItens=composicao.filter(ehDespesaOperacionalDreJulho);
  const despesasOperacionais=arred(despesasOperacionaisItens.reduce((s,x)=>s+x.valor,0));
  const despesasOperacionaisMatriz=arred(despesasOperacionaisItens.filter(x=>x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const despesasOperacionaisFilial=arred(despesasOperacionaisItens.filter(x=>x.estabelecimento==="Filial SP").reduce((s,x)=>s+x.valor,0));
  if(Math.abs(arred(despesasOperacionaisMatriz+despesasOperacionaisFilial)-despesasOperacionais)>0.01)throw new Error("Despesas operacionais Matriz + Filial não conciliam.");

  const despesasFinanceirasItens=composicao.filter(ehDespesaFinanceiraDreJulho);
  const despesasFinanceiras=arred(despesasFinanceirasItens.reduce((s,x)=>s+x.valor,0));
  const despesasFinanceirasMatriz=arred(despesasFinanceirasItens.filter(x=>x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const despesasFinanceirasFilial=arred(despesasFinanceirasItens.filter(x=>x.estabelecimento==="Filial SP").reduce((s,x)=>s+x.valor,0));
  const despesas=arred(despesasOperacionais+despesasFinanceiras);

  const receitasFinanceirasPorConta=Object.fromEntries([...contasReceitasFinanceirasJulho].map(codigo=>[codigo,Math.max(0,creditoLiquido(codigo))])) as Record<string,number>;
  const receitasFinanceiras=arred(Object.values(receitasFinanceirasPorConta).reduce((s,v)=>s+v,0));
  const receitasFinanceirasFilial=arred([...contasReceitasFinanceirasJulho].reduce((s,codigo)=>s+Math.max(0,creditoLiquidoEstab(codigo,"Filial SP")),0));
  const receitasFinanceirasMatriz=arred(receitasFinanceiras-receitasFinanceirasFilial);
  const jurosAtivos=receitasFinanceirasPorConta["25095"]??0;
  const variacaoCambialAtiva=receitasFinanceirasPorConta["25096"]??0;
  const receitaAplicacoes=receitasFinanceirasPorConta["25098"]??0;
  const jcp=Math.max(0,mov("25107"));
  const variacaoCambialPassiva=Math.max(0,mov("25109"));
  const resultado=arred(receitaLiquida-custos-despesas+receitasFinanceiras);

  const somaReceitasAbertas=arred(Object.values(receitasFinanceirasPorConta).reduce((s,v)=>s+v,0));
  if(Math.abs(somaReceitasAbertas-receitasFinanceiras)>0.01)throw new Error(`Abertura de receitas financeiras não concilia: ${somaReceitasAbertas.toFixed(2)} / ${receitasFinanceiras.toFixed(2)}`);
  if(Math.abs(arred(receitasFinanceirasMatriz+receitasFinanceirasFilial)-receitasFinanceiras)>0.01)throw new Error("Receitas financeiras Matriz + Filial não conciliam.");

  return {composicao,dre:{
    receitaProducao,receitaRevenda,receitaBruta,
    devolucoes,devolucoesMatriz,devolucoesFilial,
    icms,icmsMatriz,icmsFilial,icmsSt,icmsStMatriz,icmsStFilial,
    ipi,ipiMatriz,ipiFilial,pis,pisMatriz,pisFilial,cofins,cofinsMatriz,cofinsFilial,deducoes,receitaLiquida,
    custosReconhecidos:custos,custosMatriz,custosFilial,cpvMatriz,cpvFilial,outrosCustosMatriz,outrosCustosFilial,
    despesasReconhecidas:despesas,despesasOperacionais,despesasOperacionaisMatriz,despesasOperacionaisFilial,
    despesasFinanceiras,despesasFinanceirasMatriz,despesasFinanceirasFilial,
    receitasFinanceiras,receitasFinanceirasMatriz,receitasFinanceirasFilial,receitasFinanceirasPorConta,
    jurosAtivos,variacaoCambialAtiva,receitaAplicacoes,jcp,variacaoCambialPassiva,resultado,
    status:"fechado_com_pendencias" as const,fechadoEm:"18/08/2026",
    criterioFechamento:"Razão → Balancete → DRE. Toda linha de resultado é segregada por estabelecimento somente quando o próprio lançamento fornece evidência; nenhuma abertura gerencial cria fato contábil.",
    resumoRazao:resumoFechamentoJulhoFinal,financeiro:resumoFinanceiroJulho,
    pendenciasNaoBloqueantes:[`R$ ${resumoFinanceiroJulho.valorEntradasSemCcPendente.toFixed(2)} de entradas ainda sem distribuição completa por centro de custo`,`${resumoFinanceiroJulho.contratosCambioPendentes} contrato(s) de câmbio aguardando amarração do valor contábil de origem`],
    itensSemFonte:[`R$ ${resumoFinanceiroJulho.valorEntradasSemCcPendente.toFixed(2)} de entradas ainda sem centro de custo/documento suficiente`,`Contratos de câmbio ainda pendentes de valor contábil de origem: ${resumoFinanceiroJulho.contratosCambioPendentes}`],
  }} as const;
}

const calculoEstatico=calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
export const composicaoResultadoJulhoFinal=calculoEstatico.composicao;
export const dreJulhoFinal=calculoEstatico.dre;

const servicosAdmClassificadosComoCusto=composicaoResultadoJulhoFinal.find(x=>x.conta==="25938"&&["302","303","304","305","306","501"].includes(x.cc)&&ehCustoDreJulho(x));
if(servicosAdmClassificadosComoCusto)throw new Error(`Serviço administrativo classificado indevidamente como custo: ${servicosAdmClassificadosComoCusto.id}`);
const industrializacaoClassificadaComoCusto=composicaoResultadoJulhoFinal.find(x=>x.conta==="25937"&&ehCustoDreJulho(x));
if(industrializacaoClassificadaComoCusto)throw new Error(`Industrialização permaneceu indevidamente em Custos/CPV/CMV: ${industrializacaoClassificadaComoCusto.id}`);
const cpvFilialEmMatriz=composicaoResultadoJulhoFinal.find(x=>x.conta==="25945"&&x.estabelecimento!=="Filial SP");
if(cpvFilialEmMatriz)throw new Error(`CPV Filial sem identificação de estabelecimento: ${cpvFilialEmMatriz.id}`);

const vcaRazao=arred(-lancamentosIntegradosJulhoFinal.reduce((s,l)=>s+(l.debitoCodigo==="25096"?l.valor:0)-(l.creditoCodigo==="25096"?l.valor:0),0));
if(Math.abs(Math.max(0,vcaRazao)-dreJulhoFinal.variacaoCambialAtiva)>0.01)throw new Error("Variação cambial ativa do Razão não conciliou com a DRE.");
const vcpRazao=arred(lancamentosIntegradosJulhoFinal.reduce((s,l)=>s+(l.debitoCodigo==="25109"?l.valor:0)-(l.creditoCodigo==="25109"?l.valor:0),0));
if(Math.abs(Math.max(0,vcpRazao)-dreJulhoFinal.variacaoCambialPassiva)>0.01)throw new Error("Variação cambial passiva do Razão não conciliou com a DRE.");
