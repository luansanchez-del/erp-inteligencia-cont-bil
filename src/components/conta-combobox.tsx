import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";

export function ContaCombobox({
  value,
  onChange,
  placeholder = "Buscar conta por código ou descrição…",
  excluir,
  className,
}: {
  value: string;
  onChange: (codigo: string) => void;
  placeholder?: string;
  excluir?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);

  const contas = useMemo(
    () =>
      saldosImplantacao
        .filter((conta) => conta.conta !== excluir)
        .sort((a, b) => a.classificacao.localeCompare(b.classificacao, "pt-BR", { numeric: true })),
    [excluir],
  );
  const selecionada = contas.find((conta) => conta.conta === value);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          className={cn(
            "h-10 w-full justify-between font-normal",
            !selecionada && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selecionada ? `${selecionada.conta} · ${selecionada.descricao}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Digite o código ou a descrição…" />
          <CommandList>
            <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
            <CommandGroup>
              {contas.map((conta) => (
                <CommandItem
                  key={conta.conta}
                  value={`${conta.conta} ${conta.classificacao} ${conta.descricao}`}
                  onSelect={() => {
                    onChange(conta.conta);
                    setAberto(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 size-4 shrink-0", conta.conta === value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">
                      <span className="font-mono">{conta.conta}</span> · {conta.classificacao}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{conta.descricao}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
