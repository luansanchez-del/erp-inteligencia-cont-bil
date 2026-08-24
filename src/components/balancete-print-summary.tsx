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
  const grupos = linhas.filter((linha) => linha.tipo === "S" && !linha.classificacao.includes("."));
  const analiticas = linhas.filter((linha) => linha.tipo === "A");
  const total = (campo: "saldoAnterior" | "debitos" | "creditos" | "saldoAtual") => arred(analiticas.reduce((soma, linha) => soma + linha[campo], 0));

  return <section className="mt-5 hidden break-inside-avoid border border-black p-3 text-black print:block">
    <h2 className="mb-2 text-[10pt] font-bold uppercase">Resumo do Balancete</h2>
    <table className="w-full border-collapse text-[8pt]">
      <thead><tr className="border-y border-black"><th className="px-2 py-1 text-left">Grupo</th><th className="px-2 py-1 text-right">Saldo anterior</th><th className="px-2 py-1 text-right">Débitos</th><th className="px-2 py-1 text-right">Créditos</th><th className="px-2 py-1 text-right">Saldo atual</th></tr></thead>
      <tbody>
        {grupos.map((linha) => <tr key={linha.classificacao} className="border-b border-black/40"><td className="px-2 py-1 font-semibold">{linha.descricao}</td><Valor valor={linha.saldoAnterior}/><Valor valor={linha.debitos}/><Valor valor={linha.creditos}/><Valor valor={linha.saldoAtual}/></tr>)}
        <tr className="border-t-2 border-black font-bold"><td className="px-2 py-1">TOTAL DAS CONTAS ANALÍTICAS</td><Valor valor={total("saldoAnterior")}/><Valor valor={total("debitos")}/><Valor valor={total("creditos")}/><Valor valor={total("saldoAtual")}/></tr>
        <tr className="font-bold"><td className="px-2 py-1">DIFERENÇA DÉBITOS − CRÉDITOS</td><td/><td colSpan={2} className="px-2 py-1 text-right tabular-nums">{formatar(total("debitos") - total("creditos"))}</td><td/></tr>
      </tbody>
    </table>
  </section>;
}

function Valor({ valor }: { valor: number }) { return <td className="px-2 py-1 text-right tabular-nums">{formatar(valor)}</td>; }
function formatar(valor: number) { return Math.abs(valor) < 0.005 ? "-" : valor < 0 ? `(${brl.format(Math.abs(valor))})` : brl.format(valor); }
