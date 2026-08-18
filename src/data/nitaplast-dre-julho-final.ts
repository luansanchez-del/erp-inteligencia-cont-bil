import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { lancamentosIntegradosJulhoFinal, resumoFechamentoJulhoFinal } from "./nitaplast-razao-julho-final-v2";
import { resumoFinanceiroJulho } from "./nitaplast-financeiro-julho";

const arred=(v:number)=>Math.round(v*100)/100;
const classificacaoPorConta=new Map(saldosImplantacao.map(c=>[c.conta,c.classificacao]));
const descricaoPorConta=new Map(saldosImplantacao.map(c=>[c.conta,c.descricao]));

type Acc={codigo:string;classificacao:string;descricao:string;cc:string;centroCusto:string;debitos:number;creditos:number;valor:number;status:"validado"|"revisar";fonte:string};
export type ComposicaoResultadoJulho = {
  id:string;conta:string;classificacao:string;descricao:string;cc:string;centroCusto:string;
  valor:number;status:"validado"|"revisar";fonte:string;debitos:number;creditos:number;
};

/*
 * O plano legado possui diversas despesas operacionais dentro do grupo 5.3.
 * Portanto 5.3 não pode ser tratado integralmente como CPV/CMV. Mantemos como
 * custo somente as contas cuja natureza documental é efetivamente de compra,
 * frete de matéria-prima ou industrialização. As demais contas 5.3 seguem o
 * centro de custo na apresentação gerencial da DRE.
 */
const contasCustoOperacionalJulho=new Set(["3093","3095","25937"]);
const contasReceitasFinanceiras=new Set(["25095","25096","25098"]);

export function ehCustoDreJulho(x:Pick<ComposicaoResultadoJulho,"conta"|"classificacao">){
  return x.classificacao.startsWith("4.2")||x.classificacao.startsWith("5.1")||contasCustoOperacionalJulho.has(x.conta);
}

export function ehDespesaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"classificacao">){
  return x.classificacao.startsWith("5.8");
}

export function ehDespesaOperacionalDreJulho(x:Pick<ComposicaoResultadoJulho,"conta"|"classificacao">){
  return x.classificacao.startsWith("5.")
    && !ehCustoDreJulho(x)
    && !ehDespesaFinanceiraDreJulho(x)
    && !contasReceitasFinanceiras.has(x.conta);
}

/**
 * Calcula a DRE de julho exclusivamente a partir do Razão informado.
 * A função existe para que lançamentos/reclassificações manuais da competência
 * percorram a mesma cadeia Razão → Balancete → DRE, sem manter uma DRE paralela.
 */
export function calcularDreJulhoFinal(base: LancamentoIntegrado[]) {
  function mov(codigo:string){return arred(base.reduce((s,l)=>s+(l.debitoCodigo===codigo?l.valor:0)-(l.creditoCodigo===codigo?l.valor:0),0));}
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

  const mapa=new Map<string,Acc>();
  for(const l of base){
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

  const composicao:ComposicaoResultadoJulho[]=[...mapa.values()]
    .filter(x=>Math.abs(x.valor)>=0.005)
    .map((x,i)=>({id:`DRE-JUL-${i+1}`,conta:x.codigo,classificacao:x.classificacao,descricao:x.descricao,cc:x.cc,centroCusto:x.centroCusto,valor:x.valor,status:x.status,fonte:x.fonte,debitos:arred(x.debitos),creditos:arred(x.creditos)}));

  const custos=arred(composicao.filter(ehCustoDreJulho).reduce((s,x)=>s+x.valor,0));
  const despesasOperacionais=arred(composicao.filter(ehDespesaOperacionalDreJulho).reduce((s,x)=>s+x.valor,0));
  const despesasFinanceiras=arred(composicao.filter(ehDespesaFinanceiraDreJulho).reduce((s,x)=>s+x.valor,0));
  const despesas=arred(despesasOperacionais+despesasFinanceiras);
  const jurosAtivos=Math.max(0,creditoLiquido("25095"));
  const variacaoCambialAtiva=Math.max(0,creditoLiquido("25096"));
  const receitaAplicacoes=Math.max(0,creditoLiquido("25098"));
  const receitasFinanceiras=arred(jurosAtivos+variacaoCambialAtiva+receitaAplicacoes);
  const jcp=Math.max(0,mov("25107"));
  const variacaoCambialPassiva=Math.max(0,mov("25109"));
  const resultado=arred(receitaLiquida-custos-despesas+receitasFinanceiras);

  return {
    composicao,
    dre:{
      receitaProducao,receitaRevenda,receitaBruta,devolucoes,icms,icmsSt,ipi,pis,cofins,deducoes,receitaLiquida,
      custosReconhecidos:custos,despesasReconhecidas:despesas,despesasOperacionais,despesasFinanceiras,
      receitasFinanceiras,jurosAtivos,variacaoCambialAtiva,receitaAplicacoes,jcp,variacaoCambialPassiva,resultado,
      status:"fechado_com_pendencias" as const,
      fechadoEm:"18/08/2026",
      criterioFechamento:"Documentos reais → Razão → Balancete → DRE. Custos são definidos pela natureza contábil/documental; despesas operacionais do grupo 5.3 são apresentadas pelo centro de custo. Pendência documental não vira estimativa.",
      resumoRazao:resumoFechamentoJulhoFinal,
      financeiro:resumoFinanceiroJulho,
      pendenciasNaoBloqueantes:[
        `R$ ${resumoFinanceiroJulho.valorEntradasSemCcPendente.toFixed(2)} de entradas ainda sem distribuição completa por centro de custo`,
        `${resumoFinanceiroJulho.contratosCambioPendentes} contrato(s) de câmbio aguardando amarração do valor contábil de origem`,
      ],
      itensSemFonte:[
        `R$ ${resumoFinanceiroJulho.valorEntradasSemCcPendente.toFixed(2)} de entradas ainda sem centro de custo/documento suficiente`,
        `Contratos de câmbio ainda pendentes de valor contábil de origem: ${resumoFinanceiroJulho.contratosCambioPendentes}`,
      ],
    },
  } as const;
}

const calculoEstatico=calcularDreJulhoFinal(lancamentosIntegradosJulhoFinal);
export const composicaoResultadoJulhoFinal=calculoEstatico.composicao;
export const dreJulhoFinal=calculoEstatico.dre;

const servicosAdmClassificadosComoCusto=composicaoResultadoJulhoFinal.find(x=>x.conta==="25938"&&["302","303","304","305","306"].includes(x.cc)&&ehCustoDreJulho(x));
if(servicosAdmClassificadosComoCusto) throw new Error(`Serviço administrativo classificado indevidamente como custo: ${servicosAdmClassificadosComoCusto.id}`);