"use client";
// Supplier portal (/supplier/): a supplier signs in with the email + password K Plus sent him and sees ONLY
// his own company and the supply orders (أوامر التوريد) K Plus transferred to him. Row Level Security in
// Supabase (supabase/009_supplier_portal.sql) enforces this; the page never queries other tables.
import { useEffect, useRef, useState } from "react";
import { sb, sbConfigured } from "@/lib/supabase/client";
import { sectionAllowed, useSections } from "@/lib/sections-client";

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
  const [tab, setTab] = useState<"orders" | "products" | "profile">("orders");

  async function load() {
    const c = sb();
    const [s, o] = await Promise.all([
      c.from("suppliers").select("id,company_name,contact_name,phone,email,wa_apikey,status,categories").eq("user_id", me.id).maybeSingle(),
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
          <button role="tab" aria-selected={tab === "products"} className={tab === "products" ? "on" : ""} onClick={() => setTab("products")}>منتجاتي</button>
          <button role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? "on" : ""} onClick={() => setTab("profile")}>بياناتي والتنبيهات</button>
        </div>
        {tab === "products" ? (sup ? <MyProducts sup={sup} me={me} /> : null) : tab === "orders" ? (
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

/* ---------- supplier's own products (shown on the website after K Plus approves them) ---------- */
type MyProduct = { id: number; category: string; name_ar: string; name_en: string | null; spec_ar: string | null; unit_ar: string | null;
  image_url: string | null; supplier_price: number | null; status: string; published: boolean };
const P_STATUS: Record<string, [string, string]> = { pending: ["تحت المراجعة", "so-new"], approved: ["منشور على الموقع", "so-delivered"], rejected: ["مرفوض", "so-rejected"] };

// shrink photos in the browser before upload (max 1400px, WebP) so product pages stay fast
async function shrink(file: File): Promise<Blob> {
  try {
    const img = await createImageBitmap(file);
    const k = Math.min(1, 1400 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.85));
    return b || file;
  } catch { return file; }
}

function MyProducts({ sup, me }: { sup: any; me: Me }) {
  const sections = useSections("ar");
  const allowed = sections.filter((s) => sectionAllowed(sup.categories, s.slug));
  const [rows, setRows] = useState<MyProduct[] | null>(null);
  const [edit, setEdit] = useState<Partial<MyProduct> & { price?: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function load() {
    const { data, error } = await sb().rpc("supplier_my_products");
    setRows(error ? [] : (data as MyProduct[]));
    if (error) setMsg(error.message);
  }
  useEffect(() => { load(); }, []);

  if (sup.status !== "approved") return <p className="tip">إضافة المنتجات بتتفتح أول ما كي بلس تعتمد حسابك.</p>;
  if (!allowed.length) return <p className="tip">مفيش أقسام مسموحة لحسابك لسه. كلم كي بلس علشان تحدد الأقسام اللي بتوردها.</p>;

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !edit) return;
    if (!file.type.startsWith("image/")) return setMsg("ارفع صورة بس (JPG أو PNG أو WebP).");
    if (file.size > 15 * 1024 * 1024) return setMsg("الصورة كبيرة زيادة (أقصى حاجة 15 ميجا).");
    setBusy(true); setMsg("");
    const blob = await shrink(file);
    const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `suppliers/${me.id}/${Date.now()}.${ext}`;
    const c = sb();
    const { error } = await c.storage.from("media").upload(path, blob, { upsert: false, cacheControl: "31536000", contentType: blob.type || file.type });
    setBusy(false);
    if (error) return setMsg("الصورة ماترفعتش: " + error.message);
    setEdit({ ...edit, image_url: c.storage.from("media").getPublicUrl(path).data.publicUrl as string });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true); setMsg("");
    const price = edit.price != null && String(edit.price).trim() !== "" ? Number(String(edit.price).replace(/[^\d.]/g, "")) : null;
    const { error } = await sb().rpc("supplier_save_product", {
      p_id: edit.id ?? null, p_category: edit.category, p_name_ar: edit.name_ar || "", p_name_en: edit.name_en || null,
      p_spec_ar: edit.spec_ar || null, p_unit_ar: edit.unit_ar || null, p_image_url: edit.image_url || null, p_price: price,
    });
    setBusy(false);
    if (error) return setMsg("ماتحفظش: " + error.message);
    setEdit(null); setMsg("اتحفظ. المنتج هيظهر على الموقع بعد مراجعة كي بلس (تعديل السعر بس بيتنشر على طول)."); load();
  }

  async function del() {
    if (!edit?.id) return;
    if (!confirmDel) return setConfirmDel(true);
    setBusy(true);
    const { error } = await sb().rpc("supplier_delete_product", { p_id: edit.id });
    setBusy(false); setConfirmDel(false);
    if (error) return setMsg(error.message);
    setEdit(null); load();
  }

  const secName = (slug: string) => sections.find((s) => s.slug === slug)?.label || slug;
  return (
    <>
      <p className="tip">ضيف منتجاتك في الأقسام المسموحة لحسابك، بصورة وسعر (السعر اختياري). المنتج بيظهر على موقع كي بلس بعد المراجعة. ماتكتبش أرقام تليفونات أو بيانات تواصل في اسم أو وصف المنتج.</p>
      <div className="toolbar">
        <span className="count">{rows?.length || 0} منتج</span>
        <button className="abtn primary" onClick={() => { setConfirmDel(false); setEdit({ category: allowed[0].slug, unit_ar: "قطعة" }); }}>+ منتج جديد</button>
      </div>
      {msg && <p className="okmsg" role="status">{msg}</p>}
      {rows === null ? <p>جاري التحميل…</p> : rows.length === 0 ? <p className="emptyst">لسه ماضفتش منتجات.</p> : (
        <div className="tablewrap"><table className="atbl">
          <thead><tr><th>الصورة</th><th>المنتج</th><th>القسم</th><th>سعرك</th><th>الحالة</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} tabIndex={0} onClick={() => { setConfirmDel(false); setEdit({ ...r, price: r.supplier_price != null ? String(r.supplier_price) : "" }); }}
              onKeyDown={(e) => e.key === "Enter" && setEdit({ ...r, price: r.supplier_price != null ? String(r.supplier_price) : "" })}>
              <td>{r.image_url ? <img src={r.image_url} alt="" className="thumb" /> : "—"}</td>
              <td>{r.name_ar}{r.unit_ar ? <small className="meta"> / {r.unit_ar}</small> : null}</td>
              <td>{secName(r.category)}</td>
              <td>{r.supplier_price != null ? Number(r.supplier_price).toLocaleString("ar-EG") + " ج.م" : "—"}</td>
              <td><span className={"pill " + (P_STATUS[r.status]?.[1] || "")}>{r.status === "approved" && !r.published ? "مخفي" : P_STATUS[r.status]?.[0] || r.status}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {edit && (
        <>
          <div className="scrim" onClick={() => setEdit(null)} />
          <div className="drawer" role="dialog" aria-modal="true" aria-label="منتج">
            <form className="aform" onSubmit={save}>
              <h2 style={{ margin: 0 }}>{edit.id ? "تعديل منتج" : "منتج جديد"}</h2>
              <label>القسم<select id="mp-cat" required value={edit.category || ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                {allowed.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}</select></label>
              <label>اسم المنتج بالعربي<input id="mp-name" required minLength={2} maxLength={200} value={edit.name_ar || ""} onChange={(e) => setEdit({ ...edit, name_ar: e.target.value })} /></label>
              <label>الاسم بالإنجليزي (اختياري)<input id="mp-name-en" dir="ltr" maxLength={200} value={edit.name_en || ""} onChange={(e) => setEdit({ ...edit, name_en: e.target.value })} /></label>
              <label>المواصفات<textarea id="mp-spec" rows={3} maxLength={1000} value={edit.spec_ar || ""} onChange={(e) => setEdit({ ...edit, spec_ar: e.target.value })} placeholder="المقاس، الخامة، الموديل…" /></label>
              <label>الوحدة<input id="mp-unit" maxLength={50} value={edit.unit_ar || ""} onChange={(e) => setEdit({ ...edit, unit_ar: e.target.value })} placeholder="قطعة، متر، طن، شكارة…" /></label>
              <label>السعر (ج.م، اختياري)<input id="mp-price" inputMode="decimal" dir="ltr" value={edit.price ?? ""} onChange={(e) => setEdit({ ...edit, price: e.target.value })} placeholder="سيبه فاضي لو مش عايز تحدد سعر" /></label>
              <div className="imgf"><span>صورة المنتج</span>
                {edit.image_url && <img src={edit.image_url} alt="" />}
                <div className="row">
                  <label className="abtn">{edit.image_url ? "تغيير الصورة" : "رفع صورة"}<input type="file" accept="image/*" hidden onChange={upload} /></label>
                  {edit.image_url && <button type="button" className="abtn" onClick={() => setEdit({ ...edit, image_url: null })}>إزالة</button>}
                </div>
              </div>
              {msg && <p className="err" role="alert">{msg}</p>}
              {confirmDel && <p className="err">دوس "حذف" تاني للتأكيد.</p>}
              <div className="row sticky">
                <button className="abtn primary" disabled={busy}>حفظ</button>
                <button type="button" className="abtn" onClick={() => setEdit(null)}>إلغاء</button>
                {edit.id && <button type="button" className="abtn danger" disabled={busy} onClick={del}>حذف</button>}
              </div>
            </form>
          </div>
        </>
      )}
    </>
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
