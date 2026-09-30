import { useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado } from "@/lib/apuracao-irpj-csll";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { type useLalurAjustes, type ImpostoLalur, type TipoAjusteLalur } from "@/hooks/use-lalur-ajustes";
import { useAjustesLancamentos } from "@/hooks/use-ajustes-lancamentos";

export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const CONTA_IRPJ = "25119";
const CONTA_CSLL = "25120";
const CONTA_BANCO = "11";

const nomeConta = (codigo: string) =>
  `${codigo} - ${saldosImplantacao.find((c) => c.conta === codigo)?.descricao ?? "Conta a revisar"}`;

const rotuloImposto: Record<ImpostoLalur, string> = { irpj: "IRPJ", csll: "CSLL", ambos: "IRPJ e CSLL" };

type Props = {
  /** Id da competência (ex.: "2026-08"). */
  competencia: string;
  /** Rótulo da competência (ex.: "08/2026"). */
  rotulo: string;
  /** Último dia da competência, data do lançamento gerado (ex.: "31/08/2026"). */
  dataLancamento: string;
  lucroContabilDoMes: number;
  lucroContabilAcumulado: number;
  irpjCsll: ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado;
  lalur: ReturnType<typeof useLalurAjustes>;
  /** Apuração fechada: valores gravados e vencimento do DARF (pago no mês seguinte). */
  fechamento?: { irpj: number; csll: number; vencimento: string };
};

/**
 * Cartão do LALUR pelo Balanço de Suspensão/Redução — mesma tela para qualquer
 * competência; o cálculo (encadeamento dos meses anteriores) fica a cargo de quem usa.
 */
export function LalurApuracaoCard(props: Props) {
  const { competencia, rotulo, dataLancamento, irpjCsll, lalur } = props;
  const { ajustes, adicionar, remover } = lalur;
  const tagGeracao = `LALUR ${rotulo}`;
  const { ajustes: lancamentos, registrarNovo } = useAjustesLancamentos(competencia);

  const [tipo, setTipo] = useState<TipoAjusteLalur>("adicao");
  const [imposto, setImposto] = useState<ImpostoLalur>("ambos");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const jaGerado = lancamentos.some((item) => item.dados?.historico.includes(tagGeracao));
  const { fechamento } = props;
  const divergente =
    fechamento !== undefined &&
    (Math.abs(fechamento.irpj - irpjCsll.irpjAPagar) > 0.01 || Math.abs(fechamento.csll - irpjCsll.csllAPagar) > 0.01);

  function parseValor(texto: string) {
    const limpo = texto.trim();
    if (!limpo) return Number.NaN;
    return Number(limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo);
  }

  function adicionarAjuste() {
    setErro(null);
    try {
      adicionar({ tipo, imposto, descricao, valor: parseValor(valor) });
      setDescricao("");
      setValor("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível adicionar o ajuste.");
    }
  }

  function gerarLancamento() {
    setErro(null);
    try {
      if (irpjCsll.irpjAPagar > 0) {
        registrarNovo(
          {
            data: dataLancamento,
            debitoCodigo: CONTA_IRPJ,
            creditoCodigo: CONTA_BANCO,
            historico: `IRPJ — ESTIMATIVA CALCULADA (${tagGeracao})`,
            documento: `Apuração LALUR ${rotulo}`,
            cc: "0",
            centroCusto: "SEM CENTRO DE CUSTO",
            valor: irpjCsll.irpjAPagar,
          },
          `Cálculo do LALUR de ${rotulo} (Balanço de Suspensão/Redução): lucro contábil acumulado até ${dataLancamento} ${brl.format(props.lucroContabilAcumulado)}, base IRPJ ${brl.format(irpjCsll.baseIrpj)}.`,
        );
      }
      if (irpjCsll.csllAPagar > 0) {
        registrarNovo(
          {
            data: dataLancamento,
            debitoCodigo: CONTA_CSLL,
            creditoCodigo: CONTA_BANCO,
            historico: `CSLL — ESTIMATIVA CALCULADA (${tagGeracao})`,
            documento: `Apuração LALUR ${rotulo}`,
            cc: "0",
            centroCusto: "SEM CENTRO DE CUSTO",
            valor: irpjCsll.csllAPagar,
          },
          `Cálculo do LALUR de ${rotulo} (Balanço de Suspensão/Redução): lucro contábil acumulado até ${dataLancamento} ${brl.format(props.lucroContabilAcumulado)}, base CSLL ${brl.format(irpjCsll.baseCsll)}.`,
        );
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o lançamento.");
    }
  }

  return (
    <Card className="border-amber-500/40 bg-amber-50/40">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">LALUR — Apuração IRPJ/CSLL — {rotulo}</CardTitle>
          </div>
          {fechamento ? (
            <Badge
              variant="outline"
              className={divergente ? "border-red-600 text-red-700" : "border-emerald-600 text-emerald-800"}
            >
              {divergente ? "Divergente do fechamento" : <><CheckCircle2 className="mr-1 size-3.5" /> Fechado</>}
            </Badge>
          ) : jaGerado ? (
            <Badge variant="outline" className="border-emerald-600 text-emerald-800">
              <CheckCircle2 className="mr-1 size-3.5" /> Lançamento gerado
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-600 text-amber-800">
              Ainda não lançado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b text-xs text-muted-foreground">
                <td className="py-2">Lucro contábil do mês</td>
                <td className="py-2 text-right tabular-nums">{brl.format(props.lucroContabilDoMes)}</td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="py-2">Lucro contábil acumulado até {dataLancamento}</td>
                <td className="py-2 text-right tabular-nums">{brl.format(props.lucroContabilAcumulado)}</td>
              </tr>
              {ajustes.map((ajuste) => (
                <tr key={ajuste.id} className="border-b text-xs text-muted-foreground">
                  <td className="py-2">
                    {ajuste.tipo === "adicao" ? "(+) Adição" : "(-) Exclusão"} · {rotuloImposto[ajuste.imposto]} —{" "}
                    {ajuste.descricao}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-2 size-5 align-middle text-muted-foreground hover:text-destructive"
                      onClick={() => remover(ajuste.id)}
                      aria-label="Remover ajuste"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {ajuste.tipo === "adicao" ? "+" : "−"} {brl.format(ajuste.valor)}
                  </td>
                </tr>
              ))}
              <tr className="border-b font-semibold">
                <td className="py-2">Base de cálculo IRPJ</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.baseIrpj)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">IRPJ 15%</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irpjNormal)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Adicional IRPJ 10%</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irpjAdicional)}</td>
              </tr>
              <tr className="border-b text-xs text-muted-foreground">
                <td className="py-2">(-) Pagamentos até {dataLancamento}</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.pagamentosEstimativaIrpjAnteriores)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">(-) IRRF sobre aplicações até {dataLancamento}</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irrfAcumuladoCompensavel)}</td>
              </tr>
              <tr className="border-b font-bold">
                <td className="py-2">IRPJ a pagar</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irpjAPagar)}</td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="py-2">Base de cálculo CSLL</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.baseCsll)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">CSLL 9%</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.csllDevida)}</td>
              </tr>
              <tr className="border-b text-xs text-muted-foreground">
                <td className="py-2">(-) Pagamentos até {dataLancamento}</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.pagamentosEstimativaCsllAnteriores)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2">CSLL a pagar</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.csllAPagar)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {fechamento ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span>{fechamento.irpj + fechamento.csll > 0 ? `DARF vencimento ${fechamento.vencimento}` : "Sem DARF a pagar"}</span>
            <span className="tabular-nums">
              IRPJ {brl.format(fechamento.irpj)} · CSLL {brl.format(fechamento.csll)} · Total{" "}
              <strong>{brl.format(fechamento.irpj + fechamento.csll)}</strong>
            </span>
          </div>
        ) : (
        <>
        <div className="rounded-md border bg-background/60 p-3">
          <p className="mb-2 text-xs font-semibold">Adições e exclusões</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição"
              className="h-9"
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoAjusteLalur)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="adicao">Adição</option>
              <option value="exclusao">Exclusão</option>
            </select>
            <select
              value={imposto}
              onChange={(e) => setImposto(e.target.value as ImpostoLalur)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="ambos">IRPJ e CSLL</option>
              <option value="irpj">Só IRPJ</option>
              <option value="csll">Só CSLL</option>
            </select>
            <Input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="h-9 w-28"
            />
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={adicionarAjuste}>
              <Plus className="size-4" /> Adicionar
            </Button>
          </div>
        </div>

        {erro ? <div className="rounded-md border border-red-400 bg-red-500/5 p-3 text-sm text-red-700">{erro}</div> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-sky-300 bg-sky-50 p-3 text-xs text-sky-900">
          <span>
            D {nomeConta(CONTA_IRPJ)} / D {nomeConta(CONTA_CSLL)} — C {nomeConta(CONTA_BANCO)}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={gerarLancamento}
            disabled={jaGerado || (irpjCsll.irpjAPagar <= 0 && irpjCsll.csllAPagar <= 0)}
          >
            Gerar lançamento
          </Button>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
