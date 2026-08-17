import { AlertTriangle, Boxes, FileCheck2, ReceiptText, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  entradasCentroCustoJulho,
  estoqueFinalMatrizJulhoPorConta,
  estoqueFinalMatrizJulhoTotal,
  fiscalJulho,
  fontesFechamentoJulho,
  itensManuaisJulho,
  receitaFiscalJulho,
} from "@/data/nitaplast-fechamento-julho";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Metric({ label, value, detalhe }: { label: string; value: number; detalhe?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{brl.format(value)}</p>
      {detalhe ? <p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

export function FechamentoNitaplastJulho() {
  const fontesValidadas = fontesFechamentoJulho.filter((fonte) => fonte.status === "validado").length;
  const cobertura = (fontesValidadas / fontesFechamentoJulho.length) * 100;
  const restosEstoque = estoqueFinalMatrizJulhoPorConta["25134"];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Receita bruta fiscal preliminar"
          value={receitaFiscalJulho.totalBruto}
          detalhe="Somente vendas externas documentadas; sem transferências e remessas."
        />
        <Metric
          label="Receita líquida preliminar"
          value={receitaFiscalJulho.receitaLiquidaPreliminar}
          detalhe="Antes de CPV, folha, depreciação e resultado financeiro."
        />
        <Metric
          label="Inventário matriz 31/07"
          value={estoqueFinalMatrizJulhoTotal}
          detalhe="Inventário oficial atualizado, incluindo elaboração."
        />
        <Metric
          label="CC ainda não distribuído"
          value={entradasCentroCustoJulho.valorSemCentroCustoCompleto}
          detalhe={`${entradasCentroCustoJulho.documentosComDiferenca} documentos sem rateio completo; sem rateio automático.`}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="size-4" /> Base documental de julho</CardTitle>
              <CardDescription>Competência 07/2026 criada e fontes normalizadas antes de formar o Razão.</CardDescription>
            </div>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Em fechamento</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{fontesValidadas} de {fontesFechamentoJulho.length} fontes totalmente validadas</span>
            <span>Relatórios de validação fiscal não entram no fechamento contábil</span>
          </div>
          <Progress value={cobertura} />
          <div className="grid gap-2 md:grid-cols-2">
            {fontesFechamentoJulho.map((fonte) => (
              <div key={fonte.id} className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{fonte.nome}</p>
                  <p className="text-xs text-muted-foreground">{fonte.detalhe}</p>
                  {"observacao" in fonte && fonte.observacao ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">{fonte.observacao}</p>
                  ) : null}
                </div>
                <Badge variant={fonte.status === "validado" ? "default" : fonte.status === "pendente" ? "destructive" : "outline"}>
                  {fonte.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Scale className="size-4" /> Receita e deduções fiscais</CardTitle>
            <CardDescription>Primeira camada da DRE calculada. Ainda não é resultado final.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between border-b py-2"><span>Produção — matriz</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.matriz.producao)}</span></div>
            <div className="flex justify-between border-b py-2"><span>Revenda — matriz</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.matriz.revenda)}</span></div>
            <div className="flex justify-between border-b py-2"><span>Produção/operação triangular — filial</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.filialSp.producaoOperacaoTriangular)}</span></div>
            <div className="flex justify-between border-b py-2"><span>Revenda — filial</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.filialSp.revenda)}</span></div>
            <div className="flex justify-between border-b py-2 font-medium"><span>Receita bruta</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.totalBruto)}</span></div>
            <div className="flex justify-between border-b py-2"><span>(-) Devoluções</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.deducoesPreliminares.devolucoes)}</span></div>
            <div className="flex justify-between border-b py-2"><span>(-) ICMS + ICMS-ST</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.deducoesPreliminares.icms + receitaFiscalJulho.deducoesPreliminares.icmsSt)}</span></div>
            <div className="flex justify-between border-b py-2"><span>(-) IPI</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.deducoesPreliminares.ipi)}</span></div>
            <div className="flex justify-between border-b py-2"><span>(-) PIS</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.deducoesPreliminares.pis)}</span></div>
            <div className="flex justify-between border-b py-2"><span>(-) COFINS</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.deducoesPreliminares.cofins)}</span></div>
            <div className="flex justify-between py-2 font-semibold"><span>Receita líquida preliminar</span><span className="tabular-nums">{brl.format(receitaFiscalJulho.receitaLiquidaPreliminar)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Boxes className="size-4" /> Estoque final da matriz</CardTitle>
            <CardDescription>Alvos patrimoniais do inventário de 31/07; a contrapartida só nasce depois dos movimentos reais do mês.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between border-b py-2"><span>25133 — Produto acabado</span><span className="tabular-nums">{brl.format(estoqueFinalMatrizJulhoPorConta["25133"])}</span></div>
            <div className="flex justify-between border-b py-2"><span>25135 — Matéria-prima</span><span className="tabular-nums">{brl.format(estoqueFinalMatrizJulhoPorConta["25135"])}</span></div>
            <div className="flex justify-between border-b py-2"><span>25137 — Produto intermediário</span><span className="tabular-nums">{brl.format(estoqueFinalMatrizJulhoPorConta["25137"])}</span></div>
            <div className="flex justify-between border-b py-2"><span>25134 — Refugo, retalho e lixo</span><span className="tabular-nums">{brl.format(restosEstoque)}</span></div>
            <div className="flex justify-between border-b py-2"><span>25136 — Produtos em elaboração</span><span className="tabular-nums">{brl.format(estoqueFinalMatrizJulhoPorConta["25136"])}</span></div>
            <div className="flex justify-between py-2 font-semibold"><span>Total inventário</span><span className="tabular-nums">{brl.format(estoqueFinalMatrizJulhoTotal)}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4" /> Itens manuais fora desta etapa</CardTitle>
            <CardDescription>Não geram lançamento automático em julho.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {itensManuaisJulho.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div><p className="text-sm font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.regra}</p></div>
                <Badge variant="outline">manual depois</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Scale className="size-4" /> Apuração PIS / COFINS</CardTitle>
            <CardDescription>Valores da apuração tributária recebida; sem usar relatórios de validação fiscal.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between border-b py-2"><span>PIS — débito sobre saídas</span><span className="tabular-nums">{brl.format(fiscalJulho.contribuicoes.pisDebitoSaidas)}</span></div>
            <div className="flex justify-between border-b py-2"><span>PIS — crédito sobre entradas</span><span className="tabular-nums">{brl.format(fiscalJulho.contribuicoes.pisCreditoEntradas)}</span></div>
            <div className="flex justify-between border-b py-2 font-medium"><span>PIS devedor antes de retenções</span><span className="tabular-nums">{brl.format(fiscalJulho.contribuicoes.pisRecolherAntesDeRetencoes)}</span></div>
            <div className="flex justify-between border-b py-2"><span>COFINS — débito sobre saídas</span><span className="tabular-nums">{brl.format(fiscalJulho.contribuicoes.cofinsDebitoSaidas)}</span></div>
            <div className="flex justify-between border-b py-2"><span>COFINS — crédito sobre entradas</span><span className="tabular-nums">{brl.format(fiscalJulho.contribuicoes.cofinsCreditoEntradas)}</span></div>
            <div className="flex justify-between py-2 font-medium"><span>COFINS devedor antes de retenções</span><span className="tabular-nums">{brl.format(fiscalJulho.contribuicoes.cofinsRecolherAntesDeRetencoes)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 pt-6">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium">Regra de julho</p>
            <p className="text-xs text-muted-foreground">
              JCP, depreciação, juros ativos/passivos, variação cambial e demais itens do resultado financeiro ficam fora do fechamento automático. Relatórios de validação do fiscal também ficam fora: só analisamos TXT/SPED quando o arquivo TXT real for fornecido. Julho avança com fatos contábeis suportados pelos documentos recebidos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
