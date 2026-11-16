import {
  Users, Plus, Search, Trash2, ChevronRight, UserCircle2, Loader2, MapPin,
  Mail, Phone, CalendarDays, AlertCircle, SlidersHorizontal, X,
  ChevronLeft, AlertTriangle, ClipboardList, Utensils, Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  fetchPatientOperationalIndicators,
  fetchPatients,
  deletePatient,
  upsertPatient,
  type Patient,
  type PatientOperationalIndicators,
} from "@/lib/supabase";
import {
  derivePatientSegments,
  resolvePatientOperationalFlags,
  type PatientSegmentKey,
} from "@/lib/patientSegments";
import { cn } from "@/lib/utils";
import { matchesNormalizedSearch } from "@/lib/normalizedSearch";
import { PATIENT_SEGMENT_LABELS } from "@/lib/patientSegments";

// ─── Types ────────────────────────────────────────────────────────────────────

type GenderFilter = "all" | "M" | "F" | "outro";
type SortKey      = "recent" | "oldest" | "name" | "age_asc" | "age_desc";
type ActionFilter =
  | "all"
  | "new_this_month"
  | "incomplete"
  | "no_next_booking"
  | "no_active_plan"
  | "pending_exams"
  | "retorno_vencido"
  | "inativo_30d";

const ITEMS_PER_PAGE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GENDER_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino", outro: "Outro" };

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent",   label: "Mais recente"   },
  { id: "oldest",   label: "Mais antigo"    },
  { id: "name",     label: "Nome A–Z"       },
  { id: "age_asc",  label: "Mais jovem"     },
  { id: "age_desc", label: "Mais velho"     },
];

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const calcAge = (d: string) =>
  Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

// ─── Form state ───────────────────────────────────────────────────────────────

interface NewPatientForm {
  name: string; email: string; phone: string; city: string;
  birth_date: string; gender: string; occupation: string;
}

const emptyForm: NewPatientForm = {
  name: "", email: "", phone: "", city: "", birth_date: "", gender: "", occupation: "",
};

const emptyOperationalIndicators: PatientOperationalIndicators = {
  withoutNextBookingIds: [],
  withoutActiveMealPlanIds: [],
  pendingExamRequestPatientIds: [],
  lastInteractionDates: {},
  nextBookingDates: {},
  nextReturnDates: {},
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPacientes() {
  const navigate = useNavigate();

  const [patients,      setPatients]      = useState<Patient[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [gender,        setGender]        = useState<GenderFilter>("all");
  const [actionFilter,  setActionFilter]  = useState<ActionFilter>("all");
  const [sort,          setSort]          = useState<SortKey>("recent");
  const [showModal,     setShowModal]     = useState(false);
  const [form,          setForm]          = useState<NewPatientForm>(emptyForm);
  const [saving,        setSaving]        = useState(false);
  const [deletingId,    setDeletingId]    = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [page,          setPage]          = useState(1);
  const [operationalIndicators, setOperationalIndicators] = useState<PatientOperationalIndicators>(emptyOperationalIndicators);

  // Advanced filters
  const [cityFilter,  setCityFilter]  = useState("");
  const [ageMin,      setAgeMin]      = useState("");
  const [ageMax,      setAgeMax]      = useState("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  const loadPatients = async () => {
    setLoading(true);
    try {
      const loadedPatients = await fetchPatients();
      setPatients(loadedPatients);
      setOperationalIndicators(await fetchPatientOperationalIndicators(loadedPatients));
    }
    catch { toast.error("Erro ao carregar pacientes."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPatients(); }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const ym  = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const thisMonth = ym(now);
    const lastMonth = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const newThisMonth = patients.filter((p) => p.created_at?.slice(0, 7) === thisMonth).length;
    const newLastMonth = patients.filter((p) => p.created_at?.slice(0, 7) === lastMonth).length;

    const incomplete = patients.filter((p) => !p.email || !p.phone || !p.birth_date || !p.cpf).length;

    let monthDelta = "";
    if (newLastMonth > 0) {
      const diff = newThisMonth - newLastMonth;
      monthDelta = diff >= 0 ? `+${diff} vs mês anterior` : `${diff} vs mês anterior`;
    } else if (newThisMonth > 0) {
      monthDelta = "cadastros recentes";
    }

    return { thisMonth, newThisMonth, monthDelta, incomplete };
  }, [patients]);

  const operationalSets = useMemo(() => ({
    noNextBooking: new Set(operationalIndicators.withoutNextBookingIds),
    noActivePlan: new Set(operationalIndicators.withoutActiveMealPlanIds),
    pendingExams: new Set(operationalIndicators.pendingExamRequestPatientIds),
  }), [operationalIndicators]);

  const patientSegmentsById = useMemo(() => {
    const entries = patients
      .filter((patient): patient is Patient & { id: number } => typeof patient.id === "number")
      .map((patient) => [
        patient.id,
        derivePatientSegments({
          patient,
          operationalFlags: resolvePatientOperationalFlags(patient.id, operationalIndicators),
          lastInteraction: {
            lastInteractionAt: operationalIndicators.lastInteractionDates[patient.id] ?? patient.created_at,
            nextBookingDate: operationalIndicators.nextBookingDates[patient.id],
            nextReturnDate: operationalIndicators.nextReturnDates[patient.id],
          },
        }),
      ] as const);

    return new Map<number, PatientSegmentKey[]>(entries);
  }, [patients, operationalIndicators]);

  const segmentCounts = useMemo(() => {
    const counts: Record<PatientSegmentKey, number> = {
      sem_proximo_agendamento: 0,
      sem_plano_ativo: 0,
      exames_pendentes: 0,
      cadastro_incompleto: 0,
      inativo_30d: 0,
      inativo_60d: 0,
      inativo_90d: 0,
      retorno_vencido: 0,
    };

    patientSegmentsById.forEach((segments) => {
      segments.forEach((segment) => {
        counts[segment] += 1;
      });
    });

    return counts;
  }, [patientSegmentsById]);

  // ── Unique cities list for dropdown ─────────────────────────────────────────
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    patients.forEach((p) => { if (p.city?.trim()) set.add(p.city.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [patients]);

  // ── Gender counts (respects text search only) ────────────────────────────────
  const genderCounts = useMemo(() => {
    const base = search.trim()
      ? patients.filter((p) => matchesNormalizedSearch({
          name: p.name,
          search_text: [p.email, p.phone, p.city, p.cpf].filter(Boolean).join(" "),
        }, search))
      : patients;
    return {
      all:   base.length,
      M:     base.filter((p) => p.gender === "M").length,
      F:     base.filter((p) => p.gender === "F").length,
      outro: base.filter((p) => p.gender === "outro").length,
    };
  }, [patients, search]);

  // ── Full filtered list ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const ageMinN  = ageMin  ? parseInt(ageMin)  : null;
    const ageMaxN  = ageMax  ? parseInt(ageMax)  : null;
    const hasSegment = (patientId: number | undefined, segment: PatientSegmentKey) =>
      typeof patientId === "number" && patientSegmentsById.get(patientId)?.includes(segment);

    let list = patients.filter((p) => {
      if (search.trim() && !matchesNormalizedSearch({
        name: p.name,
        search_text: [p.email, p.phone, p.city, p.cpf].filter(Boolean).join(" "),
      }, search)) return false;
      if (gender !== "all" && p.gender !== gender) return false;
      if (actionFilter === "new_this_month" && p.created_at?.slice(0, 7) !== stats.thisMonth) return false;
      if (actionFilter === "incomplete" && !hasSegment(p.id, "cadastro_incompleto")) return false;
      if (actionFilter === "no_next_booking" && (!p.id || !operationalSets.noNextBooking.has(p.id))) return false;
      if (actionFilter === "no_active_plan" && (!p.id || !operationalSets.noActivePlan.has(p.id))) return false;
      if (actionFilter === "pending_exams" && (!p.id || !operationalSets.pendingExams.has(p.id))) return false;
      if (actionFilter === "retorno_vencido" && !hasSegment(p.id, "retorno_vencido")) return false;
      if (actionFilter === "inativo_30d" && !hasSegment(p.id, "inativo_30d")) return false;
      if (cityFilter && p.city?.trim().toLowerCase() !== cityFilter.trim().toLowerCase()) return false;
      if (ageMinN !== null || ageMaxN !== null) {
        if (!p.birth_date) return false;
        const a = calcAge(p.birth_date);
        if (ageMinN !== null && a < ageMinN) return false;
        if (ageMaxN !== null && a > ageMaxN) return false;
      }
      if (dateFrom && p.created_at && p.created_at.slice(0, 10) < dateFrom) return false;
      if (dateTo   && p.created_at && p.created_at.slice(0, 10) > dateTo)   return false;
      return true;
    });

    if (sort === "name")     list = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    if (sort === "recent")   list = [...list].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    if (sort === "oldest")   list = [...list].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    if (sort === "age_asc")  list = [...list].sort((a, b) => {
      const aa = a.birth_date ? calcAge(a.birth_date) : 0;
      const ba = b.birth_date ? calcAge(b.birth_date) : 0;
      return aa - ba;
    });
    if (sort === "age_desc") list = [...list].sort((a, b) => {
      const aa = a.birth_date ? calcAge(a.birth_date) : 0;
      const ba = b.birth_date ? calcAge(b.birth_date) : 0;
      return ba - aa;
    });

    return list;
  }, [patients, search, gender, actionFilter, stats.thisMonth, operationalSets, patientSegmentsById, cityFilter, ageMin, ageMax, dateFrom, dateTo, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, gender, actionFilter, cityFilter, ageMin, ageMax, dateFrom, dateTo, sort]);

  const hasAdvancedFilter = cityFilter !== "" || ageMin !== "" || ageMax !== "" || dateFrom !== "" || dateTo !== "";
  const hasFilter         = gender !== "all" || actionFilter !== "all" || search.trim() !== "" || hasAdvancedFilter;

  const clearAdvanced = () => {
    setCityFilter(""); setAgeMin(""); setAgeMax(""); setDateFrom(""); setDateTo("");
  };
  const clearAll = () => {
    setSearch(""); setGender("all"); setActionFilter("all"); clearAdvanced();
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    const ok = await deletePatient(id);
    if (ok) await loadPatients();
    if (ok) { setPatients((prev) => prev.filter((p) => p.id !== id)); toast.success("Paciente excluído."); }
    else    { toast.error("Erro ao excluir paciente."); }
    setDeletingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("O nome do paciente é obrigatório."); return; }
    setSaving(true);
    const result = await upsertPatient({
      name:       form.name.trim(),
      email:      form.email.trim()      || undefined,
      phone:      form.phone.trim()      || undefined,
      city:       form.city.trim()       || undefined,
      birth_date: form.birth_date        || undefined,
      gender:     (form.gender as Patient["gender"]) || undefined,
      occupation: form.occupation.trim() || undefined,
    });
    setSaving(false);
    if (!result) { toast.error("Erro ao salvar. Verifique o console e as tabelas do Supabase."); return; }
    toast.success("Paciente cadastrado com sucesso!");
    setShowModal(false);
    setForm(emptyForm);
    await loadPatients();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight leading-none text-[#13231b]">Pacientes</h1>
          <p className="mt-2 text-sm text-[#728078]">Registro de prontuários da clínica</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#1d6245] px-5 font-semibold text-white shadow-sm hover:bg-[#14583d]">
          <Plus className="h-4 w-4" />
          Novo paciente
        </Button>
      </div>

      {/* ── Snapshot e fila de atenção ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(270px,0.82fr)_minmax(0,2.35fr)]">
        <button
          type="button"
          onClick={clearAll}
          className={cn("group relative flex min-h-[220px] flex-col overflow-hidden rounded-[20px] bg-[#0d563b] p-6 text-left text-white shadow-sm transition hover:bg-[#0a4d35] focus:outline-none focus:ring-2 focus:ring-[#0d563b]/30 focus:ring-offset-2", actionFilter === "all" && "ring-2 ring-[#0d563b]/20")}
        >
          <Users className="absolute -bottom-10 -right-5 h-36 w-36 rotate-[-10deg] text-white/[0.07]" strokeWidth={1.5} />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">Total de pacientes</span>
          <span className="mt-3 text-5xl font-bold leading-none tracking-tight tabular-nums">{patients.length}</span>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/75">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">+{stats.newThisMonth} este mês</span>
            <span>{stats.monthDelta ? `⌁ ${stats.monthDelta.replace(/^\+/, "")}` : "Base de pacientes"}</span>
          </div>
        </button>

        <section className="rounded-[20px] border border-[#dfe7e2] bg-white p-4 shadow-[0_2px_5px_rgba(20,50,35,0.04)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#17251d]">Precisam de atenção</h2>
            <span className="hidden text-xs text-[#829087] sm:inline">Clique para filtrar</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Sem próxima consulta", value: operationalIndicators.withoutNextBookingIds.length, icon: <CalendarDays className="h-4 w-4" />, filter: "no_next_booking" as const },
              { label: "Perfis incompletos", value: segmentCounts.cadastro_incompleto, icon: <AlertCircle className="h-4 w-4" />, filter: "incomplete" as const },
              { label: "Inativos 30d+", value: segmentCounts.inativo_30d, icon: <Clock3 className="h-4 w-4" />, filter: "inativo_30d" as const },
              { label: "Sem plano ativo", value: operationalIndicators.withoutActiveMealPlanIds.length, icon: <Utensils className="h-4 w-4" />, filter: "no_active_plan" as const },
              { label: "Retorno vencido", value: segmentCounts.retorno_vencido, icon: <AlertTriangle className="h-4 w-4" />, filter: "retorno_vencido" as const },
              { label: "Exames pendentes", value: operationalIndicators.pendingExamRequestPatientIds.length, icon: <ClipboardList className="h-4 w-4" />, filter: "pending_exams" as const },
            ].map((metric) => {
              const isActive = actionFilter === metric.filter;
              return (
                <button
                  key={metric.filter}
                  type="button"
                  onClick={() => setActionFilter(isActive ? "all" : metric.filter)}
                  className={cn("flex min-w-0 items-center gap-3 rounded-[15px] border px-3 py-2.5 text-left transition hover:border-[#cbd8d0] hover:bg-[#fbfcfb] focus:outline-none focus:ring-2 focus:ring-[#1d6245]/20", isActive ? "border-[#1d6245]/50 bg-[#f0f6f2]" : "border-[#e0e7e2] bg-white")}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3d8] text-[#94500a]">{metric.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-xl font-semibold leading-5 tabular-nums text-[#17251d]">{metric.value}</span>
                    <span className="mt-1 block truncate text-[11px] leading-tight text-[#758179]">{metric.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Patient list ─────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-[20px] border border-[#dfe7e2] bg-white shadow-[0_2px_5px_rgba(20,50,35,0.04)]">
      <div className="flex flex-col gap-3 border-b border-[#e4ebe6] px-4 py-3.5 xl:flex-row xl:items-center xl:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto rounded-full bg-[#f0f4f1] p-1">
          {(["all", "F", "M", "outro"] as GenderFilter[]).map((g) => {
            const label = g === "all" ? "Todos" : GENDER_LABEL[g];
            const active = gender === g;
            return (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={cn("flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition whitespace-nowrap", active ? "bg-white text-[#183126] shadow-sm" : "text-[#65746b] hover:text-[#183126]")}
              >
                {label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] tabular-nums", active ? "bg-[#1d6245] text-white" : "bg-[#e3eae5] text-[#758179]")}>{genderCounts[g]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none xl:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8981]" />
            <Input
              placeholder="Buscar nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-[#dfe7e2] bg-[#f8faf8] pl-9 text-sm placeholder:text-[#8d9991] focus-visible:ring-[#1d6245]/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 min-w-0 flex-1 rounded-xl border border-[#dfe7e2] bg-white px-3 text-sm text-[#26352d] focus:outline-none focus:ring-1 focus:ring-[#1d6245]/30 sm:w-36 sm:flex-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn("h-10 shrink-0 rounded-xl border px-3 text-sm font-medium flex items-center gap-2 transition", showAdvanced || hasAdvancedFilter ? "border-[#1d6245]/40 bg-[#f0f6f2] text-[#1d6245]" : "border-[#dfe7e2] bg-white text-[#46564d] hover:bg-[#f8faf8]")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {hasAdvancedFilter && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1d6245] text-[10px] font-bold text-white">{[cityFilter, ageMin || ageMax, dateFrom || dateTo].filter(Boolean).length}</span>}
            </button>
          </div>
          {hasFilter && <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs font-medium text-[#718078] hover:text-red-600"><X className="h-3 w-3" />Limpar</button>}
        </div>
      </div>

      {/* ── Advanced filters panel ──────────────────────────────────────────── */}
      {showAdvanced && (
        <div className="mt-4 p-5 rounded-2xl border border-border/70 bg-card shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Cidade</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Todas as cidades</option>
                {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Age range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Faixa etária</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Mín"
                  min={0}
                  max={120}
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="h-10 rounded-xl border-border/60 text-sm"
                />
                <span className="text-muted-foreground text-xs font-bold shrink-0">até</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  min={0}
                  max={120}
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="h-10 rounded-xl border-border/60 text-sm"
                />
              </div>
            </div>

            {/* Date from */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Cadastrado de</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 rounded-xl border-border/60 text-sm"
              />
            </div>

            {/* Date to */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Até</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 rounded-xl border-border/60 text-sm"
              />
            </div>
          </div>

          {hasAdvancedFilter && (
            <div className="flex justify-end">
              <button
                onClick={clearAdvanced}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Limpar filtros avançados
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-28 text-[#78857d]">
          <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
          <p className="text-sm font-medium">Carregando pacientes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          <UserCircle2 className="w-14 h-14 text-muted-foreground/20" />
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">
              {hasFilter ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado ainda"}
            </p>
            <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
              {hasFilter
                ? "Tente ajustar a busca ou os filtros para encontrar o que procura."
                : "Adicione o primeiro paciente para começar a gerenciar sua clínica."}
            </p>
          </div>
          {hasFilter ? (
            <Button variant="outline" className="rounded-xl mt-2 px-6" onClick={clearAll}>
              Limpar filtros
            </Button>
          ) : (
            <Button variant="outline" className="rounded-xl mt-2 px-6 h-11 font-bold" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar paciente
            </Button>
          )}
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div className="hidden lg:grid grid-cols-[minmax(205px,1.4fr)_minmax(190px,1.35fr)_minmax(180px,1.1fr)_minmax(100px,.7fr)_minmax(120px,.8fr)_42px] border-b border-[#e4ebe6] bg-[#f5f8f6] px-5">
            {(["Paciente", "Contato", "Pendências", "Perfil", "Cadastro", ""] as const).map((col, i) => (
              <div key={i} className={cn(
                "flex items-center py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#69776f]",
                i === 3 || i === 4 ? "justify-center" : ""
              )}>
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {paginated.map((patient, idx) => (
            <div
              key={patient.id}
              onClick={() => navigate(`/admin/pacientes/${patient.id}`)}
              className={cn(
                "group grid grid-cols-[minmax(0,1fr)_32px] items-center gap-x-3 px-4 py-3.5 transition-colors hover:bg-[#fbfcfb] lg:grid-cols-[minmax(205px,1.4fr)_minmax(190px,1.35fr)_minmax(180px,1.1fr)_minmax(100px,.7fr)_minmax(120px,.8fr)_42px] lg:px-5 lg:py-3",
                idx < paginated.length - 1 && "border-b border-[#e7ede9]"
              )}
            >
              {/* Paciente */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f3ec] text-xs font-bold text-[#155b3d]">
                  {patient.name ? initials(patient.name) : "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight text-[#17251d] transition-colors group-hover:text-[#1d6245]">
                    {patient.name ?? "—"}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-[#77847c]">
                    <MapPin className="h-3 w-3 shrink-0" />{patient.city || <span className="italic">Cidade não informada</span>}
                  </p>
                  <div className="mt-2 space-y-1 lg:hidden">
                    <div className="flex flex-wrap gap-1">
                      {(patient.id ? (patientSegmentsById.get(patient.id) ?? []) : []).slice(0, 3).map((segment) => (
                        <span key={segment} className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", segment === "sem_proximo_agendamento" ? "bg-[#fff3d8] text-[#94500a]" : segment === "sem_plano_ativo" ? "bg-[#ffe9e7] text-[#ac3430]" : segment === "cadastro_incompleto" ? "bg-[#e8f3fb] text-[#22639a]" : segment === "exames_pendentes" ? "bg-[#eef2ef] text-[#69776f]" : "bg-[#fff3d8] text-[#94500a]")}>{PATIENT_SEGMENT_LABELS[segment]}</span>
                      ))}
                    </div>
                    <p className="truncate text-[11px] text-[#58685f]">{patient.email || patient.phone || "Sem contato"}</p>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="hidden min-w-0 flex-col justify-center gap-1 lg:flex">
                {patient.email ? <p className="flex min-w-0 items-center gap-1.5 truncate text-[13px] text-[#293a31]"><Mail className="h-3.5 w-3.5 shrink-0 text-[#66766c]" /><span className="truncate">{patient.email}</span></p> : null}
                {patient.phone ? <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-[#758179]"><Phone className="h-3 w-3 shrink-0" /><span className="truncate">{patient.phone}</span></p> : null}
                {!patient.email && !patient.phone && <span className="text-xs italic text-[#8b9890]">Sem contato</span>}
              </div>

              {/* Pendências */}
              <div className="hidden min-w-0 flex-wrap content-center gap-1 lg:flex">
                {(patient.id ? (patientSegmentsById.get(patient.id) ?? []) : []).slice(0, 3).map((segment) => (
                  <span key={segment} className={cn("rounded-full px-2 py-1 text-[10px] font-medium leading-none", segment === "sem_proximo_agendamento" ? "bg-[#fff3d8] text-[#94500a]" : segment === "sem_plano_ativo" ? "bg-[#ffe9e7] text-[#ac3430]" : segment === "cadastro_incompleto" ? "bg-[#e8f3fb] text-[#22639a]" : segment === "exames_pendentes" ? "bg-[#eef2ef] text-[#69776f]" : "bg-[#fff3d8] text-[#94500a]")}>{PATIENT_SEGMENT_LABELS[segment]}</span>
                ))}
              </div>

              {/* Gênero / Idade */}
              <div className="hidden min-w-0 flex-col items-center justify-center gap-1 lg:flex">
                <p className="text-[13px] text-[#293a31]">
                  {patient.gender ? GENDER_LABEL[patient.gender] : "—"}
                  {patient.birth_date ? <span className="text-[#77847c]"> · {calcAge(patient.birth_date)} anos</span> : null}
                </p>
              </div>

              {/* Cadastrado */}
              <div className="hidden items-center justify-center lg:flex">
                <p className="text-[12px] text-[#718078] tabular-nums">
                  {patient.created_at
                    ? new Date(patient.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(" de ", " ")
                    : "—"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-0.5">
                <button
                  onClick={(e) => patient.id !== undefined && handleDelete(e, patient.id)}
                  disabled={deletingId === patient.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9aa69f] opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
                  aria-label="Excluir"
                >
                  {deletingId === patient.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
                <ChevronRight className="h-4 w-4 text-[#718078] transition-colors group-hover:text-[#1d6245]" />
              </div>
            </div>
          ))}

          {/* Footer: count + pagination */}
          <div className="flex items-center justify-between gap-4 border-t border-[#e7ede9] bg-[#fafcfb] px-5 py-3.5">
            <p className="shrink-0 text-[11px] font-medium text-[#738078]">
              {filtered.length === patients.length
                ? `${patients.length} paciente${patients.length !== 1 ? "s" : ""} no total`
                : `${filtered.length} de ${patients.length} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | "…")[]>((acc, n, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === "number" && (n as number) - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "…" ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={cn(
                          "w-8 h-8 rounded-lg border text-xs font-semibold transition-colors",
                          page === item
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </section>

      {/* ── New Patient Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setForm(emptyForm); } }}
        >
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-xl shadow-2xl shadow-black/20 overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Accent bar */}
            <div className="h-1 w-full bg-primary" />

            {/* Modal header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-border/60">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold tracking-tight text-foreground">Cadastro de Paciente</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Prontuário clínico — campos obrigatórios marcados com <span className="text-destructive font-bold">*</span></p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="px-7 py-6 space-y-6">

              {/* Section: Identificação */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/50 flex items-center gap-2">
                  <span className="inline-block w-3 h-px bg-muted-foreground/30" />
                  Identificação
                  <span className="flex-1 h-px bg-border/60" />
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[11px] font-semibold text-muted-foreground">
                    Nome completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name" name="name" placeholder="Ex.: Maria Oliveira Santos"
                    value={form.name} onChange={handleFormChange} autoFocus
                    className="h-10 rounded-lg border-border/70 text-sm focus-visible:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-semibold text-muted-foreground">E-mail</Label>
                    <Input
                      id="email" name="email" type="email" placeholder="email@exemplo.com"
                      value={form.email} onChange={handleFormChange}
                      className="h-10 rounded-lg border-border/70 text-sm focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] font-semibold text-muted-foreground">Telefone</Label>
                    <Input
                      id="phone" name="phone" placeholder="(00) 00000-0000"
                      value={form.phone} onChange={handleFormChange}
                      className="h-10 rounded-lg border-border/70 text-sm focus-visible:ring-primary/30"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Dados pessoais */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/50 flex items-center gap-2">
                  <span className="inline-block w-3 h-px bg-muted-foreground/30" />
                  Dados pessoais
                  <span className="flex-1 h-px bg-border/60" />
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="birth_date" className="text-[11px] font-semibold text-muted-foreground">Nascimento</Label>
                    <Input
                      id="birth_date" name="birth_date" type="date"
                      value={form.birth_date} onChange={handleFormChange}
                      className="h-10 rounded-lg border-border/70 text-sm focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-[11px] font-semibold text-muted-foreground">Gênero</Label>
                    <select
                      id="gender" name="gender" value={form.gender} onChange={handleFormChange}
                      className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground border-border/70"
                    >
                      <option value="">Selecionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-[11px] font-semibold text-muted-foreground">Cidade</Label>
                    <Input
                      id="city" name="city" placeholder="Cidade"
                      value={form.city} onChange={handleFormChange}
                      className="h-10 rounded-lg border-border/70 text-sm focus-visible:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="occupation" className="text-[11px] font-semibold text-muted-foreground">Ocupação / Profissão</Label>
                  <Input
                    id="occupation" name="occupation" placeholder="Ex.: Professora, Atleta, Estudante..."
                    value={form.occupation} onChange={handleFormChange}
                    className="h-10 rounded-lg border-border/70 text-sm focus-visible:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 px-7 py-5 border-t border-border/60 bg-muted/20">
              <Button
                variant="ghost"
                className="h-10 px-5 rounded-lg font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <div className="flex-1" />
              <Button
                className="h-10 px-6 rounded-lg flex items-center gap-2 font-semibold shadow-sm shadow-primary/20"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                  : <><Plus className="w-4 h-4" />Cadastrar paciente</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete dialog ── */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-lg">Excluir paciente?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Esta ação é permanente e não pode ser desfeita. Todos os dados do paciente serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl flex-1">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
