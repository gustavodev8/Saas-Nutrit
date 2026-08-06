import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PatientPortalDisabledState from "@/components/patient/PatientPortalDisabledState";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import { usePatientPortalSettings } from "@/contexts/usePatientPortalSettings";
import { fetchPortalBookings } from "@/lib/patientPortalApi";
import type { Booking } from "@/lib/supabase";
import { formatPortalDateTime, formatPortalStatus, isFuturePortalDate } from "@/pages/portal/portalUtils";

function BookingList({
  title,
  description,
  items,
  showAppointmentType,
  showPaymentStatus,
}: {
  title: string;
  description: string;
  items: Booking[];
  showAppointmentType: boolean;
  showPaymentStatus: boolean;
}) {
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
            <div
              key={booking.id ?? `${booking.booking_group_id}-${booking.session_number}`}
              className="rounded-2xl border border-border/60 bg-muted/20 p-4"
            >
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

              {showAppointmentType || showPaymentStatus ? (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {showAppointmentType ? (
                    <span className="inline-flex items-center gap-1">
                      <Video size={14} />
                      {booking.type === "online" ? "Online" : "Presencial"}
                    </span>
                  ) : null}

                  {showPaymentStatus ? (
                    <span className="inline-flex items-center gap-1">
                      <CreditCard size={14} />
                      Pagamento: {booking.payment_status ?? "pendente"}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function PatientPortalConsultas() {
  const { patient } = usePatientPortalAuth();
  const { settings } = usePatientPortalSettings();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!patient?.id) {
      return;
    }

    setLoading(true);
    fetchPortalBookings(patient.id, patient.email ?? null)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [patient?.email, patient?.id]);

  const upcoming = useMemo(
    () => bookings.filter((booking) => isFuturePortalDate(booking.appointment_date)),
    [bookings],
  );
  const history = useMemo(
    () => bookings.filter((booking) => !isFuturePortalDate(booking.appointment_date)).reverse(),
    [bookings],
  );

  if (!settings.navigation.consultations) {
    return (
      <PatientPortalDisabledState
        title="Consultas temporariamente ocultas"
        description="A agenda foi retirada da navegacao pelo responsavel do portal."
      />
    );
  }

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

      {settings.consultations.upcoming || settings.consultations.history ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {settings.consultations.upcoming ? (
            <BookingList
              title="Proximas consultas"
              description="Compromissos futuros registrados no sistema."
              items={upcoming}
              showAppointmentType={settings.consultations.appointmentType}
              showPaymentStatus={settings.consultations.paymentStatus}
            />
          ) : null}

          {settings.consultations.history ? (
            <BookingList
              title="Historico"
              description="Atendimentos ja realizados ou encerrados."
              items={history}
              showAppointmentType={settings.consultations.appointmentType}
              showPaymentStatus={settings.consultations.paymentStatus}
            />
          ) : null}
        </div>
      ) : null}

      {!loading && !settings.consultations.upcoming && !settings.consultations.history ? (
        <Card className="rounded-3xl border-dashed border-border/80">
          <CardContent className="p-6 text-sm text-muted-foreground">
            O modulo esta ativo, mas os blocos de agenda e historico foram ocultados pelo admin.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
