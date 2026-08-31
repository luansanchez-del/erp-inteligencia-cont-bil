type LinhaResumoBalancete = {
  tipo: "A" | "S";
  conta?: string;
  classificacao: string;
  descricao: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  saldoAtual: number;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (valor: number) => Math.round(valor * 100) / 100;

type ResultadoResumo = { saldoAnterior: number; movimentoMes: number };

export function BalancetePrintSummary({ linhas, resultadoContabil, resultadoNaoOperacional }: { linhas: LinhaResumoBalancete[]; resultadoContabil?: ResultadoResumo; resultadoNaoOperacional?: ResultadoResumo }) {
  const { empresa } = useErp();
  const analiticas = linhas.filter((linha) => linha.tipo === "A");
  const total = (campo: "saldoAnterior" | "debitos" | "creditos" | "saldoAtual") => arred(analiticas.reduce((soma, linha) => soma + linha[campo], 0));
  const porClassificacao = (classificacao: string) => linhas.find((linha) => linha.tipo === "S" && linha.classificacao === classificacao);
  const porDescricao = (expressao: RegExp) => linhas.filter((linha) => linha.tipo === "S" && expressao.test(linha.descricao)).sort((a, b) => a.classificacao.split(".").length - b.classificacao.split(".").length)[0];
  const vazio = (descricao: string): LinhaResumoBalancete => ({ tipo: "S", classificacao: "", descricao, saldoAnterior: 0, debitos: 0, creditos: 0, saldoAtual: 0 });
  const ativo = porDescricao(/^ATIVO$/i) ?? porClassificacao("1") ?? vazio("ATIVO");
  const passivo = porDescricao(/^PASSIVO$/i) ?? porClassificacao("2") ?? vazio("PASSIVO");
  const patrimonio = porDescricao(/^PATRIM[ÔO]NIO L[ÍI]QUIDO$/i) ?? vazio("PATRIMÔNIO LÍQUIDO");
  const receitas = porDescricao(/^RECEITAS$/i) ?? vazio("RECEITAS");
  const despesasBase = porDescricao(/^CUSTOS E DESPESAS$/i) ?? porDescricao(/^DESPESAS OPERACIONAIS$/i) ?? vazio("DESPESAS OPERACIONAIS");
  const despesas = { ...despesasBase, descricao: "DESPESAS OPERACIONAIS" };
  // Alguns planos (ex.: Domínio) não têm conta sintética própria de "Resultados Não
  // Operacionais" — contas como alienação de imobilizado ficam misturadas dentro de
  // Receitas/Despesas (ex.: "Receitas Eventuais", "Perdas"), que também recebem OUTRAS
  // contas de origens diferentes mapeadas para o mesmo código Domínio. Por isso o
  // chamador informa o movimento exato (já apurado a partir das contas reais no
  // Razão, não do agregado do Domínio) em vez de tentarmos extrair daqui — extrair da
  // linha agregada do Domínio contaminaria o valor com contas não relacionadas.
  const naoOperacionalEncontrada = linhas.find((linha) => linha.tipo === "S" && /RESULTAD.*NÃO OPERACION|OUTROS RESULTADOS OPERACIONAIS/i.test(linha.descricao));
  const naoOperacional = resultadoNaoOperacional
    ? { ...vazio("RESULTADOS NÃO OPERACIONAIS"), saldoAnterior: arred(resultadoNaoOperacional.saldoAnterior), debitos: Math.max(0, resultadoNaoOperacional.movimentoMes), creditos: Math.max(0, -resultadoNaoOperacional.movimentoMes), saldoAtual: arred(resultadoNaoOperacional.saldoAnterior + resultadoNaoOperacional.movimentoMes) }
    : { ...(naoOperacionalEncontrada ?? vazio("RESULTADOS NÃO OPERACIONAIS")), descricao: "RESULTADOS NÃO OPERACIONAIS" };
  const compensacaoAtivaBase = porDescricao(/^(ATIVO COMPENSATÓRIO|CONTAS DE COMPENSAÇÃO)$/i) ?? vazio("CONTAS DE COMPENSAÇÃO");
  const compensacaoAtiva = { ...compensacaoAtivaBase, descricao: "CONTAS DE COMPENSAÇÃO" };
  const compensacaoPassivaBase = linhas.filter((linha) => linha.tipo === "S" && /^(PASSIVO COMPENSATÓRIO|CONTAS DE COMPENSAÇÃO)$/i.test(linha.descricao)).sort((a, b) => b.classificacao.localeCompare(a.classificacao))[0];
  const compensacaoPassiva = { ...(compensacaoPassivaBase ?? vazio("CONTAS DE COMPENSAÇÃO")), descricao: "CONTAS DE COMPENSAÇÃO" };
  // Fallback (usado quando a competência não tem motor de DRE dedicado, ex.: junho):
  // deriva do movimento das próprias linhas de Receitas/Despesas Operacionais/Resultados
  // Não Operacionais já resolvidas acima (batem com o Domínio), em vez de tentar
  // reclassificar contas por prefixo — um filtro de classificação (`/^(4|5)/`) já se
  // mostrou incompleto e chegou a ignorar a Receita inteira em junho/2026.
  const gruposResultado = [receitas, despesas, naoOperacional];
  const saldoAnteriorResultado = arred(resultadoContabil?.saldoAnterior ?? gruposResultado.reduce((soma, linha) => soma + linha.saldoAnterior, 0));
  const movimentoResultado = arred(resultadoContabil?.movimentoMes ?? gruposResultado.reduce((soma, linha) => soma + (linha.saldoAtual - linha.saldoAnterior), 0));
  const linhaResultado = (descricao: string, incluirAnterior: boolean): LinhaResumoBalancete => ({
    tipo: "S",
    classificacao: "",
    descricao,
    saldoAnterior: incluirAnterior ? saldoAnteriorResultado : 0,
    debitos: Math.max(0, movimentoResultado),
    creditos: Math.max(0, -movimentoResultado),
    saldoAtual: arred((incluirAnterior ? saldoAnteriorResultado : 0) + movimentoResultado),
  });
  const linhasResumo = [ativo, passivo, patrimonio, receitas, despesas, naoOperacional, compensacaoAtiva, compensacaoPassiva];
  const devedoras: LinhaResumoBalancete = { tipo: "S", classificacao: "", descricao: "CONTAS DEVEDORAS", saldoAnterior: arred(analiticas.reduce((s, x) => s + Math.max(0, x.saldoAnterior), 0)), debitos: total("debitos"), creditos: total("creditos"), saldoAtual: arred(analiticas.reduce((s, x) => s + Math.max(0, x.saldoAtual), 0)) };
  const credoras: LinhaResumoBalancete = { tipo: "S", classificacao: "", descricao: "CONTAS CREDORAS", saldoAnterior: -arred(analiticas.reduce((s, x) => s + Math.max(0, -x.saldoAnterior), 0)), debitos: total("debitos"), creditos: total("creditos"), saldoAtual: -arred(analiticas.reduce((s, x) => s + Math.max(0, -x.saldoAtual), 0)) };
  const resultadoMes = linhaResultado("RESULTADO DO MÊS", false);
  const resultadoExercicio = linhaResultado("RESULTADO DO EXERCÍCIO", true);
  if (Math.abs(resultadoExercicio.saldoAtual - arred(resultadoExercicio.saldoAnterior + resultadoMes.saldoAtual)) > 0.01) throw new Error("Resultado anterior + resultado do mês não fecha com o resultado do exercício.");

  return <section className="erp-resumo-balancete mt-5 rounded-lg border bg-card p-4 text-card-foreground print:break-before-page print:break-inside-avoid print:rounded-none print:border-0 print:bg-transparent print:p-0 print:text-black">
    <h2 className="mb-3 text-center text-sm font-bold uppercase print:text-[10pt]">Resumo do Balancete</h2>
    <div className="overflow-x-auto">
      <table className="erp-resumo-balancete-table w-full min-w-160 table-fixed border-collapse text-xs print:min-w-0 print:text-[8pt]">
        <colgroup><col className="w-[36%]"/><col className="w-[16%]"/><col className="w-[16%]"/><col className="w-[16%]"/><col className="w-[16%]"/></colgroup>
        <thead><tr className="border-y print:border-black"><th className="px-2 py-1 text-left">Grupo</th><th className="px-2 py-1 text-right">Saldo anterior</th><th className="px-2 py-1 text-right">Débitos</th><th className="px-2 py-1 text-right">Créditos</th><th className="px-2 py-1 text-right">Saldo atual</th></tr></thead>
        <tbody>
          {linhasResumo.map((linha, indice) => <tr key={`${linha.descricao}-${indice}`} className="border-b border-border/60 print:border-black/20"><td className="px-2 py-1 font-semibold">{linha.descricao}</td><Valor valor={linha.saldoAnterior} natureza/><Valor valor={linha.debitos}/><Valor valor={linha.creditos}/><Valor valor={linha.saldoAtual} natureza/></tr>)}
          <tr><td colSpan={5} className="h-2"/></tr>
          {[devedoras, credoras].map((linha) => <tr key={linha.descricao} className="border-b border-border/60 print:border-black/20"><td className="px-2 py-1 font-semibold">{linha.descricao}</td><Valor valor={linha.saldoAnterior} natureza/><Valor valor={linha.debitos}/><Valor valor={linha.creditos}/><Valor valor={linha.saldoAtual} natureza/></tr>)}
          <tr><td colSpan={5} className="h-2"/></tr>
          {[resultadoMes, resultadoExercicio].map((linha) => <tr key={linha.descricao} className="font-bold"><td className="px-2 py-1">{linha.descricao}</td><Valor valor={linha.saldoAnterior} natureza/><Valor valor={linha.debitos}/><Valor valor={linha.creditos}/><Valor valor={linha.saldoAtual} natureza/></tr>)}
        </tbody>
      </table>
    </div>
    {(empresa.responsavelLegal || empresa.responsavelContabil) ? <div className="mt-12 grid grid-cols-1 gap-8 text-xs sm:grid-cols-2 sm:gap-20 print:grid-cols-2 print:gap-20 print:text-[7pt]">
      <Assinatura nome={empresa.responsavelLegal?.nome} detalhe={[empresa.responsavelLegal?.cargo, empresa.responsavelLegal?.cpf ? `CPF: ${empresa.responsavelLegal.cpf}` : undefined]}/>
      <Assinatura nome={empresa.responsavelContabil?.nome} detalhe={[empresa.responsavelContabil?.registro, empresa.responsavelContabil?.cpf ? `CPF: ${empresa.responsavelContabil.cpf}` : undefined]}/>
    </div> : null}
  </section>;
}

function Assinatura({ nome, detalhe }: { nome?: string | undefined; detalhe: Array<string | undefined> }) { if (!nome) return <div/>; return <div className="border-t pt-1 print:border-black"><div>{nome}</div>{detalhe.filter(Boolean).map((item) => <div key={item}>{item}</div>)}</div>; }

function Valor({ valor, natureza = false }: { valor: number; natureza?: boolean }) { return <td className="px-2 py-1 text-right tabular-nums">{formatar(valor, natureza)}</td>; }
function formatar(valor: number, natureza = false) { if (Math.abs(valor) < 0.005) return "0,00"; const numero = brl.format(Math.abs(valor)).replace("R$ ", ""); return natureza ? `${numero}${valor < 0 ? "C" : "D"}` : numero; }
import { useErp } from "@/context/erp-context";
