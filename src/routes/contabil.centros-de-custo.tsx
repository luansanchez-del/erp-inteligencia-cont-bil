import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, X } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCentrosCusto, type CentroCustoCadastro } from "@/hooks/use-centros-custo";

export const Route=createFileRoute("/contabil/centros-de-custo")({component:CentrosDeCusto});
type FormCentro=Pick<CentroCustoCadastro,"codigo"|"descricao"|"grupo"|"situacao">;
const inicial:FormCentro={codigo:"",descricao:"",grupo:"",situacao:"Ativo"};

function CentrosDeCusto(){
 const{centros,salvar}=useCentrosCusto();const[busca,setBusca]=useState("");const[form,setForm]=useState<FormCentro>(inicial);const[aberto,setAberto]=useState(false);const[editando,setEditando]=useState(false);const[erro,setErro]=useState("");
 const filtrados=useMemo(()=>{const q=busca.trim().toLocaleLowerCase("pt-BR");return centros.filter(c=>!q||`${c.codigo} ${c.descricao} ${c.grupo}`.toLocaleLowerCase("pt-BR").includes(q));},[busca,centros]);
 function editar(c:CentroCustoCadastro){setForm({codigo:c.codigo,descricao:c.descricao,grupo:c.grupo,situacao:c.situacao});setEditando(true);setErro("");setAberto(true);}
 function gravar(){try{salvar(form);setAberto(false);setForm(inicial);setErro("");}catch(e){setErro(e instanceof Error?e.message:"Não foi possível salvar.");}}
 return <PageShell>
  <PageHeader titulo="Centros de Custo" descricao="Cadastro mestre usado nos lançamentos, rateios, Razão e relatórios gerenciais." acoes={<Button size="sm" className="gap-2" onClick={()=>{setForm(inicial);setEditando(false);setErro("");setAberto(true);}}><Plus className="size-4"/> Novo centro</Button>}/>
  {aberto?<Card className="border-primary/40"><CardHeader className="flex flex-row items-start justify-between"><div><CardTitle className="text-base">{editando?"Ficha do centro de custo":"Novo centro de custo"}</CardTitle><CardDescription>O cadastro fica disponível imediatamente no menu de lançamentos.</CardDescription></div><Button size="icon" variant="ghost" onClick={()=>setAberto(false)}><X className="size-4"/></Button></CardHeader><CardContent className="grid gap-3 md:grid-cols-4">
   <Campo label="Código" value={form.codigo} disabled={editando} onChange={codigo=>setForm(f=>({...f,codigo}))}/><Campo label="Descrição" value={form.descricao} onChange={descricao=>setForm(f=>({...f,descricao}))}/><Campo label="Grupo" value={form.grupo} placeholder="Industrial, Comercial..." onChange={grupo=>setForm(f=>({...f,grupo}))}/>
   <label className="grid gap-1 text-xs font-medium">Situação<select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.situacao} onChange={e=>setForm(f=>({...f,situacao:e.target.value as FormCentro["situacao"]}))}><option>Ativo</option><option>Inativo</option></select></label>
   {erro?<p className="text-sm text-red-700 md:col-span-3">{erro}</p>:<div className="md:col-span-3"/>}<Button onClick={gravar}>Salvar cadastro</Button>
  </CardContent></Card>:null}
  <Card><CardContent className="pt-5"><Input className="mb-4 max-w-md" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar código, descrição ou grupo"/><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Código</th><th className="p-2">Descrição</th><th className="p-2">Grupo</th><th className="p-2">Situação</th><th className="p-2">Origem</th><th className="p-2">Ação</th></tr></thead><tbody>{filtrados.map(c=><tr key={c.codigo} className="border-b"><td className="p-2 font-mono">{c.codigo}</td><td className="p-2 font-medium">{c.descricao}</td><td className="p-2">{c.grupo}</td><td className="p-2"><Badge variant="outline">{c.situacao}</Badge></td><td className="p-2 text-xs text-muted-foreground">{c.origem}</td><td className="p-2"><Button size="sm" variant="outline" className="gap-1" onClick={()=>editar(c)}><Pencil className="size-3.5"/> Abrir ficha</Button></td></tr>)}</tbody></table></div></CardContent></Card>
 </PageShell>;
}
function Campo({label,value,onChange,placeholder,disabled=false}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;disabled?:boolean}){return <label className="grid gap-1 text-xs font-medium">{label}<Input value={value} disabled={disabled} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>;}
