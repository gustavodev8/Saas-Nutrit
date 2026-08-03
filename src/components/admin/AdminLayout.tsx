import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutList,
  Leaf,
  Loader2,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquareQuote,
  ReceiptText,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Tag,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/contexts/ContentContext";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  description?: string;
};

type NavGroup = {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
};

const QUICK_ITEMS: NavItem[] = [
  { to: "/admin/agendamentos", icon: CalendarCheck, label: "Agenda", description: "Consultas e retornos" },
  { to: "/admin/pacientes", icon: Users, label: "Pacientes", description: "Prontuários" },
  { to: "/admin/modelos", icon: LayoutList, label: "Modelos", description: "Dietas prontas" },
];

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Clínica",
    icon: Stethoscope,
    items: [
      { to: "/admin/disponibilidade", icon: CalendarDays, label: "Disponibilidade" },
      { to: "/admin/pagamentos", icon: ReceiptText, label: "Pagamentos" },
      { to: "/admin/auditoria", icon: FileText, label: "Auditoria clínica" },
      { to: "/admin/operacao", icon: Activity, label: "Operacao" },
      { to: "/admin/alimentos", icon: Leaf, label: "Alimentos" },
      { to: "/admin/biblioteca", icon: FlaskConical, label: "Biblioteca clínica" },
    ],
  },
  {
    label: "Site",
    icon: FileText,
    items: [
      { to: "/admin/hero", icon: Sparkles, label: "Seção principal" },
      { to: "/admin/sobre", icon: User, label: "Sobre mim" },
      { to: "/admin/servicos", icon: Layers, label: "Serviços" },
      { to: "/admin/modalidades", icon: Globe, label: "Modalidades" },
      { to: "/admin/horarios", icon: CalendarDays, label: "Horários" },
      { to: "/admin/faq", icon: HelpCircle, label: "FAQ" },
      { to: "/admin/cta", icon: Megaphone, label: "Chamada final" },
    ],
  },
  {
    label: "Comercial",
    icon: ShoppingBag,
    items: [
      { to: "/admin/loja", icon: Store, label: "Marketplace" },
      { to: "/admin/precos", icon: ShoppingBag, label: "Consultas" },
      { to: "/admin/produtos", icon: BookOpen, label: "Produtos digitais" },
      { to: "/admin/desconto", icon: Tag, label: "Descontos" },
    ],
  },
  {
    label: "Autoridade",
    icon: Star,
    items: [
      { to: "/admin/resultados", icon: TrendingUp, label: "Resultados" },
      { to: "/admin/depoimentos", icon: MessageSquareQuote, label: "Depoimentos" },
      { to: "/admin/blog", icon: BookOpen, label: "Blog" },
    ],
  },
  {
    label: "Conta",
    icon: Settings,
    items: [
      { to: "/admin/perfil", icon: User, label: "Perfil e contato" },
      { to: "/admin/contato", icon: MapPin, label: "Endereço e redes" },
      { to: "/admin/disparo", icon: Send, label: "E-mails" },
      { to: "/admin/leads", icon: UserPlus, label: "Leads" },
      { to: "/admin/senha", icon: KeyRound, label: "Alterar senha" },
      { to: "/admin/ferramentas", icon: Wrench, label: "Ferramentas" },
    ],
  },
];

const DASHBOARD_ITEM: NavItem = {
  to: "/admin",
  icon: LayoutDashboard,
  label: "Dashboard",
  description: "Central do dia",
};

const ALL_ITEMS = [DASHBOARD_ITEM, ...QUICK_ITEMS, ...NAV_GROUPS.flatMap((group) => group.items)];

interface NavLinkItemProps {
  item: NavItem;
  end?: boolean;
  prominent?: boolean;
  onClick: () => void;
}

const NavLinkItem = ({ item, end, prominent, onClick }: NavLinkItemProps) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : prominent
              ? "bg-muted/35 text-foreground hover:bg-muted"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition",
              isActive ? "bg-white/15 text-primary-foreground" : "bg-background text-primary",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate leading-tight">{item.label}</span>
            {item.description && (
              <span
                className={cn(
                  "block truncate text-[11px] font-medium leading-tight",
                  isActive ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {item.description}
              </span>
            )}
          </span>
        </>
      )}
    </NavLink>
  );
};

interface NavGroupProps {
  group: NavGroup;
  defaultOpen: boolean;
  onItemClick: () => void;
}

const NavGroup = ({ group, defaultOpen, onItemClick }: NavGroupProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const GroupIcon = group.icon;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <GroupIcon className="h-3.5 w-3.5" />
          {group.label}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
      </button>

      <div className={cn("overflow-hidden transition-all", open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0")}>
        <div className="space-y-0.5 pl-1">
          {group.items.map((item) => (
            <NavLinkItem key={item.to} item={item} onClick={onItemClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

const getCurrentItem = (pathname: string) => {
  if (pathname === "/admin") return DASHBOARD_ITEM;

  return [...ALL_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) ?? DASHBOARD_ITEM;
};

const AdminLayout = () => {
  const { logout } = useAuth();
  const { content, loading } = useContent();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentItem = useMemo(() => getCurrentItem(location.pathname), [location.pathname]);

  const groupDefaultOpen = (items: NavItem[]) =>
    items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "print-hide fixed left-0 top-0 z-40 flex h-full w-[272px] flex-col border-r border-border/80 bg-card shadow-sm transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="border-b border-border/80 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold leading-tight text-foreground">
                {content.identity.brandName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Painel profissional</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <nav className="flex-1 space-y-4 overflow-y-auto p-3">
            <div className="space-y-1.5">
              <NavLinkItem item={DASHBOARD_ITEM} end prominent onClick={() => setSidebarOpen(false)} />
              {QUICK_ITEMS.map((item) => (
                <NavLinkItem key={item.to} item={item} prominent onClick={() => setSidebarOpen(false)} />
              ))}
            </div>

            <div className="space-y-2">
              {NAV_GROUPS.map((group) => (
                <NavGroup
                  key={group.label}
                  group={group}
                  defaultOpen={groupDefaultOpen(group.items)}
                  onItemClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </nav>

          <div className="border-t border-border/80 p-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              Ver site público
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 rounded-xl px-3 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-[272px]">
        <header className="print-hide sticky top-0 z-20 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur-sm sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Admin
                </p>
                <h1 className="truncate text-base font-semibold leading-tight text-foreground">
                  {currentItem.label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="hidden rounded-xl bg-card sm:inline-flex">
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver site
                </a>
              </Button>
              <p className="hidden rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground md:block">
                Olá, <span className="font-medium text-foreground">Admin</span>
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-24 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-[1500px]">
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>

      <nav className="print-hide fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="flex h-[58px] items-stretch">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:opacity-70",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <LayoutDashboard className="h-[22px] w-[22px]" />
            <span>Início</span>
          </NavLink>

          <NavLink
            to="/admin/pacientes"
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:opacity-70",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <Users className="h-[22px] w-[22px]" />
            <span>Pacientes</span>
          </NavLink>

          <NavLink
            to="/admin/agendamentos"
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:opacity-70",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <CalendarCheck className="h-[22px] w-[22px]" />
            <span>Agenda</span>
          </NavLink>

          <NavLink
            to="/admin/modelos"
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:opacity-70",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <LayoutList className="h-[22px] w-[22px]" />
            <span>Modelos</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors active:opacity-70"
          >
            <Menu className="h-[22px] w-[22px]" />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
