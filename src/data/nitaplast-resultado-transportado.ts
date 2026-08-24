import { balanceteDominioMaio } from "./nitaplast-balancete-dominio-maio";
import { comparacaoDreDetalhada } from "./nitaplast-dre-detalhada-v7";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const raiz = (descricao: string) => balanceteDominioMaio.find((linha) => linha.tipo === "S" && linha.descricao === descricao);
const ativoMaio = raiz("ATIVO")?.saldoAtual ?? 0;
const passivoMaio = raiz("PASSIVO")?.saldoAtual ?? 0;

// O resultado fechado de maio nasce da equacao patrimonial do Balancete
// original. Junho vem da DRE enviada e preservada no modulo de comparacao.
// Valores credores sao transportados com sinal negativo.
export const resultadoExercicioMaio2026 = arred(-(ativoMaio + passivoMaio));
export const resultadoJunho2026 = arred(-(comparacaoDreDetalhada.find((linha) => linha.id === "resultado-op")?.enviado ?? 0));
export const saldoAnteriorResultadoJulho2026 = arred(resultadoExercicioMaio2026 + resultadoJunho2026);
