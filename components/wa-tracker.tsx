"use client";
import { useEffect, useRef, useState } from "react";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const STORE = "kp_lead";

const TXT = {
  ar: { h: "قبل ما نكمل على واتساب", p: "سيب اسمك ورقمك عشان فريق المبيعات يقدر يرجعلك لو الرسالة اتأخرت.", name: "الاسم", phone: "رقم الموبايل", go: "كمّل على واتساب", close: "إغلاق", bad: "اكتب رقم موبايل صحيح", hi: "الاسم" },
  en: { h: "Before we continue to WhatsApp", p: "Leave your name and number so our sales team can call you back if needed.", name: "Name", phone: "Mobile number", go: "Continue to WhatsApp", close: "Close", bad: "Enter a valid mobile number", hi: "Name" },
};

function post(table: string, body: any) {
  if (!URL_ || !KEY) return;
  fetch(`${URL_}/rest/v1/${table}`, {
    method: "POST", keepalive: true,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(body),
  }).catch(() => {});
}
function readLead(): { name: string; phone: string } | null {
  try { const v = JSON.parse(localStorage.getItem(STORE) || "null"); return v && v.name && v.phone ? v : null; } catch { return null; }
}

/**
 * Every WhatsApp button on the site: logs the click (wa_clicks) and records the visitor
 * as a lead (quote_requests, source=whatsapp) with name + phone before opening WhatsApp.
 */
export default function WaTracker({ lang }: { lang: "ar" | "en" }) {
  const [pending, setPending] = useState<{ href: string; message: string } | null>(null);
  const [err, setErr] = useState("");
  const t = TXT[lang];
  const nameRef = useRef<HTMLInputElement>(null);

  function lead(name: string, phone: string, href: string, message: string) {
    const product = (message.split(":").slice(1).join(":") || "").trim() || null;
    post("quote_requests", { name, phone, product, notes: (lang === "ar" ? "تواصل عبر واتساب: " : "Contacted via WhatsApp: ") + message, source: "whatsapp", lang, page: location.pathname });
    let url = href;
    try { const u = new URL(href); u.searchParams.set("text", `${message}\n${t.hi}: ${name}`); url = u.toString(); } catch {}
    window.open(url, "_blank", "noopener");
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.('a[href*="wa.me/"]') as HTMLAnchorElement | null;
      if (!a) return;
      const source = a.closest(".wa-float") ? "float" : a.closest(".qform") ? "quote_form" : a.closest(".pfoot") ? "product"
        : a.closest("footer") ? "footer" : a.closest(".nav,.top") ? "header" : "page";
      let message = "";
      try { message = new URL(a.href).searchParams.get("text") || ""; } catch {}
      post("wa_clicks", { source, message: message.slice(0, 1000), page: location.pathname.slice(0, 300), lang });
      if (source === "quote_form" || !URL_) return; // quote form already saved the lead
      e.preventDefault();
      const known = readLead();
      if (known) return lead(known.name, known.phone, a.href, message);
      setErr(""); setPending({ href: a.href, message });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [lang]);

  useEffect(() => { if (pending) setTimeout(() => nameRef.current?.focus(), 30); }, [pending]);

  if (!pending) return null;
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim().slice(0, 120);
    const phone = String(fd.get("phone") || "").replace(/[^\d+]/g, "").slice(0, 30);
    if (phone.length < 8) return setErr(t.bad);
    try { localStorage.setItem(STORE, JSON.stringify({ name, phone })); } catch {}
    lead(name, phone, pending!.href, pending!.message);
    setPending(null);
  }
  return (
    <div className="wagate" role="dialog" aria-modal="true" aria-labelledby="wagate-h" onKeyDown={(e) => e.key === "Escape" && setPending(null)}>
      <div className="wagate-bg" onClick={() => setPending(null)} />
      <form className="wagate-card" onSubmit={submit}>
        <button type="button" className="wagate-x" aria-label={t.close} onClick={() => setPending(null)}>×</button>
        <h2 id="wagate-h">{t.h}</h2>
        <p>{t.p}</p>
        <label>{t.name}<input ref={nameRef} id="wg-name" name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label>{t.phone}<input id="wg-phone" name="phone" type="tel" required dir="ltr" maxLength={30} autoComplete="tel" inputMode="tel" /></label>
        {err && <p className="wagate-err" role="alert">{err}</p>}
        <button className="btn wa" type="submit">{t.go}</button>
      </form>
    </div>
  );
}
