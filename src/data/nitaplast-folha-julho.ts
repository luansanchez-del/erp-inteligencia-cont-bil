import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (c:string) => `${c} - ${descricaoContaJulho.get(c) ?? "Conta a revisar"}`;
const arred = (v:number) => Math.round(v*100)/100;
const l = (p: Omit<LancamentoIntegrado,"debito"|"credito"|"status"|"rastreio"> & {status?:LancamentoIntegrado["status"];rastreio?:LancamentoIntegrado["rastreio"]}): LancamentoIntegrado => ({
  ...p,
  debito:nome(p.debitoCodigo),
  credito:nome(p.creditoCodigo),
  status:p.status ?? "validado",
  rastreio:p.rastreio ?? "documento",
});

const centros:Record<string,string> = {
  "201":"VENDAS",
  "203":"FATURAMENTO",
  "206":"EXPORTAÇÃO",
  "210":"MARKETING",
  "301":"RECEPÇÃO",
  "302":"FINANCEIRO",
  "304":"ADM GERAL",
  "502":"COMERCIAL SP",
};

type EmpregadoMatriz = {
  matricula:string;
  nome:string;
  cc:string;
  remuneracaoRegular:number;
  atraso:number;
  adiantamento:number;
  assistencia:number;
  inssNormal:number;
  feriasBrutas:number;
  inssFerias:number;
  adiantamentoFerias:number;
  abonoPecuniario:number;
  salarioFamilia:number;
  vantagem:number;
  consignado:number;
  encargoEmpresa:number;
  fgtsAtualizado:number;
};

// Valores analíticos da folha mensal 07/2026. Férias pagas antecipadamente são
// controladas contra a provisão e não são duplicadas como salários do mês.
export const folhaMatrizDetalhe:EmpregadoMatriz[] = [
  {matricula:"30349",nome:"ALANA PREU ROSAS",cc:"301",remuneracaoRegular:1774.19,atraso:0,adiantamento:704.00,assistencia:99.64,inssNormal:144.15,feriasBrutas:586.67,inssFerias:44.00,adiantamentoFerias:542.67,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:644.51,fgtsAtualizado:188.86},
  {matricula:"30302",nome:"BIANCA CABRAL CASTELLANO",cc:"206",remuneracaoRegular:4000.28,atraso:0,adiantamento:1188.00,assistencia:61.75,inssNormal:466.70,feriasBrutas:1617.88,inssFerias:121.34,adiantamentoFerias:1496.54,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:1533.74,fgtsAtualizado:449.45},
  {matricula:"30319",nome:"CAROLINA LINDEMANN DE SOUZA MOREIRA",cc:"201",remuneracaoRegular:5694.29,atraso:0,adiantamento:1820.00,assistencia:1047.06,inssNormal:687.18,feriasBrutas:1465.55,inssFerias:116.69,adiantamentoFerias:1348.86,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:1954.63,fgtsAtualizado:572.78},
  {matricula:"30334",nome:"DANIELE OSLICKI AMARANTE DE MELO",cc:"210",remuneracaoRegular:4621.97,atraso:0,adiantamento:1217.33,assistencia:1468.75,inssNormal:611.08,feriasBrutas:2763.64,inssFerias:224.40,adiantamentoFerias:2539.24,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:2016.23,fgtsAtualizado:590.84},
  {matricula:"30281",nome:"EMERSON CORTES DE OLIVEIRA",cc:"203",remuneracaoRegular:4619.21,atraso:0,adiantamento:1840.00,assistencia:571.12,inssNormal:448.19,feriasBrutas:0,inssFerias:0,adiantamentoFerias:0,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:1261.05,fgtsAtualizado:369.53},
  {matricula:"30355",nome:"GLEICY KELLY ALVES WEIGERT",cc:"304",remuneracaoRegular:1800.00,atraso:90.55,adiantamento:720.00,assistencia:0,inssNormal:129.53,feriasBrutas:0,inssFerias:0,adiantamentoFerias:0,abonoPecuniario:0,salarioFamilia:135.08,vantagem:0,consignado:0,encargoEmpresa:466.68,fgtsAtualizado:0},
  {matricula:"30350",nome:"KAUHANE FERNANDES FARIA AZEVEDO",cc:"210",remuneracaoRegular:3000.00,atraso:0,adiantamento:0,assistencia:189.59,inssNormal:248.58,feriasBrutas:0,inssFerias:0,adiantamentoFerias:0,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:819.00,fgtsAtualizado:240.00},
  {matricula:"30356",nome:"LETICIA DOS SANTOS",cc:"301",remuneracaoRegular:2000.00,atraso:4.09,adiantamento:800.00,assistencia:0,inssNormal:155.31,feriasBrutas:0,inssFerias:0,adiantamentoFerias:0,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:544.89,fgtsAtualizado:159.67},
  {matricula:"30320",nome:"MARILIA APARECIDA IGNACHEWSKI ANTUNES",cc:"201",remuneracaoRegular:3369.13,atraso:28.33,adiantamento:1012.00,assistencia:534.26,inssNormal:359.95,feriasBrutas:1395.92,inssFerias:104.69,adiantamentoFerias:1291.23,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:1293.12,fgtsAtualizado:378.93},
  {matricula:"30271",nome:"VERA SANDERS",cc:"201",remuneracaoRegular:2100.00,atraso:0,adiantamento:826.67,assistencia:227.27,inssNormal:202.59,feriasBrutas:1377.77,inssFerias:103.33,adiantamentoFerias:1274.44,abonoPecuniario:688.89,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:949.44,fgtsAtualizado:278.22},
  {matricula:"30345",nome:"WALLERIA MARTINS",cc:"302",remuneracaoRegular:2411.29,atraso:0,adiantamento:953.33,assistencia:288.02,inssNormal:229.95,feriasBrutas:1155.56,inssFerias:86.66,adiantamentoFerias:1068.90,abonoPecuniario:0,salarioFamilia:0,vantagem:59.64,consignado:999.63,encargoEmpresa:973.74,fgtsAtualizado:285.34},
  {matricula:"30321",nome:"WILLIAN MACIEL DO AMARAL",cc:"201",remuneracaoRegular:4017.59,atraso:0,adiantamento:1340.00,assistencia:305.64,inssNormal:370.70,feriasBrutas:0,inssFerias:0,adiantamentoFerias:0,abonoPecuniario:0,salarioFamilia:0,vantagem:0,consignado:0,encargoEmpresa:1096.81,fgtsAtualizado:321.40},
];

type EmpregadoFilial = {
  matricula:string;
  nome:string;
  remuneracao:number;
  inss:number;
  consignado:number;
  encargoEmpresa:number;
  fgts:number;
};

export const folhaFilialDetalhe:EmpregadoFilial[] = [
  {matricula:"30323",nome:"JUSSARA SODRE LIMA",remuneracao:4314.74,inss:406.35,consignado:0,encargoEmpresa:1156.34,fgts:345.17},
  {matricula:"30335",nome:"THAUANY SANTOS CARDOSO",remuneracao:3945.50,inss:362.04,consignado:707.07,encargoEmpresa:1057.38,fgts:315.64},
  {matricula:"30352",nome:"CAUAN DOS SANTOS",remuneracao:2200.00,inss:173.68,consignado:0,encargoEmpresa:589.60,fgts:176.00},
];

const fonteMatriz = "FOLHA MENSAL 07.2026 - MATRIZ(1).pdf + DEMONSTRATIVO INSS 07.2026(1).pdf + 1-FGTS Relatorio (Atualizado)(1).pdf";
const fonteFilial = "DEMONSTRATIVO INSS 07.2026(1).pdf + 1-FGTS Relatorio (Atualizado)(1).pdf + COMUNICADO FGTS-07.2026 / consignado";

const lancamentosMatriz:LancamentoIntegrado[] = folhaMatrizDetalhe.flatMap((e)=>{
  const cc=e.cc, centroCusto=centros[cc];
  const base = `Folha 07/2026 ${e.matricula} - ${e.nome}`;
  const a:LancamentoIntegrado[]=[];
  if(e.remuneracaoRegular) a.push(l({id:`JUL-FOL-M-${e.matricula}-REM`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"4014",creditoCodigo:"1634",historico:`${base} - remuneração regular`,documento:e.matricula,cc,centroCusto,valor:e.remuneracaoRegular,observacao:"Remuneração bruta do período trabalhado; férias são tratadas contra provisão para não duplicar despesa.",fonte:fonteMatriz}));
  if(e.atraso) a.push(l({id:`JUL-FOL-M-${e.matricula}-ATR`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"1634",creditoCodigo:"4014",historico:`${base} - desconto de atrasos/saídas`,documento:e.matricula,cc,centroCusto,valor:e.atraso,observacao:"Redução documentada da remuneração do período.",fonte:fonteMatriz}));
  if(e.vantagem) a.push(l({id:`JUL-FOL-M-${e.matricula}-VANT`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"4014",creditoCodigo:"1634",historico:`${base} - vantagem folha`,documento:e.matricula,cc,centroCusto,valor:e.vantagem,observacao:"Evento 'Estouro do Mês' identificado na folha.",fonte:fonteMatriz}));
  if(e.salarioFamilia) a.push(l({id:`JUL-FOL-M-${e.matricula}-SF`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"25227",creditoCodigo:"1634",historico:`${base} - salário família`,documento:e.matricula,cc,centroCusto,valor:e.salarioFamilia,observacao:"Crédito ao empregado compensável na contribuição previdenciária.",fonte:fonteMatriz}));
  if(e.adiantamento) a.push(l({id:`JUL-FOL-M-${e.matricula}-ADT`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"1634",creditoCodigo:"312",historico:`${base} - baixa de adiantamento salarial`,documento:e.matricula,cc,centroCusto,valor:e.adiantamento,observacao:"Baixa do adiantamento previamente pago em julho.",fonte:fonteMatriz}));
  if(e.assistencia) a.push(l({id:`JUL-FOL-M-${e.matricula}-BEN`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"1634",creditoCodigo:"25263",historico:`${base} - descontos assistência médica/odontológica`,documento:e.matricula,cc,centroCusto,valor:e.assistencia,observacao:"Valor efetivamente retido do empregado; mantido em credores diversos até a baixa analítica contra os prestadores, sem usar conta transitória.",fonte:fonteMatriz}));
  if(e.inssNormal) a.push(l({id:`JUL-FOL-M-${e.matricula}-INSS`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"1634",creditoCodigo:"25227",historico:`${base} - INSS descontado do empregado`,documento:e.matricula,cc,centroCusto,valor:e.inssNormal,observacao:"INSS normal retido na folha.",fonte:fonteMatriz}));
  if(e.consignado) a.push(l({id:`JUL-FOL-M-${e.matricula}-CONS`,data:"31/07/2026",origem:"FOLHA MATRIZ 07/2026",debitoCodigo:"1634",creditoCodigo:"25231",historico:`${base} - empréstimo Crédito do Trabalhador`,documento:e.matricula,cc,centroCusto,valor:e.consignado,observacao:"Retenção do empréstimo consignado na folha; obrigação a repassar à instituição financeira.",fonte:"_FGTS RELATORIO CONSIGNADO(1).pdf"}));
  if(e.inssFerias) a.push(l({id:`JUL-FOL-M-${e.matricula}-INSS-FER`,data:"31/07/2026",origem:"FÉRIAS MATRIZ 07/2026",debitoCodigo:"25237",creditoCodigo:"25227",historico:`${base} - INSS sobre férias gozadas`,documento:e.matricula,cc,centroCusto,valor:e.inssFerias,observacao:`Férias brutas documentadas: R$ ${e.feriasBrutas.toFixed(2)}; líquido antecipado na folha: R$ ${e.adiantamentoFerias.toFixed(2)}. O pagamento bancário já reduz a provisão, portanto aqui reconhece-se somente a parcela retida de INSS para completar a liquidação bruta.`,fonte:fonteMatriz}));
  if(e.abonoPecuniario) a.push(l({id:`JUL-FOL-M-${e.matricula}-ABONO`,data:"31/07/2026",origem:"FÉRIAS MATRIZ 07/2026",debitoCodigo:"4019",creditoCodigo:"25237",historico:`${base} - abono pecuniário de férias`,documento:e.matricula,cc,centroCusto,valor:e.abonoPecuniario,observacao:"Abono pecuniário reconhecido como despesa de férias e reclassificado contra a provisão utilizada no pagamento antecipado.",fonte:fonteMatriz}));
  if(e.encargoEmpresa) a.push(l({id:`JUL-FOL-M-${e.matricula}-ENC`,data:"31/07/2026",origem:"INSS/DCTFWEB MATRIZ 07/2026",debitoCodigo:"4020",creditoCodigo:"25227",historico:`${base} - INSS patronal, RAT e terceiros`,documento:e.matricula,cc,centroCusto,valor:e.encargoEmpresa,observacao:"Parte empresa + RAT/FAP + entidades/terceiros, conforme demonstrativo previdenciário analítico.",fonte:"DEMONSTRATIVO INSS 07.2026(1).pdf"}));
  if(e.fgtsAtualizado) a.push(l({id:`JUL-FOL-M-${e.matricula}-FGTS`,data:"31/07/2026",origem:"FGTS MATRIZ 07/2026",debitoCodigo:"4021",creditoCodigo:"25228",historico:`${base} - FGTS mensal`,documento:e.matricula,cc,centroCusto,valor:e.fgtsAtualizado,observacao:"Valor da guia FGTS Digital atualizada de 11/08/2026. Gleicy não integra a guia atualizada e, por isso, não recebe lançamento de FGTS nesta versão.",fonte:"1-FGTS Relatorio (Atualizado)(1).pdf"}));
  return a;
});

const lancamentosFilial:LancamentoIntegrado[] = folhaFilialDetalhe.flatMap((e)=>{
  const cc="502",centroCusto=centros[cc];
  const base=`Folha filial 07/2026 ${e.matricula} - ${e.nome}`;
  return [
    l({id:`JUL-FOL-F-${e.matricula}-REM`,data:"31/07/2026",origem:"FOLHA FILIAL 07/2026",debitoCodigo:"4014",creditoCodigo:"1634",historico:`${base} - remuneração`,documento:e.matricula,cc,centroCusto,valor:e.remuneracao,observacao:"Remuneração da filial comprovada pela base individual de INSS e FGTS. Descontos não estatutários/líquido da filial permanecem para conciliação analítica quando houver extrato mensal completo da filial.",fonte:fonteFilial,status:"revisar"}),
    l({id:`JUL-FOL-F-${e.matricula}-INSS`,data:"31/07/2026",origem:"FOLHA FILIAL 07/2026",debitoCodigo:"1634",creditoCodigo:"25227",historico:`${base} - INSS descontado`,documento:e.matricula,cc,centroCusto,valor:e.inss,observacao:"INSS do empregado conforme demonstrativo analítico 07/2026.",fonte:"DEMONSTRATIVO INSS 07.2026(1).pdf"}),
    ...(e.consignado ? [l({id:`JUL-FOL-F-${e.matricula}-CONS`,data:"31/07/2026",origem:"FOLHA FILIAL 07/2026",debitoCodigo:"1634",creditoCodigo:"25231",historico:`${base} - Crédito do Trabalhador`,documento:e.matricula,cc,centroCusto,valor:e.consignado,observacao:"Seis contratos de Thauany totalizam R$ 707,07, retidos na competência 07/2026.",fonte:"_FGTS RELATORIO CONSIGNADO(1).pdf + comunicado filial"})] : []),
    l({id:`JUL-FOL-F-${e.matricula}-ENC`,data:"31/07/2026",origem:"INSS/DCTFWEB FILIAL 07/2026",debitoCodigo:"4020",creditoCodigo:"25227",historico:`${base} - INSS patronal, RAT e terceiros`,documento:e.matricula,cc,centroCusto,valor:e.encargoEmpresa,observacao:"Parte empresa + RAT/FAP + entidades/terceiros conforme demonstrativo previdenciário analítico.",fonte:"DEMONSTRATIVO INSS 07.2026(1).pdf"}),
    l({id:`JUL-FOL-F-${e.matricula}-FGTS`,data:"31/07/2026",origem:"FGTS FILIAL 07/2026",debitoCodigo:"4021",creditoCodigo:"25228",historico:`${base} - FGTS mensal`,documento:e.matricula,cc,centroCusto,valor:e.fgts,observacao:"Guia FGTS Digital atualizada da filial CNPJ 82.295.817/0003-60.",fonte:"1-FGTS Relatorio (Atualizado)(1).pdf"}),
  ];
});

// IRRF de R$ 517,50 foi retido no adiantamento salarial de Carolina. O banco registra
// o valor líquido do adiantamento; esta partida completa o custo do adiantamento no ativo.
const irrfAdiantamento:LancamentoIntegrado[] = [
  l({id:"JUL-FOL-M-30319-IRRF-ADT",data:"20/07/2026",origem:"IRRF FOLHA 07/2026",debitoCodigo:"312",creditoCodigo:"25232",historico:"IRRF retido no adiantamento salarial de Carolina Lindemann",documento:"30319",cc:"201",centroCusto:"VENDAS",valor:517.50,observacao:"Base IRRF R$ 5.648,17; origem Adiant. Salário; vencimento 20/08/2026.",fonte:"RELATORIO IRRF 07.2026(1).pdf"}),
];

const baseProvisaoMatriz = [
  {cc:"301",base:3770.10},{cc:"206",base:4000.28},{cc:"201",base:15152.68},
  {cc:"210",base:7621.97},{cc:"203",base:4619.21},{cc:"304",base:1709.45},{cc:"302",base:2411.29},
];

function provisoesPorCc(cc:string,base:number,aliquotaEncargos:number,prefixo:string,fonte:string):LancamentoIntegrado[] {
  const centroCusto=centros[cc];
  const decimo=arred(base/12);
  const ferias=arred((base/12)*(4/3));
  const enc13=arred(decimo*aliquotaEncargos);
  const encFerias=arred(ferias*aliquotaEncargos);
  return [
    l({id:`${prefixo}-${cc}-FER`,data:"31/07/2026",origem:"PROVISÃO FÉRIAS 07/2026",debitoCodigo:"25057",creditoCodigo:"25237",historico:`Provisão mensal de férias 07/2026 - ${centroCusto}`,documento:"PROV 07/2026",cc,centroCusto,valor:ferias,observacao:`Cálculo padrão: base remuneratória do mês R$ ${base.toFixed(2)} ÷ 12 + 1/3 constitucional.`,fonte,rastreio:"derivado"}),
    l({id:`${prefixo}-${cc}-FER-ENC`,data:"31/07/2026",origem:"PROVISÃO FÉRIAS 07/2026",debitoCodigo:"25058",creditoCodigo:"25230",historico:`Encargos sobre provisão de férias 07/2026 - ${centroCusto}`,documento:"PROV 07/2026",cc,centroCusto,valor:encFerias,observacao:`Encargos calculados sobre a provisão de férias à alíquota ${(aliquotaEncargos*100).toFixed(1)}% (INSS/RAT/terceiros + FGTS da unidade).`,fonte,rastreio:"derivado"}),
    l({id:`${prefixo}-${cc}-13`,data:"31/07/2026",origem:"PROVISÃO 13º 07/2026",debitoCodigo:"25059",creditoCodigo:"25238",historico:`Provisão mensal de 13º salário 07/2026 - ${centroCusto}`,documento:"PROV 07/2026",cc,centroCusto,valor:decimo,observacao:`Cálculo padrão: base remuneratória do mês R$ ${base.toFixed(2)} ÷ 12.`,fonte,rastreio:"derivado"}),
    l({id:`${prefixo}-${cc}-13-ENC`,data:"31/07/2026",origem:"PROVISÃO 13º 07/2026",debitoCodigo:"25060",creditoCodigo:"25229",historico:`Encargos sobre provisão de 13º 07/2026 - ${centroCusto}`,documento:"PROV 07/2026",cc,centroCusto,valor:enc13,observacao:`Encargos calculados sobre a provisão de 13º à alíquota ${(aliquotaEncargos*100).toFixed(1)}% (INSS/RAT/terceiros + FGTS da unidade).`,fonte,rastreio:"derivado"}),
  ];
}

// Matriz: 27,3% previdenciário/terceiros + 8% FGTS = 35,3%.
// Filial: 26,8% previdenciário/terceiros + 8% FGTS = 34,8%.
const provisoesMatriz = baseProvisaoMatriz.flatMap(x=>provisoesPorCc(x.cc,x.base,0.353,`JUL-PROV-M-${x.cc}`,"FOLHA MENSAL 07.2026 - MATRIZ(1).pdf + DEMONSTRATIVO INSS 07.2026(1).pdf"));
const provisoesFilial = provisoesPorCc("502",10460.24,0.348,"JUL-PROV-F-502","DEMONSTRATIVO INSS 07.2026(1).pdf + 1-FGTS Relatorio (Atualizado)(1).pdf");

export const lancamentosFolhaJulho:LancamentoIntegrado[] = [
  ...lancamentosMatriz,
  ...lancamentosFilial,
  ...irrfAdiantamento,
  ...provisoesMatriz,
  ...provisoesFilial,
];

const soma=(xs:number[])=>arred(xs.reduce((s,v)=>s+v,0));
const somaLanc=(xs:LancamentoIntegrado[],debito:string)=>arred(xs.filter(x=>x.debitoCodigo===debito).reduce((s,x)=>s+x.valor,0));

export const resumoFolhaJulho = {
  matriz:{
    proventosFolha:50459.83,
    vantagens:194.72,
    liquidoMensal:17211.73,
    inssSegurados:4855.02,
    encargosEmpresa:13553.84,
    fgtsAtualizado:3835.02,
    consignado:999.63,
    irrfAdiantamento:517.50,
    feriasBrutas:11051.88,
    feriasLiquidasAntecipadas:10250.77,
    inssFerias:801.11,
  },
  filial:{
    remuneracao:soma(folhaFilialDetalhe.map(x=>x.remuneracao)),
    inssSegurados:soma(folhaFilialDetalhe.map(x=>x.inss)),
    encargosEmpresa:soma(folhaFilialDetalhe.map(x=>x.encargoEmpresa)),
    fgts:soma(folhaFilialDetalhe.map(x=>x.fgts)),
    consignado:soma(folhaFilialDetalhe.map(x=>x.consignado)),
    funcionarios:folhaFilialDetalhe.length,
  },
  consolidado:{
    fgts:4671.83,
    dctfWebSaldoPagar:22536.67,
    inssSegurados:5797.09,
    salarioFamilia:135.08,
    contribuicaoPatronal:12870.94,
    terceiros:3486.22,
    irrf:517.50,
  },
  provisoes:{
    ferias:somaLanc([...provisoesMatriz,...provisoesFilial],"25057"),
    encargosFerias:somaLanc([...provisoesMatriz,...provisoesFilial],"25058"),
    decimoTerceiro:somaLanc([...provisoesMatriz,...provisoesFilial],"25059"),
    encargosDecimoTerceiro:somaLanc([...provisoesMatriz,...provisoesFilial],"25060"),
    metodo:"1/12 da base remuneratória; férias acrescidas de 1/3; encargos pela carga efetiva de cada estabelecimento",
  },
} as const;

const totalFolha=soma(lancamentosFolhaJulho.map(x=>x.valor));
if(totalFolha<=0) throw new Error("Folha julho sem lançamentos");
if(arred(resumoFolhaJulho.matriz.liquidoMensal)!==17211.73) throw new Error("Líquido matriz divergente");
if(arred(resumoFolhaJulho.filial.fgts)!==836.81) throw new Error("FGTS filial divergente");
if(arred(resumoFolhaJulho.matriz.fgtsAtualizado+resumoFolhaJulho.filial.fgts)!==4671.83) throw new Error("FGTS consolidado divergente");
