import { useMemo } from "react";
import type { Booking } from "@/lib/supabase";
import { toLocalISO } from "./bookingDateUtils";
import {
  bookingGroupNeedsNextReturn,
  isBookingGroupComplete,
  type FilterTab,
} from "./bookingStatusUtils";

interface UseBookingGroupsParams {
  bookings: Booking[];
  detail: string | null;
  filter: FilterTab;
  search: string;
  filterType: "all" | "online" | "presencial";
  filterDateFrom: string;
  filterDateTo: string;
  filterPlan: string;
}

export function getBookingGroupsData({
  bookings,
  detail,
  filter,
  search,
  filterType,
  filterDateFrom,
  filterDateTo,
  filterPlan,
  adminTodayISO,
}: UseBookingGroupsParams & { adminTodayISO: string }) {
  const allGrouped: Record<string, Booking[]> = {};
  bookings.forEach(booking => {
    if (!allGrouped[booking.booking_group_id]) allGrouped[booking.booking_group_id] = [];
    allGrouped[booking.booking_group_id].push(booking);
  });

  const groupedSessions = Object.values(allGrouped);
  const counts: Record<FilterTab, number> = {
    all: groupedSessions.length,
    today: groupedSessions.filter(sessions =>
      sessions.some(booking =>
        booking.appointment_date === adminTodayISO &&
        !["cancelled", "completed", "no_show"].includes(booking.status || "")
      )
    ).length,
    confirmed: groupedSessions.filter(sessions => !isBookingGroupComplete(sessions) && sessions.some(booking => booking.status === "confirmed")).length,
    pending: groupedSessions.filter(sessions => !isBookingGroupComplete(sessions) && sessions.some(booking => booking.status === "pending")).length,
    retornos: groupedSessions.filter(sessions =>
      !isBookingGroupComplete(sessions) &&
      (bookingGroupNeedsNextReturn(sessions) || sessions.some(booking => (booking.session_number ?? 1) > 1 && booking.status === "confirmed"))
    ).length,
    completed: groupedSessions.filter(sessions => isBookingGroupComplete(sessions)).length,
    no_show: groupedSessions.filter(sessions => !isBookingGroupComplete(sessions) && sessions.some(booking => booking.status === "no_show")).length,
    cancelled: groupedSessions.filter(sessions => sessions.every(booking => booking.status === "cancelled")).length,
  };

  const filteredGroupIds = Object.entries(allGrouped)
    .filter(([, sessions]) => {
      const complete = isBookingGroupComplete(sessions);
      if (filter === "all") return true;
      if (filter === "today") {
        return sessions.some(booking =>
          booking.appointment_date === adminTodayISO &&
          !["cancelled", "completed", "no_show"].includes(booking.status || "")
        );
      }
      if (filter === "completed") return complete;
      if (complete) return false;
      if (filter === "cancelled") return sessions.every(booking => booking.status === "cancelled");
      if (filter === "retornos") {
        return bookingGroupNeedsNextReturn(sessions) || sessions.some(booking => (booking.session_number ?? 1) > 1 && booking.status === "confirmed");
      }
      return sessions.some(booking => booking.status === filter);
    })
    .map(([id]) => id);

  const groups: Record<string, Booking[]> = {};
  filteredGroupIds.forEach(id => { groups[id] = allGrouped[id]; });

  const query = search.trim().toLowerCase();

  const groupEntries = Object.entries(groups)
    .filter(([, sessions]) => {
      const first = sessions[0];
      const latest = [...sessions].sort((a, b) => (b.session_number ?? 0) - (a.session_number ?? 0))[0];
      if (query) {
        if (!first.client_name?.toLowerCase().includes(query) &&
            !first.plan_name?.toLowerCase().includes(query) &&
            !first.client_email?.toLowerCase().includes(query)) return false;
      }
      if (filterType !== "all" && !sessions.some(session => session.type === filterType)) return false;
      if (filterDateFrom && latest.appointment_date < filterDateFrom) return false;
      if (filterDateTo && latest.appointment_date > filterDateTo) return false;
      if (filterPlan && first.plan_name !== filterPlan) return false;
      return true;
    })
    .sort(([, a], [, b]) => {
      const latestA = [...a].sort((x, y) => (y.session_number ?? 0) - (x.session_number ?? 0))[0];
      const latestB = [...b].sort((x, y) => (y.session_number ?? 0) - (x.session_number ?? 0))[0];
      return new Date(latestB.appointment_date).getTime() - new Date(latestA.appointment_date).getTime();
    });

  const detailGroup = detail ? (allGrouped[detail] || []).sort((a, b) => a.session_number - b.session_number) : [];

  const upcomingReturnSessions = Object.entries(allGrouped)
    .flatMap(([groupId, sessions]) => {
      const first = sessions[0];
      return sessions
        .filter(session => (session.session_number ?? 1) > 1 && session.status === "confirmed")
        .map(session => ({ groupId, first, session }));
    })
    .sort((a, b) => {
      const dateDiff = a.session.appointment_date.localeCompare(b.session.appointment_date);
      if (dateDiff !== 0) return dateDiff;
      return (a.session.appointment_time || "").localeCompare(b.session.appointment_time || "");
    });

  const todaySessions = Object.entries(allGrouped)
    .flatMap(([groupId, sessions]) => {
      const first = sessions[0];
      return sessions
        .filter(session =>
          session.appointment_date === adminTodayISO &&
          !["cancelled", "completed", "no_show"].includes(session.status || "")
        )
        .map(session => ({ groupId, first, session }));
    })
    .sort((a, b) => (a.session.appointment_time || "").localeCompare(b.session.appointment_time || ""));

  return {
    adminTodayISO,
    allGrouped,
    counts,
    groupEntries,
    detailGroup,
    detailFirst: detailGroup[0],
    upcomingReturnSessions,
    todaySessions,
  };
}

export const useBookingGroups = ({
  bookings,
  detail,
  filter,
  search,
  filterType,
  filterDateFrom,
  filterDateTo,
  filterPlan,
}: UseBookingGroupsParams) => {
  const adminTodayISO = useMemo(() => toLocalISO(new Date()), []);

  return useMemo(() => getBookingGroupsData({
    bookings,
    detail,
    filter,
    search,
    filterType,
    filterDateFrom,
    filterDateTo,
    filterPlan,
    adminTodayISO,
  }), [adminTodayISO, bookings, detail, filter, filterDateFrom, filterDateTo, filterPlan, filterType, search]);
};
