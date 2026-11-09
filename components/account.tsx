"use client";
import { useEffect, useRef, useState } from "react";
import { sb, sbConfigured } from "@/lib/supabase/client";
import { GOVS, TOP, upath, type Lang } from "@/lib/content";

const TX = {
  ar: {
    title: "حسابي", login: "تسجيل الدخول", signup: "حساب جديد", email: "الإيميل", password: "كلمة السر", name: "الاسم", phone: "الموبايل",
    company: "الشركة (اختياري)", type: "نوع الحساب", customer: "عميل / مقاول", supplier: "مورد", go_login: "دخول", go_signup: "إنشاء الحساب",
    optional: "التسجيل اختياري للعملاء: تقدر تطلب عرض سعر من غير حساب. الحساب بيخليك تتابع طلباتك.",
    check_mail: "بعتنالك إيميل تأكيد. افتحه ودوس على اللينك، وبعدين ادخل.", logout: "خروج", my_quotes: "طلباتي",
    no_quotes: "لسه مفيش طلبات. اطلب عرض سعر من أي صفحة منتج.", status: "الحالة", date: "التاريخ", product: "المنتج", qty: "الكمية",
    sup_profile: "بيانات المورد", company_name: "اسم الشركة", contact_name: "اسم المسؤول", gov: "المحافظة", cats: "الأقسام اللي بتوردها",
    sup_products: "المنتجات والماركات", cr: "رقم السجل التجاري", tax: "رقم البطاقة الضريبية", website: "الموقع الإلكتروني (اختياري)",
    docs: "المستندات (سجل تجاري، بطاقة ضريبية، كتالوج)", upload: "رفع ملف", save: "حفظ", saved: "اتحفظ.", staff: "لوحة التحكم",
    s_pending: "تحت المراجعة", s_approved: "معتمد", s_rejected: "مرفوض", not_ready: "التسجيل هيتفتح قريب. لحد ما يجهز كلمنا على واتساب.",
    forgot: "نسيت كلمة السر؟", reset_sent: "بعتنالك لينك تغيير كلمة السر على الإيميل.",
    q: { new: "جديد", contacted: "اتواصلنا", quoted: "اتبعت عرض سعر", won: "اتنفذ", lost: "مقفول" } as Record<string, string>,
  },
  en: {
    title: "My account", login: "Sign in", signup: "Create account", email: "Email", password: "Password", name: "Name", phone: "Mobile",
    company: "Company (optional)", type: "Account type", customer: "Customer / contractor", supplier: "Supplier", go_login: "Sign in", go_signup: "Create account",
    optional: "Registration is optional for customers: you can request a quote without an account. An account lets you track your requests.",
    check_mail: "We sent you a confirmation email. Open the link, then sign in.", logout: "Sign out", my_quotes: "My requests",
    no_quotes: "No requests yet. Request a quote from any product page.", status: "Status", date: "Date", product: "Product", qty: "Quantity",
    sup_profile: "Supplier profile", company_name: "Company name", contact_name: "Contact person", gov: "Governorate", cats: "Categories you supply",
    sup_products: "Products and brands", cr: "Commercial register no.", tax: "Tax card no.", website: "Website (optional)",
    docs: "Documents (commercial register, tax card, catalogue)", upload: "Upload file", save: "Save", saved: "Saved.", staff: "Dashboard",
    s_pending: "Under review", s_approved: "Approved", s_rejected: "Rejected", not_ready: "Registration opens soon. Until then, message us on WhatsApp.",
    forgot: "Forgot password?", reset_sent: "We emailed you a password reset link.",
    q: { new: "New", contacted: "Contacted", quoted: "Quote sent", won: "Delivered", lost: "Closed" } as Record<string, string>,
  },
};

type Profile = { id: string; email: string; full_name: string | null; phone: string | null; company: string | null; role: string };

export default function Account({ lang }: { lang: Lang }) {
  const x = TX[lang];
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const loadSeq = useRef(0);

  async function load() {
    const seq = ++loadSeq.current;
    const client = sb();
    const { data } = await client.auth.getUser();
    if (seq !== loadSeq.current) return;
    if (!data.user) { setProfile(null); setReady(true); return; }
    const { data: p } = await client.from("profiles").select("*").eq("id", data.user.id).single();
    if (seq !== loadSeq.current) return;
    setProfile((p as Profile) || null);
    setReady(true);
  }

  useEffect(() => {
    if (!sbConfigured) { setReady(true); return; }
    load();
    const { data } = sb().auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <>
      <section className="phero"><div className="wrap"><div><h1>{x.title}</h1>{!profile && <p className="lead">{x.optional}</p>}</div></div></section>
      <section className="wrap acct">
        {!sbConfigured ? <p className="empty">{x.not_ready}</p>
          : !ready ? <p className="empty">…</p>
          : !profile ? <AuthForms lang={lang} />
          : <Dashboard lang={lang} profile={profile} />}
      </section>
    </>
  );
}

function AuthForms({ lang }: { lang: Lang }) {
  const x = TX[lang];
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [type, setType] = useState("customer");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("type") === "supplier") { setMode("signup"); setType("supplier"); }
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")), password = String(fd.get("password"));
    setBusy(true); setMsg("");
    const client = sb();
    if (mode === "login") {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    } else {
      const { data, error } = await client.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: location.origin + upath(lang, "account"),
          data: { account_type: type, full_name: fd.get("full_name"), phone: fd.get("phone"), company: fd.get("company") },
        },
      });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg(x.check_mail);
    }
    setBusy(false);
  }

  async function forgot() {
    const email = (document.getElementById("a-email") as HTMLInputElement)?.value;
    if (!email) return;
    await sb().auth.resetPasswordForEmail(email, { redirectTo: location.origin + upath(lang, "account") });
    setMsg(x.reset_sent);
  }

  return (
    <div className="authbox card">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>{x.login}</button>
        <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>{x.signup}</button>
      </div>
      <form className="qform" onSubmit={submit}>
        {mode === "signup" && (
          <>
            <fieldset className="full seg"><legend>{x.type}</legend>
              <label><input type="radio" name="type" checked={type === "customer"} onChange={() => setType("customer")} /> {x.customer}</label>
              <label><input type="radio" name="type" checked={type === "supplier"} onChange={() => setType("supplier")} /> {x.supplier}</label>
            </fieldset>
            <label>{x.name}<input id="a-name" name="full_name" required autoComplete="name" /></label>
            <label>{x.phone}<input id="a-phone" name="phone" type="tel" required dir="ltr" autoComplete="tel" /></label>
            <label className="full">{type === "supplier" ? x.company_name : x.company}<input id="a-company" name="company" required={type === "supplier"} autoComplete="organization" /></label>
          </>
        )}
        <label>{x.email}<input id="a-email" name="email" type="email" required dir="ltr" autoComplete="email" /></label>
        <label>{x.password}<input id="a-pass" name="password" type="password" required minLength={8} dir="ltr" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        <button className="btn full" disabled={busy}>{mode === "login" ? x.go_login : x.go_signup}</button>
        {mode === "login" && <button type="button" className="linkbtn full" onClick={forgot}>{x.forgot}</button>}
        {msg && <p className="hint full" role="status">{msg}</p>}
      </form>
    </div>
  );
}

function Dashboard({ lang, profile }: { lang: Lang; profile: Profile }) {
  const x = TX[lang];
  const staff = profile.role === "admin" || profile.role === "sales";
  return (
    <>
      <div className="acct-head">
        <div><b>{profile.full_name || profile.email}</b><br /><span className="unit" dir="ltr">{profile.email}</span></div>
        <div className="actions">
          {staff && <a className="btn" href="/admin/">{x.staff}</a>}
          <button className="btn ghost" onClick={() => sb().auth.signOut()}>{x.logout}</button>
        </div>
      </div>
      {profile.role === "supplier" ? <SupplierForm lang={lang} profile={profile} /> : <MyQuotes lang={lang} />}
    </>
  );
}

function MyQuotes({ lang }: { lang: Lang }) {
  const x = TX[lang];
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    sb().from("quote_requests").select("id,created_at,product,quantity,status").order("created_at", { ascending: false }).then(({ data }: { data: any[] | null }) => setRows(data || []));
  }, []);
  return (
    <>
      <h2>{x.my_quotes}</h2>
      {rows === null ? <p>…</p> : rows.length === 0 ? <p className="empty">{x.no_quotes} <a href={upath(lang, "contact")}>→</a></p> : (
        <div className="tablewrap"><table className="tbl">
          <thead><tr><th>#</th><th>{x.date}</th><th>{x.product}</th><th>{x.qty}</th><th>{x.status}</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{r.id}</td><td>{new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}</td><td>{r.product}</td><td>{r.quantity}</td><td><span className={"pill s-" + r.status}>{x.q[r.status]}</span></td></tr>)}</tbody>
        </table></div>
      )}
    </>
  );
}

function SupplierForm({ lang, profile }: { lang: Lang; profile: Profile }) {
  const x = TX[lang];
  const [sup, setSup] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await sb().from("suppliers").select("*").eq("user_id", profile.id).maybeSingle();
    setSup(data || { company_name: profile.company || "", contact_name: profile.full_name || "", phone: profile.phone || "", email: profile.email, categories: [], files: [] });
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const row: Record<string, any> = {};
    ["company_name", "contact_name", "phone", "email", "governorate", "products", "cr_number", "tax_number", "website"].forEach((k) => (row[k] = String(fd.get(k) || "").trim() || null));
    row.categories = fd.getAll("categories").map(String);
    setBusy(true);
    const client = sb();
    const res = sup?.id
      ? await client.from("suppliers").update(row).eq("id", sup.id).select().single()
      : await client.from("suppliers").insert({ ...row, user_id: profile.id, status: "pending" }).select().single();
    setBusy(false);
    if (res.error) setMsg(res.error.message); else { setSup(res.data); setMsg(x.saved); }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !sup?.id) return;
    setBusy(true);
    const path = `${profile.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const client = sb();
    const up = await client.storage.from("supplier-docs").upload(path, file);
    if (up.error) { setMsg(up.error.message); setBusy(false); return; }
    const files = [...(sup.files || []), { path, name: file.name, at: new Date().toISOString() }];
    const res = await client.from("suppliers").update({ files }).eq("id", sup.id).select().single();
    setBusy(false);
    if (!res.error) setSup(res.data);
    e.target.value = "";
  }

  if (!sup) return <p>…</p>;
  const statusLabel = { pending: x.s_pending, approved: x.s_approved, rejected: x.s_rejected } as Record<string, string>;
  return (
    <>
      <h2>{x.sup_profile} {sup.id && <span className={"pill s-" + sup.status}>{statusLabel[sup.status]}</span>}</h2>
      <form className="qform card" onSubmit={save}>
        <label>{x.company_name}<input id="s-company" name="company_name" required defaultValue={sup.company_name || ""} /></label>
        <label>{x.contact_name}<input id="s-contact" name="contact_name" defaultValue={sup.contact_name || ""} /></label>
        <label>{x.phone}<input id="s-phone" name="phone" type="tel" dir="ltr" required defaultValue={sup.phone || ""} /></label>
        <label>{x.email}<input id="s-email" name="email" type="email" dir="ltr" defaultValue={sup.email || ""} /></label>
        <label>{x.gov}<select id="s-gov" name="governorate" defaultValue={sup.governorate || ""}><option value=""></option>{GOVS[lang].map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>{x.website}<input id="s-web" name="website" dir="ltr" defaultValue={sup.website || ""} /></label>
        <fieldset className="full seg"><legend>{x.cats}</legend>
          {TOP.map((c) => <label key={c.slug}><input type="checkbox" name="categories" value={c.slug} defaultChecked={(sup.categories || []).includes(c.slug)} /> {c[lang].nav}</label>)}
        </fieldset>
        <label className="full">{x.sup_products}<textarea id="s-products" name="products" rows={3} defaultValue={sup.products || ""} /></label>
        <label>{x.cr}<input id="s-cr" name="cr_number" dir="ltr" defaultValue={sup.cr_number || ""} /></label>
        <label>{x.tax}<input id="s-tax" name="tax_number" dir="ltr" defaultValue={sup.tax_number || ""} /></label>
        <button className="btn full" disabled={busy}>{x.save}</button>
        {msg && <p className="hint full" role="status">{msg}</p>}
      </form>
      {sup.id && (
        <div className="card docs">
          <h3>{x.docs}</h3>
          <ul>{(sup.files || []).map((f: any) => <li key={f.path}>{f.name}</li>)}</ul>
          <label className="btn ghost sm upl">{x.upload}<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={upload} hidden /></label>
        </div>
      )}
    </>
  );
}


