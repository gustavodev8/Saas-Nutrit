import { AlertTriangle, ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SubscriptionStatus, trialDaysLeft } from "@/lib/workspaceSubscription";

interface WorkspacePaywallProps {
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  onManage?: () => void;
}

export function WorkspacePaywall({ status, trialEndsAt, onManage }: WorkspacePaywallProps) {
  const isExpiredTrial = status === "trialing" && trialEndsAt && trialDaysLeft(trialEndsAt) === 0;
  const isCanceled = status === "canceled" || status === "suspended";
  const isPastDue = status === "past_due";

  const title = isExpiredTrial
    ? "Seu período gratuito encerrou"
    : isCanceled
    ? "Assinatura cancelada"
    : isPastDue
    ? "Pagamento pendente"
    : "Acesso suspenso";

  const description = isExpiredTrial
    ? "Seus 30 dias grátis chegaram ao fim. Assine o plano por R$79,90/mês para continuar usando o Nutrit sem interrupções."
    : isCanceled
    ? "Sua assinatura foi cancelada. Reative para voltar a ter acesso completo ao workspace."
    : isPastDue
    ? "Há um problema com o pagamento da sua assinatura. Atualize as informações de pagamento para continuar."
    : "Seu workspace está temporariamente suspenso. Entre em contato com o suporte.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f1eb]">
          <Leaf size={26} className="text-[#166b50]" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {isPastDue ? "Ação necessária" : "Acesso bloqueado"}
            </span>
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 text-left space-y-1">
          <p className="text-sm font-semibold">Plano Nutrit · R$79,90/mês</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>✓ Pacientes ilimitados</li>
            <li>✓ Planos alimentares e modelos</li>
            <li>✓ Avaliações antropométricas</li>
            <li>✓ Banco de alimentos completo</li>
          </ul>
        </div>

        <Button
          className="w-full bg-[#166b50] hover:bg-[#145e45] text-white"
          onClick={onManage}
        >
          {isPastDue ? "Regularizar pagamento" : "Ativar assinatura"}
          <ArrowRight size={16} />
        </Button>

        <p className="text-xs text-muted-foreground">
          Dúvidas? Entre em contato pelo suporte da plataforma.
        </p>
      </div>
    </div>
  );
}
