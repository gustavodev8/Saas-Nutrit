import { useState } from "react";
import {
  Apple, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Home,
  LayoutDashboard, LogOut, Moon, Settings, Sun, UsersRound,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { WorkspacePaywall } from "@/components/workspace/WorkspacePaywall";
import {
  initiateWorkspaceSubscription,
  isSubscriptionAccessible,
  trialDaysLeft,
} from "@/lib/workspaceSubscription";

const navCls = (isActive: boolean, collapsed: boolean) =>
  cn(
    "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
    collapsed && "justify-center px-0",
    isActive
      ? "bg-[#e6f1eb] dark:bg-primary/20 text-[#166b50] dark:text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export default function WorkspaceShell() {
  const { membership, userEmail, logout, subscription } = useWorkspaceAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

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

  // Trial banner
  const trialBanner = (() => {
    if (subscription?.status !== "trialing") return null;
    const days = trialDaysLeft(subscription.trial_ends_at);
    const cls =
      days <= 3
        ? "bg-red-50 border-red-300 text-red-700"
        : days <= 7
        ? "bg-amber-50 border-amber-300 text-amber-700"
        : "bg-blue-50 border-blue-300 text-blue-700";
    return (
      <div className={cn("flex items-center justify-center gap-2 border-b px-4 py-2 text-xs", cls)}>
        <span>
          {days > 0 ? (
            <>Período gratuito: <strong>{days} {days === 1 ? "dia restante" : "dias restantes"}</strong>.</>
          ) : (
            "Período gratuito encerrado."
          )}
        </span>
        <Link
          to="/workspace/configuracoes?tab=plano"
          className="whitespace-nowrap font-semibold underline underline-offset-2"
        >
          Assinar agora →
        </Link>
      </div>
    );
  })();

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex h-screen overflow-hidden bg-muted dark:bg-background">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "relative flex flex-col border-r bg-background transition-all duration-200 shrink-0 h-full overflow-y-auto overflow-x-hidden",
          collapsed ? "w-[60px]" : "w-[220px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2.5 border-b px-3 py-4",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e6f1eb] text-[#166b50]">
            <LayoutDashboard size={17} />
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold text-[#153f34]">Nutrit</p>
              <p className="text-[10px] text-muted-foreground">Área clínica</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-2 py-3 flex-1" aria-label="Navegação">
          <NavLink to="/workspace" end title={collapsed ? "Início" : undefined}
            className={({ isActive }) => navCls(isActive, collapsed)}>
            <Home size={17} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Início</span>}
          </NavLink>
          <NavLink to="/workspace/patients" title={collapsed ? "Pacientes" : undefined}
            className={({ isActive }) => navCls(isActive, collapsed)}>
            <UsersRound size={17} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Pacientes</span>}
          </NavLink>
          <NavLink to="/workspace/agenda" title={collapsed ? "Agenda" : undefined}
            className={({ isActive }) => navCls(isActive, collapsed)}>
            <CalendarDays size={17} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Agenda</span>}
          </NavLink>
          <NavLink to="/workspace/modelos" title={collapsed ? "Modelos" : undefined}
            className={({ isActive }) => navCls(isActive, collapsed)}>
            <BookOpen size={17} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Modelos</span>}
          </NavLink>
          <NavLink to="/workspace/alimentos" title={collapsed ? "Alimentos" : undefined}
            className={({ isActive }) => navCls(isActive, collapsed)}>
            <Apple size={17} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Alimentos</span>}
          </NavLink>
          <NavLink to="/workspace/configuracoes" title={collapsed ? "Configurações" : undefined}
            className={({ isActive }) => navCls(isActive, collapsed)}>
            <Settings size={17} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Configurações</span>}
          </NavLink>
        </nav>

        {/* User + logout */}
        <div className={cn("border-t px-2 py-3 space-y-1", collapsed && "flex flex-col items-center")}>
          {!collapsed && (
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#166b50]/10 text-[#166b50] text-xs font-bold">
                {initials}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-medium text-foreground">{userEmail}</p>
                <p className="text-[10px] text-muted-foreground">
                  {membership?.role === "owner" ? "Owner" : "Nutricionista"}
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#166b50]/10 text-[#166b50] text-xs font-bold"
              title={userEmail ?? ""}
            >
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {theme === "dark"
              ? <Sun size={16} className="shrink-0" aria-hidden="true" />
              : <Moon size={16} className="shrink-0" aria-hidden="true" />}
            {!collapsed && <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            title={collapsed ? "Sair" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut size={16} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute -right-3 top-[52px] flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-y-auto">
        {trialBanner}
        <Outlet />
      </div>
    </div>
  );
}
