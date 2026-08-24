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
const contasCpvFechadoJulho=new Set(["25944","25945"]);
const contasEstoquePatrimonialJulho=new Set(["25133","25134","25135","25136","25137","25138","25139"]);
const contasCreditoFederalJulho=new Set(["25946","25947"]);
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

type ChaveClassificacaoResultado=Pick<ComposicaoResultadoJulho,"conta"|"classificacao">;
type ChaveClassificacaoCusto=Pick<ComposicaoResultadoJulho,"conta"|"classificacao"|"cc">;

function ehCustoDreJulhoCriterioAnterior(x:ChaveClassificacaoResultado){
  return x.classificacao.startsWith("4.2")||x.classificacao.startsWith("5.1")||x.conta==="3093"||x.conta==="3095";
}
export function ehCustoDreJulho(x:ChaveClassificacaoCusto){
  if(contasEstoquePatrimonialJulho.has(x.conta)) return false;
  if(contasCpvFechadoJulho.has(x.conta)||x.classificacao.startsWith("5.1")) return true;

  // O CPV segue a movimentação periódica dos estoques, como no fechamento de
  // maio. O centro de custo, isoladamente, não transforma despesa em custo de
  // estoque/produto vendido. Serviços de industrialização permanecem nas
  // despesas operacionais, em grupo próprio.
  if(x.conta==="3093") return true;

  // Fretes sem vínculo documental com a matéria-prima, materiais de uso e
  // consumo, energia, manutenção e serviços gerais permanecem como despesas da
  // área correspondente. Não entram no CPV somente por estarem em CC produtivo.
  return false;
}
export function ehDespesaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"classificacao">){return x.classificacao.startsWith("5.8");}
export function ehReceitaFinanceiraDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){return contasReceitasFinanceirasJulho.has(x.conta);}
export function ehReceitaAlienacaoImobilizadoDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){return x.conta==="4736";}
export function ehCustoAlienacaoImobilizadoDreJulho(x:Pick<ComposicaoResultadoJulho,"conta">){return x.conta==="4760";}
function ehDespesaOperacionalDreJulhoCriterioAnterior(x:ChaveClassificacaoResultado){
  return x.classificacao.startsWith("5.")&&!ehCustoDreJulhoCriterioAnterior(x)&&!ehDespesaFinanceiraDreJulho(x)&&!ehReceitaFinanceiraDreJulho(x)&&!contasAlienacaoImobilizadoJulho.has(x.conta);
}
export function ehDespesaOperacionalDreJulho(x:ChaveClassificacaoCusto){
  return x.classificacao.startsWith("5.")&&!ehCustoDreJulho(x)&&!ehDespesaFinanceiraDreJulho(x)&&!ehReceitaFinanceiraDreJulho(x)&&!contasAlienacaoImobilizadoJulho.has(x.conta)&&!contasCreditoFederalJulho.has(x.conta);
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

  const custosItensCriterioAnterior=composicao.filter(ehCustoDreJulhoCriterioAnterior);
  const custosCriterioAnterior=arred(custosItensCriterioAnterior.reduce((s,x)=>s+x.valor,0));
  const custosItens=composicao.filter(ehCustoDreJulho);
  const custos=arred(custosItens.reduce((s,x)=>s+x.valor,0));
  const reclassificacaoIndustrialParaCpv=arred(custos-custosCriterioAnterior);
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

  const saldo=(codigo:string)=>balancete.saldosAnaliticos.find(x=>x.conta===codigo);
  const contasEstoqueMatriz=["25133","25134","25135","25136","25137"];
  const estoqueInicialMatriz=arred(contasEstoqueMatriz.reduce((s,c)=>s+(saldo(c)?.saldoAnterior??0),0));
  const estoqueFinalMatriz=arred(contasEstoqueMatriz.reduce((s,c)=>s+(saldo(c)?.saldoAtual??0),0));
  const comprasLiquidasMatriz=Math.max(0,mov("3093"));
  const industrializacaoLiquidaMatriz=arred(composicao.filter(x=>x.conta==="25937"&&x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const estoqueInicialFilial=saldo("25138")?.saldoAnterior??0;
  const comprasParaRevendaAberturaFilial=saldo("25139")?.saldoAnterior??0;
  const fechamentoComprasFilial=base.find(x=>x.id==="JUL-CPV-F-COMP")?.valor??0;
  const ajusteExtemporaneoComprasFilial=base.find(x=>x.id==="JUL-AJ-FIL-COMP-JUN")?.valor??0;
  const comprasLiquidasJulhoFilial=arred(fechamentoComprasFilial);
  const estoqueFinalFilial=saldo("25138")?.saldoAtual??0;
  const saldoFinalComprasFilial=saldo("25139")?.saldoAtual??0;
  if(Math.abs(arred(saldoFinalComprasFilial-(comprasParaRevendaAberturaFilial-ajusteExtemporaneoComprasFilial)))>0.01)throw new Error(`Saldo remanescente da conta 25139 não conciliou após a correção extemporânea: ${saldoFinalComprasFilial.toFixed(2)}.`);
  if(Math.abs(arred(estoqueInicialMatriz+comprasLiquidasMatriz-estoqueFinalMatriz)-cpvMatriz)>0.01)throw new Error("Memória do CPV Matriz não concilia com o Razão.");
  if(Math.abs(arred(estoqueInicialFilial+comprasLiquidasJulhoFilial+ajusteExtemporaneoComprasFilial-estoqueFinalFilial)-cpvFilial)>0.01)throw new Error("Memória do CPV Filial não concilia com o Razão.");

  const despesasOperacionaisItensCriterioAnterior=composicao.filter(ehDespesaOperacionalDreJulhoCriterioAnterior);
  const despesasOperacionaisCriterioAnterior=arred(despesasOperacionaisItensCriterioAnterior.reduce((s,x)=>s+x.valor,0));
  const despesasOperacionaisItens=composicao.filter(ehDespesaOperacionalDreJulho);
  const despesasOperacionais=arred(despesasOperacionaisItens.reduce((s,x)=>s+x.valor,0));
  const despesasOperacionaisMatriz=arred(despesasOperacionaisItens.filter(x=>x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const despesasOperacionaisFilial=arred(despesasOperacionaisItens.filter(x=>x.estabelecimento==="Filial SP").reduce((s,x)=>s+x.valor,0));
  const creditosFederais=arred(composicao.filter(x=>contasCreditoFederalJulho.has(x.conta)).reduce((s,x)=>s+x.valor,0));
  if(Math.abs(arred(despesasOperacionaisMatriz+despesasOperacionaisFilial)-despesasOperacionais)>0.01)throw new Error("Despesas operacionais Matriz + Filial não conciliam com o Balancete.");

  const despesasFinanceirasItens=composicao.filter(ehDespesaFinanceiraDreJulho);
  const despesasFinanceiras=arred(despesasFinanceirasItens.reduce((s,x)=>s+x.valor,0));
  const despesasFinanceirasMatriz=arred(despesasFinanceirasItens.filter(x=>x.estabelecimento==="Matriz").reduce((s,x)=>s+x.valor,0));
  const despesasFinanceirasFilial=arred(despesasFinanceirasItens.filter(x=>x.estabelecimento==="Filial SP").reduce((s,x)=>s+x.valor,0));
  const despesas=arred(despesasOperacionais+despesasFinanceiras+creditosFederais);

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

  // Ajustes de conciliação com a DRE apresentada pelo cliente (planilha 07/2026). NENHUM dos
  // dois é lançado no Razão/Balancete — o Balancete continua fechando só com o Razão real.
  //
  // 1) CC 503 (Manutenção SP) é Filial e já compõe integralmente "Despesas Comerciais —
  //    Filial SP" (bate com o cliente). A planilha do cliente soma esse mesmo valor de novo em
  //    "Despesas de Produção"/"Despesas com Industrialização" (Matriz): despesa do cliente
  //    R$ 19.225,58 maior que a nossa, então o resultado comparável precisa ser R$ 19.225,58
  //    menor. Pendente de confirmação do cliente/Domínio sobre a origem da duplicidade.
  //
  // 2) ICMS/COFINS Matriz: nossa apuração de ICMS "saídas externas" (R$ 230.381,99) não
  //    segrega as 3 notas de venda do imobilizado (Mini Cooper + Corolla + Transformador,
  //    R$ 306.900,00, fora da Receita Operacional Bruta) do restante das saídas — o ICMS
  //    específico dessas notas nunca foi documentado (planilha Composicao_ICMS_Imobilizado
  //    ainda está "a preencher"). Os créditos de COFINS por CFOP (1201/1202/2201/2911,
  //    R$ 2.512,44) também não têm segregação Matriz/Filial na fonte (EFD bloco D). Nossa
  //    dedução de ICMS+COFINS Matriz fica R$ 3.768,38 maior que a do cliente, então o
  //    resultado comparável precisa ser R$ 3.768,38 maior. Pendente do detalhamento fiscal.
  const ajusteConciliacaoClienteCC503Producao=-18252.55;
  const ajusteConciliacaoClienteCC503Industrializacao=-973.03;
  const ajusteConciliacaoClienteCC503=arred(ajusteConciliacaoClienteCC503Producao+ajusteConciliacaoClienteCC503Industrializacao);
  const ajusteConciliacaoClienteIcmsCofinsMatriz=3768.38;
  const ajusteConciliacaoClienteTotal=arred(ajusteConciliacaoClienteCC503+ajusteConciliacaoClienteIcmsCofinsMatriz);
  const resultadoConciliadoClienteJulho=arred(resultado+ajusteConciliacaoClienteTotal);
  const despesasCriterioAnterior=arred(despesasOperacionaisCriterioAnterior+despesasFinanceiras);
  const resultadoCriterioAnterior=arred(receitaLiquida-custosCriterioAnterior-despesasCriterioAnterior+receitasFinanceiras+resultadoAlienacaoImobilizado);
  const impactoResultadoReclassificacao=arred(resultado-resultadoCriterioAnterior);
  if(Math.abs(impactoResultadoReclassificacao)>0.01)throw new Error(`Reclassificação industrial alterou indevidamente o resultado em ${impactoResultadoReclassificacao.toFixed(2)}.`);

  const somaReceitasAbertas=arred(Object.values(receitasFinanceirasPorConta).reduce((s,v)=>s+v,0));
  if(Math.abs(somaReceitasAbertas-receitasFinanceiras)>0.01)throw new Error(`Abertura de receitas financeiras não concilia: ${somaReceitasAbertas.toFixed(2)} / ${receitasFinanceiras.toFixed(2)}`);
  if(Math.abs(arred(receitasFinanceirasMatriz+receitasFinanceirasFilial)-receitasFinanceiras)>0.01)throw new Error("Receitas financeiras Matriz + Filial não conciliam.");
  if(Math.abs(receitaAlienacaoImobilizado-306900)>0.01)throw new Error(`Venda de imobilizado reconhecida deveria ser R$ 306.900,00; encontrado ${receitaAlienacaoImobilizado.toFixed(2)}.`);
  if(Math.abs(custoAlienacaoImobilizado-203278.15)>0.01)throw new Error(`Custo residual dos ativos vendidos deveria ser R$ 203.278,15; encontrado ${custoAlienacaoImobilizado.toFixed(2)}.`);
  if(Math.abs(resultadoAlienacaoImobilizado-103621.85)>0.01)throw new Error("Resultado de Mini + Corolla + Transformador não conciliou em R$ 103.621,85.");
  // Energia líquida de ICMS, PIS e COFINS recuperáveis. Os créditos reduzem
  // diretamente o custo fabril e não aparecem como linha autônoma na DRE.
  if(Math.abs(energiaDebitosMatriz-35286.38)>0.01||Math.abs(energiaCreditosMatriz-19998.21)>0.01||Math.abs(energiaEletricaMatriz-15288.17)>0.01){
    throw new Error(`Energia elétrica julho não concilia. Débitos ${energiaDebitosMatriz.toFixed(2)}, créditos ${energiaCreditosMatriz.toFixed(2)}, líquido ${energiaEletricaMatriz.toFixed(2)}.`);
  }

  const pendenciasBloqueantes:string[]=[];

  return {composicao,dre:{
    receitaProducao,receitaRevenda,receitaBruta,
    devolucoes,devolucoesMatriz,devolucoesFilial,
    icms,icmsMatriz,icmsFilial,icmsFilialTransferenciasInternas,icmsSt,icmsStMatriz,icmsStFilial,
    ipi,ipiMatriz,ipiFilial,pis,pisMatriz,pisFilial,cofins,cofinsMatriz,cofinsFilial,deducoes,receitaLiquida,
    custosReconhecidos:custos,custosMatriz,custosFilial,cpvMatriz,cpvFilial,fechamentoEstoqueMatriz,fechamentoEstoqueFilial,outrosCustosMatriz,outrosCustosFilial,
    memoriaCpv:{
      matriz:{estoqueInicial:estoqueInicialMatriz,comprasLiquidas:comprasLiquidasMatriz,estoqueFinal:estoqueFinalMatriz,industrializacaoLiquida:industrializacaoLiquidaMatriz,total:cpvMatriz},
      filial:{estoqueInicial:estoqueInicialFilial,comprasParaRevendaAbertura:comprasParaRevendaAberturaFilial,ajusteExtemporaneoComprasJunho:ajusteExtemporaneoComprasFilial,comprasLiquidasJulho:comprasLiquidasJulhoFilial,estoqueFinal:estoqueFinalFilial,saldoFinalComprasParaRevenda:saldoFinalComprasFilial,total:cpvFilial},
    },
    despesasReconhecidas:despesas,despesasOperacionais,despesasOperacionaisMatriz,despesasOperacionaisFilial,creditosFederais,
    despesasFinanceiras,despesasFinanceirasMatriz,despesasFinanceirasFilial,
    receitasFinanceiras,receitasFinanceirasMatriz,receitasFinanceirasFilial,receitasFinanceirasPorConta,
    jurosAtivos,variacaoCambialAtiva,receitaAplicacoes,jcp,variacaoCambialPassiva,
    receitaAlienacaoImobilizado,custoAlienacaoImobilizado,resultadoAlienacaoImobilizado,
    vendasAtivoImobilizadoFiscais,vendasAtivoImobilizadoReconhecidas,vendaAtivoImobilizadoPendente,
    energiaEletricaMatriz,energiaDebitosMatriz,energiaCreditosMatriz,
    simulacaoCpv:{
      cpvAntes:custosCriterioAnterior,
      cpvDepois:custos,
      reclassificadoParaCpv:reclassificacaoIndustrialParaCpv,
      despesasOperacionaisAntes:despesasOperacionaisCriterioAnterior,
      despesasOperacionaisDepois:despesasOperacionais,
      resultadoAntes:resultadoCriterioAnterior,
      resultadoDepois:resultado,
      impactoResultado:impactoResultadoReclassificacao,
    },
    conferenciaBalancete:balancete.conferencia,
    resultado,
    ajusteConciliacaoCliente:{
      cc503:{
        producao:ajusteConciliacaoClienteCC503Producao,
        industrializacao:ajusteConciliacaoClienteCC503Industrializacao,
        total:ajusteConciliacaoClienteCC503,
        criterio:"CC 503 (Manutenção SP) é Filial e já compõe integralmente Despesas Comerciais — Filial SP. A DRE do cliente soma o mesmo valor novamente em Despesas de Produção/Industrialização da Matriz. Não lançado no Razão; pendente de confirmação do cliente/Domínio.",
      },
      icmsCofinsMatriz:{
        total:ajusteConciliacaoClienteIcmsCofinsMatriz,
        criterio:"ICMS das 3 notas de venda do imobilizado (fora da Receita Operacional Bruta) não está segregado da apuração de saídas externas, e os créditos de COFINS por CFOP não têm segregação Matriz/Filial na fonte. Não lançado no Razão; pendente do detalhamento fiscal (ICMS por NF do imobilizado e EFD bloco D por estabelecimento).",
      },
      total:ajusteConciliacaoClienteTotal,
    },
    resultadoConciliadoClienteJulho,
    status:"fechado_com_pendencias" as const,fechadoEm:"18/08/2026",
    possuiPendenciaBloqueante:false as const,
    pendenciasBloqueantes,
    criterioFechamento:"Documento/fato real → Razão → Balancete → DRE. A DRE lê o movimento mensal das contas analíticas do Balancete; saldo acumulado e conta sintética não são somados para formar resultado. O CPV decorre da movimentação periódica dos estoques. Gastos por área, inclusive produção e industrialização, permanecem em despesas operacionais conforme a estrutura de maio/2026.",
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
const industrializacaoIndevidaNoCpv=composicaoResultadoJulhoFinal.find(x=>x.conta==="25937"&&ehCustoDreJulho(x));
if(industrializacaoIndevidaNoCpv)throw new Error(`Industrialização classificada indevidamente no CPV: ${industrializacaoIndevidaNoCpv.id}`);
const materialConsumoNoCpv=composicaoResultadoJulhoFinal.find(x=>x.conta==="3244"&&ehCustoDreJulho(x));
if(materialConsumoNoCpv)throw new Error(`Material de uso/consumo classificado indevidamente no CPV: ${materialConsumoNoCpv.id}`);
const servicoGeralNoCpv=composicaoResultadoJulhoFinal.find(x=>x.conta==="25938"&&ehCustoDreJulho(x));
if(servicoGeralNoCpv)throw new Error(`Serviço geral classificado indevidamente no CPV apenas pelo centro de custo: ${servicoGeralNoCpv.id}`);
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
// Conciliação com o EFD Contribuições: os débitos apurados por estabelecimento.
// A DRE apresenta o movimento líquido da conta (débitos de apuração menos créditos
// de transporte já contabilizados), por isso a conciliação é feita sobre o débito bruto.
const debitoApurado=(id:string)=>arred(lancamentosIntegradosJulhoFinal.filter(l=>l.id===id).reduce((s,l)=>s+l.valor,0));
if(Math.abs(debitoApurado("JUL-TAX-PIS-M")-43082.61)>0.01||Math.abs(debitoApurado("JUL-TAX-PIS-F")-6737.69)>0.01)throw new Error("Abertura PIS Matriz/Filial não conciliou ao EFD Contribuições.");
if(Math.abs(debitoApurado("JUL-TAX-COF-M")-198442.47)>0.01||Math.abs(debitoApurado("JUL-TAX-COF-F")-31034.21)>0.01)throw new Error("Abertura COFINS Matriz/Filial não conciliou ao EFD Contribuições.");
if(Math.abs(arred(dreJulhoFinal.pisMatriz+dreJulhoFinal.pisFilial)-dreJulhoFinal.pis)>0.01)throw new Error("Soma PIS Matriz + Filial não fecha com o PIS consolidado da DRE.");
if(Math.abs(arred(dreJulhoFinal.cofinsMatriz+dreJulhoFinal.cofinsFilial)-dreJulhoFinal.cofins)>0.01)throw new Error("Soma COFINS Matriz + Filial não fecha com o COFINS consolidado da DRE.");
