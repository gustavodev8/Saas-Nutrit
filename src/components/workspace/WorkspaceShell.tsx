import { useState } from "react";
import {
  Apple, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Home,
  LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, UsersRound,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { WorkspacePaywall } from "@/components/workspace/WorkspacePaywall";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  initiateWorkspaceSubscription,
  isSubscriptionAccessible,
  trialDaysLeft,
} from "@/lib/workspaceSubscription";

const navCls = (isActive: boolean, collapsed: boolean) =>
  cn(
    "flex min-h-10 items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    collapsed && "justify-center px-0",
    isActive
      ? "bg-primary/10 text-primary dark:bg-primary/20"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export default function WorkspaceShell() {
  const { membership, userEmail, logout, subscription } = useWorkspaceAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex h-screen flex-col overflow-hidden bg-muted dark:bg-background md:flex-row">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label="Abrir menu" className="flex h-10 w-10 items-center justify-center rounded-md text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Menu size={20} aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[min(85vw,20rem)] flex-col gap-0 overflow-y-auto p-0 md:hidden">
            <div className="border-b px-5 py-5">
              <SheetTitle className="text-left text-base text-primary">Nutrit</SheetTitle>
              <p className="text-xs text-muted-foreground">Área clínica</p>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Navegação móvel">
              <NavLink to="/workspace" end onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => navCls(isActive, false)}><Home size={18} aria-hidden="true" />Início</NavLink>
              <NavLink to="/workspace/patients" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => navCls(isActive, false)}><UsersRound size={18} aria-hidden="true" />Pacientes</NavLink>
              <NavLink to="/workspace/agenda" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => navCls(isActive, false)}><CalendarDays size={18} aria-hidden="true" />Agenda</NavLink>
              <NavLink to="/workspace/modelos" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => navCls(isActive, false)}><BookOpen size={18} aria-hidden="true" />Modelos</NavLink>
              <NavLink to="/workspace/alimentos" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => navCls(isActive, false)}><Apple size={18} aria-hidden="true" />Alimentos</NavLink>
              <NavLink to="/workspace/configuracoes" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => navCls(isActive, false)}><Settings size={18} aria-hidden="true" />Configurações</NavLink>
            </nav>
            <div className="space-y-1 border-t px-3 py-3">
              <p className="truncate px-2.5 py-2 text-xs text-muted-foreground">{userEmail}</p>
              <button type="button" onClick={toggleTheme} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
                {theme === "dark" ? "Modo claro" : "Modo escuro"}
              </button>
              <button type="button" onClick={() => void logout()} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <LogOut size={17} aria-hidden="true" />Sair
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-primary">Nutrit</span>
      </header>
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "relative hidden flex-col border-r border-border/80 bg-background transition-all duration-200 shrink-0 h-full overflow-y-auto overflow-x-hidden md:flex",
          collapsed ? "w-[60px]" : "w-[220px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2.5 border-b border-border/70 px-3 py-4",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LayoutDashboard size={17} />
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold text-primary">Nutrit</p>
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
        <div className={cn("border-t border-border/70 px-2 py-3 space-y-1", collapsed && "flex flex-col items-center")}>
          {!collapsed && (
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
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
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
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
              "flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
              "flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
          className="absolute -right-3 top-[52px] z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden md:h-screen">
        {trialBanner}
        <Outlet />
      </div>
    </div>
  );
}
