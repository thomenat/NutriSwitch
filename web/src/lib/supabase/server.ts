import "server-only";

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseBucket(): string {
  return (process.env.SUPABASE_STORAGE_BUCKET ?? "recipe-images").trim() || "recipe-images";
}

