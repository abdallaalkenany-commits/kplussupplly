"use client";
import { useEffect } from "react";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** Logs every click on a WhatsApp link to the CRM (table wa_clicks) without delaying the visitor. */
export default function WaTracker({ lang }: { lang: string }) {
  useEffect(() => {
    if (!URL_ || !KEY) return;
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.('a[href*="wa.me/"]') as HTMLAnchorElement | null;
      if (!a) return;
      const source = a.closest(".wa-float") ? "float" : a.closest(".qform") ? "quote_form" : a.closest(".pfoot") ? "product"
        : a.closest("footer") ? "footer" : a.closest(".nav,.top") ? "header" : "page";
      let message = "";
      try { message = new URL(a.href).searchParams.get("text") || ""; } catch {}
      fetch(`${URL_}/rest/v1/wa_clicks`, {
        method: "POST", keepalive: true,
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ source, message: message.slice(0, 1000), page: location.pathname.slice(0, 300), lang }),
      }).catch(() => {});
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [lang]);
  return null;
}
