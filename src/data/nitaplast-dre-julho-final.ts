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
 * A DRE é consequência do Razão. O plano legado possui despesas operacionais no
 * grupo 5.3, portanto prefixo contábil isolado não define CPV/CMV. Industrialização
 * (25937) é apresentada como despesa operacional própria no modelo gerencial do
 * cliente; compras e fretes de matéria-prima permanecem em custo.
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

export function ehDespesaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"classificacao">){
  return x.classificacao.startsWith("5.8");
}

export function ehReceitaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){
  return contasReceitasFinanceirasJulho.has(x.conta);
}

export function ehDespesaOperacionalDreJulho(x:Pick<ComposicaoResultadoJulho,"conta"|"classificacao">){
  return x.classificacao.startsWith("5.")
    && !ehCustoDreJulho(x)
    && !ehDespesaFinanceiraDreJulho(x)
    && !ehReceitaFinanceiraDreJulho(x);
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

  const receitasFinanceirasPorConta=Object.fromEntries(
    [...contasReceitasFinanceirasJulho].map(codigo=>[codigo,Math.max(0,creditoLiquido(codigo))]),
  ) as Record<string,number>;
  const receitasFinanceiras=arred(Object.values(receitasFinanceirasPorConta).reduce((s,v)=>s+v,0));
  const jurosAtivos=receitasFinanceirasPorConta["25095"]??0;
  const variacaoCambialAtiva=receitasFinanceirasPorConta["25096"]??0;
  const receitaAplicacoes=receitasFinanceirasPorConta["25098"]??0;
  const jcp=Math.max(0,mov("25107"));
  const variacaoCambialPassiva=Math.max(0,mov("25109"));
  const resultado=arred(receitaLiquida-custos-despesas+receitasFinanceiras);

  const somaReceitasAbertas=arred(Object.values(receitasFinanceirasPorConta).reduce((s,v)=>s+v,0));
  if(Math.abs(somaReceitasAbertas-receitasFinanceiras)>0.01) throw new Error(`Abertura de receitas financeiras não concilia: ${somaReceitasAbertas.toFixed(2)} / ${receitasFinanceiras.toFixed(2)}`);

  return {
    composicao,
    dre:{
      receitaProducao,receitaRevenda,receitaBruta,devolucoes,icms,icmsSt,ipi,pis,cofins,deducoes,receitaLiquida,
      custosReconhecidos:custos,despesasReconhecidas:despesas,despesasOperacionais,despesasFinanceiras,
      receitasFinanceiras,receitasFinanceirasPorConta,jurosAtivos,variacaoCambialAtiva,receitaAplicacoes,jcp,variacaoCambialPassiva,resultado,
      status:"fechado_com_pendencias" as const,
      fechadoEm:"18/08/2026",
      criterioFechamento:"Documentos reais → Razão → Balancete → DRE. Custos são definidos pela natureza contábil/documental; despesas operacionais são apresentadas pela natureza e pelo centro de custo. Pendência documental não vira estimativa.",
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

const servicosAdmClassificadosComoCusto=composicaoResultadoJulhoFinal.find(x=>x.conta==="25938"&&["302","303","304","305","306","501"].includes(x.cc)&&ehCustoDreJulho(x));
if(servicosAdmClassificadosComoCusto) throw new Error(`Serviço administrativo classificado indevidamente como custo: ${servicosAdmClassificadosComoCusto.id}`);

const industrializacaoClassificadaComoCusto=composicaoResultadoJulhoFinal.find(x=>x.conta==="25937"&&ehCustoDreJulho(x));
if(industrializacaoClassificadaComoCusto) throw new Error(`Industrialização permaneceu indevidamente em Custos/CPV/CMV: ${industrializacaoClassificadaComoCusto.id}`);

const vcaRazao=arred(-lancamentosIntegradosJulhoFinal.reduce((s,l)=>s+(l.debitoCodigo==="25096"?l.valor:0)-(l.creditoCodigo==="25096"?l.valor:0),0));
if(Math.abs(Math.max(0,vcaRazao)-dreJulhoFinal.variacaoCambialAtiva)>0.01) throw new Error("Variação cambial ativa do Razão não conciliou com a DRE.");
const vcpRazao=arred(lancamentosIntegradosJulhoFinal.reduce((s,l)=>s+(l.debitoCodigo==="25109"?l.valor:0)-(l.creditoCodigo==="25109"?l.valor:0),0));
if(Math.abs(Math.max(0,vcpRazao)-dreJulhoFinal.variacaoCambialPassiva)>0.01) throw new Error("Variação cambial passiva do Razão não conciliou com a DRE.");
