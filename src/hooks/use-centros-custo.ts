import { useCallback, useEffect, useMemo, useState } from "react";
import { nomesCcFonte } from "@/data/nitaplast-centros-custo-fonte";
import { grupoCentroCustoNitaplast } from "@/data/nitaplast-balancete-cc-junho";

export type CentroCustoCadastro = { codigo:string; descricao:string; grupo:string; situacao:"Ativo"|"Inativo"; origem:"Importado"|"Manual"; atualizadoEm:string };
const STORAGE_KEY="erp-centros-custo-v1";
const EVENTO="erp-centros-custo-atualizados";

function originais():CentroCustoCadastro[]{return Object.entries(nomesCcFonte).map(([codigo,descricao])=>({codigo,descricao,grupo:grupoCentroCustoNitaplast(codigo),situacao:"Ativo",origem:"Importado",atualizadoEm:"Importação inicial"}));}
function carregar():CentroCustoCadastro[]{if(typeof window==="undefined")return[];try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)??"[]");return Array.isArray(v)?v:[];}catch{return[];}}

export function useCentrosCusto(){
  const [alteracoes,setAlteracoes]=useState<CentroCustoCadastro[]>(carregar);
  useEffect(()=>{const atualizar=()=>setAlteracoes(carregar());window.addEventListener(EVENTO,atualizar);return()=>window.removeEventListener(EVENTO,atualizar);},[]);
  const centros=useMemo(()=>{const mapa=new Map(originais().map(c=>[c.codigo,c]));for(const c of alteracoes)mapa.set(c.codigo,c);return[...mapa.values()].sort((a,b)=>a.codigo.localeCompare(b.codigo,"pt-BR",{numeric:true}));},[alteracoes]);
  const salvar=useCallback((dados:Pick<CentroCustoCadastro,"codigo"|"descricao"|"grupo"|"situacao">)=>{
    const codigo=dados.codigo.trim(),descricao=dados.descricao.trim().toLocaleUpperCase("pt-BR");
    if(!codigo)throw new Error("Informe o código do centro de custo.");if(!descricao)throw new Error("Informe a descrição do centro de custo.");
    const registro:CentroCustoCadastro={...dados,codigo,descricao,grupo:dados.grupo.trim()||grupoCentroCustoNitaplast(codigo),origem:nomesCcFonte[codigo]?"Importado":"Manual",atualizadoEm:new Date().toISOString()};
    const proximas=[...carregar().filter(c=>c.codigo!==codigo),registro];localStorage.setItem(STORAGE_KEY,JSON.stringify(proximas));window.dispatchEvent(new Event(EVENTO));
  },[]);
  return{centros,salvar};
}
