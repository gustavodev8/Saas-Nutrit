import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookingService,
  BookingSettings,
  FULL_DAY_NAMES,
  fetchBookedSlots,
  fetchPublicAvailability,
  fetchPublicBlockedDates,
  fetchPublicBookingSettings,
  fetchPublicServices,
  formatBRL,
  generateTimeSlots,
  type BookingSlot,
  type BookingAvailability,
} from "@/lib/workspaceBookings";
import { cn } from "@/lib/utils";
import { parseISODate, toISODate } from "@/lib/bookingDates";
import { buildICS, googleCalendarUrl } from "@/lib/icsBooking";
import { buildMonthGrid, canGoNextMonth, canGoPrevMonth, findNextAvailableDate } from "@/lib/bookingCalendar";

type Step = "service" | "datetime" | "info" | "payment" | "success";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function WorkspacePublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());
  const [autoPick, setAutoPick] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Payment state
  const [paymentId, setPaymentId] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [qrBase64, setQrBase64] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    async function load() {
      const s = await fetchPublicBookingSettings(slug!);
      if (!s) { setNotFound(true); setLoading(false); return; }
      setSettings(s);
      const [svcs, avail, blocked] = await Promise.all([
        fetchPublicServices(s.workspace_id),
        fetchPublicAvailability(s.workspace_id),
        fetchPublicBlockedDates(s.workspace_id),
      ]);
      setServices(svcs);
      setAvailability(avail);
      setBlockedDates(new Set(blocked));
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedTime("");
    setLoadingSlots(true);
    const booked = await fetchBookedSlots(settings!.workspace_id, date);
    const dow = new Date(date + "T12:00:00").getDay();
    const avail = availability.find(a => a.day_of_week === dow);
    if (!avail) { setSlots([]); setLoadingSlots(false); return; }
    const generated = generateTimeSlots(
      date,
      avail.start_time.slice(0, 5),
      avail.end_time.slice(0, 5),
      selectedService!.duration_min,
      booked,
      {
        bufferMin: settings!.buffer_minutes ?? 0,
        minNoticeMin: (settings!.min_notice_hours ?? 2) * 60,
        slotIntervalMin: settings!.slot_interval_min ?? selectedService!.duration_min,
      },
    );
    setSlots(generated);
    setLoadingSlots(false);
  }

  async function handleSubmitInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const supabaseUrl = (import.meta.env as Record<string, string>).VITE_SUPABASE_URL;
      const anonKey = (import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-workspace-booking-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${anonKey}`, "apikey": anonKey },
        body: JSON.stringify({
          workspace_id: settings!.workspace_id,
          service_id: selectedService!.id,
          booking_date: selectedDate,
          booking_time: selectedTime,
          patient_name: name.trim(),
          patient_email: email.trim().toLowerCase(),
          patient_phone: phone.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Erro ao criar pagamento. Tente novamente.");
        setSubmitting(false);
        return;
      }
      setPaymentId(json.payment_id);
      setQrCode(json.qr_code);
      setQrBase64(json.qr_code_base64);
      setBookingId(json.booking_id);
      setStep("payment");
      startPolling(json.payment_id);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function startPolling(pid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const supabaseUrl = (import.meta.env as Record<string, string>).VITE_SUPABASE_URL;
        const anonKey = (import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY;
        const res = await fetch(
          `${supabaseUrl}/rest/v1/workspace_bookings?mp_payment_id=eq.${pid}&select=status&limit=1`,
          { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
        );
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.status === "paid") {
          clearInterval(pollRef.current!);
          setStep("success");
        }
      } catch { /* ignore */ }
    }, 4000);
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Auto-seleção do primeiro horário livre após o atalho "Primeira data disponível"
  useEffect(() => {
    if (!autoPick || loadingSlots || !selectedDate) return;
    const firstFree = slots.find(s => s.available);
    if (firstFree) setSelectedTime(firstFree.time);
    setAutoPick(false);
  }, [autoPick, loadingSlots, slots, selectedDate]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 size={24} className="animate-spin text-[#166b50]" />
    </div>
  );

  if (notFound) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="rounded-full bg-muted p-5"><CalendarDays size={28} className="text-muted-foreground" /></div>
      <h1 className="text-xl font-semibold">Link não encontrado</h1>
      <p className="text-sm text-muted-foreground">Verifique se o link está correto ou entre em contato com o nutricionista.</p>
    </div>
  );

  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const maxDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + (settings?.max_advance_days ?? 60));
  const activeDows = new Set(availability.filter(a => a.active).map(a => a.day_of_week));
  const monthGrid = buildMonthGrid({ year: viewYear, month: viewMonth, activeDows, blocked: blockedDates, minDate, maxDate });
  const prevEnabled = canGoPrevMonth(viewYear, viewMonth, minDate);
  const nextEnabled = canGoNextMonth(viewYear, viewMonth, maxDate);
  const nextDate = findNextAvailableDate(minDate, maxDate, activeDows, blockedDates);

  function jumpToNextAvailable() {
    if (!nextDate) return;
    const d = parseISODate(nextDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setAutoPick(true);
    handleDateSelect(nextDate);
  }

  function goToMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  return (
    <div className="min-h-screen bg-[#e8ede5]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-xl px-4 py-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1eb]">
            <span className="text-lg">🌿</span>
          </div>
          <div>
            <h1 className="font-bold text-foreground leading-tight">
              {settings?.presentation_name ?? "Nutricionista"}
            </h1>
            {settings?.bio && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{settings.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
        {/* Steps indicator */}
        <div className="flex flex-wrap items-center gap-2 gap-y-1 text-xs text-muted-foreground">
          {["Serviço", "Data e hora", "Seus dados", "Pagamento"].map((s, i) => {
            const stepKeys: Step[] = ["service", "datetime", "info", "payment"];
            const done = stepKeys.indexOf(step) > i || step === "success";
            const current = stepKeys[i] === step;
            return (
              <span key={s} className={cn("flex items-center gap-1", current && "text-[#166b50] font-medium", done && !current && "text-muted-foreground/60")}>
                {done && !current ? <Check size={12} className="text-[#166b50]" /> : <span className="w-3 text-center">{i + 1}.</span>}
                {s}
                {i < 3 && <span className="text-muted-foreground/40 ml-1">›</span>}
              </span>
            );
          })}
        </div>

        {/* ── Step: service ── */}
        {step === "service" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Escolha o tipo de consulta</h2>
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum serviço disponível no momento.</p>
            )}
            {services.map(svc => (
              <button
                key={svc.id}
                type="button"
                onClick={() => { setSelectedService(svc); setStep("datetime"); }}
                className="w-full text-left rounded-2xl border border-border bg-white p-4 hover:border-[#166b50]/60 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-[#166b50] transition-colors">{svc.name}</p>
                    {svc.description && <p className="text-sm text-muted-foreground mt-0.5">{svc.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock size={11} />{svc.duration_min} min
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-[#166b50] text-lg">{formatBRL(svc.price_cents)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step: datetime ── */}
        {step === "datetime" && selectedService && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep("service")} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-semibold text-foreground">Escolha a data e horário</h2>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4 text-sm">
              <span className="font-medium">{selectedService.name}</span>
              <span className="text-muted-foreground ml-2">· {formatBRL(selectedService.price_cents)} · {selectedService.duration_min} min</span>
            </div>

            {/* Atalho: primeira data disponível */}
            {!selectedDate && nextDate && (
              <div>
                <button
                  type="button"
                  onClick={jumpToNextAvailable}
                  className="inline-flex items-center gap-1 rounded-full bg-[#e6f1eb] text-[#166b50] text-xs font-medium px-3 py-1.5 hover:bg-[#d5e9de] transition-colors"
                >
                  ⚡ Primeira data disponível: {formatDateBR(nextDate).slice(0, 5)}
                </button>
              </div>
            )}

            {/* Calendar */}
            <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToMonth(-1)}
                  disabled={!prevEnabled}
                  aria-label="Mês anterior"
                  className="rounded-xl p-2 text-foreground hover:bg-[#e6f1eb] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-sm font-semibold text-foreground">
                  {MONTHS[viewMonth]} {viewYear}
                </p>
                <button
                  type="button"
                  onClick={() => goToMonth(1)}
                  disabled={!nextEnabled}
                  aria-label="Próximo mês"
                  className="rounded-xl p-2 text-foreground hover:bg-[#e6f1eb] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["D","S","T","Q","Q","S","S"].map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
                ))}
                {monthGrid.map(day => {
                  const isSelected = selectedDate === day.iso;
                  if (!day.selectable) {
                    return (
                      <div
                        key={day.iso}
                        aria-disabled="true"
                        className={cn(
                          "min-h-[44px] flex items-center justify-center rounded-xl text-center text-sm font-medium",
                          day.inMonth ? "text-muted-foreground/35" : "text-transparent",
                        )}
                      >
                        {day.date.getDate()}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => handleDateSelect(day.iso)}
                      className={cn(
                        "min-h-[44px] flex items-center justify-center rounded-xl text-sm font-medium transition-all",
                        isSelected
                          ? "bg-[#166b50] text-white shadow-sm"
                          : "text-foreground hover:bg-[#e6f1eb] hover:text-[#166b50]",
                      )}
                    >
                      {day.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{formatDateBR(selectedDate)} — Horários disponíveis</p>
                {loadingSlots ? (
                  <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum horário disponível nesta data.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "min-h-[44px] rounded-xl border py-2.5 text-sm font-medium transition-all",
                          !slot.available && "opacity-30 cursor-not-allowed bg-muted",
                          slot.available && selectedTime === slot.time && "bg-[#166b50] text-white border-[#166b50] shadow-sm",
                          slot.available && selectedTime !== slot.time && "border-border bg-white hover:border-[#166b50]/50 hover:bg-[#e6f1eb]/50",
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDate && selectedTime && (
              <Button
                onClick={() => setStep("info")}
                className="w-full bg-[#166b50] hover:bg-[#145e45] text-white py-6 rounded-2xl text-base"
              >
                Continuar · {formatDateBR(selectedDate).slice(0, 5)} às {selectedTime}
              </Button>
            )}
          </div>
        )}

        {/* ── Step: info ── */}
        {step === "info" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep("datetime")} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-semibold text-foreground">Seus dados</h2>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4 space-y-1 text-sm">
              <p className="font-medium">{selectedService?.name}</p>
              <p className="text-muted-foreground">
                {formatDateBR(selectedDate)} às {selectedTime} · {selectedService && formatBRL(selectedService.price_cents)}
              </p>
            </div>

            <form onSubmit={handleSubmitInfo} className="space-y-4">
              <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Nome completo</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">E-mail</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Telefone / WhatsApp <span className="text-muted-foreground">(recomendado)</span></Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="rounded-xl" />
                  <p className="text-[11px] text-muted-foreground">Usamos para confirmar e lembrar da sua consulta.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 px-1">
                <Checkbox
                  id="consent-lgpd"
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                  className="mt-0.5 border-[#166b50] data-[state=checked]:bg-[#166b50] data-[state=checked]:border-[#166b50]"
                />
                <Label htmlFor="consent-lgpd" className="text-xs text-muted-foreground font-normal leading-relaxed cursor-pointer">
                  Li e concordo com o uso dos meus dados para agendamento e contato, conforme a LGPD.
                </Label>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button
                type="submit"
                disabled={submitting || !consent}
                className="w-full bg-[#166b50] hover:bg-[#145e45] text-white py-6 rounded-2xl text-base"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin mr-2" />Aguarde...</> : `Pagar ${selectedService && formatBRL(selectedService.price_cents)}`}
              </Button>
            </form>
          </div>
        )}

        {/* ── Step: payment ── */}
        {step === "payment" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Pagamento via PIX</h2>

            <div className="rounded-2xl border border-border bg-white p-4 space-y-1 text-sm">
              <p className="font-medium">{selectedService?.name}</p>
              <p className="text-muted-foreground">
                {formatDateBR(selectedDate)} às {selectedTime} · {selectedService && formatBRL(selectedService.price_cents)}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 flex flex-col items-center gap-4">
              {qrBase64 ? (
                <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code PIX" className="w-52 h-52 rounded-xl" />
              ) : (
                <div className="w-52 h-52 rounded-xl bg-muted flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">Escaneie o QR Code com seu app do banco</p>

              {qrCode && (
                <div className="w-full space-y-2">
                  <p className="text-xs text-muted-foreground text-center">ou copie o código PIX:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-mono break-all">
                      {qrCode.slice(0, 60)}…
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl shrink-0"
                      onClick={() => { navigator.clipboard.writeText(qrCode); }}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            </div>
          </div>
        )}

        {/* ── Step: success ── */}
        {step === "success" && (
          <div className="rounded-2xl border border-green-200 bg-white p-8 flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-green-100 p-4">
              <Check size={28} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Agendamento confirmado!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Sua consulta foi agendada com sucesso. Um e-mail de confirmação foi enviado para <strong>{email}</strong>.
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 px-6 py-4 w-full text-sm space-y-1">
              <p><span className="text-muted-foreground">Serviço:</span> <strong>{selectedService?.name}</strong></p>
              <p><span className="text-muted-foreground">Data:</span> <strong>{formatDateBR(selectedDate)}</strong></p>
              <p><span className="text-muted-foreground">Horário:</span> <strong>{selectedTime}</strong></p>
            </div>
            {selectedService && selectedDate && selectedTime && (() => {
              const startDate = (() => { const d = parseISODate(selectedDate); const [h, m] = selectedTime.split(":").map(Number); d.setHours(h, m, 0, 0); return d; })();
              const calEvent = { title: `${selectedService.name ?? "Consulta"}${settings?.presentation_name ? " — " + settings.presentation_name : ""}`, description: "Agendamento confirmado.", start: startDate, durationMin: selectedService.duration_min ?? 60 };
              return (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={googleCalendarUrl(calEvent)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#166b50] px-4 py-2 text-sm font-medium text-[#166b50] hover:bg-[#e6f1eb]/50 transition-colors"
                  >
                    <CalendarDays size={16} />
                    Adicionar ao Google Agenda
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([buildICS(calEvent)], { type: "text/calendar" });
                      const objectUrl = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = objectUrl;
                      link.download = "agendamento.ics";
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#166b50] px-4 py-2 text-sm font-medium text-[#166b50] hover:bg-[#e6f1eb]/50 transition-colors"
                  >
                    <Clock size={16} />
                    Baixar .ics
                  </button>
                </div>
              );
            })()}
            <p className="text-xs text-muted-foreground">Em breve o profissional entrará em contato para confirmar os detalhes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
