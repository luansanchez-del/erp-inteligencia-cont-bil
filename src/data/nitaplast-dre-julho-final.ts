import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { lancamentosIntegradosJulhoFinal, resumoFechamentoJulhoFinal } from "./nitaplast-razao-julho-final-v2";
import { resumoFinanceiroJulho } from "./nitaplast-financeiro-julho";
import { calcularBalanceteJulho } from "./nitaplast-balancete-julho-engine";

const arred=(v:number)=>Math.round(v*100)/100;

type EstabelecimentoResultado="Matriz"|"Filial SP";
export type ComposicaoResultadoJulho = {
  id:string;conta:string;classificacao:string;descricao:string;cc:string;centroCusto:string;estabelecimento:EstabelecimentoResultado;
  valor:number;status:"validado"|"revisar";fonte:string;debitos:number;creditos:number;
};

/*
 * Regra estrutural obrigatória:
 * documento/fato real -> Razão -> Balancete -> DRE.
 * A DRE consome o MOVIMENTO mensal das contas analíticas do Balancete.
 * Saldo acumulado não alimenta DRE e nenhuma linha gerencial cria débito/crédito.
 */
const contasCustoOperacionalJulho=new Set(["3093","3095"]);
const contasAlienacaoImobilizadoJulho=new Set(["4736","4760"]);
export const contasReceitasFinanceirasJulho=new Set([
  "4927",
  "25095",
  "25096",
  "25097",
  "25098",
  "25099",
  "25100",
  "25101",
]);

export function ehCustoDreJulho(x:Pick<ComposicaoResultadoJulho,"conta"|"classificacao">){
  return x.classificacao.startsWith("4.2")||x.classificacao.startsWith("5.1")||contasCustoOperacionalJulho.has(x.conta);
}
export function ehDespesaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"classificacao">){return x.classificacao.startsWith("5.8");}
export function ehReceitaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){return contasReceitasFinanceirasJulho.has(x.conta);}
export function ehReceitaAlienacaoImobilizadoDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){return x.conta==="4736";}
export function ehCustoAlienacaoImobilizadoDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){return x.conta==="4760";}
export function ehDespesaOperacionalDreJulho(x:Pick<ComposicaoResultadoJulho,"conta"|"classificacao">){
  return x.classificacao.startsWith("5.")&&!ehCustoDreJulho(x)&&!ehDespesaFinanceiraDreJulho(x)&&!ehReceitaFinanceiraDreJulho(x)&&!contasAlienacaoImobilizadoJulho.has(x.conta);
}

export function calcularDreJulhoFinal(base: LancamentoIntegrado[]) {
  const balancete=calcularBalanceteJulho(base);

  // A origem dos totais é o Balancete analítico, nunca um segundo cálculo paralelo.
  function mov(codigo:string){return balancete.movimentoPorConta.get(codigo)?.movimento??0;}
  function movExcluindo(codigo:string,idsExcluidos:Set<string>){
    const excluido=arred(base.filter(l=>idsExcluidos.has(l.id)).reduce((s,l)=>s+(l.debitoCodigo===codigo?l.valor:0)-(l.creditoCodigo===codigo?l.valor:0),0));
    return arred(mov(codigo)-excluido);
  }
  function movEstabelecimento(codigo:string,estabelecimento:EstabelecimentoResultado){
    return arred(balancete.movimentosDetalhados.filter(x=>x.conta===codigo&&x.estabelecimento===estabelecimento).reduce((s,x)=>s+x.movimento,0));
  }
  function creditoLiquido(codigo:string){return arred(-mov(codigo));}
  function creditoLiquidoEstab(codigo:string,estabelecimento:EstabelecimentoResultado){return arred(-movEstabelecimento(codigo,estabelecimento));}

  const receitaProducao=creditoLiquido("2606");
  const receitaRevenda=creditoLiquido("2655");
  const receitaBruta=arred(receitaProducao+receitaRevenda);
  const devolucoes=Math.max(0,mov("25943"));
  const icmsMatriz=Math.max(0,mov("2827"));

  // ICMS de transferência permanece contabilizado no Balancete, mas não é dedução de venda na DRE.
  const idsIcmsTransferenciaInterna=new Set(["JUL-ICMS-F-DEB-TRANSF"]);
  const icmsFilial=Math.max(0,movExcluindo("25054",idsIcmsTransferenciaInterna));
  const icmsFilialTransferenciasInternas=Math.max(0,arred(base.filter(l=>idsIcmsTransferenciaInterna.has(l.id)).reduce((s,l)=>s+(l.debitoCodigo==="25054"?l.valor:0)-(l.creditoCodigo==="25054"?l.valor:0),0)));
  const icms=arred(icmsMatriz+icmsFilial);

  const icmsSt=Math.max(0,mov("2832"));
  const ipiMatriz=Math.max(0,mov("2826"));
  const ipiFilial=Math.max(0,mov("25055"));
  const ipi=arred(ipiMatriz+ipiFilial);
  const pis=Math.max(0,mov("2829"));
  const cofins=Math.max(0,mov("2830"));
  const deducoes=arred(devolucoes+icms+icmsSt+ipi+pis+cofins);
  const receitaLiquida=arred(receitaBruta-deducoes);

  const devolucoesFilial=Math.max(0,movEstabelecimento("25943","Filial SP"));
  const devolucoesMatriz=arred(devolucoes-devolucoesFilial);
  const pisFilial=Math.max(0,movEstabelecimento("2829","Filial SP"));
  const pisMatriz=arred(pis-pisFilial);
  const cofinsFilial=Math.max(0,movEstabelecimento("2830","Filial SP"));
  const cofinsMatriz=arred(cofins-cofinsFilial);
  const icmsStFilial=Math.max(0,movEstabelecimento("2832","Filial SP"));
  const icmsStMatriz=arred(icmsSt-icmsStFilial);

  // Composição por CC/estabelecimento é a abertura analítica do mesmo Balancete.
  const composicao:ComposicaoResultadoJulho[]=balancete.movimentosDetalhados
    .filter(x=>x.classificacao.startsWith("4.2")||x.classificacao.startsWith("5."))
    .map((x,i)=>({
      id:`DRE-JUL-${i+1}`,
      conta:x.conta,
      classificacao:x.classificacao,
      descricao:x.descricao,
      cc:x.cc,
      centroCusto:x.centroCusto,
      estabelecimento:x.estabelecimento,
      valor:x.movimento,
      status:x.status,
      fonte:x.fonte,
      debitos:x.debitos,
      creditos:x.creditos,
    }));

  // Trava: a abertura detalhada de cada conta de resultado deve fechar com o movimento do Balancete.
  const contasResultado=[...new Set(composicao.map(x=>x.conta))];
  for(const conta of contasResultado){
    const detalhe=arred(composicao.filter(x=>x.conta===conta).reduce((s,x)=>s+x.valor,0));
    if(Math.abs(detalhe-mov(conta))>0.01)throw new Error(`DRE não conciliou com o Balancete na conta ${conta}: ${detalhe.toFixed(2)} / ${mov(conta).toFixed(2)}`);
  }
  if(Math.abs(balancete.conferencia.diferencaDebitosCreditos)>0.01)throw new Error("Razão de julho não fecha: Débitos diferentes de Créditos.");
  if(Math.abs(balancete.conferencia.somaMovimentosAnaliticos)>0.01)throw new Error(`Balancete de julho não fecha no movimento analítico: ${balancete.conferencia.somaMovimentosAnaliticos.toFixed(2)}.`);

  const custosItens=composicao.filter(ehCustoDreJulho);
  const custos=arred(custosItens.reduce((s,x)=>s+x.valor,0));
  const custosMatriz=arred(custosItens.filter(x=>x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const custosFilial=arred(custosItens.filter(x=>x.estabelecimento==="Filial SP").reduce((s,x)=>s+x.valor,0));

  // 25944/25945 são componentes de fechamento de estoque. CPV total é todo o custo do Balancete.
  const fechamentoEstoqueMatriz=arred(custosItens.filter(x=>x.conta==="25944").reduce((s,x)=>s+x.valor,0));
  const fechamentoEstoqueFilial=arred(custosItens.filter(x=>x.conta==="25945").reduce((s,x)=>s+x.valor,0));
  const cpvMatriz=custosMatriz;
  const cpvFilial=custosFilial;
  const outrosCustosMatriz=arred(cpvMatriz-fechamentoEstoqueMatriz);
  const outrosCustosFilial=arred(cpvFilial-fechamentoEstoqueFilial);
  if(Math.abs(arred(cpvMatriz+cpvFilial)-custos)>0.01)throw new Error("CPV Matriz + Filial não concilia com o Balancete.");
  if(Math.abs(arred(fechamentoEstoqueMatriz+outrosCustosMatriz)-cpvMatriz)>0.01)throw new Error("Composição do CPV Matriz não concilia.");
  if(Math.abs(arred(fechamentoEstoqueFilial+outrosCustosFilial)-cpvFilial)>0.01)throw new Error("Composição do CPV Filial não concilia.");

  const despesasOperacionaisItens=composicao.filter(ehDespesaOperacionalDreJulho);
  const despesasOperacionais=arred(despesasOperacionaisItens.reduce((s,x)=>s+x.valor,0));
  const despesasOperacionaisMatriz=arred(despesasOperacionaisItens.filter(x=>x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const despesasOperacionaisFilial=arred(despesasOperacionaisItens.filter(x=>x.estabelecimento==="Filial SP").reduce((s,x)=>s+x.valor,0));
  if(Math.abs(arred(despesasOperacionaisMatriz+despesasOperacionaisFilial)-despesasOperacionais)>0.01)throw new Error("Despesas operacionais Matriz + Filial não conciliam com o Balancete.");

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

  const receitaAlienacaoImobilizado=Math.max(0,creditoLiquido("4736"));
  const custoAlienacaoImobilizado=Math.max(0,mov("4760"));
  const resultadoAlienacaoImobilizado=arred(receitaAlienacaoImobilizado-custoAlienacaoImobilizado);
  const vendasAtivoImobilizadoFiscais=306900;
  const vendasAtivoImobilizadoReconhecidas=receitaAlienacaoImobilizado;
  const vendaAtivoImobilizadoPendente=arred(vendasAtivoImobilizadoFiscais-vendasAtivoImobilizadoReconhecidas);

  const energiaEletricaItens=composicao.filter(x=>x.conta==="3494"&&x.estabelecimento==="Matriz");
  const energiaEletricaMatriz=arred(energiaEletricaItens.reduce((s,x)=>s+x.valor,0));
  const energiaDebitosMatriz=arred(energiaEletricaItens.reduce((s,x)=>s+x.debitos,0));
  const energiaCreditosMatriz=arred(energiaEletricaItens.reduce((s,x)=>s+x.creditos,0));

  const resultado=arred(receitaLiquida-custos-despesas+receitasFinanceiras+resultadoAlienacaoImobilizado);

  const somaReceitasAbertas=arred(Object.values(receitasFinanceirasPorConta).reduce((s,v)=>s+v,0));
  if(Math.abs(somaReceitasAbertas-receitasFinanceiras)>0.01)throw new Error(`Abertura de receitas financeiras não concilia: ${somaReceitasAbertas.toFixed(2)} / ${receitasFinanceiras.toFixed(2)}`);
  if(Math.abs(arred(receitasFinanceirasMatriz+receitasFinanceirasFilial)-receitasFinanceiras)>0.01)throw new Error("Receitas financeiras Matriz + Filial não conciliam.");
  if(Math.abs(receitaAlienacaoImobilizado-246900)>0.01)throw new Error(`Venda de imobilizado reconhecida deveria ser R$ 246.900,00; encontrado ${receitaAlienacaoImobilizado.toFixed(2)}.`);
  if(Math.abs(custoAlienacaoImobilizado-145639.29)>0.01)throw new Error(`Custo residual dos ativos vendidos deveria ser R$ 145.639,29; encontrado ${custoAlienacaoImobilizado.toFixed(2)}.`);
  if(Math.abs(resultadoAlienacaoImobilizado-101260.71)>0.01)throw new Error("Resultado de Mini + Corolla não conciliou em R$ 101.260,71.");
  if(Math.abs(energiaDebitosMatriz-35286.38)>0.01||Math.abs(energiaCreditosMatriz-17146.20)>0.01||Math.abs(energiaEletricaMatriz-18140.18)>0.01){
    throw new Error(`Energia elétrica julho não concilia. Débitos ${energiaDebitosMatriz.toFixed(2)}, créditos ${energiaCreditosMatriz.toFixed(2)}, líquido ${energiaEletricaMatriz.toFixed(2)}.`);
  }

  const pendenciasBloqueantes=[
    "Transformador seco 1000KVA — NF 93639, venda fiscal de R$ 60.000,00: aguardando valor contábil residual/custo para reconhecer ganho ou perda. Mini Cooper e Corolla já estão contabilizados.",
  ];

  return {composicao,dre:{
    receitaProducao,receitaRevenda,receitaBruta,
    devolucoes,devolucoesMatriz,devolucoesFilial,
    icms,icmsMatriz,icmsFilial,icmsFilialTransferenciasInternas,icmsSt,icmsStMatriz,icmsStFilial,
    ipi,ipiMatriz,ipiFilial,pis,pisMatriz,pisFilial,cofins,cofinsMatriz,cofinsFilial,deducoes,receitaLiquida,
    custosReconhecidos:custos,custosMatriz,custosFilial,cpvMatriz,cpvFilial,fechamentoEstoqueMatriz,fechamentoEstoqueFilial,outrosCustosMatriz,outrosCustosFilial,
    despesasReconhecidas:despesas,despesasOperacionais,despesasOperacionaisMatriz,despesasOperacionaisFilial,
    despesasFinanceiras,despesasFinanceirasMatriz,despesasFinanceirasFilial,
    receitasFinanceiras,receitasFinanceirasMatriz,receitasFinanceirasFilial,receitasFinanceirasPorConta,
    jurosAtivos,variacaoCambialAtiva,receitaAplicacoes,jcp,variacaoCambialPassiva,
    receitaAlienacaoImobilizado,custoAlienacaoImobilizado,resultadoAlienacaoImobilizado,
    vendasAtivoImobilizadoFiscais,vendasAtivoImobilizadoReconhecidas,vendaAtivoImobilizadoPendente,
    energiaEletricaMatriz,energiaDebitosMatriz,energiaCreditosMatriz,
    conferenciaBalancete:balancete.conferencia,
    resultado,
    status:"fechado_com_pendencias" as const,fechadoEm:"18/08/2026",
    possuiPendenciaBloqueante:true as const,
    pendenciasBloqueantes,
    criterioFechamento:"Documento/fato real → Razão → Balancete → DRE. A DRE lê o movimento mensal das contas analíticas do Balancete; saldo acumulado e conta sintética não são somados para formar resultado.",
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
if(cpvFilialEmMatriz)throw new Error(`Fechamento de estoque da Filial sem identificação de estabelecimento: ${cpvFilialEmMatriz.id}`);
const alienacaoEmDespesa=composicaoResultadoJulhoFinal.find(x=>contasAlienacaoImobilizadoJulho.has(x.conta)&&ehDespesaOperacionalDreJulho(x));
if(alienacaoEmDespesa)throw new Error(`Alienação de imobilizado misturada em despesa operacional: ${alienacaoEmDespesa.id}`);

const vcaRazao=arred(-lancamentosIntegradosJulhoFinal.reduce((s,l)=>s+(l.debitoCodigo==="25096"?l.valor:0)-(l.creditoCodigo==="25096"?l.valor:0),0));
if(Math.abs(Math.max(0,vcaRazao)-dreJulhoFinal.variacaoCambialAtiva)>0.01)throw new Error("Variação cambial ativa do Razão não conciliou com a DRE.");
const vcpRazao=arred(lancamentosIntegradosJulhoFinal.reduce((s,l)=>s+(l.debitoCodigo==="25109"?l.valor:0)-(l.creditoCodigo==="25109"?l.valor:0),0));
if(Math.abs(Math.max(0,vcpRazao)-dreJulhoFinal.variacaoCambialPassiva)>0.01)throw new Error("Variação cambial passiva do Razão não conciliou com a DRE.");

if(Math.abs(dreJulhoFinal.icmsFilial-80710.71)>0.01)throw new Error(`ICMS Filial na DRE deveria ser R$ 80.710,71 após excluir transferências internas e líquido da devolução; encontrado ${dreJulhoFinal.icmsFilial.toFixed(2)}.`);
if(Math.abs(dreJulhoFinal.icmsFilialTransferenciasInternas-3894.05)>0.01)throw new Error("ICMS de transferências internas da Filial não conciliou em R$ 3.894,05.");
if(Math.abs(dreJulhoFinal.pisMatriz-43082.61)>0.01||Math.abs(dreJulhoFinal.pisFilial-6737.69)>0.01)throw new Error("Abertura PIS Matriz/Filial não conciliou ao EFD Contribuições.");
if(Math.abs(dreJulhoFinal.cofinsMatriz-198442.47)>0.01||Math.abs(dreJulhoFinal.cofinsFilial-31034.21)>0.01)throw new Error("Abertura COFINS Matriz/Filial não conciliou ao EFD Contribuições.");
