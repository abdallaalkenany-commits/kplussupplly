"use client";
import { useEffect, useRef, useState } from "react";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const STORE = "kp_lead";

const TXT = {
  ar: { h: "قبل ما نكمل على واتساب", p: "اسمك ورقمك اختياري: بيساعد فريق المبيعات يرجعلك لو الرسالة اتأخرت.", name: "الاسم (اختياري)", phone: "رقم الموبايل (اختياري)", go: "كمّل على واتساب", skip: "افتح واتساب على طول من غير بيانات", close: "إغلاق", bad: "اكتب رقم موبايل صحيح أو سيبه فاضي", hi: "الاسم" },
  en: { h: "Before we continue to WhatsApp", p: "Name and number are optional: they help our sales team call you back if needed.", name: "Name (optional)", phone: "Mobile number (optional)", go: "Continue to WhatsApp", skip: "Open WhatsApp directly, skip this", close: "Close", bad: "Enter a valid mobile number or leave it empty", hi: "Name" },
};

function post(table: string, body: any, fallback?: any): Promise<unknown> {
  if (!URL_ || !KEY) return Promise.resolve();
  const send = (b: any) => fetch(`${URL_}/rest/v1/${table}`, {
    method: "POST", keepalive: true,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(b),
  });
  return send(body).then((r) => { if (!r.ok && fallback && r.status === 400) return send(fallback); }).catch(() => {});
}
function uid(): string {
  try { if (crypto.randomUUID) return crypto.randomUUID(); } catch {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
}
type Outcome = "closed" | "direct" | "lead" | "known";
/** What the visitor did after the click (shown in /admin/whatsapp/). Runs after the click row is saved. */
function saveOutcome(click: { id: string; saved: Promise<unknown> }, outcome: Outcome) {
  click.saved.then(() => post("rpc/wa_set_outcome", { p_click: click.id, p_outcome: outcome }));
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
  const clickRef = useRef<{ id: string; saved: Promise<unknown> } | null>(null);
  function mark(outcome: Outcome) {
    const c = clickRef.current;
    clickRef.current = null;
    if (c) saveOutcome(c, outcome);
  }

  function lead(name: string, phone: string, href: string, message: string) {
    const product = (message.split(":").slice(1).join(":") || "").trim() || null;
    const q = { name, phone, product, notes: (lang === "ar" ? "تواصل عبر واتساب: " : "Contacted via WhatsApp: ") + message, lang, page: location.pathname };
    post("quote_requests", { ...q, source: "whatsapp" }, q);
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
      const known = source === "quote_form" ? null : readLead();
      const base = { source, message: message.slice(0, 1000), page: location.pathname.slice(0, 300), lang };
      const id = uid();
      // fallback = the old row shape, in case the outcome columns (SQL 014) are missing
      const saved = post("wa_clicks", { ...base, click_id: id, outcome: source === "quote_form" ? "form" : known ? "known" : null }, base);
      if (source === "quote_form" || !URL_) return; // quote form already saved the lead
      e.preventDefault();
      if (known) return lead(known.name, known.phone, a.href, message);
      clickRef.current = { id, saved };
      setErr(""); setPending({ href: a.href, message });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [lang]);

  useEffect(() => { if (pending) setTimeout(() => nameRef.current?.focus(), 30); }, [pending]);

  if (!pending) return null;
  // Never block WhatsApp: name/phone are optional, and "skip" opens the chat straight away.
  function direct() {
    mark("direct");
    window.open(pending!.href, "_blank", "noopener");
    setPending(null);
  }
  function close() {
    mark("closed");
    setPending(null);
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim().slice(0, 120);
    const phone = String(fd.get("phone") || "").replace(/[^\d+]/g, "").slice(0, 30);
    if (!phone) return direct();
    if (phone.length < 8) return setErr(t.bad);
    try { localStorage.setItem(STORE, JSON.stringify({ name, phone })); } catch {}
    mark("lead");
    lead(name || phone, phone, pending!.href, pending!.message);
    setPending(null);
  }
  return (
    <div className="wagate" role="dialog" aria-modal="true" aria-labelledby="wagate-h" onKeyDown={(e) => e.key === "Escape" && close()}>
      <div className="wagate-bg" onClick={close} />
      <form className="wagate-card" onSubmit={submit}>
        <button type="button" className="wagate-x" aria-label={t.close} onClick={close}>×</button>
        <h2 id="wagate-h">{t.h}</h2>
        <p>{t.p}</p>
        <label>{t.name}<input ref={nameRef} id="wg-name" name="name" maxLength={120} autoComplete="name" /></label>
        <label>{t.phone}<input id="wg-phone" name="phone" type="tel" dir="ltr" maxLength={30} autoComplete="tel" inputMode="tel" /></label>
        {err && <p className="wagate-err" role="alert">{err}</p>}
        <button className="btn wa" type="submit">{t.go}</button>
        <button type="button" onClick={direct} style={{ border: 0, background: "none", color: "var(--muted)", textDecoration: "underline", cursor: "pointer", font: "inherit", fontSize: 14, padding: 4 }}>{t.skip}</button>
      </form>
    </div>
  );
}
