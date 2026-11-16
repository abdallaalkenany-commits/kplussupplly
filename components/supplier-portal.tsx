"use client";
// Supplier portal (/supplier/): a supplier signs in with the email + password K Plus sent him and sees ONLY
// his own company and the supply orders (أوامر التوريد) K Plus transferred to him. Row Level Security in
// Supabase (supabase/009_supplier_portal.sql) enforces this; the page never queries other tables.
import { useEffect, useRef, useState } from "react";
import { sb, sbConfigured } from "@/lib/supabase/client";

type Me = { id: string; email: string; full_name: string | null; role: string };
type Order = {
  id: number; items: string; quantity: string | null; delivery_location: string | null; delivery_date: string | null;
  delivery_contact: string | null; notes: string | null; status: string; supplier_note: string | null; created_at: string; updated_at: string;
};

export const SO_STATUS: [string, string][] = [
  ["new", "جديد"], ["accepted", "اتقبل"], ["preparing", "جاري التجهيز"], ["delivered", "اتسلم"], ["rejected", "اعتذار"], ["cancelled", "اتلغى"],
];
const label = (s: string) => SO_STATUS.find(([k]) => k === s)?.[1] || s;
const fmt = (d: string) => new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
// what the supplier may do next from each status (the database enforces the same rule)
const NEXT: Record<string, [string, string][]> = {
  new: [["accepted", "قبول الأمر"], ["rejected", "اعتذار"]],
  accepted: [["preparing", "جاري التجهيز"], ["delivered", "تم التسليم"]],
  preparing: [["delivered", "تم التسليم"]],
};

export default function SupplierPortal() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const seq = useRef(0);

  async function load() {
    const n = ++seq.current;
    const c = sb();
    const { data } = await c.auth.getUser();
    if (n !== seq.current) return;
    if (!data.user) return setMe(null);
    const { data: p } = await c.from("profiles").select("id,email,full_name,role").eq("id", data.user.id).single();
    if (n !== seq.current) return;
    setMe((p as Me) || null);
  }
  useEffect(() => {
    if (!sbConfigured) return setMe(null);
    load();
    const { data } = sb().auth.onAuthStateChange((ev: string) => { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") load(); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (me === undefined) return <Center><p>جاري التحميل…</p></Center>;
  if (me === null) return <Login />;
  if (me.role !== "supplier") return (
    <Center>
      <h1>الصفحة دي للموردين بس</h1>
      <p>الحساب ده ({me.email}) مش حساب مورد.</p>
      {(me.role === "admin" || me.role === "sales") && <a className="abtn primary" href="/admin/suppliers/?tab=orders">افتح أوامر التوريد في لوحة التحكم</a>}
      <button className="abtn" onClick={() => sb().auth.signOut()}>خروج</button>
    </Center>
  );
  return <Portal me={me} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="center"><div className="panel">{children}</div></div>;
}

function Login() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setMsg("");
    const { error } = await sb().auth.signInWithPassword({ email: String(fd.get("email")).trim(), password: String(fd.get("password")) });
    setBusy(false);
    if (error) setMsg("الإيميل أو كلمة السر غلط.");
  }
  async function forgot() {
    const email = (document.getElementById("sp-email") as HTMLInputElement)?.value.trim();
    if (!email) return setMsg("اكتب الإيميل الأول.");
    await sb().auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/supplier/" });
    setMsg("لو الإيميل مسجل هيوصلك لينك تغيير كلمة السر.");
  }
  return (
    <Center>
      <img src="/assets/logo.png" alt="كي بلس" height={44} />
      <h1>بوابة الموردين</h1>
      <p className="meta">ادخل بالإيميل وكلمة السر اللي وصلوك من كي بلس للتوريدات العمومية علشان تتابع أوامر التوريد.</p>
      <form className="aform" onSubmit={submit}>
        <label>الإيميل<input id="sp-email" name="email" type="email" required dir="ltr" autoComplete="email" /></label>
        <label>كلمة السر<input id="sp-pass" name="password" type="password" required dir="ltr" autoComplete="current-password" /></label>
        <button className="abtn primary" disabled={busy}>دخول</button>
        <button type="button" className="abtn" onClick={forgot}>نسيت كلمة السر؟</button>
        {msg && <p className="err" role="alert">{msg}</p>}
      </form>
    </Center>
  );
}

function Portal({ me }: { me: Me }) {
  const [sup, setSup] = useState<any>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [tab, setTab] = useState<"orders" | "profile">("orders");

  async function load() {
    const c = sb();
    const [s, o] = await Promise.all([
      c.from("suppliers").select("id,company_name,contact_name,phone,email,wa_apikey,status").eq("user_id", me.id).maybeSingle(),
      c.from("supply_orders").select("id,items,quantity,delivery_location,delivery_date,delivery_contact,notes,status,supplier_note,created_at,updated_at").order("created_at", { ascending: false }),
    ]);
    setSup(s.data || false);
    setOrders((o.data as Order[]) || []);
  }
  useEffect(() => {
    load();
    const id = Number(new URLSearchParams(location.search).get("order"));
    if (id) setOpen(id);
  }, []);

  const counts = (orders || []).reduce((m: Record<string, number>, o) => ({ ...m, [o.status]: (m[o.status] || 0) + 1 }), {});
  const openOrder = orders?.find((o) => o.id === open);

  return (
    <div className="portal">
      <header className="ptop">
        <img src="/assets/logo-white.png" alt="كي بلس" height={30} />
        <div className="ptitle"><b>بوابة الموردين</b><small>{sup ? sup.company_name : me.email}</small></div>
        <button className="abtn" onClick={() => sb().auth.signOut()}>خروج</button>
      </header>
      <div className="content">
        <p className="tip">الأوامر هنا <b>محوّلة من كي بلس للتوريدات العمومية</b>. أي تواصل بخصوص الأمر يكون مع كي بلس على واتساب <a href="https://wa.me/201028879918" dir="ltr">01028879918</a>.</p>
        {sup === false && <p className="err">حسابك لسه مش مربوط بشركة. كلم كي بلس.</p>}
        <div className="seg" role="tablist" style={{ marginBottom: 14 }}>
          <button role="tab" aria-selected={tab === "orders"} className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>أوامر التوريد</button>
          <button role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? "on" : ""} onClick={() => setTab("profile")}>بياناتي والتنبيهات</button>
        </div>
        {tab === "orders" ? (
          <>
            <div className="kpis">
              {[["new", "أوامر جديدة"], ["accepted", "مقبولة"], ["preparing", "جاري التجهيز"], ["delivered", "اتسلمت"]].map(([k, l]) => (
                <div key={k} className={"kpi" + (k === "new" && counts.new ? " hot" : "")}><span className="kl">{l}</span><span className="kv">{counts[k] || 0}</span></div>
              ))}
            </div>
            {orders === null ? <p>جاري التحميل…</p> : orders.length === 0 ? <p className="emptyst">لسه مفيش أوامر توريد. أول ما كي بلس تحوّلك أمر هيظهر هنا ويوصلك إيميل.</p> : (
              <div className="tablewrap"><table className="atbl">
                <thead><tr><th>رقم الأمر</th><th>الأصناف</th><th>الكمية</th><th>موعد التسليم</th><th>الحالة</th><th>التاريخ</th></tr></thead>
                <tbody>{orders.map((o) => (
                  <tr key={o.id} onClick={() => setOpen(o.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(o.id)}>
                    <td><b dir="ltr">PO-{o.id}</b></td><td>{o.items.length > 60 ? o.items.slice(0, 60) + "…" : o.items}</td><td>{o.quantity || "—"}</td>
                    <td>{o.delivery_date || "—"}</td><td><span className={"pill so-" + o.status}>{label(o.status)}</span></td><td>{fmt(o.created_at)}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </>
        ) : sup ? <Profile sup={sup} onSaved={load} /> : null}
      </div>
      {openOrder && (
        <>
          <div className="scrim" onClick={() => setOpen(null)} />
          <OrderDrawer o={openOrder} onClose={() => setOpen(null)} onChanged={load} />
        </>
      )}
    </div>
  );
}

function OrderDrawer({ o, onClose, onChanged }: { o: Order; onClose: () => void; onChanged: () => void }) {
  const [note, setNote] = useState(o.supplier_note || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(status?: string) {
    setBusy(true); setMsg("");
    const patch: any = { supplier_note: note.trim() || null };
    if (status) patch.status = status;
    const { error } = await sb().from("supply_orders").update(patch).eq("id", o.id);
    setBusy(false);
    if (error) return setMsg("ماتحفظش: " + error.message);
    setMsg(status ? "اتحدثت الحالة ووصل تنبيه لكي بلس." : "اتحفظت الملاحظة.");
    onChanged();
  }
  const rows: [string, string | null][] = [
    ["الأصناف", o.items], ["الكمية", o.quantity], ["مكان التسليم", o.delivery_location], ["موعد التسليم", o.delivery_date],
    ["المسؤول في الموقع", o.delivery_contact], ["ملاحظات كي بلس", o.notes], ["تاريخ الأمر", fmt(o.created_at)],
  ];
  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label={"أمر توريد PO-" + o.id}>
      <div className="aform">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>أمر توريد <span dir="ltr">PO-{o.id}</span></h2>
          <span className={"pill so-" + o.status}>{label(o.status)}</span>
        </div>
        <p className="meta">محوّل من كي بلس للتوريدات العمومية</p>
        {rows.map(([k, v]) => v ? <div key={k} className="ro so-row"><span>{k}</span><b style={{ whiteSpace: "pre-wrap" }}>{v}</b></div> : null)}
        <label>ملاحظتك لكي بلس (اختياري)<textarea id="so-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: التسليم يوم الخميس، أو صنف ناقص…" /></label>
        <div className="row">
          {(NEXT[o.status] || []).map(([s, l]) => (
            <button key={s} className={"abtn" + (s === "rejected" ? " danger" : " primary")} disabled={busy} onClick={() => save(s)}>{l}</button>
          ))}
          <button className="abtn" disabled={busy} onClick={() => save()}>حفظ الملاحظة</button>
          <button className="abtn" onClick={onClose}>إغلاق</button>
        </div>
        {msg && <p className="okmsg" role="status">{msg}</p>}
      </div>
    </div>
  );
}

function Profile({ sup, onSaved }: { sup: any; onSaved: () => void }) {
  const [v, setV] = useState({ contact_name: sup.contact_name || "", phone: sup.phone || "", wa_apikey: sup.wa_apikey || "" });
  const [msg, setMsg] = useState("");
  const [pw, setPw] = useState("");
  const [pmsg, setPmsg] = useState("");
  async function save() {
    setMsg("");
    const { error } = await sb().from("suppliers").update({
      contact_name: v.contact_name.trim() || null, phone: v.phone.replace(/[^\d+]/g, "") || null, wa_apikey: v.wa_apikey.trim() || null,
    }).eq("id", sup.id);
    setMsg(error ? "ماتحفظش: " + error.message : "اتحفظ.");
    if (!error) onSaved();
  }
  async function changePw() {
    if (pw.length < 8) return setPmsg("كلمة السر لازم 8 حروف على الأقل.");
    const { error } = await sb().auth.updateUser({ password: pw });
    setPmsg(error ? "ماتغيرتش: " + error.message : "اتغيرت كلمة السر.");
    if (!error) setPw("");
  }
  return (
    <div className="two">
      <section className="box">
        <h2>بيانات التواصل</h2>
        <div className="aform" style={{ padding: 0 }}>
          <div className="ro"><span>الشركة</span><b>{sup.company_name}</b></div>
          <div className="ro"><span>الإيميل (بتوصله الأوامر)</span><b dir="ltr">{sup.email || "—"}</b></div>
          <label>اسم المسؤول<input id="sp-contact" value={v.contact_name} onChange={(e) => setV({ ...v, contact_name: e.target.value })} /></label>
          <label>رقم واتساب<input id="sp-phone" dir="ltr" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="01xxxxxxxxx" /></label>
          <label>مفتاح تنبيهات واتساب (CallMeBot)<input id="sp-wa" dir="ltr" value={v.wa_apikey} onChange={(e) => setV({ ...v, wa_apikey: e.target.value })} /></label>
          <p className="hint">علشان توصلك رسالة واتساب مع كل أمر جديد: افتح <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener">خطوات تفعيل CallMeBot</a>، ضيف رقمهم عندك وابعتلهم على واتساب <b dir="ltr">I allow callmebot to send me messages</b>. هيردوا عليك بمفتاح (apikey)، الصقه هنا واحفظ. (الإيميل بيوصلك في كل الأحوال.)</p>
          <button className="abtn primary" onClick={save}>حفظ</button>
          {msg && <p className="okmsg" role="status">{msg}</p>}
        </div>
      </section>
      <section className="box">
        <h2>تغيير كلمة السر</h2>
        <div className="aform" style={{ padding: 0 }}>
          <label>كلمة السر الجديدة<input id="sp-newpw" type="password" dir="ltr" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <button className="abtn primary" onClick={changePw}>تغيير</button>
          {pmsg && <p className="okmsg" role="status">{pmsg}</p>}
        </div>
      </section>
    </div>
  );
}
