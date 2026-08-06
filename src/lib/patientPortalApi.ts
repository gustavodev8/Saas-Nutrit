import { patientPortalSupabase } from "@/lib/patientPortalSupabase";
import type {
  Booking,
  ConsultationRecord,
  Meal,
  MealPlan,
  Measurement,
  Patient,
  PatientExamRequest,
  PatientReport,
} from "@/lib/supabase";

export async function fetchCurrentPortalPatient(): Promise<Patient | null> {
  const {
    data: { session },
  } = await patientPortalSupabase.auth.getSession();

  if (!session?.user?.id) {
    return null;
  }

  const { data, error } = await patientPortalSupabase
    .from("patients")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[PatientPortal] fetchCurrentPortalPatient:", error.message);
    return null;
  }

  return data ?? null;
}

export async function fetchPortalMealPlans(patientId: number): Promise<MealPlan[]> {
  const { data, error } = await patientPortalSupabase
    .from("meal_plans")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PatientPortal] fetchPortalMealPlans:", error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchPortalFullMealPlan(planId: number): Promise<Meal[]> {
  const { data: meals, error: mealError } = await patientPortalSupabase
    .from("meals")
    .select("*")
    .eq("plan_id", planId)
    .order("meal_order", { ascending: true })
    .order("id", { ascending: true });

  if (mealError || !meals?.length) {
    if (mealError) {
      console.error("[PatientPortal] fetchPortalFullMealPlan meals:", mealError.message);
    }
    return [];
  }

  const mealIds = meals
    .map((meal) => meal.id)
    .filter((id): id is number => typeof id === "number");

  let foodsByMealId = new Map<number, Array<Meal["foods"] extends Array<infer T> ? T : never>>();

  if (mealIds.length > 0) {
    const { data: foods, error: foodsError } = await patientPortalSupabase
      .from("meal_foods")
      .select("*")
      .in("meal_id", mealIds)
      .order("food_order", { ascending: true })
      .order("id", { ascending: true });

    if (foodsError) {
      console.error("[PatientPortal] fetchPortalFullMealPlan foods:", foodsError.message);
    } else {
      foodsByMealId = (foods ?? []).reduce((map, food) => {
        const current = map.get(food.meal_id) ?? [];
        current.push(food);
        map.set(food.meal_id, current);
        return map;
      }, new Map<number, Array<Meal["foods"] extends Array<infer T> ? T : never>>());
    }
  }

  return meals.map((meal) => ({
    ...meal,
    foods: meal.id ? foodsByMealId.get(meal.id) ?? [] : [],
  }));
}

export async function fetchPortalMeasurements(patientId: number): Promise<Measurement[]> {
  const { data, error } = await patientPortalSupabase
    .from("measurements")
    .select("*")
    .eq("patient_id", patientId)
    .order("assessment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PatientPortal] fetchPortalMeasurements:", error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchPortalPatientReports(patientId: number): Promise<PatientReport[]> {
  const { data, error } = await patientPortalSupabase
    .from("patient_reports")
    .select("*")
    .eq("patient_id", patientId)
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PatientPortal] fetchPortalPatientReports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchPortalExamRequests(patientId: number): Promise<PatientExamRequest[]> {
  const { data, error } = await patientPortalSupabase
    .from("patient_exam_requests")
    .select(`
      *,
      protocol:global_exam_protocols(id, name),
      items:patient_exam_request_items(*)
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PatientPortal] fetchPortalExamRequests:", error.message);
    return [];
  }

  return (data ?? []).map((request) => ({
    ...request,
    items: request.items ?? [],
  }));
}

export async function fetchPortalBookings(
  patientId?: number | null,
  email?: string | null,
): Promise<Booking[]> {
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  const bookingMap = new Map<number, Booking>();

  if (patientId) {
    const { data, error } = await patientPortalSupabase
      .from("bookings")
      .select("*")
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("[PatientPortal] fetchPortalBookings by patient:", error.message);
    } else {
      (data ?? []).forEach((booking) => {
        if (booking.id != null) {
          bookingMap.set(booking.id, booking);
        }
      });
    }
  }

  if (normalizedEmail) {
    const { data, error } = await patientPortalSupabase
      .from("bookings")
      .select("*")
      .ilike("client_email", normalizedEmail)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("[PatientPortal] fetchPortalBookings by email:", error.message);
    } else {
      (data ?? []).forEach((booking) => {
        if (booking.id != null) {
          bookingMap.set(booking.id, booking);
        }
      });
    }
  }

  return Array.from(bookingMap.values()).sort((a, b) => {
    const left = `${a.appointment_date}T${a.appointment_time}`;
    const right = `${b.appointment_date}T${b.appointment_time}`;
    return left.localeCompare(right);
  });
}

export async function fetchPortalConsultationRecords(
  patientId?: number | null,
  email?: string | null,
): Promise<ConsultationRecord[]> {
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  const recordMap = new Map<string, ConsultationRecord>();
  const portalBookings = await fetchPortalBookings(patientId, normalizedEmail);
  const bookingGroupIds = Array.from(
    new Set(
      portalBookings
        .map((booking) => booking.booking_group_id)
        .filter((bookingGroupId): bookingGroupId is string => Boolean(bookingGroupId)),
    ),
  );

  if (bookingGroupIds.length > 0) {
    const { data, error } = await patientPortalSupabase
      .from("consultation_records")
      .select("*")
      .in("booking_group_id", bookingGroupIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PatientPortal] fetchPortalConsultationRecords by groups:", error.message);
    } else {
      (data ?? []).forEach((record) => {
        recordMap.set(String(record.id ?? `${record.booking_group_id}-${record.created_at}`), record);
      });
    }
  }

  if (normalizedEmail) {
    const { data, error } = await patientPortalSupabase
      .from("consultation_records")
      .select("*")
      .ilike("client_email", normalizedEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PatientPortal] fetchPortalConsultationRecords by email:", error.message);
    } else {
      (data ?? []).forEach((record) => {
        recordMap.set(String(record.id ?? `${record.booking_group_id}-${record.created_at}`), record);
      });
    }
  }

  return Array.from(recordMap.values()).sort((left, right) =>
    (right.created_at ?? "").localeCompare(left.created_at ?? ""),
  );
}
