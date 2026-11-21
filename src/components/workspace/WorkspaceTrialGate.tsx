import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { trialDaysLeft } from "@/lib/workspaceSubscription";

type Props = { children: React.ReactNode };

export function WorkspaceTrialGate({ children }: Props) {
  const { subscription, membership } = useWorkspaceAuth();

  // No subscription row yet → still in grace (workspace just created)
  if (!subscription) return <>{children}</>;

  const { status, trial_ends_at } = subscription;

  const isTrialingExpired =
    status === "trialing" &&
    trial_ends_at &&
    trialDaysLeft(trial_ends_at) === 0 &&
    new Date(trial_ends_at).getTime() < Date.now();

  const isBlocked =
    isTrialingExpired ||
    status === "canceled" ||
    status === "suspended";

  if (!isBlocked) return <>{children}</>;

  const isOwner = membership?.role === "owner";

  const reason =
    status === "canceled" ? "A assinatura foi cancelada." :
    status === "suspended" ? "A assinatura está suspensa." :
    "O período gratuito encerrou.";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1efeb]">
          <Lock size={22} className="text-[#153f34]" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-semibold text-[#1a2f26]">Acesso bloqueado</h1>
        <p className="mt-2 text-sm text-[#5c6e66]">{reason}</p>
        <p className="mt-1 text-sm text-[#5c6e66]">
          Assine o Plano Starter para continuar usando o Nutrit.
        </p>

        <div className="mt-6 rounded-xl border border-[#e1e9e3] bg-white p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#5c6e66]">Plano Starter</p>
          <p className="mt-1 text-2xl font-bold text-[#153f34]">R$79,90<span className="text-sm font-normal text-[#5c6e66]">/mês</span></p>
          <ul className="mt-3 space-y-1.5">
            {["Pacientes ilimitados", "Planos alimentares e modelos", "Avaliações antropométricas", "Banco de alimentos completo"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#374151]">
                <span className="text-[#166b50]">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {isOwner ? (
          <Link
            to="/workspace/configuracoes?tab=plano"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#153f34] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f5546]"
          >
            Assinar agora <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          <p className="mt-5 text-sm text-[#5c6e66]">
            Fale com o owner do workspace para reativar a assinatura.
          </p>
        )}
      </div>
    </div>
  );
}
