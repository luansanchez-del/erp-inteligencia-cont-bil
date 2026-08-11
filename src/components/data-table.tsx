import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
  valor?: (row: T) => string;
}

interface DataTableProps<T> {
  colunas: Column<T>[];
  dados: T[];
  chave: (row: T) => string;
  placeholderBusca?: string;
  filtros?: ReactNode;
  vazio?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  colunas,
  dados,
  chave,
  placeholderBusca = "Buscar…",
  filtros,
  vazio = "Nenhum registro para os filtros atuais.",
  onRowClick,
}: DataTableProps<T>) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState("25");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return dados;
    return dados.filter((row) =>
      colunas.some((c) => (c.valor?.(row) ?? "").toLowerCase().includes(termo)),
    );
  }, [busca, dados, colunas]);

  const tamanho = Number(porPagina);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / tamanho));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * tamanho, paginaAtual * tamanho);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder={placeholderBusca}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {filtros}
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {colunas.map((c) => (
                <TableHead key={c.key} className={cn("h-9 whitespace-nowrap", c.className)}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colunas.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {vazio}
                </TableCell>
              </TableRow>
            )}
            {visiveis.map((row) => (
              <TableRow
                key={chave(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {colunas.map((c) => (
                  <TableCell key={c.key} className={cn("py-2", c.className)}>
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground">
        <span className="truncate">
          {filtrados.length} registro(s) · página {paginaAtual} de {totalPaginas}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={porPagina}
            onValueChange={(v) => {
              setPorPagina(v);
              setPagina(1);
            }}
          >
            <SelectTrigger className="h-8 w-[92px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["25", "50", "100", "250"].map((n) => (
                <SelectItem key={n} value={n}>
                  {n} / pág.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={paginaAtual <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={paginaAtual >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
