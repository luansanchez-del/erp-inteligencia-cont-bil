import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  Building,
  FileSpreadsheet,
  FileText,
  Landmark,
  Receipt,
  ScrollText,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/fechamento-assistido")({
  head: () => ({
    meta: [
      { title: "Fechamento Assistido — ERP Contábil" },
      {
        name: "description",
        content:
          "Fechamento contábil assistido: cobertura documental, leitura, mapeamento, conciliação e aprovação da competência.",
      },
      { property: "og:title", content: "Fechamento Assistido — ERP Contábil" },
      {
        property: "og:description",
        content: "Preparação da competência, fontes documentais e fluxo assistido de fechamento contábil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FechamentoAssistidoPage,
});

const fontes = [
  { nome: "Plano de contas", icon: BookOpen, obs: "Estrutura vigente da empresa" },
  { nome: "Balancete anterior", icon: FileSpreadsheet, obs: "Saldos de abertura da competência" },
  { nome: "Entradas", icon: Receipt, obs: "Documentos fiscais de compra" },
  { nome: "Saídas", icon: Receipt, obs: "Documentos fiscais de venda" },
  { nome: "Contas a pagar / receber", icon: Wallet, obs: "Títulos e baixas do período" },
  { nome: "Extratos bancários", icon: Landmark, obs: "Movimento para conciliação" },
  { nome: "Folha e provisões", icon: Users, obs: "Encargos, férias e 13º" },
  { nome: "Estoque", icon: Boxes, obs: "Inventário e custo do período" },
  { nome: "Imobilizado", icon: Building, obs: "Aquisições, baixas e depreciação" },
];

const etapas = [
  { nome: "Documentos", desc: "Recepção e conferência da cobertura documental da competência." },
  { nome: "Leitura", desc: "Extração estruturada do conteúdo dos arquivos recebidos." },
  { nome: "Mapeamento", desc: "Vínculo entre origens, contas contábeis e históricos padrão." },
  { nome: "Lançamentos", desc: "Geração das partidas propostas a partir do mapeamento." },
  { nome: "Conciliação", desc: "Confronto de saldos bancários, títulos e contas de controle." },
  { nome: "Balancete", desc: "Verificação de saldos e consistência antes das demonstrações." },
  { nome: "DRE", desc: "Apuração do resultado do período para revisão." },
  { nome: "Aprovação", desc: "Revisão final do responsável e liberação da competência." },
];

const saidas = [
  { nome: "Lançamentos contábeis", desc: "Partidas geradas e revisadas da competência." },
  { nome: "Razão e Diário", desc: "Livros analíticos e cronológicos do período." },
  { nome: "Balancete e DRE", desc: "Peças de verificação e resultado do exercício." },
  { nome: "Arquivo Questor", desc: "Exportação de movimento para contingência no Questor." },
];

function FechamentoAssistidoPage() {
  const { empresa, competencia } = useErp();

  return (
    <PageShell>
      <PageHeader
        titulo="Fechamento Assistido"
        descricao={`Preparação assistida da competência ${competencia.label} — ${empresa.nomeFantasia}. Estrutura visual; nenhum processamento contábil é executado nesta etapa.`}
        acoes={
          <Button size="sm" disabled>
            Iniciar preparação
          </Button>
        }
      />

      <Card>
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Preparação da competência</CardTitle>
            <CardDescription>
              Cobertura documental necessária antes de iniciar a escrituração assistida.
            </CardDescription>
          </div>
          <Badge variant="outline">Competência {competencia.label}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cobertura documental</span>
              <span className="font-mono text-xs text-muted-foreground">
                0 de {fontes.length} fontes recebidas
              </span>
            </div>
            <Progress value={0} />
          </div>
          <Separator />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {fontes.map((f) => (
              <div
                key={f.nome}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-dashed px-3 py-2"
              >
                <f.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{f.obs}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                  pendente
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <CardTitle className="text-base">Classificações ausentes não são inventadas</CardTitle>
            <CardDescription>
              Quando faltar documento, histórico ou definição de conta, o item fica retido como
              pendência para decisão humana. O sistema não presume classificação contábil nem
              completa lacunas por estimativa.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fluxo assistido</CardTitle>
          <CardDescription>Etapas sequenciais da competência, sem execução nesta etapa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {etapas.map((e, i) => (
            <div
              key={e.nome}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-3 py-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full border font-mono text-sm">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.nome}</p>
                <p className="text-xs text-muted-foreground">{e.desc}</p>
              </div>
              <Badge variant="outline">Não iniciado</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saídas previstas</CardTitle>
          <CardDescription>Entregáveis ao final do fechamento assistido.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {saidas.map((s) => (
            <div
              key={s.nome}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-md border border-dashed px-3 py-3"
            >
              {s.nome === "Arquivo Questor" ? (
                <ScrollText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.nome}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
