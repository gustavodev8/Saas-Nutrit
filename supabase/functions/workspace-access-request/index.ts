import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createWorkspaceAccessRequestHandler } from "./workspaceAccessRequestHandler.ts";

serve(createWorkspaceAccessRequestHandler({
  env: (name) => Deno.env.get(name),
}));
