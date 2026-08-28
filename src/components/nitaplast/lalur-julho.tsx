import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calcularApuracaoIrpjCsllJulho,
  contaIrrfAplicacoesFinanceirasNitaplast,
} from "@/data/nitaplast-irpj-csll-julho";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
import { calcularBalanceteJulho } from "@/data/nitaplast-balancete-julho-engine";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useLalurAjustes, type ImpostoLalur, type TipoAjusteLalur } from "@/hooks/use-lalur-ajustes";
import { useAjustesLancamentos } from "@/hooks/use-ajustes-lancamentos";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const COMPETENCIA = "2026-07";
const CONTA_IRPJ = "25119";
const CONTA_CSLL = "25120";
const CONTA_BANCO = "11";
const TAG_GERACAO = "LALUR 07/2026";

const nomeConta = (codigo: string) =>
  `${codigo} - ${saldosImplantacao.find((c) => c.conta === codigo)?.descricao ?? "Conta a revisar"}`;

const rotuloImposto: Record<ImpostoLalur, string> = { irpj: "IRPJ", csll: "CSLL", ambos: "IRPJ e CSLL" };

export function LalurJulho() {
  const { aplicar } = useReclassificacoesInteligentes(COMPETENCIA);
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const dre = useMemo(() => calcularDreJulhoFinal(razaoAjustado).dre, [razaoAjustado]);
  const balanceteJulho = useMemo(() => calcularBalanceteJulho(razaoAjustado), [razaoAjustado]);
  const irrfAplicacoesFinanceiras = balanceteJulho.movimentoPorConta.get(contaIrrfAplicacoesFinanceirasNitaplast)?.debitos ?? 0;

  const { ajustes, adicionar, remover, totais } = useLalurAjustes(COMPETENCIA);
  const { ajustes: lancamentos, registrarNovo } = useAjustesLancamentos(COMPETENCIA);

  const [tipo, setTipo] = useState<TipoAjusteLalur>("adicao");
  const [imposto, setImposto] = useState<ImpostoLalur>("ambos");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const irpjCsll = useMemo(
    () => calcularApuracaoIrpjCsllJulho(dre, irrfAplicacoesFinanceiras, totais),
    [dre, irrfAplicacoesFinanceiras, totais],
  );

  const jaGerado = lancamentos.some((item) => item.dados?.historico.includes(TAG_GERACAO));

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
            data: "31/07/2026",
            debitoCodigo: CONTA_IRPJ,
            creditoCodigo: CONTA_BANCO,
            historico: `IRPJ — ESTIMATIVA CALCULADA (${TAG_GERACAO})`,
            documento: "Apuração LALUR 07/2026",
            cc: "0",
            centroCusto: "SEM CENTRO DE CUSTO",
            valor: irpjCsll.irpjAPagar,
          },
          `Cálculo do LALUR de 07/2026 (Balanço de Suspensão/Redução): lucro contábil acumulado jan-jul ${brl.format(irpjCsll.lucroContabilAcumuladoJaneiroAJulho)}, base IRPJ ${brl.format(irpjCsll.baseIrpj)}.`,
        );
      }
      if (irpjCsll.csllAPagar > 0) {
        registrarNovo(
          {
            data: "31/07/2026",
            debitoCodigo: CONTA_CSLL,
            creditoCodigo: CONTA_BANCO,
            historico: `CSLL — ESTIMATIVA CALCULADA (${TAG_GERACAO})`,
            documento: "Apuração LALUR 07/2026",
            cc: "0",
            centroCusto: "SEM CENTRO DE CUSTO",
            valor: irpjCsll.csllAPagar,
          },
          `Cálculo do LALUR de 07/2026 (Balanço de Suspensão/Redução): lucro contábil acumulado jan-jul ${brl.format(irpjCsll.lucroContabilAcumuladoJaneiroAJulho)}, base CSLL ${brl.format(irpjCsll.baseCsll)}.`,
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
            <CardTitle className="text-base">LALUR — Apuração IRPJ/CSLL — 07/2026</CardTitle>
            <CardDescription>
              Balanço de Suspensão/Redução (mesmo método usado em janeiro-junho/2026): lucro real
              acumulado de janeiro a julho ± ajustes do LALUR abaixo, abatidos os DARFs de
              estimativa já pagos até junho.
            </CardDescription>
          </div>
          {jaGerado ? (
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
                <td className="py-2">Lucro Contábil do mês (Resultado da DRE de julho)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.lucroContabilDoMes)}</td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="py-2">Lucro Contábil Acumulado (janeiro a julho/2026)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.lucroContabilAcumuladoJaneiroAJulho)}</td>
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
                <td className="py-2">Base IRPJ (lucro real acumulado Jan-Jul ± adições/exclusões do LALUR)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.baseIrpj)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">IRPJ normal (15%)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irpjNormal)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Adicional IRPJ (10% sobre o que exceder R$ 20.000,00 × 7 meses)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irpjAdicional)}</td>
              </tr>
              <tr className="border-b text-xs text-muted-foreground">
                <td className="py-2">(-) Pagamentos de estimativa de IRPJ já efetuados (jan-jun/2026)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.pagamentosEstimativaIrpjAnteriores)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">(-) IRRF sobre Aplicações Financeiras a compensar (acumulado jan-jul)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irrfAcumuladoCompensavel)}</td>
              </tr>
              <tr className="border-b font-bold">
                <td className="py-2">IRPJ a pagar</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.irpjAPagar)}</td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="py-2">Base CSLL (lucro real acumulado Jan-Jul ± adições/exclusões do LALUR)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.baseCsll)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">CSLL devida (9%)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.csllDevida)}</td>
              </tr>
              <tr className="border-b text-xs text-muted-foreground">
                <td className="py-2">(-) Pagamentos de estimativa de CSLL já efetuados (jan-jun/2026)</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.pagamentosEstimativaCsllAnteriores)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2">CSLL a pagar</td>
                <td className="py-2 text-right tabular-nums">{brl.format(irpjCsll.csllAPagar)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-md border bg-background/60 p-3">
          <p className="mb-2 text-xs font-semibold">Adicionar ajuste do LALUR (adição ou exclusão)</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: multa indedutível, doação, IRRF sobre aplicações…"
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
            Gera o lançamento no mesmo padrão já usado pela Nitaplast (D {nomeConta(CONTA_IRPJ)} / D {nomeConta(CONTA_CSLL)} — C{" "}
            {nomeConta(CONTA_BANCO)}), auditável e editável como qualquer lançamento manual.
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
      </CardContent>
    </Card>
  );
}
