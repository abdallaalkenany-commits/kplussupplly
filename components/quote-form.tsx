"use client";
import { useState } from "react";

const sbConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type Props = {
  lang: "ar" | "en";
  t: Record<string, string>;
  options: string[];
  preset?: string;
  wa: string;
};

const FIELDS = ["name", "phone", "product", "quantity", "location", "notes"] as const;

export default function QuoteForm({ lang, t, options, preset, wa }: Props) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const labels: Record<string, string> = { name: t.f_name, phone: t.f_phone, product: t.f_cat, quantity: t.f_qty, location: t.f_loc, notes: t.f_note };

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
      if (v) lines.push(`${labels[k]}: ${v}`);
    });
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    if (!sbConfigured) { setMsg(t.ok); return; }
    setBusy(true);
    try {
      const { sb } = await import("@/lib/supabase/client");
      const client = sb();
      const { data } = await client.auth.getSession();
      const uid = data.session?.user.id;
      const { error } = await client.from("quote_requests").insert({ ...row, lang, page: location.pathname, user_id: uid || null });
      setMsg(error ? t.err : t.ok);
      if (!error) f.reset();
    } catch {
      setMsg(t.err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wrap quote" id="quote">
      <h2>{t.form_h}</h2>
      <form className="qform" onSubmit={submit}>
        <label>{t.f_name}<input id="q-name" name="name" required autoComplete="name" maxLength={120} /></label>
        <label>{t.f_phone}<input id="q-phone" name="phone" type="tel" required autoComplete="tel" dir="ltr" maxLength={30} /></label>
        <label>{t.f_cat}<select id="q-product" name="product" defaultValue={preset || options[0]}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>{t.f_qty}<input id="q-qty" name="quantity" maxLength={200} /></label>
        <label className="full">{t.f_loc}<input id="q-loc" name="location" maxLength={200} /></label>
        <label className="full">{t.f_note}<textarea id="q-notes" name="notes" rows={3} maxLength={2000} /></label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button className="btn wa full" type="submit" disabled={busy}>{t.f_send}</button>
        <p className="hint full" role="status">{msg || t.f_hint}</p>
      </form>
    </section>
  );
}
