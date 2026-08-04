export interface AdminAuthContext {
  supabaseUrl: string;
  serviceKey: string;
  userEmail: string;
}

export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isDatabaseAdmin(
  supabaseUrl: string,
  serviceKey: string,
  userEmail: string,
): Promise<boolean> {
  const lookupUrl = new URL(`${supabaseUrl}/rest/v1/admin_emails`);
  lookupUrl.searchParams.set("select", "email");
  lookupUrl.searchParams.set("email", `eq.${userEmail}`);
  lookupUrl.searchParams.set("limit", "1");

  const lookupRes = await fetch(lookupUrl.toString(), {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!lookupRes.ok) {
    return false;
  }

  const rows = await lookupRes.json().catch(() => []) as Array<{ email?: string }>;
  return rows.some((row) => row.email?.trim().toLowerCase() === userEmail);
}

export async function requireAuthenticatedAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AdminAuthContext | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Supabase não configurado." }, 500, corsHeaders);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token || token === anonKey || token === serviceKey) {
    return jsonResponse({ error: "Sessão administrativa obrigatória." }, 401, corsHeaders);
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    return jsonResponse({ error: "Sessão inválida. Faça login novamente." }, 401, corsHeaders);
  }

  const user = await userRes.json().catch(() => null) as { email?: string } | null;
  const userEmail = user?.email?.trim().toLowerCase();

  if (!userEmail) {
    return jsonResponse({ error: "Sessão inválida. Faça login novamente." }, 401, corsHeaders);
  }

  const allowlistRaw =
    Deno.env.get("ADMIN_EMAILS") ??
    Deno.env.get("ADMIN_EMAIL") ??
    Deno.env.get("VITE_ADMIN_EMAIL") ??
    "";

  const allowedEmails = allowlistRaw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.includes(userEmail)) {
    return { supabaseUrl, serviceKey, userEmail };
  }

  const isAdmin = await isDatabaseAdmin(supabaseUrl, serviceKey, userEmail);

  if (!isAdmin) {
    return jsonResponse({ error: "Acesso administrativo negado." }, 403, corsHeaders);
  }

  return { supabaseUrl, serviceKey, userEmail };
}
