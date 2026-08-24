import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { balanceteDominioMaio, resumoBalanceteDominioMaio } from "@/data/nitaplast-balancete-dominio-maio";
import { BalancetePrintSummary } from "@/components/balancete-print-summary";

const brl=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const paginaTamanho=50;
export function BalanceteMaioDominio(){
 const[busca,setBusca]=useState("");const[pagina,setPagina]=useState(1);const[soAnaliticas,setSoAnaliticas]=useState(false);
 const filtradas=useMemo(()=>{const q=busca.trim().toLocaleLowerCase("pt-BR");return balanceteDominioMaio.filter(x=>(!soAnaliticas||x.tipo==="A")&&(!q||`${x.conta} ${x.classificacao} ${x.descricao}`.toLocaleLowerCase("pt-BR").includes(q)));},[busca,soAnaliticas]);
 const totalPaginas=Math.max(1,Math.ceil(filtradas.length/paginaTamanho));const atual=Math.min(pagina,totalPaginas);const linhas=filtradas.slice((atual-1)*paginaTamanho,atual*paginaTamanho);
 return <>
  <PageHeader titulo="Balancete de implantação — Domínio 05/2026" descricao="Plano e saldos originais da contabilidade anterior. Consulta histórica; não gera lançamentos em junho."/>
  <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm"><div><strong>Fonte original preservada.</strong> Período {resumoBalanceteDominioMaio.periodo}. O DE/PARA para o Questor será uma camada separada.</div><Badge variant="outline">{resumoBalanceteDominioMaio.linhas} linhas · {resumoBalanceteDominioMaio.analiticas} analíticas</Badge></CardContent></Card>
  <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base">Balancete original completo</CardTitle><CardDescription>Código, classificação e descrição conforme o sistema Domínio.</CardDescription></div><div className="flex w-full gap-2 sm:w-auto"><Input className="sm:w-80" value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1);}} placeholder="Buscar conta, classificação ou descrição"/><Button variant={soAnaliticas?"default":"outline"} onClick={()=>{setSoAnaliticas(v=>!v);setPagina(1);}}>Somente analíticas</Button></div></div></CardHeader>
   <CardContent className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta Domínio</th><th className="p-2">S/A</th><th className="p-2">Classificação Domínio</th><th className="p-2">Descrição</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débitos maio</th><th className="p-2 text-right">Créditos maio</th><th className="p-2 text-right">Saldo em 31/05</th></tr></thead><tbody>{linhas.map(x=><tr key={`${x.conta}-${x.classificacao}`} className={`border-b ${x.tipo==="S"?"bg-muted/20 font-semibold":""}`}><td className="p-2 font-mono">{x.conta}</td><td className="p-2">{x.tipo}</td><td className="p-2 font-mono text-xs">{x.classificacao}</td><td className="p-2">{x.descricao}</td><Money v={x.saldoAnterior}/><Money v={x.debitos}/><Money v={x.creditos}/><Money v={x.saldoAtual} strong/></tr>)}</tbody></table><BalancetePrintSummary linhas={balanceteDominioMaio}/></CardContent>
   <CardContent className="flex items-center justify-between border-t pt-4"><span className="text-xs text-muted-foreground">{filtradas.length} linhas encontradas</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={atual===1} onClick={()=>setPagina(p=>p-1)}>Anterior</Button><span className="text-xs">Página {atual} de {totalPaginas}</span><Button size="sm" variant="outline" disabled={atual===totalPaginas} onClick={()=>setPagina(p=>p+1)}>Próxima</Button></div></CardContent>
  </Card>
 </>;
}
function Money({v,strong=false}:{v:number;strong?:boolean}){return <td className={`p-2 text-right tabular-nums ${strong?"font-semibold":""}`}>{v<0?`(${brl.format(Math.abs(v))})`:brl.format(v)}</td>;}
