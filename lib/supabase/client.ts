"use client";
import { createBrowserClient } from "@supabase/ssr";

export const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const sbConfigured = Boolean(SB_URL && SB_KEY);

let client: ReturnType<typeof createBrowserClient> | null = null;
export function sb() {
  if (!sbConfigured) throw new Error("Supabase is not configured");
  if (!client) client = createBrowserClient(SB_URL, SB_KEY);
  return client;
}
