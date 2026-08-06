import { Home, CalendarDays, FileText, LogOut, Soup, User2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import { getInitials } from "@/pages/portal/portalUtils";

const navItems = [
  { to: "/portal", icon: Home, label: "Inicio", end: true },
  { to: "/portal/plano", icon: Soup, label: "Plano" },
  { to: "/portal/consultas", icon: CalendarDays, label: "Consultas" },
  { to: "/portal/documentos", icon: FileText, label: "Documentos" },
];

export default function PatientPortalLayout() {
  const { patient, logout } = usePatientPortalAuth();

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 border border-border/60">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(patient?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Portal do paciente
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {patient?.name || "Paciente"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => void logout()}
          >
            <LogOut size={18} />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
