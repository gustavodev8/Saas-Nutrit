import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAccessRequestAdminHandler } from "./accessRequestAdminHandler.ts";

serve(createAccessRequestAdminHandler({
  env: (name) => Deno.env.get(name),
}));
