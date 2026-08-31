import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleAlert, Plus, Save, Trash2 } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useErp } from "@/context/erp-context";
import { useAberturaSimplesNacional } from "@/hooks/use-abertura-simples-nacional";
import type { AberturaSimplesNacional, Empresa, SocioCapitalAbertura } from "@/types/erp";

export const Route = createFileRoute("/simples-nacional")({
  head: () => ({
    meta: [
      { title: "Simples Nacional" },
      {
        name: "description",
        content: "Módulo dedicado às empresas do Simples Nacional: cadastro e abertura contábil, isolado do fechamento da Nitaplast.",
      },
      { property: "og:title", content: "Simples Nacional — ERP Contábil" },
      { property: "og:description", content: "Cadastro e abertura contábil de empresas do Simples Nacional." },
    ],
  }),
  component: SimplesNacionalPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parseValor(valor: string) {
  const texto = valor.trim();
  if (!texto) return 0;
  const numero = Number(texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
  return Number.isFinite(numero) ? numero : 0;
}

type LinhaSocio = { nome: string; cpf: string; valor: string };

const linhaSocioVazia: LinhaSocio = { nome: "", cpf: "", valor: "" };

function SimplesNacionalPage() {
  const { empresa, empresas, setEmpresaId } = useErp();
  const empresasSimples = useMemo(() => empresas.filter((e) => e.regime === "simples"), [empresas]);
  const empresaEhSimples = empresa.regime === "simples";

  const colunasEmpresas: Column<Empresa>[] = [
    { key: "codigo", header: "Código", className: "font-mono w-24", render: (e) => e.codigo, valor: (e) => e.codigo },
    { key: "razao", header: "Razão social", render: (e) => <div className="min-w-0"><p className="truncate font-medium">{e.razaoSocial}</p><p className="truncate text-xs text-muted-foreground">{e.nomeFantasia}</p></div>, valor: (e) => `${e.razaoSocial} ${e.nomeFantasia}` },
    { key: "cnpj", header: "CNPJ", className: "font-mono whitespace-nowrap", render: (e) => e.cnpj, valor: (e) => e.cnpj },
    { key: "status", header: "Situação", className: "w-28", render: (e) => <Badge variant={e.ativa ? "secondary" : "outline"}>{e.ativa ? "Ativa" : "Inativa"}</Badge>, valor: (e) => (e.ativa ? "ativa" : "inativa") },
  ];

  return (
    <PageShell>
      <PageHeader
        titulo="Simples Nacional"
        descricao="Módulo próprio para empresas do Simples Nacional: cadastro e abertura contábil, sem interferir no fechamento em uso pela Nitaplast."
        acoes={
          <Button size="sm" className="gap-2" asChild>
            <Link to="/empresas/nova" search={{ retorno: "/simples-nacional" }}>
              <Plus className="size-4" /> Nova empresa
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresas do Simples Nacional</CardTitle>
          <CardDescription>Clique numa linha para selecioná-la como empresa ativa e iniciar a abertura abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            colunas={colunasEmpresas}
            dados={empresasSimples}
            chave={(e) => e.id}
            placeholderBusca="Buscar por razão social, CNPJ ou código…"
            vazio="Nenhuma empresa cadastrada como Simples Nacional ainda."
            onRowClick={(e) => setEmpresaId(e.id)}
          />
        </CardContent>
      </Card>

      {empresaEhSimples ? (
        <AberturaContabil empresa={empresa} />
      ) : (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 pt-5 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <strong>Empresa ativa não é Simples Nacional.</strong> Selecione, na tabela acima ou no seletor de
              empresa no topo, uma empresa com regime Simples Nacional para lançar a abertura — ou cadastre uma
              nova empresa com esse regime.
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

function AberturaContabil({ empresa }: { empresa: Empresa }) {
  const { aberturas, registrar, remover } = useAberturaSimplesNacional(empresa.id);
  const hoje = new Date().toISOString().slice(0, 10);

  const [dataAbertura, setDataAbertura] = useState(hoje);
  const [contaContrapartidaCodigo, setContaContrapartidaCodigo] = useState("");
  const [contaContrapartidaDescricao, setContaContrapartidaDescricao] = useState("Caixa Geral");
  const [contaCapitalCodigo, setContaCapitalCodigo] = useState("");
  const [contaCapitalDescricao, setContaCapitalDescricao] = useState("Capital Social");
  const [socios, setSocios] = useState<LinhaSocio[]>([{ ...linhaSocioVazia }]);
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const totalCapital = useMemo(
    () => socios.reduce((soma, socio) => soma + parseValor(socio.valor), 0),
    [socios],
  );

  function atualizarSocio(indice: number, campo: keyof LinhaSocio, valor: string) {
    setSocios((atual) => atual.map((socio, i) => (i === indice ? { ...socio, [campo]: valor } : socio)));
  }

  function adicionarSocio() {
    setSocios((atual) => [...atual, { ...linhaSocioVazia }]);
  }

  function removerSocio(indice: number) {
    setSocios((atual) => (atual.length > 1 ? atual.filter((_, i) => i !== indice) : atual));
  }

  function registrarAbertura() {
    const sociosValidos: Omit<SocioCapitalAbertura, "id">[] = socios
      .filter((socio) => socio.nome.trim())
      .map((socio) => ({ nome: socio.nome.trim(), cpf: socio.cpf.trim() || undefined, valorCapital: parseValor(socio.valor) }));

    if (!dataAbertura) return setErro("Informe a data de abertura.");
    if (!contaContrapartidaCodigo.trim() || !contaCapitalCodigo.trim())
      return setErro("Informe o código das contas de contrapartida e de capital social.");
    if (sociosValidos.length === 0) return setErro("Informe ao menos um sócio com valor de capital.");
    if (sociosValidos.some((s) => s.valorCapital <= 0)) return setErro("Todos os sócios precisam ter valor de capital maior que zero.");

    registrar({
      dataAbertura,
      contaContrapartidaCodigo: contaContrapartidaCodigo.trim(),
      contaContrapartidaDescricao: contaContrapartidaDescricao.trim(),
      contaCapitalCodigo: contaCapitalCodigo.trim(),
      contaCapitalDescricao: contaCapitalDescricao.trim(),
      socios: sociosValidos,
      observacoes: observacoes.trim() || undefined,
    });
    setSocios([{ ...linhaSocioVazia }]);
    setObservacoes("");
    setErro(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abertura contábil — {empresa.nomeFantasia}</CardTitle>
          <CardDescription>
            Implantação do saldo inicial de capital social. Gera as partidas dobradas (débito na conta de
            contrapartida, crédito em Capital Social por sócio), apenas para esta empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Campo label="Data de abertura *"><Input type="date" value={dataAbertura} onChange={(e) => setDataAbertura(e.target.value)} /></Campo>
            <Campo label="Conta contrapartida (código) *"><Input value={contaContrapartidaCodigo} onChange={(e) => setContaContrapartidaCodigo(e.target.value)} placeholder="Ex.: 11" /></Campo>
            <Campo label="Descrição da contrapartida"><Input value={contaContrapartidaDescricao} onChange={(e) => setContaContrapartidaDescricao(e.target.value)} /></Campo>
            <Campo label="Conta Capital Social (código) *"><Input value={contaCapitalCodigo} onChange={(e) => setContaCapitalCodigo(e.target.value)} placeholder="Ex.: 2348" /></Campo>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Sócios e capital integralizado</p>
            {socios.map((socio, indice) => (
              <div key={indice} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Input value={socio.nome} onChange={(e) => atualizarSocio(indice, "nome", e.target.value)} placeholder="Nome do sócio" />
                <Input value={socio.cpf} onChange={(e) => atualizarSocio(indice, "cpf", e.target.value)} placeholder="CPF (opcional)" />
                <Input value={socio.valor} onChange={(e) => atualizarSocio(indice, "valor", e.target.value)} placeholder="Valor do capital" inputMode="decimal" />
                <Button variant="outline" size="icon" onClick={() => removerSocio(indice)} disabled={socios.length === 1} aria-label="Remover sócio"><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-fit gap-2" onClick={adicionarSocio}><Plus className="size-4" /> Adicionar sócio</Button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Observações</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Opcional" />
          </div>

          <Card className="bg-muted/30">
            <CardContent className="grid gap-1 pt-5 text-sm">
              <p className="font-medium">Pré-visualização do lançamento</p>
              <p>Débito {contaContrapartidaCodigo || "—"} — {contaContrapartidaDescricao || "Contrapartida"}: <span className="font-mono">{brl.format(totalCapital)}</span></p>
              {socios.filter((s) => s.nome.trim()).map((socio, indice) => (
                <p key={indice} className="pl-4 text-muted-foreground">
                  Crédito {contaCapitalCodigo || "—"} — Capital social integralizado pelo sócio {socio.nome}: <span className="font-mono">{brl.format(parseValor(socio.valor))}</span>
                </p>
              ))}
            </CardContent>
          </Card>

          {erro ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{erro}</p> : null}

          <div className="flex justify-end">
            <Button onClick={registrarAbertura} className="gap-2"><Save className="size-4" /> Registrar abertura</Button>
          </div>
        </CardContent>
      </Card>

      {aberturas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aberturas registradas</CardTitle>
            <CardDescription>Histórico local de aberturas lançadas para {empresa.nomeFantasia}.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {aberturas.map((abertura) => (
              <HistoricoAbertura key={abertura.id} abertura={abertura} onRemover={() => remover(abertura.id)} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function HistoricoAbertura({ abertura, onRemover }: { abertura: AberturaSimplesNacional; onRemover: () => void }) {
  const total = abertura.socios.reduce((soma, s) => soma + s.valorCapital, 0);
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium">{new Date(abertura.dataAbertura).toLocaleDateString("pt-BR")}</span>
          <span className="ml-2 text-muted-foreground">
            Débito {abertura.contaContrapartidaCodigo} / Crédito {abertura.contaCapitalCodigo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono font-medium">{brl.format(total)}</span>
          <Button variant="outline" size="sm" className="gap-1 text-red-700" onClick={onRemover}><Trash2 className="size-3.5" /> Remover</Button>
        </div>
      </div>
      <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">
        {abertura.socios.map((socio) => (
          <li key={socio.id}>{socio.nome}{socio.cpf ? ` (${socio.cpf})` : ""} — {brl.format(socio.valorCapital)}</li>
        ))}
      </ul>
      {abertura.observacoes ? <p className="mt-2 text-xs text-muted-foreground">{abertura.observacoes}</p> : null}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}
