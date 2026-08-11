import type { ReactNode } from "react";

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6">{children}</div>;
}
