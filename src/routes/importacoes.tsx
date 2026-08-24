import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Database, FileCheck2, ShieldCheck, UploadCloud } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useErp } from "@/context/erp-context";
import { calcularHashArquivo, carregarDossieImportacao, salvarDossieImportacao } from "@/lib/dossie-importacao";
import type { CategoriaFonteImportacao, FluxoImportacao, FormatoImportacao, ItemDossieImportacao } from "@/types/erp";

export const Route = createFileRoute("/importacoes")({ head: () => ({ meta: [{ title: "Dossiê de Importação — ERP Contábil" }] }), component: ImportacoesPage });

const categorias: Record<FluxoImportacao, { valor: CategoriaFonteImportacao; label: string; finalidade?: "conferencia" }[]> = {
  implantacao: [
    { valor: "plano_contas", label: "Plano de contas" },
    { valor: "saldos_abertura", label: "Balancete / saldos de abertura" },
    { valor: "saldos_auxiliares", label: "Saldos auxiliares analíticos" },
    { valor: "relatorio_conferencia", label: "Relatório de conferência", finalidade: "conferencia" },
  ],
  recorrencia: [
    { valor: "fiscal_entradas", label: "Documentos fiscais de entrada" }, { valor: "fiscal_saidas", label: "Documentos fiscais de saída" },
    { valor: "bancos", label: "Extratos e movimentações bancárias" }, { valor: "folha", label: "Folha e provisões" },
    { valor: "tributos", label: "Apurações e guias de tributos" }, { valor: "estoque", label: "Estoque e inventário" },
    { valor: "imobilizado", label: "Imobilizado e depreciação" }, { valor: "aplicacoes", label: "Aplicações financeiras" },
    { valor: "outros_documentos", label: "Outros documentos de origem" },
    { valor: "relatorio_conferencia", label: "Relatório de conferência", finalidade: "conferencia" },
  ],
};
const extensoes: Record<string, FormatoImportacao> = { txt: "TXT", csv: "CSV", xlsx: "XLSX", xls: "XLSX", ofx: "OFX", pdf: "PDF", xml: "XML" };
const categoriaLabel = new Map(Object.values(categorias).flat().map((item) => [item.valor, item.label]));
const formato = (nome: string) => extensoes[nome.split(".").pop()?.toLowerCase() ?? ""] ?? null;
const tamanho = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

function ImportacoesPage() {
  const { empresa, competencia } = useErp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fluxo, setFluxo] = useState<FluxoImportacao>("recorrencia");
  const [categoria, setCategoria] = useState<CategoriaFonteImportacao>(categorias.recorrencia[0]!.valor);
  const [itens, setItens] = useState<ItemDossieImportacao[]>([]);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  useEffect(() => setItens(carregarDossieImportacao()), []);
  useEffect(() => setCategoria(categorias[fluxo][0]!.valor), [fluxo]);
  const contexto = useMemo(() => itens.filter((item) => item.empresaId === empresa.id && item.competenciaId === competencia.id), [competencia.id, empresa.id, itens]);
  const resumo = { total: contexto.length, pendentes: contexto.filter((x) => x.status === "aguardando_conferencia").length, aprovados: contexto.filter((x) => x.status === "aprovado").length, duplicados: contexto.filter((x) => x.status === "duplicado").length };
  function persistir(proximos: ItemDossieImportacao[]) { setItens(proximos); salvarDossieImportacao(proximos); }

  async function receber(lista: FileList | null) {
    if (!lista?.length) return;
    setProcessando(true); setMensagem(null);
    const proximos = [...itens]; let adicionados = 0; let duplicados = 0;
    for (const arquivo of Array.from(lista)) {
      const tipo = formato(arquivo.name); if (!tipo) continue;
      const hash = await calcularHashArquivo(arquivo);
      const repetido = proximos.some((item) => item.empresaId === empresa.id && item.hash === hash);
      const definicao = categorias[fluxo].find((item) => item.valor === categoria)!;
      proximos.unshift({ id: `IMP-${Date.now()}-${adicionados}-${hash.slice(0, 8)}`, empresaId: empresa.id, competenciaId: competencia.id, fluxo, categoria, formato: tipo, arquivo: arquivo.name, tamanho: arquivo.size, tipoMime: arquivo.type || "application/octet-stream", hash, ultimaModificacao: arquivo.lastModified, finalidade: definicao.finalidade ?? "fonte", podeGerarLancamento: definicao.finalidade !== "conferencia" && categoria !== "plano_contas", status: repetido ? "duplicado" : "aguardando_conferencia", criadoEm: new Date().toISOString() });
      repetido ? duplicados++ : adicionados++;
    }
    persistir(proximos);
    setMensagem(`${adicionados} arquivo(s) registrado(s)${duplicados ? ` · ${duplicados} duplicado(s) bloqueado(s)` : ""}. Nenhum lançamento foi criado.`);
    setProcessando(false); if (inputRef.current) inputRef.current.value = "";
  }
  function aprovar(id: string) { persistir(itens.map((item) => item.id === id && item.status === "aguardando_conferencia" ? { ...item, status: "aprovado", aprovadoEm: new Date().toISOString() } : item)); }

  return <PageShell>
    <PageHeader titulo="Dossiê de Importação" descricao={`Arquivos de ${empresa.nomeFantasia} · competência ${competencia.label}. Importar registra evidência; não contabiliza.`} acoes={<Badge variant="outline">Controle de origem ativo</Badge>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Resumo label="Arquivos no dossiê" valor={resumo.total}/><Resumo label="Aguardando conferência" valor={resumo.pendentes}/><Resumo label="Aprovados como fonte" valor={resumo.aprovados}/><Resumo label="Duplicados bloqueados" valor={resumo.duplicados} alerta={resumo.duplicados > 0}/></div>
    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="flex gap-3 pt-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-700"/><div><p className="font-medium">Separação obrigatória</p><p className="mt-1 text-sm text-muted-foreground">Implantação recebe a abertura patrimonial. Recorrência recebe documentos do mês. Diário, Razão, Balancete e DRE serão saídas do motor contábil.</p></div></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card><CardHeader><CardTitle className="text-base">1. Escolha o processo</CardTitle></CardHeader><CardContent className="grid gap-2">{(["implantacao", "recorrencia"] as const).map((item) => <button key={item} type="button" onClick={() => setFluxo(item)} className={`rounded-md border p-3 text-left ${fluxo === item ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}><p className="font-medium">{item === "implantacao" ? "Implantação" : "Recorrência mensal"}</p><p className="mt-1 text-xs text-muted-foreground">{item === "implantacao" ? "Plano, abertura e auxiliares. Ocorre uma vez." : "Documentos e movimentações da competência."}</p></button>)}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">2. Identifique e registre os arquivos</CardTitle><CardDescription>O hash SHA-256 impede que o mesmo conteúdo seja utilizado duas vezes para a empresa.</CardDescription></CardHeader><CardContent className="grid gap-4"><label className="grid gap-1.5 text-sm font-medium">Categoria da fonte<select className="h-9 rounded-md border bg-background px-3 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaFonteImportacao)}>{categorias[fluxo].map((item) => <option key={item.valor} value={item.valor}>{item.label}</option>)}</select></label><div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center"><UploadCloud className="size-7 text-muted-foreground"/><div><p className="text-sm font-medium">Selecione um ou mais arquivos</p><p className="mt-1 text-xs text-muted-foreground">TXT, CSV, XLSX, OFX, PDF ou XML. Eles ficam aguardando conferência.</p></div><Input ref={inputRef} type="file" multiple accept=".txt,.csv,.xls,.xlsx,.ofx,.pdf,.xml" className="hidden" onChange={(e) => void receber(e.target.files)}/><Button type="button" size="sm" disabled={processando} onClick={() => inputRef.current?.click()}>{processando ? "Calculando identificação…" : "Selecionar arquivos"}</Button></div>{mensagem ? <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{mensagem}</p> : null}</CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="text-base">3. Conferência do dossiê</CardTitle><CardDescription>Aprovar confirma a fonte. A contabilização permanece bloqueada até existir um parser e regras validadas para a categoria.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b bg-muted/60 text-left text-xs"><th className="p-2">Processo / categoria</th><th className="p-2">Arquivo</th><th className="p-2">Formato</th><th className="p-2">Tamanho</th><th className="p-2">Identificação</th><th className="p-2">Finalidade</th><th className="p-2">Status</th><th className="p-2 text-right">Ação</th></tr></thead><tbody>{contexto.map((item) => <tr key={item.id} className="border-b"><td className="p-2"><p className="font-medium">{item.fluxo === "implantacao" ? "Implantação" : "Recorrência"}</p><p className="text-xs text-muted-foreground">{categoriaLabel.get(item.categoria)}</p></td><td className="max-w-[280px] p-2"><p className="truncate font-medium" title={item.arquivo}>{item.arquivo}</p><p className="text-[10px] text-muted-foreground">{new Date(item.criadoEm).toLocaleString("pt-BR")}</p></td><td className="p-2 font-mono">{item.formato}</td><td className="p-2 tabular-nums">{tamanho(item.tamanho)}</td><td className="p-2 font-mono text-xs" title={item.hash}>{item.hash.slice(0, 12)}…</td><td className="p-2">{item.finalidade === "fonte" ? "Fonte de dados" : "Somente conferência"}</td><td className="p-2"><Status item={item}/></td><td className="p-2 text-right"><Button size="sm" variant="outline" disabled={item.status !== "aguardando_conferencia"} onClick={() => aprovar(item.id)}><FileCheck2 className="mr-1.5 size-4"/>Aprovar fonte</Button></td></tr>)}{contexto.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum arquivo registrado para esta empresa e competência.</td></tr> : null}</tbody></table></CardContent></Card>
  </PageShell>;
}

function Resumo({ label, valor, alerta = false }: { label: string; valor: number; alerta?: boolean }) { return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-semibold tabular-nums ${alerta ? "text-amber-700" : ""}`}>{valor.toLocaleString("pt-BR")}</p></CardContent></Card>; }
function Status({ item }: { item: ItemDossieImportacao }) { if (item.status === "duplicado") return <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="size-4"/>Duplicado</span>; if (item.status === "aprovado") return <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4"/>Aprovado</span>; return <span className="inline-flex items-center gap-1 text-blue-700"><Database className="size-4"/>Aguardando</span>; }
