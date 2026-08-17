import { Search, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useErp } from "@/context/erp-context";
import { useFuncaoAtual } from "@/lib/permissions";

const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  em_fechamento: "Em fechamento",
  fechada: "Fechada",
};

export function Topbar() {
  const { empresa, empresas, competencia, competencias, setEmpresaId, setCompetenciaId } = useErp();
  const funcao = useFuncaoAtual();

  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <Select value={empresa.id} onValueChange={setEmpresaId}>
            <SelectTrigger className="h-9 w-[128px] sm:w-[220px] md:w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.codigo} — {e.nomeFantasia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={competencia.id} onValueChange={setCompetenciaId}>
            <SelectTrigger className="h-9 w-[102px] sm:w-[118px] md:w-[130px]" aria-label="Selecionar competência">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {competencias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative hidden min-w-0 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa, conta, lançamento…"
            className="h-9 pl-9"
            aria-label="Busca global"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium leading-tight">Luan Sanchez</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{funcao}</p>
          </div>
          <span className="hidden size-9 place-items-center rounded-full bg-muted sm:grid">
            <User className="size-4" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t bg-muted/40 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-medium">{empresa.razaoSocial}</span>
          <Badge variant="outline" className="hidden shrink-0 text-[10px] uppercase sm:inline-flex">
            {empresa.tipo === "matriz" ? "Matriz" : "Filial"}
          </Badge>
          <span className="hidden truncate font-mono text-xs text-muted-foreground sm:inline">
            {empresa.cnpj}
          </span>
          <span className="hidden truncate text-xs text-muted-foreground md:inline">
            {empresa.municipio ? `${empresa.municipio}/${empresa.uf}` : empresa.uf}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            Competência {competencia.label}
          </span>
          <Badge variant={competencia.status === "aberta" ? "secondary" : "outline"}>
            {statusLabel[competencia.status]}
          </Badge>
        </div>
      </div>
    </header>
  );
}
