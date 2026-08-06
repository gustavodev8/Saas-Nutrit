import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import { fetchPortalBookings, type Booking } from "@/lib/supabase";
import { formatPortalDateTime, formatPortalStatus, isFuturePortalDate } from "@/pages/portal/portalUtils";

function BookingList({ title, description, items }: { title: string; description: string; items: Booking[] }) {
  return (
    <Card className="rounded-3xl border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma consulta nesta secao.</p>
        ) : (
          items.map((booking) => (
            <div key={booking.id ?? `${booking.booking_group_id}-${booking.session_number}`} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{booking.plan_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPortalDateTime(booking.appointment_date, booking.appointment_time)}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {formatPortalStatus(booking.status)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Video size={14} />
                  {booking.type === "online" ? "Online" : "Presencial"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CreditCard size={14} />
                  Pagamento: {booking.payment_status ?? "pendente"}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function PatientPortalConsultas() {
  const { patient, userEmail } = usePatientPortalAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!patient?.id) return;

    setLoading(true);
    fetchPortalBookings(patient.id, userEmail)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [patient?.id, userEmail]);

  const upcoming = useMemo(
    () => bookings.filter((booking) => isFuturePortalDate(booking.appointment_date)),
    [bookings],
  );
  const history = useMemo(
    () => bookings.filter((booking) => !isFuturePortalDate(booking.appointment_date)).reverse(),
    [bookings],
  );

  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Consultas</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Sua agenda com a clinica
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe consultas confirmadas, pendentes e seu historico recente.
        </p>
      </section>

      {loading ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <CalendarDays size={16} />
            Carregando consultas...
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <BookingList
          title="Proximas consultas"
          description="Compromissos futuros registrados no sistema."
          items={upcoming}
        />
        <BookingList
          title="Historico"
          description="Atendimentos ja realizados ou encerrados."
          items={history}
        />
      </div>
    </div>
  );
}
