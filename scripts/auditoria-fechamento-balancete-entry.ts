import { estruturaBalanceteNitaplast, type LinhaEstruturaBalancete } from "../src/data/nitaplast-balancete-estrutura";
import { calcularBalanceteJulho, contasPosImplantacao } from "../src/data/nitaplast-balancete-julho-engine";
import { saldoAberturaJulhoPorConta } from "../src/data/nitaplast-saldos-julho";
import { lancamentosIntegradosJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2";
import type { LancamentoIntegrado } from "../src/data/nitaplast-razao-base";
import { escopoContaBalanceteNitaplast, estabelecimentoLancamentoNitaplast, type EscopoContaNitaplast, type EstabelecimentoNitaplast } from "../src/data/nitaplast-estabelecimento";

const arred = (v: number) => Math.round(v * 100) / 100;

type LinhaBalancete = LinhaEstruturaBalancete & { saldoAnterior: number; debitos: number; creditos: number; movimento: number; saldoAtual: number; lancamentos: number; estabelecimento: EscopoContaNitaplast };
const contasEstrutura = new Set(estruturaBalanceteNitaplast.map((x) => x.conta));
function compararClassificacao(a: LinhaEstruturaBalancete, b: LinhaEstruturaBalancete) {
  const pa = a.classificacao.split(".").map(Number);
  const pb = b.classificacao.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (i >= pa.length) return -1;
    if (i >= pb.length) return 1;
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  if (a.tipo !== b.tipo) return a.tipo === "S" ? -1 : 1;
  return Number(a.conta) - Number(b.conta);
}
const estruturaBalanceteCompleta: LinhaEstruturaBalancete[] = [
  ...estruturaBalanceteNitaplast,
  ...contasPosImplantacao.filter(([conta]) => !contasEstrutura.has(conta)).map(([conta, classificacao, descricao]) => ({ conta, tipo: "A" as const, classificacao, descricao, nivel: classificacao.split(".").length })),
].sort(compararClassificacao);
function descendente(a: LinhaEstruturaBalancete, s: LinhaEstruturaBalancete) { return a.classificacao === s.classificacao || a.classificacao.startsWith(`${s.classificacao}.`); }
function combinarEscopos(escopos: Iterable<EscopoContaNitaplast>): EscopoContaNitaplast {
  let matriz = false; let filial = false;
  for (const e of escopos) { if (e === "Matriz") matriz = true; else if (e === "Filial SP") filial = true; else { matriz = true; filial = true; } }
  if (matriz && filial) return "Matriz + Filial SP";
  if (filial) return "Filial SP";
  return "Matriz";
}
function calcularBalancete(base: LancamentoIntegrado[]): LinhaBalancete[] {
  const mov = new Map<string, { debitos: number; creditos: number; lancamentos: number }>();
  const estabs = new Map<string, Set<EstabelecimentoNitaplast>>();
  const addEst = (conta: string, e: EstabelecimentoNitaplast) => { const s = estabs.get(conta) ?? new Set<EstabelecimentoNitaplast>(); s.add(e); estabs.set(conta, s); };
  for (const x of base) {
    const e = estabelecimentoLancamentoNitaplast(x);
    const d = mov.get(x.debitoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 }; d.debitos += x.valor; d.lancamentos++; mov.set(x.debitoCodigo, d); addEst(x.debitoCodigo, e);
    const c = mov.get(x.creditoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 }; c.creditos += x.valor; c.lancamentos++; mov.set(x.creditoCodigo, c); addEst(x.creditoCodigo, e);
  }
  const analiticas = estruturaBalanceteCompleta.filter((x) => x.tipo === "A");
  const vals = new Map<string, { saldoAnterior: number; debitos: number; creditos: number; movimento: number; saldoAtual: number; lancamentos: number; estabelecimento: EscopoContaNitaplast }>();
  for (const x of analiticas) {
    const m = mov.get(x.conta) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
    const sa = saldoAberturaJulhoPorConta.get(x.conta) ?? 0;
    const liq = arred(m.debitos - m.creditos);
    const estabelecimento = escopoContaBalanceteNitaplast(x.conta, x.descricao, estabs.get(x.conta) ?? []);
    vals.set(x.conta, { saldoAnterior: sa, debitos: arred(m.debitos), creditos: arred(m.creditos), movimento: liq, saldoAtual: arred(sa + liq), lancamentos: m.lancamentos, estabelecimento });
  }
  return estruturaBalanceteCompleta.map((x) => {
    if (x.tipo === "A") return { ...x, ...(vals.get(x.conta) ?? { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0, estabelecimento: escopoContaBalanceteNitaplast(x.conta, x.descricao, []) }) };
    const t = { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 };
    const escopos: EscopoContaNitaplast[] = [];
    for (const a of analiticas) { if (!descendente(a, x)) continue; const v = vals.get(a.conta); if (!v) continue; t.saldoAnterior += v.saldoAnterior; t.debitos += v.debitos; t.creditos += v.creditos; t.movimento += v.movimento; t.saldoAtual += v.saldoAtual; t.lancamentos += v.lancamentos; escopos.push(v.estabelecimento); }
    return { ...x, saldoAnterior: arred(t.saldoAnterior), debitos: arred(t.debitos), creditos: arred(t.creditos), movimento: arred(t.movimento), saldoAtual: arred(t.saldoAtual), lancamentos: t.lancamentos, estabelecimento: combinarEscopos(escopos) };
  });
}

const balancete = calcularBalancete(lancamentosIntegradosJulhoFinal);
const motor = calcularBalanceteJulho(lancamentosIntegradosJulhoFinal);

const porDescricao = (expressao: RegExp) => balancete.filter((linha) => linha.tipo === "S" && expressao.test(linha.descricao)).sort((a, b) => a.classificacao.split(".").length - b.classificacao.length)[0];
const ativo = porDescricao(/^ATIVO$/i);
const passivo = porDescricao(/^PASSIVO$/i);
const patrimonio = porDescricao(/^PATRIM[ÔO]NIO L[ÍI]QUIDO$/i);
const receitas = porDescricao(/^RECEITAS$/i);
const despesas = porDescricao(/^CUSTOS E DESPESAS$/i) ?? porDescricao(/^DESPESAS OPERACIONAIS$/i);
const naoOperacional = balancete.find((linha) => linha.tipo === "S" && /RESULTAD.*N[ÃA]O OPERACION|OUTROS RESULTADOS OPERACIONAIS/i.test(linha.descricao));

const fechaPassivoPl = arred((passivo?.saldoAtual ?? 0) + (patrimonio?.saldoAtual ?? 0));

const somaManualDespesas5 = arred(balancete.filter((x) => x.tipo === "A" && x.classificacao.startsWith("5.")).reduce((s, x) => s + x.saldoAtual, 0));
const contagemContasClass5 = balancete.filter((x) => x.tipo === "A" && x.classificacao.startsWith("5.")).length;
const linha4760 = balancete.find((x) => x.conta === "4760");
const linha1089 = balancete.find((x) => x.conta === "1089");
const linha1083 = balancete.find((x) => x.conta === "1083");
const presenteNaEstruturaCompleta = estruturaBalanceteCompleta.some((x) => x.conta === "4760");

const movimentoMesResultado = arred(motor.saldosAnaliticos.filter((x) => x.classificacao.startsWith("4.") || x.classificacao.startsWith("5.")).reduce((s, x) => s + x.movimento, 0));

console.log(JSON.stringify({
  resultadoJulhoPelaMovimentacaoDoMes: arred(-movimentoMesResultado),
  presenteNaEstruturaCompleta,
  somaManualDespesas5, contagemContasClass5,
  linha4760, linha1089, linha1083,
  conferenciaMotor: motor.conferencia,
  ativo: ativo && { classificacao: ativo.classificacao, descricao: ativo.descricao, saldoAnterior: ativo.saldoAnterior, debitos: ativo.debitos, creditos: ativo.creditos, saldoAtual: ativo.saldoAtual },
  passivo: passivo && { classificacao: passivo.classificacao, saldoAtual: passivo.saldoAtual },
  patrimonio: patrimonio && { classificacao: patrimonio.classificacao, saldoAtual: patrimonio.saldoAtual },
  passivoMaisPl: fechaPassivoPl,
  ativoMenosPassivoMaisPl: arred((ativo?.saldoAtual ?? 0) - fechaPassivoPl),
  receitas: receitas && { saldoAtual: receitas.saldoAtual },
  despesas: despesas && { descricao: despesas.descricao, saldoAtual: despesas.saldoAtual },
  naoOperacional: naoOperacional && { descricao: naoOperacional.descricao, saldoAtual: naoOperacional.saldoAtual },
  totalAnaliticasSaldoAtual: arred(balancete.filter((x) => x.tipo === "A").reduce((s, x) => s + x.saldoAtual, 0)),
  contasRazaoSemEstrutura: motor.conferencia.contasRazaoSemEstrutura,
}, null, 2));
