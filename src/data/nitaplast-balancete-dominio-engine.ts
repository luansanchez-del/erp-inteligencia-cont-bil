import { balanceteDominioMaio, type LinhaBalanceteDominioMaio } from "./nitaplast-balancete-dominio-maio";
import { obterContaDominio } from "./nitaplast-plano-dominio";
import { estruturaBalanceteNitaplast } from "./nitaplast-balancete-estrutura";
import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

export type LinhaBalanceteDominioCalculada = LinhaBalanceteDominioMaio & {
  movimento: number;
  lancamentos: number;
};

export type PendenciaContaDominio = {
  contaAtual: string;
  classificacaoAtual: string;
  descricaoAtual: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  movimento: number;
  saldoAtual: number;
  quantidade: number;
};

const arred = (valor: number) => Math.round(valor * 100) / 100;

function movimentos(lancamentos: LancamentoIntegrado[]) {
  const vinculados = new Map<string, { debitos: number; creditos: number; quantidade: number }>();
  const pendentes = new Map<string, { debitos: number; creditos: number; quantidade: number }>();
  const acumular = (contaAtual: string, lado: "debitos" | "creditos", valor: number) => {
    const vinculo = obterContaDominio(contaAtual);
    const destino = vinculo ? vinculados : pendentes;
    const chave = vinculo?.contaDominio ?? contaAtual;
    const item = destino.get(chave) ?? { debitos: 0, creditos: 0, quantidade: 0 };
    item[lado] += valor;
    item.quantidade += 1;
    destino.set(chave, item);
  };
  for (const lancamento of lancamentos) {
    acumular(lancamento.debitoCodigo, "debitos", lancamento.valor);
    acumular(lancamento.creditoCodigo, "creditos", lancamento.valor);
  }
  return { vinculados, pendentes };
}

const contasAtuais = new Map([...saldosImplantacao, ...estruturaBalanceteNitaplast.filter((item) => item.tipo === "A")].map((item) => [item.conta, item]));
const raizDominio = (classificacaoAtual: string) => classificacaoAtual.startsWith("1") ? "1" : classificacaoAtual.startsWith("2") ? "2" : classificacaoAtual.startsWith("4") ? "3" : "4";

function aplicarMovimentos(saldosAbertura: Map<string, number>, lancamentos: LancamentoIntegrado[], aberturaPendentes = new Map<string, number>()) {
  const apuracao = movimentos(lancamentos);
  const analiticas = balanceteDominioMaio.filter((linha) => linha.tipo === "A");
  const valores = new Map<string, LinhaBalanceteDominioCalculada>();
  for (const linha of analiticas) {
    const mov = apuracao.vinculados.get(linha.conta) ?? { debitos: 0, creditos: 0, quantidade: 0 };
    const saldoAnterior = saldosAbertura.get(linha.conta) ?? 0;
    const movimento = arred(mov.debitos - mov.creditos);
    valores.set(linha.conta, { ...linha, saldoAnterior, debitos: arred(mov.debitos), creditos: arred(mov.creditos), movimento, saldoAtual: arred(saldoAnterior + movimento), lancamentos: mov.quantidade });
  }
  let linhas = balanceteDominioMaio.map<LinhaBalanceteDominioCalculada>((linha) => {
    if (linha.tipo === "A") return valores.get(linha.conta)!;
    const filhas = analiticas.filter((item) => item.classificacao === linha.classificacao || item.classificacao.startsWith(`${linha.classificacao}.`));
    const total = filhas.reduce((acc, filha) => {
      const valor = valores.get(filha.conta)!;
      acc.saldoAnterior += valor.saldoAnterior;
      acc.debitos += valor.debitos;
      acc.creditos += valor.creditos;
      acc.movimento += valor.movimento;
      acc.saldoAtual += valor.saldoAtual;
      acc.lancamentos += valor.lancamentos;
      return acc;
    }, { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 });
    return { ...linha, ...Object.fromEntries(Object.entries(total).map(([chave, valor]) => [chave, arred(valor)])) } as LinhaBalanceteDominioCalculada;
  });
  const pendencias: PendenciaContaDominio[] = [...apuracao.pendentes].map(([contaAtual, valor]) => {
    const cadastro = contasAtuais.get(contaAtual);
    const saldoAnterior = aberturaPendentes.get(contaAtual) ?? 0;
    const movimento = arred(valor.debitos - valor.creditos);
    return { contaAtual, classificacaoAtual: cadastro?.classificacao ?? "1.1.99", descricaoAtual: cadastro?.descricao ?? "Conta presente no Razão, ausente no plano de maio", saldoAnterior, ...valor, debitos: arred(valor.debitos), creditos: arred(valor.creditos), movimento, saldoAtual: arred(saldoAnterior + movimento) };
  });
  linhas = linhas.map((linha) => {
    if (linha.classificacao.length !== 1) return linha;
    const extras = pendencias.filter((item) => raizDominio(item.classificacaoAtual) === linha.classificacao);
    if (!extras.length) return linha;
    return extras.reduce((total, item) => ({ ...total, saldoAnterior: arred(total.saldoAnterior + item.saldoAnterior), debitos: arred(total.debitos + item.debitos), creditos: arred(total.creditos + item.creditos), movimento: arred(total.movimento + item.movimento), saldoAtual: arred(total.saldoAtual + item.saldoAtual), lancamentos: total.lancamentos + item.quantidade }), linha);
  });
  return { linhas, pendencias };
}

export function calcularBalanceteDominio(junho: LancamentoIntegrado[], julho?: LancamentoIntegrado[]) {
  const aberturaMaio = new Map(balanceteDominioMaio.filter((linha) => linha.tipo === "A").map((linha) => [linha.conta, linha.saldoAtual]));
  const fechamentoJunho = aplicarMovimentos(aberturaMaio, junho);
  if (!julho) return fechamentoJunho;
  const aberturaJulho = new Map(fechamentoJunho.linhas.filter((linha) => linha.tipo === "A").map((linha) => [linha.conta, linha.saldoAtual]));
  const aberturaPendentesJulho = new Map(fechamentoJunho.pendencias.map((linha) => [linha.contaAtual, linha.saldoAtual]));
  const fechamentoJulho = aplicarMovimentos(aberturaJulho, julho, aberturaPendentesJulho);
  return { ...fechamentoJulho, pendenciasAnteriores: fechamentoJunho.pendencias };
}
