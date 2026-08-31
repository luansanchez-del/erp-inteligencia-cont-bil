import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert, Info, OctagonAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useErp } from "@/context/erp-context";
import { notasTecnicasDoGrupo, type CategoriaNotaTecnica, type NotaTecnica } from "@/data/notas-tecnicas";
import { calcularBalanceteDominio, type PendenciaContaDominio } from "@/data/nitaplast-balancete-dominio-engine";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";

export const Route = createFileRoute("/notas-tecnicas")({ component: NotasTecnicasPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const rotuloCategoria: Record<CategoriaNotaTecnica, string> = {
  impedimento: "Impedimento",
  alerta: "Alerta",
  informacao: "Informação",
};

const corCategoria: Record<CategoriaNotaTecnica, string> = {
  impedimento: "border-red-500/40 bg-red-500/5",
  alerta: "border-amber-500/40 bg-amber-50/40",
  informacao: "border-blue-500/30 bg-blue-500/5",
};

const iconeCategoria: Record<CategoriaNotaTecnica, typeof Info> = {
  impedimento: OctagonAlert,
  alerta: CircleAlert,
  informacao: Info,
};

function usarPendenciasPosImplantacao(grupoId: string | undefined, competenciaId: string): PendenciaContaDominio[] {
  return useMemo(() => {
    if (grupoId !== "g-nitaplast") return [];
    if (competenciaId !== "2026-06" && competenciaId !== "2026-07") return [];
    const julho = competenciaId === "2026-07" ? lancamentosIntegradosJulhoFinal : undefined;
    return calcularBalanceteDominio(lancamentosIntegrados, julho).pendencias;
  }, [grupoId, competenciaId]);
}

function NotasTecnicasPage() {
  const { empresa, competencia } = useErp();
  const grupoId = empresa.grupoId ?? empresa.id;
  const notas = useMemo(() => notasTecnicasDoGrupo(grupoId, competencia.id), [grupoId, competencia.id]);
  const pendenciasPosImplantacao = usarPendenciasPosImplantacao(grupoId, competencia.id);

  const notasPosImplantacao: NotaTecnica[] = pendenciasPosImplantacao.map((item) => ({
    id: `pos-implantacao-${item.contaAtual}`,
    grupoId,
    competenciaId: competencia.id,
    categoria: "alerta",
    titulo: `Conta pós-implantação aguarda vínculo documental — ${item.contaAtual}`,
    descricao: `${item.descricaoAtual}. Movimento e saldo estão incluídos nos totais contábeis (saldo atual ${brl.format(item.saldoAtual)}), mas não foram encaixados artificialmente em outra conta do plano Domínio.`,
    origem: "Apurado automaticamente do Razão da competência",
  }));

  const todasAsNotas = [...notas, ...notasPosImplantacao];
  const porCategoria = (categoria: CategoriaNotaTecnica) => todasAsNotas.filter((nota) => nota.categoria === categoria);
  const ordemCategorias: CategoriaNotaTecnica[] = ["impedimento", "alerta", "informacao"];

  return (
    <PageShell>
      <PageHeader
        titulo="Notas Técnicas"
        descricao={`Achados, pendências e decisões documentadas de fechamento — ${empresa.nomeFantasia} · ${competencia.label}.`}
      />
      {todasAsNotas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nenhuma nota técnica registrada para {empresa.nomeFantasia} em {competencia.label}.
          </CardContent>
        </Card>
      ) : (
        ordemCategorias.map((categoria) => {
          const lista = porCategoria(categoria);
          if (lista.length === 0) return null;
          const Icone = iconeCategoria[categoria];
          return (
            <div key={categoria} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Icone className="size-4" />
                {rotuloCategoria[categoria]} ({lista.length})
              </h2>
              {lista.map((nota) => (
                <Card key={nota.id} className={corCategoria[nota.categoria]}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-sm">{nota.titulo}</CardTitle>
                      <Badge variant="outline">{nota.competenciaId === "*" ? "Todas as competências" : nota.competenciaId}</Badge>
                    </div>
                    <CardDescription className="text-xs">{nota.origem}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">{nota.descricao}</CardContent>
                </Card>
              ))}
            </div>
          );
        })
      )}
    </PageShell>
  );
}
