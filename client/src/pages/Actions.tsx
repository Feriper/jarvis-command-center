import { AlertTriangle, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function Actions() {
  const utils = trpc.useUtils();
  const { data: actions = [], isLoading } = trpc.actions.list.useQuery();
  const approve = trpc.actions.approve.useMutation({ onSuccess: () => utils.actions.list.invalidate() });
  const reject = trpc.actions.reject.useMutation({ onSuccess: () => utils.actions.list.invalidate() });

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <header className="mb-6 border-b border-accent/30 pb-4">
        <h1 className="text-3xl font-bold">AÇÕES PENDENTES</h1>
        <p className="mt-2 text-sm text-muted-foreground">Nenhuma aprovação executa Pix, publicação ou mensagem automaticamente.</p>
      </header>
      {isLoading ? <p>Carregando aprovações...</p> : actions.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">Nenhuma ação aguardando revisão.</Card>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <Card key={action.id} className="space-y-4 border-accent/30 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{action.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>
                <Badge variant={action.status === "pending" ? "secondary" : "outline"}>{action.status}</Badge>
              </div>
              {action.type === "financial" || action.type === "publish" || action.type === "message" ? (
                <div className="flex items-center gap-2 text-xs text-amber-500"><AlertTriangle className="h-4 w-4" /> Ação externa sensível; confira os detalhes antes de aprovar.</div>
              ) : null}
              {action.status === "pending" ? (
                <div className="flex gap-2">
                  <Button onClick={() => approve.mutate({ actionId: action.id })} disabled={approve.isPending}><Check className="mr-2 h-4 w-4" />Aprovar registro</Button>
                  <Button variant="outline" onClick={() => reject.mutate({ actionId: action.id })} disabled={reject.isPending}><X className="mr-2 h-4 w-4" />Rejeitar</Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
