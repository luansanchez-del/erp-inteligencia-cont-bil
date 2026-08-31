import { calcularBalanceteDominio } from "../src/data/nitaplast-balancete-dominio-engine";
import { lancamentosIntegrados } from "../src/data/nitaplast-razao-integrado";
import { dreCompletaJunho } from "../src/data/nitaplast-dre-completa";

const arred = (v: number) => Math.round(v * 100) / 100;

const apuracao = calcularBalanceteDominio(lancamentosIntegrados);
const linhas = apuracao.linhas;

const porDescricao = (expressao: RegExp) =>
  linhas.filter((l) => l.tipo === "S" && expressao.test(l.descricao)).sort((a, b) => a.classificacao.length - b.classificacao.length)[0];

const ativo = porDescricao(/^ATIVO$/i);
const passivo = porDescricao(/^PASSIVO$/i);
const patrimonio = porDescricao(/^PATRIM[ÔO]NIO L[ÍI]QUIDO$/i);

const totalDebitos = arred(lancamentosIntegrados.reduce((s, x) => s + x.valor, 0));
const somaMovimentoAnaliticas = arred(linhas.filter((l) => l.tipo === "A").reduce((s, l) => s + l.movimento, 0));

const lucroLiquidoJunho = dreCompletaJunho.find((l) => l.id === "lucro-liq")?.valor ?? null;

console.log(JSON.stringify({
  totalDebitosLancamentos: totalDebitos,
  somaMovimentoTodasAnaliticas: somaMovimentoAnaliticas,
  ativo: ativo && { saldoAnterior: ativo.saldoAnterior, debitos: ativo.debitos, creditos: ativo.creditos, movimento: ativo.movimento, saldoAtual: ativo.saldoAtual },
  passivo: passivo && { saldoAtual: passivo.saldoAtual },
  patrimonio: patrimonio && { classificacao: patrimonio.classificacao, saldoAtual: patrimonio.saldoAtual },
  lucroLiquidoJunhoDRE: lucroLiquidoJunho,
  pendencias: apuracao.pendencias.map((p) => ({ contaAtual: p.contaAtual, descricaoAtual: p.descricaoAtual, saldoAtual: p.saldoAtual, quantidade: p.quantidade })),
  qtdContasAnaliticas: linhas.filter((l) => l.tipo === "A").length,
}, null, 2));
