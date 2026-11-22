import { useEffect, useState } from "react";
import { CalendarDays, Check, Copy, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BookingAvailability,
  BookingService,
  BookingSettings,
  DAY_NAMES,
  FULL_DAY_NAMES,
  PIX_KEY_TYPE_LABELS,
  deleteBookingService,
  fetchBookingAvailability,
  fetchBookingServices,
  fetchBookingSettings,
  formatBRL,
  generateSlug,
  upsertAvailability,
  upsertBookingService,
  upsertBookingSettings,
} from "@/lib/workspaceBookings";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_TIMES = { start_time: "08:00", end_time: "18:00" };

function ServiceForm({
  service,
  onSave,
  onCancel,
}: {
  service?: Partial<BookingService>;
  onSave: (s: Partial<BookingService> & { name: string; price_cents: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [desc, setDesc] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service ? String(service.price_cents! / 100) : "");
  const [duration, setDuration] = useState(String(service?.duration_min ?? 60));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    if (!name.trim() || isNaN(priceCents) || priceCents <= 0) return;
    setSaving(true);
    await onSave({ ...service, name: name.trim(), description: desc.trim() || null, price_cents: priceCents, duration_min: parseInt(duration) || 60 });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-[#166b50]/30 bg-[#f5f7f3] p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Nome do serviço</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Consulta inicial" required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor (R$)</Label>
          <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="150,00" required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duração (min)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[30, 45, 60, 90, 120].map(d => (
                <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Descrição (opcional)</Label>
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Primeira consulta, anamnese completa..." rows={2} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={saving} className="bg-[#166b50] hover:bg-[#145e45] text-white">
          {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

export function WorkspaceBookingSettingsTab({ workspaceId, workspaceName }: { workspaceId: string; workspaceName?: string }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Settings form
  const [slug, setSlug] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<string>("cpf");
  const [presentationName, setPresentationName] = useState("");
  const [bio, setBio] = useState("");
  const [active, setActive] = useState(false);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [minNoticeHours, setMinNoticeHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
  const [slotIntervalMin, setSlotIntervalMin] = useState(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, svcs, avail] = await Promise.all([
        fetchBookingSettings(workspaceId),
        fetchBookingServices(workspaceId),
        fetchBookingAvailability(workspaceId),
      ]);
      if (s) {
        setSettings(s);
        setSlug(s.slug);
        setPixKey(s.pix_key ?? "");
        setPixKeyType(s.pix_key_type ?? "cpf");
        setPresentationName(s.presentation_name ?? "");
        setBio(s.bio ?? "");
        setActive(s.active);
        setBufferMinutes(s.buffer_minutes ?? 0);
        setMinNoticeHours(s.min_notice_hours ?? 2);
        setMaxAdvanceDays(s.max_advance_days ?? 60);
        setSlotIntervalMin(s.slot_interval_min ?? 30);
      } else {
        const newSlug = generateSlug(workspaceName ?? "nutri");
        setSlug(newSlug);
      }
      setServices(svcs);
      setAvailability(avail);
      setLoading(false);
    }
    load();
  }, [workspaceId, workspaceName]);

  const bookingUrl = `${window.location.origin}/agendar/${slug}`;

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !pixKey.trim()) {
      toast({ title: "Preencha o link e a chave PIX", variant: "destructive" });
      return;
    }
    setSavingSettings(true);
    try {
      await upsertBookingSettings(workspaceId, {
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        pix_key: pixKey.trim(),
        pix_key_type: pixKeyType as BookingSettings["pix_key_type"],
        presentation_name: presentationName.trim() || null,
        bio: bio.trim() || null,
        active,
        buffer_minutes: bufferMinutes,
        min_notice_hours: minNoticeHours,
        max_advance_days: maxAdvanceDays,
        slot_interval_min: slotIntervalMin,
      });
      toast({ title: "Configurações salvas!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleServiceSave(s: Partial<BookingService> & { name: string; price_cents: number }) {
    await upsertBookingService(workspaceId, s);
    setServices(await fetchBookingServices(workspaceId));
    setAddingService(false);
    setEditingServiceId(null);
    toast({ title: "Serviço salvo!" });
  }

  async function handleDeleteService(id: string) {
    if (!confirm("Remover este serviço?")) return;
    await deleteBookingService(id, workspaceId);
    setServices(prev => prev.filter(s => s.id !== id));
  }

  async function handleAvailabilityToggle(day: number, currentActive: boolean) {
    const existing = availability.find(a => a.day_of_week === day);
    const start = existing?.start_time ?? DEFAULT_TIMES.start_time;
    const end = existing?.end_time ?? DEFAULT_TIMES.end_time;
    await upsertAvailability(workspaceId, day, start, end, !currentActive);
    const updated = await fetchBookingAvailability(workspaceId);
    setAvailability(updated);
  }

  async function handleAvailabilityTime(day: number, field: "start_time" | "end_time", value: string) {
    const existing = availability.find(a => a.day_of_week === day);
    const start = field === "start_time" ? value : (existing?.start_time ?? DEFAULT_TIMES.start_time);
    const end = field === "end_time" ? value : (existing?.end_time ?? DEFAULT_TIMES.end_time);
    await upsertAvailability(workspaceId, day, start, end, existing?.active ?? false);
    const updated = await fetchBookingAvailability(workspaceId);
    setAvailability(updated);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#e6f1eb] p-2">
          <CalendarDays size={18} className="text-[#166b50]" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Agendamento online</h2>
          <p className="text-sm text-muted-foreground">Seus clientes agendam e pagam sem depender de você</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
          <Switch checked={active} onCheckedChange={v => setActive(v)} />
        </div>
      </div>

      {/* Settings form */}
      <form onSubmit={handleSaveSettings} className="space-y-5 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Configurações gerais</h3>

        {/* Link público */}
        <div className="space-y-1.5">
          <Label className="text-xs">Seu link de agendamento</Label>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center rounded-lg border border-border bg-muted/40 overflow-hidden">
              <span className="px-3 text-xs text-muted-foreground whitespace-nowrap">{window.location.origin}/agendar/</span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none font-mono"
                placeholder="seu-nome"
              />
            </div>
            <Button type="button" variant="outline" size="icon"
              onClick={() => { navigator.clipboard.writeText(bookingUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            </Button>
            <Button type="button" variant="outline" size="icon" asChild>
              <a href={bookingUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>
            </Button>
          </div>
        </div>

        {/* PIX */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo da chave PIX</Label>
            <Select value={pixKeyType} onValueChange={setPixKeyType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PIX_KEY_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Chave PIX (recebe 95% de cada agendamento)</Label>
            <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="sua@chave.pix" required />
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <strong>Taxa da plataforma:</strong> 5% por agendamento. 95% cai automaticamente no seu PIX após confirmação do pagamento.
        </div>

        {/* Regras de agendamento */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Regras de agendamento</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Intervalo entre horários</Label>
              <Select value={String(slotIntervalMin)} onValueChange={v => setSlotIntervalMin(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Passo entre opções no calendário.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pausa entre consultas</Label>
              <Select value={String(bufferMinutes)} onValueChange={v => setBufferMinutes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem pausa</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Bloqueio após cada consulta.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Antecedência mínima</Label>
              <Select value={String(minNoticeHours)} onValueChange={v => setMinNoticeHours(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem mínimo</SelectItem>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Mínimo antes do horário.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Janela de agendamento</Label>
              <Select value={String(maxAdvanceDays)} onValueChange={v => setMaxAdvanceDays(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Até quando aceitar agendamentos.</p>
            </div>
          </div>
        </div>

        {/* Perfil público */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome exibido na página</Label>
            <Input value={presentationName} onChange={e => setPresentationName(e.target.value)} placeholder="Dra. Ana Silva — Nutricionista" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Mini bio (opcional)</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Nutricionista clínica e esportiva, 10 anos de experiência..." rows={2} />
          </div>
        </div>

        <Button type="submit" disabled={savingSettings} className="bg-[#166b50] hover:bg-[#145e45] text-white">
          {savingSettings ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
          Salvar configurações
        </Button>
      </form>

      {/* Services */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Tipos de consulta</h3>
          <Button size="sm" variant="outline" onClick={() => setAddingService(true)} disabled={addingService}>
            <Plus size={14} className="mr-1" /> Adicionar
          </Button>
        </div>

        {addingService && (
          <ServiceForm onSave={handleServiceSave} onCancel={() => setAddingService(false)} />
        )}

        {services.length === 0 && !addingService && (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum serviço ainda. Adicione ao menos um para ativar o agendamento.</p>
        )}

        <div className="space-y-2">
          {services.map(svc =>
            editingServiceId === svc.id ? (
              <ServiceForm key={svc.id} service={svc} onSave={handleServiceSave} onCancel={() => setEditingServiceId(null)} />
            ) : (
              <div key={svc.id} className={cn("flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3", !svc.active && "opacity-50")}>
                <div>
                  <p className="text-sm font-medium">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBRL(svc.price_cents)} · {svc.duration_min} min
                    {svc.description && ` · ${svc.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingServiceId(svc.id)}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteService(svc.id)}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Disponibilidade semanal</h3>
        <div className="rounded-xl border border-border bg-card divide-y overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 0].map(day => {
            const avail = availability.find(a => a.day_of_week === day);
            const isActive = avail?.active ?? false;
            return (
              <div key={day} className="flex items-center gap-4 px-4 py-3">
                <Switch checked={isActive} onCheckedChange={() => handleAvailabilityToggle(day, isActive)} />
                <span className="w-16 text-sm font-medium">{FULL_DAY_NAMES[day]}</span>
                {isActive ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" value={avail?.start_time?.slice(0, 5) ?? DEFAULT_TIMES.start_time}
                      onChange={e => handleAvailabilityTime(day, "start_time", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm bg-background" />
                    <span className="text-muted-foreground">até</span>
                    <input type="time" value={avail?.end_time?.slice(0, 5) ?? DEFAULT_TIMES.end_time}
                      onChange={e => handleAvailabilityTime(day, "end_time", e.target.value)}
                      className="rounded border border-border px-2 py-1 text-sm bg-background" />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Indisponível</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
