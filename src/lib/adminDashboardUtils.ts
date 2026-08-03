import type { Booking, Patient } from "@/lib/supabase";

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const formatShortDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

export const isActiveBooking = (booking: Booking) =>
  booking.status !== "cancelled" && booking.status !== "no_show";

export const parseBookingDateTime = (booking: Booking) =>
  new Date(`${booking.appointment_date}T${booking.appointment_time || "00:00"}`);

export interface AdminDashboardData {
  todayBookings: Booking[];
  nextBookings: Booking[];
  pendingPayments: Booking[];
  completedThisMonth: Booking[];
  recentPatients: Patient[];
}

export function buildAdminDashboardData(
  bookings: Booking[],
  patients: Patient[],
  now = new Date(),
): AdminDashboardData {
  const today = now.toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const activeBookings = bookings.filter(isActiveBooking);
  const todayBookings = activeBookings
    .filter((booking) => booking.appointment_date === today)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  const upcomingBookings = activeBookings
    .filter((booking) => parseBookingDateTime(booking) >= now)
    .sort((a, b) => parseBookingDateTime(a).getTime() - parseBookingDateTime(b).getTime());

  const pendingPayments = activeBookings.filter(
    (booking) => booking.payment_status === "pending" && booking.status !== "completed",
  );

  const completedThisMonth = activeBookings.filter(
    (booking) =>
      booking.status === "completed" && booking.appointment_date.slice(0, 7) === thisMonth,
  );

  const recentPatients = [...patients]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 5);

  return {
    todayBookings,
    nextBookings: upcomingBookings.slice(0, 5),
    pendingPayments,
    completedThisMonth,
    recentPatients,
  };
}
