import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthenticatedAdmin } from "../_shared/adminAuth.ts";
import {
  buildCorsHeaders,
  handlePublicOptions,
  jsonResponse,
} from "../_shared/publicEndpoint.ts";

const corsHeaders = buildCorsHeaders();

interface Payload {
  action?: string;
  patientId?: number;
  login?: string;
  password?: string;
  enabled?: boolean;
}

const LOGIN_REGEX = /^[a-z0-9._-]{4,32}$/;

function normalizeLogin(value: string) {
  return value.trim().toLowerCase();
}

function buildAuthEmail(login: string) {
  return `patient+${normalizeLogin(login)}@portal.local`;
}

function validatePassword(password: string) {
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "A senha precisa ter ao menos uma letra maiuscula.";
  if (!/[a-z]/.test(password)) return "A senha precisa ter ao menos uma letra minuscula.";
  if (!/[0-9]/.test(password)) return "A senha precisa ter ao menos um numero.";
  return null;
}

serve(async (req) => {
  const optionsResponse = handlePublicOptions(req, corsHeaders);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido." }, 405, corsHeaders);
  }

  const admin = await requireAuthenticatedAdmin(req, corsHeaders);
  if (admin instanceof Response) return admin;

  try {
    const payload = await req.json() as Payload;

    if (payload.action !== "upsert_credentials") {
      return jsonResponse({ error: "Acao invalida." }, 400, corsHeaders);
    }

    const patientId = Number(payload.patientId);
    if (!Number.isFinite(patientId) || patientId <= 0) {
      return jsonResponse({ error: "Paciente invalido." }, 400, corsHeaders);
    }

    const adminSupabase = createClient(admin.supabaseUrl, admin.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: patient, error: patientError } = await adminSupabase
      .from("patients")
      .select("id, name, email")
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return jsonResponse({ error: "Paciente nao encontrado." }, 404, corsHeaders);
    }

    const { data: existingAccount, error: accountError } = await adminSupabase
      .from("patient_portal_accounts")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle();

    if (accountError) {
      return jsonResponse({ error: "Nao foi possivel consultar o acesso atual." }, 500, corsHeaders);
    }

    const normalizedLogin = normalizeLogin(payload.login ?? existingAccount?.login ?? "");
    const enabled = Boolean(payload.enabled);
    const password = payload.password?.trim() ?? "";

    if (!normalizedLogin) {
      return jsonResponse({ error: "Informe um login para o portal." }, 400, corsHeaders);
    }

    if (!LOGIN_REGEX.test(normalizedLogin)) {
      return jsonResponse(
        { error: "Login invalido. Use 4 a 32 caracteres com letras, numeros, ponto, traço ou underscore." },
        400,
        corsHeaders,
      );
    }

    const passwordError = password ? validatePassword(password) : null;
    if (passwordError) {
      return jsonResponse({ error: passwordError }, 400, corsHeaders);
    }

    if (enabled && !existingAccount?.auth_user_id && !password) {
      return jsonResponse(
        { error: "Defina uma senha para ativar o acesso do portal." },
        400,
        corsHeaders,
      );
    }

    if (!enabled && !existingAccount) {
      return jsonResponse(
        { error: "Nao existe acesso criado para este paciente." },
        400,
        corsHeaders,
      );
    }

    const authEmail = buildAuthEmail(normalizedLogin);
    let authUserId = existingAccount?.auth_user_id ?? null;

    const authPayload = {
      email: authEmail,
      email_confirm: true,
      app_metadata: {
        role: "patient_portal",
        patient_portal: true,
      },
      user_metadata: {
        patient_id: patientId,
        portal_login: normalizedLogin,
        patient_email: patient.email ?? null,
      },
    };

    if (authUserId) {
      const { error: updateAuthError } = await adminSupabase.auth.admin.updateUserById(authUserId, {
        ...authPayload,
        ...(password ? { password } : {}),
      });

      if (updateAuthError) {
        return jsonResponse(
          { error: updateAuthError.message || "Nao foi possivel atualizar as credenciais." },
          400,
          corsHeaders,
        );
      }
    } else if (enabled) {
      const { data: createdUser, error: createAuthError } = await adminSupabase.auth.admin.createUser({
        ...authPayload,
        password,
      });

      if (createAuthError || !createdUser.user?.id) {
        return jsonResponse(
          { error: createAuthError?.message || "Nao foi possivel criar o usuario do portal." },
          400,
          corsHeaders,
        );
      }

      authUserId = createdUser.user.id;
    }

    const now = new Date().toISOString();
    const accountRow = {
      patient_id: patientId,
      auth_user_id: authUserId,
      login: normalizedLogin,
      login_normalized: normalizedLogin,
      auth_email: authEmail,
      is_active: enabled,
      password_set_at: password ? now : existingAccount?.password_set_at ?? null,
      last_login_at: existingAccount?.last_login_at ?? null,
      updated_at: now,
      updated_by: admin.userEmail,
    };

    const { data: savedAccount, error: saveError } = await adminSupabase
      .from("patient_portal_accounts")
      .upsert(accountRow, { onConflict: "patient_id" })
      .select("*")
      .single();

    if (saveError || !savedAccount) {
      return jsonResponse(
        { error: saveError?.message || "Nao foi possivel salvar o acesso do portal." },
        400,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        account: savedAccount,
        message: enabled ? "Acesso do portal atualizado." : "Acesso do portal desativado.",
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[patient-portal-credentials]", error);
    return jsonResponse({ error: "Erro interno ao gerenciar credenciais do portal." }, 500, corsHeaders);
  }
});
