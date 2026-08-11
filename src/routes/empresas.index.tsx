import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useErp, type NovaEmpresa } from "@/context/erp-context";
import type { Empresa, RegimeTributario } from "@/types/erp";

export const Route = createFileRoute("/empresas/")({
  head: () => ({
    meta: [
      { title: "Empresas — ERP Contábil" },
      { name: "description", content: "Cadastro de empresas atendidas pelo escritório contábil." },
      { property: "og:title", content: "Empresas — ERP Contábil" },
      { property: "og:description", content: "Cadastro de empresas do ERP Contábil." },
    ],
  }),
  component: EmpresasPage,
});

const regimeLabel: Record<Empresa["regime"], string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
  imune: "Imune / Isenta",
};

const estadoInicial: NovaEmpresa = {
  codigo: "",
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  uf: "PR",
  regime: "simples",
  ativa: true,
};

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function EmpresasPage() {
  const navigate = useNavigate();
  const { empresas, grupos, adicionarEmpresa } = useErp();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<NovaEmpresa>(estadoInicial);
  const [erro, setErro] = useState("");

  const gruposPorId = useMemo(() => new Map(grupos.map((grupo) => [grupo.id, grupo])), [grupos]);

  const colunas: Column<Empresa>[] = [
    {
      key: "codigo",
      header: "Código",
      className: "font-mono w-24",
      render: (e) => e.codigo,
      valor: (e) => e.codigo,
    },
    {
      key: "razao",
      header: "Razão social",
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{e.razaoSocial}</p>
          <p className="truncate text-xs text-muted-foreground">{e.nomeFantasia}</p>
        </div>
      ),
      valor: (e) => `${e.razaoSocial} ${e.nomeFantasia}`,
    },
    {
      key: "cnpj",
      header: "CNPJ",
      className: "font-mono whitespace-nowrap",
      render: (e) => e.cnpj,
      valor: (e) => e.cnpj,
    },
    { key: "uf", header: "UF", className: "w-16", render: (e) => e.uf, valor: (e) => e.uf },
    {
      key: "regime",
      header: "Regime",
      render: (e) => regimeLabel[e.regime],
      valor: (e) => regimeLabel[e.regime],
    },
    {
      key: "grupo",
      header: "Grupo",
      render: (e) => gruposPorId.get(e.grupoId ?? "")?.nome ?? "—",
      valor: (e) => gruposPorId.get(e.grupoId ?? "")?.nome ?? "",
    },
    {
      key: "status",
      header: "Situação",
      className: "w-28",
      render: (e) => (
        <Badge variant={e.ativa ? "secondary" : "outline"}>{e.ativa ? "Ativa" : "Inativa"}</Badge>
      ),
      valor: (e) => (e.ativa ? "ativa" : "inativa"),
    },
  ];

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");

    const codigo = form.codigo.trim();
    const razaoSocial = form.razaoSocial.trim();
    const nomeFantasia = form.nomeFantasia.trim();
    const cnpj = somenteDigitos(form.cnpj);

    if (!codigo || !razaoSocial || !nomeFantasia || cnpj.length !== 14) {
      setErro("Preencha código, razão social, nome fantasia e um CNPJ com 14 dígitos.");
      return;
    }
    if (empresas.some((empresa) => empresa.codigo.toLowerCase() === codigo.toLowerCase())) {
      setErro("Já existe uma empresa com esse código.");
      return;
    }
    if (empresas.some((empresa) => somenteDigitos(empresa.cnpj) === cnpj)) {
      setErro("Já existe uma empresa com esse CNPJ.");
      return;
    }

    const criada = adicionarEmpresa({
      ...form,
      codigo,
      razaoSocial,
      nomeFantasia,
      cnpj: form.cnpj.trim(),
      uf: form.uf.toUpperCase(),
    });
    setForm(estadoInicial);
    setAberto(false);
    navigate({ to: "/empresas/$id", params: { id: criada.id } });
  }

  return (
    <PageShell>
      <PageHeader
        titulo="Empresas"
        descricao="Cadastro das empresas atendidas, com vínculo de grupo e contexto independente."
        acoes={
          <Button size="sm" className="gap-2" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Nova empresa
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={empresas}
        chave={(e) => e.id}
        placeholderBusca="Buscar por razão social, CNPJ ou código…"
        onRowClick={(e) => navigate({ to: "/empresas/$id", params: { id: e.id } })}
      />

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={salvar}>
            <DialogHeader>
              <DialogTitle>Nova empresa</DialogTitle>
              <DialogDescription>
                O cadastro ficará disponível no seletor global e será separado das demais empresas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <Campo label="Código">
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm((atual) => ({ ...atual, codigo: e.target.value }))}
                  placeholder="0001"
                  autoFocus
                />
              </Campo>
              <Campo label="CNPJ">
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm((atual) => ({ ...atual, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                />
              </Campo>
              <Campo label="Razão social" className="sm:col-span-2">
                <Input
                  value={form.razaoSocial}
                  onChange={(e) => setForm((atual) => ({ ...atual, razaoSocial: e.target.value }))}
                />
              </Campo>
              <Campo label="Nome fantasia">
                <Input
                  value={form.nomeFantasia}
                  onChange={(e) => setForm((atual) => ({ ...atual, nomeFantasia: e.target.value }))}
                />
              </Campo>
              <Campo label="UF">
                <Input
                  value={form.uf}
                  maxLength={2}
                  onChange={(e) => setForm((atual) => ({ ...atual, uf: e.target.value }))}
                />
              </Campo>
              <Campo label="Regime tributário">
                <Select
                  value={form.regime}
                  onValueChange={(regime) =>
                    setForm((atual) => ({ ...atual, regime: regime as RegimeTributario }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(regimeLabel).map(([valor, label]) => (
                      <SelectItem key={valor} value={valor}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo label="Grupo">
                <Select
                  value={form.grupoId ?? "sem-grupo"}
                  onValueChange={(grupoId) =>
                    setForm((atual) => ({
                      ...atual,
                      grupoId: grupoId === "sem-grupo" ? undefined : grupoId,
                    }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Sem grupo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-grupo">Sem grupo</SelectItem>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id}>{grupo.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
            </div>

            {erro && <p className="mb-4 text-sm text-destructive">{erro}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar empresa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Campo({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
