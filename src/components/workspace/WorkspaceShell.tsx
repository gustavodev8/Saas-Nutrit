import { Apple, BookOpen, Home, LayoutDashboard, LogOut, Settings, UsersRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { WorkspacePaywall } from "@/components/workspace/WorkspacePaywall";
import { initiateWorkspaceSubscription, isSubscriptionAccessible } from "@/lib/workspaceSubscription";

function navClass({ isActive }: { isActive: boolean }) {
  return `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
    ? "bg-[#e6f1eb] text-[#166b50]"
    : "text-muted-foreground hover:bg-muted hover:text-foreground"}`;
}

export default function WorkspaceShell() {
  const { membership, userEmail, logout, subscription } = useWorkspaceAuth();

  // Show paywall when subscription exists and access is blocked
  // (subscription null = legacy pilot user or migration not yet applied — allow through)
  if (subscription && !isSubscriptionAccessible(subscription.status)) {
    return (
      <WorkspacePaywall
        status={subscription.status}
        trialEndsAt={subscription.trial_ends_at}
        onManage={async () => {
          try {
            const initPoint = await initiateWorkspaceSubscription(
              `${window.location.origin}/workspace/configuracoes?subscribed=1`
            );
            window.location.href = initPoint;
          } catch {
            window.location.href = "/workspace/configuracoes?tab=plano";
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-5">
            <NavLink to="/workspace/patients" className="flex items-center gap-2 text-base font-semibold text-[#166b50]">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e6f1eb]" aria-hidden="true"><LayoutDashboard size={17} /></span>
              Nutrit · Área clínica
            </NavLink>
            <nav aria-label="Navegação do workspace" className="hidden items-center gap-1 sm:flex">
              <NavLink to="/workspace" end className={navClass}><Home size={16} aria-hidden="true" />Início</NavLink>
              <NavLink to="/workspace/patients" className={navClass}><UsersRound size={16} aria-hidden="true" />Pacientes</NavLink>
              <NavLink to="/workspace/modelos" className={navClass}><BookOpen size={16} aria-hidden="true" />Modelos</NavLink>
              <NavLink to="/workspace/alimentos" className={navClass}><Apple size={16} aria-hidden="true" />Alimentos</NavLink>
              <NavLink to="/workspace/configuracoes" className={navClass}><Settings size={16} aria-hidden="true" />Configurações</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-right text-xs text-muted-foreground md:block">
              <span className="block">{userEmail}</span>
              <span>{membership?.role === "owner" ? "Owner" : "Nutricionista"}</span>
            </p>
            <Button variant="outline" size="sm" onClick={() => void logout()}><LogOut size={16} aria-hidden="true" />Sair</Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
