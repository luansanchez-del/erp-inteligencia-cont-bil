type LinhaResumoBalancete = {
  tipo: "A" | "S";
  classificacao: string;
  descricao: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  saldoAtual: number;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (valor: number) => Math.round(valor * 100) / 100;

export function BalancetePrintSummary({ linhas }: { linhas: LinhaResumoBalancete[] }) {
  const { empresa } = useErp();
  const analiticas = linhas.filter((linha) => linha.tipo === "A");
  const total = (campo: "saldoAnterior" | "debitos" | "creditos" | "saldoAtual") => arred(analiticas.reduce((soma, linha) => soma + linha[campo], 0));
  const porClassificacao = (classificacao: string) => linhas.find((linha) => linha.tipo === "S" && linha.classificacao === classificacao);
  const vazio = (descricao: string): LinhaResumoBalancete => ({ tipo: "S", classificacao: "", descricao, saldoAnterior: 0, debitos: 0, creditos: 0, saldoAtual: 0 });
  const ativo = porClassificacao("1") ?? vazio("ATIVO");
  const passivo = porClassificacao("2") ?? vazio("PASSIVO");
  const patrimonio = porClassificacao("2.3") ?? vazio("PATRIMÔNIO LÍQUIDO");
  const receitas = porClassificacao("3") ?? vazio("RECEITAS");
  const despesas = porClassificacao("4") ?? porClassificacao("5") ?? vazio("DESPESAS OPERACIONAIS");
  const naoOperacional = linhas.find((linha) => linha.tipo === "S" && /RESULTAD.*NÃO OPERACION|OUTROS RESULTADOS OPERACIONAIS/i.test(linha.descricao)) ?? vazio("RESULTADOS NÃO OPERACIONAIS");
  const compensacaoAtiva = porClassificacao("1.9") ?? vazio("CONTAS DE COMPENSAÇÃO");
  const compensacaoPassiva = porClassificacao("2.5") ?? vazio("CONTAS DE COMPENSAÇÃO");
  const resultado = (descricao: string, somenteMes: boolean): LinhaResumoBalancete => {
    const saldoAnterior = somenteMes ? 0 : arred(receitas.saldoAnterior + despesas.saldoAnterior + naoOperacional.saldoAnterior);
    const debitos = arred(receitas.debitos + despesas.debitos + naoOperacional.debitos);
    const creditos = arred(receitas.creditos + despesas.creditos + naoOperacional.creditos);
    return { tipo: "S", classificacao: "", descricao, saldoAnterior, debitos, creditos, saldoAtual: arred(saldoAnterior + debitos - creditos) };
  };
  const linhasResumo = [ativo, passivo, patrimonio, receitas, despesas, naoOperacional, compensacaoAtiva, compensacaoPassiva];
  const devedoras: LinhaResumoBalancete = { tipo: "S", classificacao: "", descricao: "CONTAS DEVEDORAS", saldoAnterior: arred(analiticas.reduce((s, x) => s + Math.max(0, x.saldoAnterior), 0)), debitos: total("debitos"), creditos: total("creditos"), saldoAtual: arred(analiticas.reduce((s, x) => s + Math.max(0, x.saldoAtual), 0)) };
  const credoras: LinhaResumoBalancete = { tipo: "S", classificacao: "", descricao: "CONTAS CREDORAS", saldoAnterior: -arred(analiticas.reduce((s, x) => s + Math.max(0, -x.saldoAnterior), 0)), debitos: total("debitos"), creditos: total("creditos"), saldoAtual: -arred(analiticas.reduce((s, x) => s + Math.max(0, -x.saldoAtual), 0)) };

  return <section className="mt-5 hidden break-inside-avoid border border-black p-3 text-black print:block">
    <h2 className="mb-2 text-[10pt] font-bold uppercase">Resumo do Balancete</h2>
    <table className="w-full border-collapse text-[8pt]">
      <thead><tr className="border-y border-black"><th className="px-2 py-1 text-left">Grupo</th><th className="px-2 py-1 text-right">Saldo anterior</th><th className="px-2 py-1 text-right">Débitos</th><th className="px-2 py-1 text-right">Créditos</th><th className="px-2 py-1 text-right">Saldo atual</th></tr></thead>
      <tbody>
        {linhasResumo.map((linha, indice) => <tr key={`${linha.descricao}-${indice}`} className="border-b border-black/20"><td className="px-2 py-1 font-semibold">{linha.descricao}</td><Valor valor={linha.saldoAnterior} natureza/><Valor valor={linha.debitos}/><Valor valor={linha.creditos}/><Valor valor={linha.saldoAtual} natureza/></tr>)}
        <tr><td colSpan={5} className="h-2"/></tr>
        {[devedoras, credoras].map((linha) => <tr key={linha.descricao} className="border-b border-black/20"><td className="px-2 py-1 font-semibold">{linha.descricao}</td><Valor valor={linha.saldoAnterior} natureza/><Valor valor={linha.debitos}/><Valor valor={linha.creditos}/><Valor valor={linha.saldoAtual} natureza/></tr>)}
        <tr><td colSpan={5} className="h-2"/></tr>
        {[resultado("RESULTADO DO MÊS", true), resultado("RESULTADO DO EXERCÍCIO", false)].map((linha) => <tr key={linha.descricao} className="font-bold"><td className="px-2 py-1">{linha.descricao}</td><Valor valor={linha.saldoAnterior} natureza/><Valor valor={linha.debitos}/><Valor valor={linha.creditos}/><Valor valor={linha.saldoAtual} natureza/></tr>)}
      </tbody>
    </table>
    {(empresa.responsavelLegal || empresa.responsavelContabil) ? <div className="mt-12 grid grid-cols-2 gap-20 text-[7pt]">
      <Assinatura nome={empresa.responsavelLegal?.nome} detalhe={[empresa.responsavelLegal?.cargo, empresa.responsavelLegal?.cpf ? `CPF: ${empresa.responsavelLegal.cpf}` : undefined]}/>
      <Assinatura nome={empresa.responsavelContabil?.nome} detalhe={[empresa.responsavelContabil?.registro, empresa.responsavelContabil?.cpf ? `CPF: ${empresa.responsavelContabil.cpf}` : undefined]}/>
    </div> : null}
  </section>;
}

function Assinatura({ nome, detalhe }: { nome?: string; detalhe: Array<string | undefined> }) { if (!nome) return <div/>; return <div className="border-t border-black pt-1"><div>{nome}</div>{detalhe.filter(Boolean).map((item) => <div key={item}>{item}</div>)}</div>; }

function Valor({ valor, natureza = false }: { valor: number; natureza?: boolean }) { return <td className="px-2 py-1 text-right tabular-nums">{formatar(valor, natureza)}</td>; }
function formatar(valor: number, natureza = false) { if (Math.abs(valor) < 0.005) return "0,00"; const numero = brl.format(Math.abs(valor)).replace("R$ ", ""); return natureza ? `${numero}${valor < 0 ? "C" : "D"}` : numero; }
import { useErp } from "@/context/erp-context";
