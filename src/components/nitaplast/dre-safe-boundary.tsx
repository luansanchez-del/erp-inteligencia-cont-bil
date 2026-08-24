import { Component, type ErrorInfo, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  titulo: string;
  children: ReactNode;
};

type State = {
  erro: Error | null;
};

/**
 * A validação contábil pode bloquear uma seção, mas nunca deve derrubar a rota inteira.
 * O erro fica visível para revisão e as demais partes da DRE continuam acessíveis.
 */
export class DreSafeBoundary extends Component<Props, State> {
  override state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error(`[DRE] ${this.props.titulo}`, erro, info);
  }

  private tentarNovamente = () => {
    this.setState({ erro: null });
  };

  override render() {
    if (!this.state.erro) return this.props.children;

    return (
      <Card className="border-amber-500/50 bg-amber-50/40">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex max-w-4xl gap-3">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-900">{this.props.titulo} — revisão necessária</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A validação encontrou uma divergência. A página permanece aberta para que o problema seja conferido no Razão/Balancete, sem esconder a inconsistência nem derrubar toda a DRE.
                </p>
                <p className="mt-2 rounded-md border bg-background p-2 font-mono text-xs text-amber-900">
                  {this.state.erro.message}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={this.tentarNovamente}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}
