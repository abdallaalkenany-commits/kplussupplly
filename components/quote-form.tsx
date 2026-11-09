"use client";
import { useEffect, useRef, useState } from "react";

const sbConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const STORE = "kp_lead";

type Props = {
  lang: "ar" | "en";
  t: Record<string, string>;
  options: string[];
  preset?: string;
  wa: string;
};

const FIELDS = ["name", "phone", "company", "customer_type", "product", "quantity", "location", "map_url", "notes"] as const;
const REMEMBER = ["name", "phone", "company", "customer_type", "location"] as const;

export default function QuoteForm({ lang, t, options, preset, wa }: Props) {
  const [msg, setMsg] = useState("");
  const [waUrl, setWaUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [mapMsg, setMapMsg] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const ctypes: [string, string][] = (t.ctypes || "").split("|").map((x) => x.split(":") as [string, string]);
  const labels: Record<string, string> = { name: t.f_name, phone: t.f_phone, company: t.f_company, customer_type: t.f_ctype, product: t.f_cat, quantity: t.f_qty, location: t.f_loc, map_url: t.f_map, notes: t.f_note };

  // Autofill: details saved on this device, then the signed-in customer/supplier profile.
  useEffect(() => {
    const f = form.current; if (!f) return;
    let filled = false;
    const fill = (k: string, v: any) => {
      const el = f.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null;
      if (el && !el.value && v) { el.value = String(v); filled = true; }
    };
    try { const saved = JSON.parse(localStorage.getItem(STORE) || "null"); if (saved) REMEMBER.forEach((k) => fill(k, saved[k])); } catch {}
    if (filled) setPrefilled(true);
    if (!sbConfigured) return;
    (async () => {
      try {
        const { sb } = await import("@/lib/supabase/client");
        const c = sb();
        const { data } = await c.auth.getSession();
        const uid = data.session?.user.id; if (!uid) return;
        const { data: p } = await c.from("profiles").select("full_name,phone,company,role").eq("id", uid).single();
        if (!p) return;
        fill("name", p.full_name); fill("phone", p.phone); fill("company", p.company);
        if (p.role === "supplier") {
          fill("customer_type", "supplier");
          const { data: s } = await c.from("suppliers").select("company_name,phone,governorate").eq("user_id", uid).maybeSingle();
          if (s) { fill("company", s.company_name); fill("phone", s.phone); fill("location", s.governorate); }
        }
        if (filled) setPrefilled(true);
      } catch {}
    })();
  }, []);

  function locate() {
    const el = form.current?.elements.namedItem("map_url") as HTMLInputElement | null;
    if (!navigator.geolocation || !el) return setMapMsg(t.f_map_err);
    setMapMsg("…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { el.value = `https://maps.google.com/?q=${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`; setMapMsg(t.f_map_ok); },
      () => setMapMsg(t.f_map_err),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const fd = new FormData(f);
    if (fd.get("website")) return; // bot trap
    const row: Record<string, string | null> = {};
    const lines = [t.wa_msg];
    FIELDS.forEach((k) => {
      const v = String(fd.get(k) || "").trim();
      row[k] = v || null;
      if (v) lines.push(`${labels[k].replace(/\s*\(.*\)$/, "")}: ${k === "customer_type" ? ctypes.find(([c]) => c === v)?.[1] || v : v}`);
    });
    if (row.map_url && !/^https?:\/\//i.test(row.map_url)) row.map_url = null;
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`;
    if (!sbConfigured) { window.open(url, "_blank", "noopener"); setMsg(t.ok); return; }
    setBusy(true); setMsg(""); setWaUrl("");
    let saved = false; let code = "";
    try {
      const { sb } = await import("@/lib/supabase/client");
      const client = sb();
      const { data } = await client.auth.getSession();
      const base = { lang, page: location.pathname, user_id: data.session?.user.id || null };
      let { error } = await client.from("quote_requests").insert({ ...row, source: "form", ...base });
      if (error && (error.code === "PGRST204" || error.code === "42703")) {
        // database not updated yet: save the core fields and keep the extras in the notes
        const { company, customer_type, map_url, ...core } = row;
        const extra = [company, customer_type, map_url].filter(Boolean).join(" | ");
        ({ error } = await client.from("quote_requests").insert({ ...core, company, notes: [row.notes, extra].filter(Boolean).join("\n") || null, ...base }));
      }
      saved = !error;
      if (error) { code = error.code || error.message || "db"; console.error("quote save failed", error); }
    } catch (x: any) { saved = false; code = "net"; console.error("quote save failed", x); }
    setBusy(false);
    if (saved) {
      try { const keep: Record<string, string | null> = {}; REMEMBER.forEach((k) => (keep[k] = row[k])); localStorage.setItem(STORE, JSON.stringify(keep)); } catch {}
      setMsg(t.ok); setWaUrl(url);
      ["product", "quantity", "map_url", "notes"].forEach((k) => { const el = f.elements.namedItem(k) as HTMLInputElement | null; if (el && k !== "product") el.value = ""; });
      setMapMsg("");
    } else { setMsg(`${t.err} [${code}]`); window.open(url, "_blank", "noopener"); }
  }

  return (
    <section className="wrap quote" id="quote">
      <h2>{t.form_h}</h2>
      {prefilled && <p className="hint">{t.f_prefill}</p>}
      <form className="qform" onSubmit={submit} ref={form} autoComplete="on">
        <label>{t.f_name}<input id="q-name" name="name" required autoComplete="name" maxLength={120} /></label>
        <label>{t.f_phone}<input id="q-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" dir="ltr" maxLength={30} /></label>
        <label>{t.f_company}<input id="q-company" name="company" autoComplete="organization" maxLength={200} /></label>
        <label>{t.f_ctype}<select id="q-ctype" name="customer_type" defaultValue=""><option value="">—</option>{ctypes.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>{t.f_cat}<select id="q-product" name="product" defaultValue={preset || options[0]}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>{t.f_qty}<input id="q-qty" name="quantity" maxLength={200} /></label>
        <label className="full">{t.f_loc}<input id="q-loc" name="location" autoComplete="address-level2" maxLength={200} /></label>
        <div className="full mapf">
          <span>{t.f_map}</span>
          <div className="maprow">
            <button type="button" className="btn light sm" onClick={locate}>{t.f_map_btn}</button>
            <input id="q-map" name="map_url" type="url" dir="ltr" placeholder={t.f_map_ph} maxLength={500} aria-label={t.f_map} />
          </div>
          {mapMsg && <small role="status">{mapMsg}</small>}
        </div>
        <label className="full">{t.f_note}<textarea id="q-notes" name="notes" rows={3} maxLength={2000} /></label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button className="btn full" type="submit" disabled={busy}>{busy ? "…" : sbConfigured ? t.q_send : t.f_send}</button>
        <p className={"hint full" + (waUrl ? " okq" : "")} role="status">{msg || (sbConfigured ? t.q_hint : t.f_hint)}</p>
        {waUrl && <a className="btn wa full" href={waUrl} target="_blank" rel="noopener">{t.wa_follow}</a>}
      </form>
    </section>
  );
}
