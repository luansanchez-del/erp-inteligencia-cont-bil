import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Download, Printer, Search } from "lucide-react";
import { ReclassificacaoInteligente } from "@/components/reclassificacao-inteligente";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { estruturaBalanceteNitaplast, type LinhaEstruturaBalancete } from "@/data/nitaplast-balancete-estrutura";
import { calcularBalanceteJulho, contasPosImplantacao } from "@/data/nitaplast-balancete-julho-engine";
import { saldoAberturaJulhoPorConta } from "@/data/nitaplast-saldos-julho";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import type { LancamentoIntegrado } from "@/data/nitaplast-razao-base";
import {
  escopoContaBalanceteNitaplast,
  estabelecimentoLancamentoNitaplast,
  type EscopoContaNitaplast,
  type EstabelecimentoNitaplast,
} from "@/data/nitaplast-estabelecimento";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

const brl=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const arred=(v:number)=>Math.round(v*100)/100;

type LinhaBalancete=LinhaEstruturaBalancete&{saldoAnterior:number;debitos:number;creditos:number;movimento:number;saldoAtual:number;lancamentos:number;estabelecimento:EscopoContaNitaplast};
const contasEstrutura=new Set(estruturaBalanceteNitaplast.map(x=>x.conta));
const estruturaBalanceteCompleta: LinhaEstruturaBalancete[]=[
  ...estruturaBalanceteNitaplast,
  ...contasPosImplantacao
    .filter(([conta])=>!contasEstrutura.has(conta))
    .map(([conta,classificacao,descricao])=>({conta,tipo:"A" as const,classificacao,descricao,nivel:classificacao.split(".").length})),
];
function descendente(a:LinhaEstruturaBalancete,s:LinhaEstruturaBalancete){return a.classificacao===s.classificacao||a.classificacao.startsWith(`${s.classificacao}.`);}
function combinarEscopos(escopos:Iterable<EscopoContaNitaplast>):EscopoContaNitaplast{
  let matriz=false;let filial=false;
  for(const e of escopos){if(e==="Matriz")matriz=true;else if(e==="Filial SP")filial=true;else{matriz=true;filial=true;}}
  if(matriz&&filial)return "Matriz + Filial SP";
  if(filial)return "Filial SP";
  return "Matriz";
}
function calcularBalancete(base:LancamentoIntegrado[]):LinhaBalancete[]{
  const mov=new Map<string,{debitos:number;creditos:number;lancamentos:number}>();
  const estabs=new Map<string,Set<EstabelecimentoNitaplast>>();
  const addEst=(conta:string,e:EstabelecimentoNitaplast)=>{const s=estabs.get(conta)??new Set<EstabelecimentoNitaplast>();s.add(e);estabs.set(conta,s);};
  for(const x of base){
    const e=estabelecimentoLancamentoNitaplast(x);
    const d=mov.get(x.debitoCodigo)??{debitos:0,creditos:0,lancamentos:0};d.debitos+=x.valor;d.lancamentos++;mov.set(x.debitoCodigo,d);addEst(x.debitoCodigo,e);
    const c=mov.get(x.creditoCodigo)??{debitos:0,creditos:0,lancamentos:0};c.creditos+=x.valor;c.lancamentos++;mov.set(x.creditoCodigo,c);addEst(x.creditoCodigo,e);
  }
  const analiticas=estruturaBalanceteCompleta.filter(x=>x.tipo==="A");
  const vals=new Map<string,{saldoAnterior:number;debitos:number;creditos:number;movimento:number;saldoAtual:number;lancamentos:number;estabelecimento:EscopoContaNitaplast}>();
  for(const x of analiticas){
    const m=mov.get(x.conta)??{debitos:0,creditos:0,lancamentos:0};const sa=saldoAberturaJulhoPorConta.get(x.conta)??0;const liq=arred(m.debitos-m.creditos);
    const estabelecimento=escopoContaBalanceteNitaplast(x.conta,x.descricao,estabs.get(x.conta)??[]);
    vals.set(x.conta,{saldoAnterior:sa,debitos:arred(m.debitos),creditos:arred(m.creditos),movimento:liq,saldoAtual:arred(sa+liq),lancamentos:m.lancamentos,estabelecimento});
  }
  return estruturaBalanceteCompleta.map(x=>{
    if(x.tipo==="A")return {...x,...(vals.get(x.conta)??{saldoAnterior:0,debitos:0,creditos:0,movimento:0,saldoAtual:0,lancamentos:0,estabelecimento:escopoContaBalanceteNitaplast(x.conta,x.descricao,[])})};
    const t={saldoAnterior:0,debitos:0,creditos:0,movimento:0,saldoAtual:0,lancamentos:0};const escopos:EscopoContaNitaplast[]=[];
    for(const a of analiticas){if(!descendente(a,x))continue;const v=vals.get(a.conta);if(!v)continue;t.saldoAnterior+=v.saldoAnterior;t.debitos+=v.debitos;t.creditos+=v.creditos;t.movimento+=v.movimento;t.saldoAtual+=v.saldoAtual;t.lancamentos+=v.lancamentos;escopos.push(v.estabelecimento);}
    return {...x,saldoAnterior:arred(t.saldoAnterior),debitos:arred(t.debitos),creditos:arred(t.creditos),movimento:arred(t.movimento),saldoAtual:arred(t.saldoAtual),lancamentos:t.lancamentos,estabelecimento:combinarEscopos(escopos)};
  });
}

function Header({titulo,descricao,acoes}:{titulo:string;descricao:string;acoes?:React.ReactNode}){return <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><h1 className="text-xl font-semibold tracking-tight">{titulo}</h1><p className="mt-1 text-sm text-muted-foreground">{descricao}</p></div><div className="flex flex-wrap gap-2">{acoes}<Badge variant="outline">Matriz + Filial SP · 07/2026</Badge></div></div>}
function Metric({label,value,money=true}:{label:string;value:number;money?:boolean}){return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{money?brl.format(value):value.toLocaleString("pt-BR")}</p></CardContent></Card>}
function Money({value,strong=false}:{value:number;strong?:boolean}){return <td className={`p-2 text-right tabular-nums ${strong?"font-semibold":""}`}>{value<0?`(${brl.format(Math.abs(value))})`:brl.format(value)}</td>}
type CelulaCsv=string|number;
function exportar(nome:string,linhas:CelulaCsv[][],sep=";"){
  const celula=(valor:CelulaCsv)=>typeof valor==="number"
    ? valor.toFixed(2).replace(".",",")
    : `"${String(valor).replaceAll('"','""')}"`;
  const texto=linhas.map(linha=>linha.map(celula).join(sep)).join("\n");
  const blob=new Blob(["\ufeff",texto],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nome;a.click();URL.revokeObjectURL(a.href);
}

function useRazaoJulhoAjustado(){const controles=useReclassificacoesInteligentes("2026-07");const razao=useMemo(()=>controles.aplicar(lancamentosIntegradosJulhoFinal),[controles.aplicar]);return {...controles,razao};}

export function BalanceteJulhoAjustavel(){
  const {razao,reclassificacoes}=useRazaoJulhoAjustado();
  const motor=useMemo(()=>calcularBalanceteJulho(razao),[razao]);
  const balancete=useMemo(()=>calcularBalancete(razao),[razao]);

  // A tela do Balancete não pode divergir do mesmo motor consumido pela DRE.
  const divergencias=useMemo(()=>{
    const motorPorConta=new Map(motor.saldosAnaliticos.map(x=>[x.conta,x]));
    return balancete.filter(x=>x.tipo==="A").filter(x=>{
      const m=motorPorConta.get(x.conta);
      if(!m)return true;
      return Math.abs(x.debitos-m.debitos)>0.01||Math.abs(x.creditos-m.creditos)>0.01||Math.abs(x.movimento-m.movimento)>0.01||Math.abs(x.saldoAtual-m.saldoAtual)>0.01;
    }).map(x=>x.conta);
  },[balancete,motor]);
  if(divergencias.length)throw new Error(`Balancete visual divergiu do motor contábil nas contas: ${divergencias.join(", ")}`);

  const[busca,setBusca]=useState("");const[grupo,setGrupo]=useState("todos");const[soMov,setSoMov]=useState(false);const[zeradas,setZeradas]=useState(false);const[estab,setEstab]=useState("todos");
  const linhas=useMemo(()=>balancete.filter(x=>{const q=busca.trim().toLocaleLowerCase("pt-BR");const zero=Math.abs(x.saldoAnterior)<.005&&Math.abs(x.debitos)<.005&&Math.abs(x.creditos)<.005&&Math.abs(x.saldoAtual)<.005;if(!zeradas&&zero)return false;if(soMov&&Math.abs(x.debitos)+Math.abs(x.creditos)<.005)return false;if(grupo!=="todos"&&x.grupo!==grupo)return false;if(estab!=="todos"&&x.estabelecimento!==estab)return false;if(q&&![x.conta,x.classificacao,x.descricao,x.estabelecimento].join(" ").toLocaleLowerCase("pt-BR").includes(q))return false;return true;}),[balancete,busca,grupo,soMov,zeradas,estab]);
  const revisao=razao.filter(x=>x.status==="revisar").length;
  const conferencia=motor.conferencia;
  const fechado=Math.abs(conferencia.diferencaDebitosCreditos)<0.01&&Math.abs(conferencia.somaMovimentosAnaliticos)<0.01&&Math.abs(conferencia.somaSaldoAtualAnalitico)<0.01&&conferencia.contasRazaoSemEstrutura.length===0;
  const csv=()=>{
    const analiticas=linhas.filter(x=>x.tipo==="A");
    const total=(campo:"debitos"|"creditos"|"saldoAtual")=>arred(analiticas.reduce((s,x)=>s+x[campo],0));
    exportar("Balancete_Nitaplast_07-2026.csv",[
      ["Conta","S/A","Classificação","Descrição","Estabelecimento","Saldo anterior","Débito","Crédito","Movimento","Saldo atual","Incluir na soma","Débito conferência","Crédito conferência","Saldo conferência"],
      ...linhas.map(x=>[x.conta,x.tipo,x.classificacao,x.descricao,x.estabelecimento,x.saldoAnterior,x.debitos,x.creditos,x.movimento,x.saldoAtual,x.tipo==="A"?"SIM":"NÃO",x.tipo==="A"?x.debitos:"",x.tipo==="A"?x.creditos:"",x.tipo==="A"?x.saldoAtual:""]),
      ["","","","TOTAL DAS CONTAS ANALÍTICAS","","","","","","","",total("debitos"),total("creditos"),total("saldoAtual")],
    ]);
  };
  return <div className="grid gap-5">
    <Header titulo="Balancete consolidado - Nitaplast" descricao="Razão → Balancete → DRE. A DRE de 07/2026 lê o movimento mensal deste Balancete." acoes={<><Button variant="outline" size="sm" onClick={csv}><Download className="mr-2 size-4"/>Exportar CSV</Button><Button variant="outline" size="sm" onClick={()=>window.print()}><Printer className="mr-2 size-4"/>Imprimir / PDF</Button></>}/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric label="Partidas do Razão" value={razao.length} money={false}/><Metric label="Débitos 07" value={conferencia.totalDebitos}/><Metric label="Créditos 07" value={conferencia.totalCreditos}/><Metric label="Diferença contábil" value={conferencia.diferencaDebitosCreditos}/><Metric label="Em revisão" value={revisao} money={false}/><Metric label="Reclassificações" value={reclassificacoes.length} money={false}/></div>
    <Card className={fechado?"border-emerald-500/40 bg-emerald-50/40":"border-amber-500/50 bg-amber-50/40"}><CardContent className="pt-5 text-sm"><strong>Conferência contábil: {fechado?"FECHADO":"REVISAR"}.</strong> Débitos − Créditos: <strong>{brl.format(conferencia.diferencaDebitosCreditos)}</strong> · soma do movimento das contas analíticas: <strong>{brl.format(conferencia.somaMovimentosAnaliticos)}</strong> · soma assinada do saldo final analítico: <strong>{brl.format(conferencia.somaSaldoAtualAnalitico)}</strong>. Para conferir se o Balancete zera, some somente as linhas <strong>A (analíticas)</strong> com seus sinais; não some linhas sintéticas + analíticas, pois isso duplica os mesmos saldos.{conferencia.contasRazaoSemEstrutura.length>0?<span className="block mt-2 font-semibold text-amber-800">Contas do Razão ausentes na estrutura do Balancete: {conferencia.contasRazaoSemEstrutura.join(", ")}</span>:null}</CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="text-base">Balancete 07/2026</CardTitle><div className="relative w-full sm:w-96"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar conta, estabelecimento ou descrição"/></div></div></CardHeader><CardContent>
      <div className="mb-4 flex flex-wrap gap-2"><Button size="sm" variant={grupo==="todos"?"default":"outline"} onClick={()=>setGrupo("todos")}>Todos</Button><Button size="sm" variant={grupo==="Ativo"?"default":"outline"} onClick={()=>setGrupo("Ativo")}>Ativo</Button><Button size="sm" variant={grupo==="Passivo e patrimônio líquido"?"default":"outline"} onClick={()=>setGrupo("Passivo e patrimônio líquido")}>Passivo e PL</Button><Button size="sm" variant={grupo==="Receitas acumuladas"?"default":"outline"} onClick={()=>setGrupo("Receitas acumuladas")}>Receitas</Button><Button size="sm" variant={grupo==="Custos e despesas acumulados"?"default":"outline"} onClick={()=>setGrupo("Custos e despesas acumulados")}>Custos e despesas</Button><Button size="sm" variant={soMov?"default":"outline"} onClick={()=>setSoMov(v=>!v)}>Somente com movimento</Button><Button size="sm" variant={zeradas?"default":"outline"} onClick={()=>setZeradas(v=>!v)}>Exibir zeradas</Button><select value={estab} onChange={e=>setEstab(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="todos">Todos os estabelecimentos</option><option value="Matriz">Matriz</option><option value="Filial SP">Filial SP</option><option value="Matriz + Filial SP">Matriz + Filial SP</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-sm"><thead><tr className="border-b bg-muted text-left text-xs"><th className="p-2">Conta</th><th className="p-2">S/A</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">Estabelecimento</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2 text-right">Movimento</th><th className="p-2 text-right">Saldo atual</th><th className="p-2">Detalhe</th></tr></thead><tbody>{linhas.map(x=><tr key={`${x.tipo}-${x.conta}-${x.classificacao}`} className={`border-b ${x.tipo==="S"?"bg-muted/40 font-semibold":""}`}><td className="p-2 font-mono">{x.conta}</td><td className="p-2">{x.tipo}</td><td className="p-2 font-mono text-xs">{x.classificacao}</td><td className="p-2">{x.descricao}</td><td className="p-2 font-medium">{x.estabelecimento}</td><Money value={x.saldoAnterior}/><Money value={x.debitos}/><Money value={x.creditos}/><Money value={x.movimento}/><Money value={x.saldoAtual} strong/><td className="p-2">{x.tipo==="A"?<Button size="sm" variant="outline" onClick={()=>window.location.assign(`/contabil/razao?conta=${encodeURIComponent(x.conta)}`)}>Abrir Razão</Button>:"—"}</td></tr>)}</tbody></table></div>
    </CardContent></Card>
  </div>;
}

function filtrar(base:LancamentoIntegrado[],busca:string,conta:string,estab="todos"){const q=busca.trim().toLocaleLowerCase("pt-BR");return base.filter(x=>{const e=estabelecimentoLancamentoNitaplast(x);return(!conta||x.debitoCodigo===conta||x.creditoCodigo===conta)&&(estab==="todos"||e===estab)&&(!q||[x.id,x.origem,x.historico,x.documento,x.debito,x.credito,x.cc,x.centroCusto,x.fonte,e].join(" ").toLocaleLowerCase("pt-BR").includes(q));});}

export function RazaoJulhoAjustavel(){
  const contaUrl=typeof window==="undefined"?"":new URLSearchParams(window.location.search).get("conta")??"";
  const {razao,registrar,reclassificacoes}=useRazaoJulhoAjustado();
  const[conta,setConta]=useState(contaUrl);const[busca,setBusca]=useState("");const[estab,setEstab]=useState("todos");
  const linhas=useMemo(()=>filtrar(razao,busca,conta,estab),[razao,busca,conta,estab]);
  const abertura=conta?(saldoAberturaJulhoPorConta.get(conta)??0):0;const mov=conta?linhas.reduce((s,x)=>s+(x.debitoCodigo===conta?x.valor:0)-(x.creditoCodigo===conta?x.valor:0),0):0;
  return <div className="grid gap-5">
    <Header titulo="Razão contábil - Nitaplast 07/2026" descricao="Razão é a fonte do Balancete e da DRE. Cada partida identifica Matriz, Filial SP ou transferência Matriz ↔ Filial."/>
    <div className="grid gap-3 sm:grid-cols-4"><Metric label="Partidas exibidas" value={linhas.length} money={false}/><Metric label="Saldo anterior da conta" value={abertura}/><Metric label="Saldo atual da conta" value={arred(abertura+mov)}/><Metric label="Reclassificações" value={reclassificacoes.length} money={false}/></div>
    <Card className="border-sky-500/40 bg-sky-50/40"><CardContent className="pt-5 text-sm"><strong>Regra:</strong> estabelecimento é identificado no Razão pela conta, CC, documento, origem, histórico e fonte. Sem evidência de filial, a partida permanece Matriz; não há rateio por aproximação.</CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap gap-2"><Input className="w-full sm:w-48" value={conta} onChange={e=>setConta(e.target.value)} placeholder="Filtrar conta"/><select value={estab} onChange={e=>setEstab(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="todos">Todos estabelecimentos</option><option value="Matriz">Matriz</option><option value="Filial SP">Filial SP</option><option value="Matriz ↔ Filial">Matriz ↔ Filial</option></select><div className="relative w-full sm:flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar histórico, documento, origem, CC, estabelecimento..."/></div></div></CardHeader><CardContent className="overflow-x-auto"><TabelaLancamentos linhas={linhas} onRegistrar={registrar}/></CardContent></Card>
  </div>;
}

export function DiarioJulhoAjustavel(){const {razao,registrar}=useRazaoJulhoAjustado();const[busca,setBusca]=useState("");const linhas=useMemo(()=>[...filtrar(razao,busca,"")].sort((a,b)=>a.data.localeCompare(b.data)||a.id.localeCompare(b.id)),[razao,busca]);return <div className="grid gap-5"><Header titulo="Diário contábil - Nitaplast 07/2026" descricao="Livro Diário da competência 07/2026 com estabelecimento identificado em cada partida."/><div className="grid gap-3 sm:grid-cols-3"><Metric label="Partidas" value={linhas.length} money={false}/><Metric label="Total Débitos" value={arred(razao.reduce((s,x)=>s+x.valor,0))}/><Metric label="Total Créditos" value={arred(razao.reduce((s,x)=>s+x.valor,0))}/></div><Card><CardHeader><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar no Diário"/></div></CardHeader><CardContent className="overflow-x-auto"><TabelaLancamentos linhas={linhas} onRegistrar={registrar}/></CardContent></Card></div>;}

export function LancamentosJulhoAjustavel(){
  const {razao,registrar}=useRazaoJulhoAjustado();const[busca,setBusca]=useState("");const linhas=useMemo(()=>filtrar(razao,busca,""),[razao,busca]);
  const csv=()=>exportar("Lancamentos_Nitaplast_07-2026.csv",[["ID","Data","Estabelecimento","Origem","Débito","Crédito","Histórico","Documento","CC","Centro de Custo","Valor","Status","Fonte"],...linhas.map(x=>[x.id,x.data,estabelecimentoLancamentoNitaplast(x),x.origem,x.debito,x.credito,x.historico,x.documento,x.cc,x.centroCusto,x.valor,x.status,x.fonte])]);
  return <div className="grid gap-5"><Header titulo="Lançamentos contábeis - Nitaplast 07/2026" descricao="Partidas que formam Razão → Balancete → DRE, sempre com Matriz/Filial identificada." acoes={<Button variant="outline" size="sm" onClick={csv}><Download className="mr-2 size-4"/>Exportar CSV</Button>}/><div className="grid gap-3 sm:grid-cols-4"><Metric label="Lançamentos" value={razao.length} money={false}/><Metric label="Débitos" value={arred(razao.reduce((s,x)=>s+x.valor,0))}/><Metric label="Créditos" value={arred(razao.reduce((s,x)=>s+x.valor,0))}/><Metric label="Em revisão" value={razao.filter(x=>x.status==="revisar").length} money={false}/></div><Card><CardHeader><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar lançamento, estabelecimento, conta, documento ou fonte"/></div></CardHeader><CardContent className="overflow-x-auto"><TabelaLancamentos linhas={linhas} onRegistrar={registrar}/></CardContent></Card></div>;
}

function TabelaLancamentos({linhas,onRegistrar}:{linhas:LancamentoIntegrado[];onRegistrar:Parameters<typeof ReclassificacaoInteligente>[0]["onRegistrar"]}){return <table className="w-full min-w-[1850px] text-xs"><thead><tr className="border-b bg-muted text-left"><th className="p-2">Data</th><th className="p-2">Estabelecimento</th><th className="p-2">ID / Origem</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico / Documento</th><th className="p-2">CC</th><th className="p-2 text-right">Valor</th><th className="p-2">Status</th><th className="p-2 text-right">Ações</th></tr></thead><tbody>{linhas.map(x=>{const estabelecimento=estabelecimentoLancamentoNitaplast(x);return <tr key={x.id} className="border-b align-top"><td className="p-2 whitespace-nowrap">{x.data}</td><td className="p-2 font-medium">{estabelecimento}</td><td className="p-2"><p className="font-mono font-medium">{x.id}</p><p className="text-[10px] text-muted-foreground">{x.origem}</p></td><td className="p-2"><p className="font-mono">{x.debitoCodigo}</p><p>{x.debito.replace(`${x.debitoCodigo} - `,"")}</p></td><td className="p-2"><p className="font-mono">{x.creditoCodigo}</p><p>{x.credito.replace(`${x.creditoCodigo} - `,"")}</p></td><td className="p-2 max-w-[420px]"><p>{x.historico}</p><p className="text-[10px] text-muted-foreground">{x.documento} · {x.fonte}</p></td><td className="p-2"><span className="font-mono">{x.cc}</span><br/>{x.centroCusto}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td><td className="p-2">{x.status==="validado"?<span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4"/>Validado</span>:<span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4"/>Revisar</span>}</td><td className="p-2 text-right"><ReclassificacaoInteligente lancamento={x} onRegistrar={onRegistrar}/></td></tr>;})}</tbody></table>}
