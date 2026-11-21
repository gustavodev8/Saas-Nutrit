import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, FolderOpen, Users } from "lucide-react";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { LeafLoader } from "@/components/workspace/LeafLoader";

interface RecentPatient {
  id: number;
  name: string;
  created_at: string;
}

interface DashboardData {
  patientCount: number;
  recentPatients: RecentPatient[];
}

async function fetchDashboardData(workspaceId: string): Promise<DashboardData> {
  const [countRes, recentRes] = await Promise.all([
    workspaceSupabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    workspaceSupabase
      .from("patients")
      .select("id, name, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    patientCount: countRes.count ?? 0,
    recentPatients: (recentRes.data ?? []) as RecentPatient[],
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
  return `${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? "es" : ""} atrás`;
}

export function WorkspaceDashboardPage() {
  const { membership, userEmail } = useWorkspaceAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!membership?.workspace_id) return;
    fetchDashboardData(membership.workspace_id).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [membership?.workspace_id]);

  const firstName = userEmail?.split("@")[0] ?? "Nutricionista";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LeafLoader size="lg" label="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1eb]">
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M20 36 C20 36 18 28 20 20" stroke="#166b50" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M20 20 C20 20 8 18 6 8 C6 8 16 4 24 10 C30 14 20 20 20 20Z" fill="#166b50" fillOpacity="0.85" />
              <path d="M20 20 C20 20 28 14 32 6 C32 6 24 2 18 8 C14 12 20 20 20 20Z" fill="#1a8464" fillOpacity="0.6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Olá, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">Bem-vindo à sua área clínica</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="border rounded-xl p-5 bg-card flex items-center gap-4">
          <div className="rounded-xl bg-[#e6f1eb] p-3">
            <Users size={22} className="text-[#166b50]" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{data?.patientCount ?? 0}</p>
            <p className="text-sm text-muted-foreground">Paciente{(data?.patientCount ?? 0) !== 1 ? "s" : ""} cadastrado{(data?.patientCount ?? 0) !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="border rounded-xl p-5 bg-card flex items-center gap-4">
          <div className="rounded-xl bg-[#e6f1eb] p-3">
            <BookOpen size={22} className="text-[#166b50]" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">126</p>
            <p className="text-sm text-muted-foreground">Modelos de dieta disponíveis</p>
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/workspace/patients"
          className="group border rounded-xl p-4 bg-card hover:border-[#166b50]/50 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#e6f1eb] p-2">
              <Users size={18} className="text-[#166b50]" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-[#166b50] transition-colors">Pacientes</p>
              <p className="text-xs text-muted-foreground">Ver e adicionar pacientes</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-[#166b50] transition-colors" />
        </Link>

        <Link
          to="/workspace/modelos"
          className="group border rounded-xl p-4 bg-card hover:border-[#166b50]/50 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#e6f1eb] p-2">
              <BookOpen size={18} className="text-[#166b50]" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-[#166b50] transition-colors">Modelos de Dieta</p>
              <p className="text-xs text-muted-foreground">Biblioteca de protocolos</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-[#166b50] transition-colors" />
        </Link>
      </div>

      {/* Recent patients */}
      {(data?.recentPatients?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pacientes recentes
            </h2>
            <Link to="/workspace/patients" className="text-xs text-[#166b50] hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="border rounded-xl overflow-hidden bg-card divide-y">
            {data?.recentPatients.map((p) => (
              <Link
                key={p.id}
                to={`/workspace/patients/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6f1eb] text-[#166b50] text-xs font-semibold">
                  {getInitials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-[#166b50] transition-colors">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Adicionado {timeAgo(p.created_at)}</p>
                </div>
                <FolderOpen size={15} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data?.patientCount === 0 && (
        <div className="border rounded-xl p-10 bg-card flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-[#e6f1eb] p-4">
            <Users size={28} className="text-[#166b50]" />
          </div>
          <div>
            <p className="font-medium">Nenhum paciente ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione seu primeiro paciente para começar</p>
          </div>
          <Link
            to="/workspace/patients"
            className="bg-[#166b50] hover:bg-[#145e45] text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Adicionar paciente
          </Link>
        </div>
      )}
    </div>
  );
}
