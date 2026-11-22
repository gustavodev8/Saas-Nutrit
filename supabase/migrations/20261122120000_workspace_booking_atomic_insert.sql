-- Atomic check+insert for workspace bookings (closes the TOCTOU double-booking race).
-- The create-workspace-booking-payment edge function used to check for conflicts
-- and then INSERT in two separate requests, so two simultaneous requests could both
-- pass the check. This function runs the conflict check and the insert in one
-- transaction, serialized per workspace+day with a transaction-scoped advisory lock.
-- Raises 'BOOKING_CONFLICT' (SQLSTATE P0001) when the requested slot overlaps an
-- existing booking. Only service_role may execute it (the edge function uses the
-- service role key); RLS is bypassed by SECURITY DEFINER, so PUBLIC/anon/authenticated
-- execution is revoked explicitly.
-- Does not duplicate any existing object: no workspace_bookings insert/conflict RPC
-- exists in the candidate migrations (only public legacy `bookings` RPCs).

create or replace function public.create_workspace_booking_atomic(
  p_workspace_id uuid,
  p_service_id uuid,
  p_patient_name text,
  p_patient_email text,
  p_patient_phone text,
  p_booking_date date,
  p_booking_time time,
  p_service_duration_min int,
  p_total_amount_cents int,
  p_platform_fee_cents int,
  p_repasse_amount_cents int,
  p_pending_ttl_min int default 15
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_start int := extract(hour from p_booking_time)*60 + extract(minute from p_booking_time);
  v_new_end   int := v_new_start + p_service_duration_min;
  v_conflict  int;
  v_id uuid;
begin
  -- serializa concorrência por workspace+dia
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || p_booking_date::text, 0));

  select 1 into v_conflict
  from workspace_bookings b
  where b.workspace_id = p_workspace_id
    and b.booking_date = p_booking_date
    and (
      b.status in ('paid','confirmed','completed')
      or (b.status = 'pending_payment' and b.created_at > now() - make_interval(mins => p_pending_ttl_min))
    )
    and v_new_start < (extract(hour from b.booking_time)*60 + extract(minute from b.booking_time) + coalesce(b.service_duration_min,60))
    and v_new_end   > (extract(hour from b.booking_time)*60 + extract(minute from b.booking_time))
  limit 1;

  if v_conflict is not null then
    raise exception 'BOOKING_CONFLICT' using errcode = 'P0001';
  end if;

  insert into workspace_bookings(
    workspace_id, service_id, patient_name, patient_email, patient_phone,
    booking_date, booking_time, status, total_amount_cents, platform_fee_cents,
    repasse_amount_cents, service_duration_min
  ) values (
    p_workspace_id, p_service_id, p_patient_name, p_patient_email, p_patient_phone,
    p_booking_date, p_booking_time, 'pending_payment', p_total_amount_cents, p_platform_fee_cents,
    p_repasse_amount_cents, p_service_duration_min
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_workspace_booking_atomic(uuid,uuid,text,text,text,date,time,int,int,int,int,int)
  from public, anon, authenticated;
grant execute on function public.create_workspace_booking_atomic(uuid,uuid,text,text,text,date,time,int,int,int,int,int)
  to service_role;
