import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/competencias")({
  head: () => ({
    meta: [
      { title: "Competências" },
      { name: "description", content: "Períodos contábeis por empresa, com controle de abertura e fechamento." },
      { property: "og:title", content: "Competências — ERP Contábil" },
      { property: "og:description", content: "Períodos contábeis por empresa, com controle de abertura e fechamento." },
    ],
  }),
  component: Competencias,
});

type Registro = { id: string; competenciaId: string; periodo: string; empresa: string; status: string; statusOriginal: string; fechadaEm: string };

const nomeStatus = (status: string) => ({
  aberta: "Aberta",
  em_fechamento: "Em fechamento",
  fechada: "Fechada",
}[status] ?? status);

function Competencias() {
  const { empresa, competencias, registrarCompetencia, fecharCompetencia } = useErp();
  const [formAberto, setFormAberto] = useState(false);
  const [label, setLabel] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const dados: Registro[] = competencias.map((competencia) => ({
    id: `${empresa.id}-${competencia.id}`,
    competenciaId: competencia.id,
    periodo: competencia.label,
    empresa: empresa.nomeFantasia,
    status: nomeStatus(competencia.status),
    statusOriginal: competencia.status,
    fechadaEm: competencia.status === "fechada" ? "Histórico" : "—",
  }));

  function criar() {
    try {
      registrarCompetencia(label);
      setLabel("");
      setErro(null);
      setFormAberto(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a competência.");
    }
  }

  function fechar(competenciaId: string, periodo: string) {
    if (!window.confirm(`Fechar a competência ${periodo}? Depois de fechada, os lançamentos ficam travados para edição — inclusive para automações.`)) return;
    fecharCompetencia(competenciaId);
  }

  const colunas: Column<Registro>[] = [
    { key: "periodo", header: "Período", className: "font-mono w-28", render: (r) => r.periodo, valor: (r) => r.periodo },
    { key: "empresa", header: "Empresa", render: (r) => r.empresa, valor: (r) => r.empresa },
    { key: "status", header: "Situação", className: "w-40", render: (r) => r.status, valor: (r) => r.status },
    { key: "fechadaEm", header: "Fechada em", className: "w-36", render: (r) => r.fechadaEm, valor: (r) => r.fechadaEm },
    {
      key: "acoes",
      header: "Ações",
      className: "w-32 text-right",
      render: (r) => r.statusOriginal !== "fechada"
        ? <Button size="sm" variant="outline" className="gap-1" onClick={() => fechar(r.competenciaId, r.periodo)}><Lock className="size-3.5" /> Fechar</Button>
        : null,
      valor: () => "",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        titulo="Competências"
        descricao="Períodos contábeis por empresa, com controle de abertura e fechamento."
        acoes={
          <Button size="sm" className="gap-2" onClick={() => setFormAberto((v) => !v)}>
            <Plus className="size-4" /> Nova competência
          </Button>
        }
      />

      {formAberto ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Nova competência</CardTitle><CardDescription>Cria um período aberto, sem herdar lançamentos de nenhum outro mês.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm font-medium">Período (MM/AAAA)<Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="09/2026" className="w-40" /></label>
            <Button onClick={criar}>Criar</Button>
            <Button variant="outline" onClick={() => { setFormAberto(false); setErro(null); }}>Cancelar</Button>
            {erro ? <p role="alert" className="w-full text-sm text-destructive">{erro}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        colunas={colunas}
        dados={dados}
        chave={(r) => r.id}
        placeholderBusca="Buscar competência…"
        vazio="Nenhuma competência cadastrada."
      />
    </PageShell>
  );
}
