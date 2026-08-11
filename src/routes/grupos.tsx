import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useErp } from "@/context/erp-context";
import type { GrupoEmpresa } from "@/types/erp";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos de Empresas — ERP Contábil" },
      { name: "description", content: "Agrupamento de empresas para gestão contábil consolidada." },
      { property: "og:title", content: "Grupos de Empresas — ERP Contábil" },
      { property: "og:description", content: "Agrupamento de empresas do ERP Contábil." },
    ],
  }),
  component: GruposPage,
});

function GruposPage() {
  const { empresas, grupos, adicionarGrupo } = useErp();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [erro, setErro] = useState("");

  const empresasPorGrupo = useMemo(() => {
    const mapa = new Map<string, typeof empresas>();
    grupos.forEach((grupo) => mapa.set(grupo.id, []));
    empresas.forEach((empresa) => {
      if (!empresa.grupoId) return;
      mapa.set(empresa.grupoId, [...(mapa.get(empresa.grupoId) ?? []), empresa]);
    });
    return mapa;
  }, [empresas, grupos]);

  const colunas: Column<GrupoEmpresa>[] = [
    {
      key: "nome",
      header: "Grupo",
      render: (g) => <span className="font-medium">{g.nome}</span>,
      valor: (g) => g.nome,
    },
    {
      key: "resp",
      header: "Responsável",
      render: (g) => g.responsavel,
      valor: (g) => g.responsavel,
    },
    {
      key: "qtd",
      header: "Empresas",
      className: "w-24 font-mono",
      render: (g) => empresasPorGrupo.get(g.id)?.length ?? 0,
      valor: (g) => String(empresasPorGrupo.get(g.id)?.length ?? 0),
    },
    {
      key: "empresas",
      header: "Vinculadas",
      render: (g) =>
        empresasPorGrupo.get(g.id)?.map((empresa) => empresa.nomeFantasia).join(", ") || "—",
      valor: (g) =>
        empresasPorGrupo.get(g.id)?.map((empresa) => empresa.nomeFantasia).join(" ") ?? "",
    },
  ];

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    const nomeLimpo = nome.trim();
    const responsavelLimpo = responsavel.trim();

    if (!nomeLimpo || !responsavelLimpo) {
      setErro("Informe o nome do grupo e o responsável.");
      return;
    }
    if (grupos.some((grupo) => grupo.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
      setErro("Já existe um grupo com esse nome.");
      return;
    }

    adicionarGrupo({ nome: nomeLimpo, responsavel: responsavelLimpo });
    setNome("");
    setResponsavel("");
    setAberto(false);
  }

  return (
    <PageShell>
      <PageHeader
        titulo="Grupos de Empresas"
        descricao="Agrupamentos para carteiras, permissões e futuras visões consolidadas."
        acoes={
          <Button size="sm" className="gap-2" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Novo grupo
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={grupos}
        chave={(g) => g.id}
        placeholderBusca="Buscar grupo ou responsável…"
      />

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <form onSubmit={salvar}>
            <DialogHeader>
              <DialogTitle>Novo grupo de empresas</DialogTitle>
              <DialogDescription>
                Depois de criar o grupo, vincule as empresas pelo cadastro de cada empresa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <Campo label="Nome do grupo">
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
              </Campo>
              <Campo label="Responsável">
                <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              </Campo>
            </div>
            {erro && <p className="mb-4 text-sm text-destructive">{erro}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar grupo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
