import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceRateLimit } from "../_shared/publicEndpoint.ts";
import { createWorkspaceInvitationSignupHandler } from "./workspaceInvitationSignupHandler.ts";

serve(createWorkspaceInvitationSignupHandler({
  env: (name) => Deno.env.get(name),
  rateLimit: enforceRateLimit,
}));
