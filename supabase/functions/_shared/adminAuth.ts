export interface AdminAuthContext {
  supabaseUrl: string;
  serviceKey: string;
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

  return { supabaseUrl, serviceKey };
}
