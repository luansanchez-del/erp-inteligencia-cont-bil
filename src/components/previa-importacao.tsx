import { useMemo, useState } from "react";
import { CheckCircle2, TriangleAlert, Info, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContaCombobox } from "@/components/conta-combobox";
import { useLancamentosCompetencia } from "@/hooks/use-lancamentos-competencia";
import type { AchadoImportacao, ItemDossieImportacao, LinhaPreviaImportacao, ResultadoLeituraDocumento } from "@/types/erp";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function IconeAchado({ severidade }: { severidade: AchadoImportacao["severidade"] }) {
  if (severidade === "impedimento") return <Ban className="size-3.5 shrink-0 text-red-700" />;
  if (severidade === "alerta") return <TriangleAlert className="size-3.5 shrink-0 text-amber-700" />;
  return <Info className="size-3.5 shrink-0 text-blue-700" />;
}

function ListaAchados({ achados }: { achados: AchadoImportacao[] }) {
  if (!achados.length) return null;
  return (
    <div className="grid gap-1">
      {achados.map((a, i) => (
        <div key={i} className={`flex items-start gap-1.5 text-xs ${a.severidade === "impedimento" ? "text-red-800" : a.severidade === "alerta" ? "text-amber-800" : "text-blue-800"}`}>
          <IconeAchado severidade={a.severidade} />
          <span>{a.mensagem}</span>
        </div>
      ))}
    </div>
  );
}

export function PreviaImportacao({
  item,
  resultado,
  empresaId,
  competenciaId,
  onGerado,
}: {
  item: ItemDossieImportacao;
  resultado: ResultadoLeituraDocumento;
  empresaId: string;
  competenciaId: string;
  onGerado: (ids: string[]) => void;
}) {
  const { registrar } = useLancamentosCompetencia(empresaId, competenciaId);
  const [linhas, setLinhas] = useState<LinhaPreviaImportacao[]>(resultado.linhas);
  const [incluidas, setIncluidas] = useState<Set<string>>(() => new Set(resultado.linhas.map((l) => l.id)));
  const [gerados, setGerados] = useState<string[] | null>(item.lancamentosGeradosIds ?? null);

  const impedimentoDocumento = resultado.achados.some((a) => a.severidade === "impedimento");

  function atualizarLinha(id: string, campo: "debitoCodigo" | "creditoCodigo", valor: string) {
    setLinhas((atuais) => atuais.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  const totais = useMemo(() => {
    const selecionadas = linhas.filter((l) => incluidas.has(l.id));
    const comImpedimento = selecionadas.filter((l) => l.achados.some((a) => a.severidade === "impedimento"));
    const semConta = selecionadas.filter((l) => !l.debitoCodigo || !l.creditoCodigo);
    return { selecionadas, comImpedimento, semConta, valor: selecionadas.reduce((s, l) => s + l.valor, 0) };
  }, [linhas, incluidas]);

  const podeGerar = !impedimentoDocumento && totais.selecionadas.length > 0 && totais.comImpedimento.length === 0 && totais.semConta.length === 0 && !gerados;

  function gerarLancamentos() {
    const ids = totais.selecionadas.map((l) => registrar({ data: l.data, debitoCodigo: l.debitoCodigo, creditoCodigo: l.creditoCodigo, historico: l.historico, documento: l.documento, cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: l.valor }, "importado", item.id).id);
    setGerados(ids);
    onGerado(ids);
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">Prévia da leitura — {item.arquivo}</CardTitle>
        <CardDescription>Revise débito/crédito antes de aprovar. Nada aqui é lançamento até você clicar em "Gerar lançamentos".</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ListaAchados achados={resultado.achados} />
        {!resultado.suportado ? null : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs">
                    <th className="p-2">Incluir</th><th className="p-2">Data</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico</th><th className="p-2 text-right">Valor</th><th className="p-2">Achados</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.id} className="border-b last:border-0 align-top">
                      <td className="p-2"><input type="checkbox" checked={incluidas.has(l.id)} disabled={!!gerados} onChange={(e) => setIncluidas((atual) => { const n = new Set(atual); e.target.checked ? n.add(l.id) : n.delete(l.id); return n; })} /></td>
                      <td className="p-2 whitespace-nowrap">{new Date(`${l.data}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                      <td className="min-w-[200px] p-2"><ContaCombobox value={l.debitoCodigo} onChange={(c) => atualizarLinha(l.id, "debitoCodigo", c)} excluir={l.creditoCodigo} /></td>
                      <td className="min-w-[200px] p-2"><ContaCombobox value={l.creditoCodigo} onChange={(c) => atualizarLinha(l.id, "creditoCodigo", c)} excluir={l.debitoCodigo} /></td>
                      <td className="max-w-[320px] p-2 text-muted-foreground">{l.historico}</td>
                      <td className="p-2 text-right tabular-nums">{brl.format(l.valor)}</td>
                      <td className="min-w-[220px] p-2"><ListaAchados achados={l.achados} /></td>
                    </tr>
                  ))}
                  {linhas.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma linha extraída deste documento.</td></tr> : null}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">{totais.selecionadas.length} linha(s) selecionada(s) · total {brl.format(totais.valor)}</div>
              {gerados ? (
                <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="size-3.5" /> {gerados.length} lançamento(s) gerado(s)</Badge>
              ) : (
                <Button onClick={gerarLancamentos} disabled={!podeGerar}>Gerar {totais.selecionadas.length} lançamento(s)</Button>
              )}
            </div>
            {!podeGerar && !gerados ? (
              <p className="text-xs text-muted-foreground">
                {impedimentoDocumento ? "Bloqueado: há impedimento no documento (veja acima) — corrija a origem e importe novamente." : totais.comImpedimento.length ? `Bloqueado: ${totais.comImpedimento.length} linha(s) com impedimento.` : totais.semConta.length ? `Bloqueado: ${totais.semConta.length} linha(s) sem débito/crédito definido.` : "Selecione ao menos uma linha."}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
