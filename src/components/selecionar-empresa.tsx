import { useMemo, useState } from "react";
import { Building2, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useErp } from "@/context/erp-context";
import { useAuth } from "@/context/auth-context";

export function SelecionarEmpresa({ onConfirmar }: { onConfirmar: () => void }) {
  const { empresas, setEmpresaId } = useErp();
  const { user, signOut } = useAuth();
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return empresas;
    return empresas.filter((e) =>
      [e.nomeFantasia, e.razaoSocial, e.codigo, e.cnpj].some((campo) =>
        campo.toLowerCase().includes(termo),
      ),
    );
  }, [busca, empresas]);

  function escolher(id: string) {
    setEmpresaId(id);
    onConfirmar();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/branding/group-legacy-logo.webp" alt="Group Legacy" className="h-8 w-auto" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Selecione a empresa</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {empresas.length > 5 && (
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar empresa, código ou CNPJ…"
              className="h-10 pl-9"
            />
          </div>
        )}

        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-lg border bg-card p-2 shadow-sm">
          {filtradas.map((empresa) => (
            <button
              key={empresa.id}
              type="button"
              onClick={() => escolher(empresa.id)}
              className="flex items-center gap-3 rounded-md border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-accent"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <Building2 className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{empresa.nomeFantasia}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {empresa.codigo} · {empresa.cnpj}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {filtradas.length === 0 && (
            <p className="p-3 text-center text-sm text-muted-foreground">
              Nenhuma empresa encontrada para "{busca}".
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
