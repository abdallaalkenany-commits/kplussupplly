"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/client";
import { CATEGORIES, GOVS, TOP } from "@/lib/content";
import { catArt } from "@/lib/art";
import Crud, { Editor, toCsv, type Field } from "./crud";
import { useMe } from "./shell";

export const CTYPES: [string, string][] = [["developer", "مطور عقاري"], ["contractor", "مقاول"], ["supplier", "مورد"], ["factory", "مصنع"], ["concrete_plant", "محطة خرسانة"], ["company", "شركة"], ["individual", "فرد"], ["other", "أخرى"]];
export const Q_STATUS: [string, string][] = [["new", "جديد"], ["contacted", "اتواصلنا"], ["quoted", "اتبعت عرض سعر"], ["won", "اتكسب"], ["lost", "اتخسر"]];
const CAT_OPTS: [string, string][] = CATEGORIES.map((c) => [c.slug, c.ar.nav]);
const TOP_OPTS: [string, string][] = TOP.map((c) => [c.slug, c.ar.nav]);
const GOV_OPTS: [string, string][] = GOVS.ar.map((g) => [g, g]);
const fmtDate = (d: string) => new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
const money = (v: number | null) => (v == null ? "—" : Number(v).toLocaleString("ar-EG") + " ج.م");

/* ---------------- dashboard ---------------- */
export function Dashboard() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const c = sb();
      const [stats, recent, sup, follow, cust, leads, wa] = await Promise.all([
        c.from("quote_stats").select("*"),
        c.from("quote_requests").select("id,name,phone,product,status,created_at").order("created_at", { ascending: false }).limit(8),
        c.from("suppliers").select("id", { count: "exact", head: true }).eq("status", "pending"),
        c.from("quote_requests").select("id,name,product,follow_up_at,status").not("follow_up_at", "is", null).lte("follow_up_at", new Date().toISOString().slice(0, 10)).in("status", ["new", "contacted", "quoted"]).order("follow_up_at"),
        c.from("customers").select("id", { count: "exact", head: true }).eq("stage", "customer"),
        c.from("customers").select("id", { count: "exact", head: true }).eq("stage", "lead"),
        c.from("wa_clicks").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()),
      ]);
      setS({ stats: stats.data || [], recent: recent.data || [], pendingSup: sup.count || 0, follow: follow.data || [], customers: cust.count || 0, leads: leads.count || 0, wa: wa.count || 0 });
    })();
  }, []);
  if (!s) return <p>جاري التحميل…</p>;
  const by = (k: string) => s.stats.find((x: any) => x.status === k) || { n: 0, amount: 0, n30: 0 };
  const total = s.stats.reduce((a: number, x: any) => a + x.n, 0);
  const total30 = s.stats.reduce((a: number, x: any) => a + x.n30, 0);
  const won = by("won"), lost = by("lost");
  const rate = won.n + lost.n ? Math.round((won.n / (won.n + lost.n)) * 100) : 0;
  return (
    <div className="dash">
      <div className="kpis">
        <Kpi label="طلبات جديدة محتاجة رد" value={by("new").n} href="/admin/quotes/?status=new" hot={by("new").n > 0} />
        <Kpi label="طلبات آخر 30 يوم" value={total30} sub={`الإجمالي ${total}`} />
        <Kpi label="عروض أسعار مفتوحة" value={by("quoted").n} sub={money(by("quoted").amount)} />
        <Kpi label="صفقات اتكسبت" value={won.n} sub={money(won.amount)} />
        <Kpi label="نسبة الكسب" value={rate + "%"} sub="من الطلبات المقفولة" />
        <Kpi label="موردين مستنيين موافقة" value={s.pendingSup} href="/admin/suppliers/" hot={s.pendingSup > 0} />
        <Kpi label="عملاء محتملين" value={s.leads} href="/admin/customers/" />
        <Kpi label="عملاء (بكود)" value={s.customers} href="/admin/customers/" />
        <Kpi label="ضغطات واتساب آخر 7 أيام" value={s.wa} href="/admin/whatsapp/" />
      </div>
      <div className="two">
        <section className="box"><h2>متابعات النهارده والمتأخرة</h2>
          {s.follow.length === 0 ? <p className="emptyst">مفيش متابعات متأخرة.</p> : <ul className="list">{s.follow.map((r: any) => <li key={r.id}><Link href={`/admin/quotes/?id=${r.id}`}>#{r.id} {r.name} — {r.product}</Link><span className="late">{r.follow_up_at}</span></li>)}</ul>}
        </section>
        <section className="box"><h2>أحدث الطلبات</h2>
          <ul className="list">{s.recent.map((r: any) => <li key={r.id}><Link href={`/admin/quotes/?id=${r.id}`}>#{r.id} {r.name} — {r.product || "—"}</Link><span className={"pill s-" + r.status}>{Q_STATUS.find(([k]) => k === r.status)?.[1]}</span></li>)}</ul>
        </section>
      </div>
    </div>
  );
}
function Kpi({ label, value, sub, href, hot }: { label: string; value: any; sub?: string; href?: string; hot?: boolean }) {
  const inner = <><span className="kl">{label}</span><b className="kv">{value}</b>{sub && <span className="ks">{sub}</span>}</>;
  return href ? <Link href={href} className={"kpi" + (hot ? " hot" : "")}>{inner}</Link> : <div className="kpi">{inner}</div>;
}

/* ---------------- quotes pipeline ---------------- */
export function Quotes() {
  const me = useMe();
  const [rows, setRows] = useState<any[] | null>(null);
  const [staff, setStaff] = useState<[string, string][]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<any>(null);
  const [view, setView] = useState<"board" | "table">("board");

  async function load() {
    const { data } = await sb().from("quote_requests").select("*").order("created_at", { ascending: false }).limit(2000);
    setRows(data || []);
  }
  useEffect(() => {
    load();
    sb().from("profiles").select("id,full_name,email").in("role", ["admin", "sales"]).then(({ data }: any) => setStaff((data || []).map((p: any) => [p.id, p.full_name || p.email])));
    const p = new URLSearchParams(location.search);
    if (p.get("status")) setStatus(p.get("status")!);
    if (p.get("id")) sb().from("quote_requests").select("*").eq("id", p.get("id")).single().then(({ data }: any) => data && setOpen(data));
    if (window.innerWidth < 800) setView("table");
  }, []);

  const shown = useMemo(() => (rows || []).filter((r) => (!status || r.status === status) && (!q || [r.name, r.phone, r.product, r.company, r.location, String(r.id)].some((x) => String(x ?? "").includes(q)))), [rows, status, q]);
  const fields: Field[] = [
    { key: "id", label: "رقم" }, { key: "created_at", label: "التاريخ" }, { key: "name", label: "الاسم" }, { key: "phone", label: "الموبايل" },
    { key: "company", label: "الشركة" }, { key: "customer_type", label: "النشاط" }, { key: "product", label: "المنتج" }, { key: "quantity", label: "الكمية" }, { key: "location", label: "الموقع" }, { key: "map_url", label: "اللوكيشن" },
    { key: "source", label: "المصدر" }, { key: "status", label: "الحالة" }, { key: "quoted_amount", label: "قيمة العرض" }, { key: "follow_up_at", label: "المتابعة" }, { key: "notes", label: "ملاحظات" },
  ];

  async function move(r: any, st: string) {
    await sb().from("quote_requests").update({ status: st }).eq("id", r.id);
    await sb().from("activities").insert({ quote_id: r.id, customer_id: r.customer_id, kind: "status", body: `الحالة: ${Q_STATUS.find(([k]) => k === st)?.[1]}` });
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <input id="q-search" className="search" placeholder="بحث بالاسم أو الموبايل أو الرقم…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select id="q-status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">كل الحالات</option>{Q_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <div className="seg"><button className={view === "board" ? "on" : ""} onClick={() => setView("board")}>مراحل</button><button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>جدول</button></div>
        <span className="count">{shown.length} طلب</span>
        <button className="abtn" onClick={() => toCsv(shown, fields, "quotes")}>تصدير Excel</button>
      </div>
      {rows === null ? <p>جاري التحميل…</p> : view === "board" ? (
        <div className="board">
          {Q_STATUS.filter(([k]) => !status || k === status).map(([k, l]) => {
            const col = shown.filter((r) => r.status === k);
            return (
              <section key={k} className={"col s-" + k}>
                <h3>{l} <span>{col.length}</span></h3>
                {col.map((r) => (
                  <button key={r.id} className="qcard" onClick={() => setOpen(r)}>
                    <b>{r.name}{r.source === "whatsapp" && <em className="src wa"> واتساب</em>}</b><span>{r.product || "—"}{r.quantity ? ` · ${r.quantity}` : ""}</span>
                    <small>#{r.id} · {new Date(r.created_at).toLocaleDateString("ar-EG")}{r.quoted_amount ? ` · ${money(r.quoted_amount)}` : ""}</small>
                    {r.follow_up_at && <small className={r.follow_up_at <= new Date().toISOString().slice(0, 10) ? "late" : ""}>متابعة {r.follow_up_at}</small>}
                  </button>
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="tablewrap"><table className="atbl">
          <thead><tr><th>#</th><th>التاريخ</th><th>الاسم</th><th>الموبايل</th><th>المنتج</th><th>الكمية</th><th>الحالة</th><th>القيمة</th></tr></thead>
          <tbody>{shown.map((r) => <tr key={r.id} onClick={() => setOpen(r)} tabIndex={0}><td>{r.id}</td><td>{new Date(r.created_at).toLocaleDateString("ar-EG")}</td><td>{r.name}{r.source === "whatsapp" && <em className="src wa"> واتساب</em>}</td><td dir="ltr">{r.phone}</td><td>{r.product}</td><td>{r.quantity}</td><td><span className={"pill s-" + r.status}>{Q_STATUS.find(([k]) => k === r.status)?.[1]}</span></td><td>{money(r.quoted_amount)}</td></tr>)}</tbody>
        </table></div>
      )}
      {open && <QuoteDrawer row={open} staff={staff} me={me.id} onClose={() => setOpen(null)} onChanged={(r) => { setOpen(r); load(); }} onMove={move} />}
    </div>
  );
}

function QuoteDrawer({ row, staff, me, onClose, onChanged, onMove }: { row: any; staff: [string, string][]; me: string; onClose: () => void; onChanged: (r: any) => void; onMove: (r: any, s: string) => void }) {
  const [acts, setActs] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState("note");
  const loadActs = () => sb().from("activities").select("*").eq("quote_id", row.id).order("created_at", { ascending: false }).then(({ data }: any) => setActs(data || []));
  useEffect(() => { loadActs(); }, [row.id]);

  const fields: Field[] = [
    { key: "status", label: "الحالة", type: "select", options: Q_STATUS, required: true },
    { key: "quoted_amount", label: "قيمة عرض السعر (ج.م)", type: "number" },
    { key: "assigned_to", label: "المسؤول", type: "select", options: staff },
    { key: "follow_up_at", label: "ميعاد المتابعة", type: "date" },
    { key: "name", label: "الاسم", required: true }, { key: "phone", label: "الموبايل", ltr: true, required: true },
    { key: "company", label: "الشركة" }, { key: "customer_type", label: "نوع النشاط", type: "select", options: CTYPES.slice(0, 5) }, { key: "email", label: "الإيميل", ltr: true },
    { key: "product", label: "المنتج" }, { key: "quantity", label: "الكمية" }, { key: "location", label: "موقع المشروع" },
    { key: "map_url", label: "لوكيشن الخريطة (رابط)", ltr: true },
    { key: "notes", label: "ملاحظات العميل", type: "textarea" },
  ];
  async function save(r: any) {
    const before = row.status;
    const { data, error } = await sb().from("quote_requests").update(r).eq("id", row.id).select().single();
    if (error) return error.message;
    if (r.status !== before) await sb().from("activities").insert({ quote_id: row.id, customer_id: row.customer_id, kind: "status", body: `الحالة: ${Q_STATUS.find(([k]) => k === r.status)?.[1]}` });
    onChanged(data); return null;
  }
  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    await sb().from("activities").insert({ quote_id: row.id, customer_id: row.customer_id, kind, body: note.trim(), author: me });
    setNote(""); loadActs();
  }
  const waText = `أهلاً ${row.name}، معاك كي بلس بخصوص طلبك رقم ${row.id} (${row.product || ""}).`;
  const kinds: [string, string][] = [["note", "ملاحظة"], ["call", "مكالمة"], ["whatsapp", "واتساب"], ["email", "إيميل"], ["visit", "زيارة"]];
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <Editor fields={fields} row={row} folder="quotes" onSave={save} onCancel={onClose} extra={
        <div className="acts">
          <div className="row">
            <a className="abtn wa" href={`https://wa.me/${String(row.phone).replace(/\D/g, "").replace(/^0/, "20")}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener">واتساب العميل</a>
            <a className="abtn" href={`tel:${row.phone}`}>اتصال</a>
            {row.map_url && <a className="abtn" href={row.map_url} target="_blank" rel="noopener">📍 فتح اللوكيشن</a>}
            {Q_STATUS.filter(([k]) => k !== row.status).slice(0, 3).map(([k, l]) => <button type="button" key={k} className="abtn" onClick={() => onMove(row, k)}>← {l}</button>)}
          </div>
          <p className="meta">طلب #{row.id} · {fmtDate(row.created_at)} · من صفحة <span dir="ltr">{row.page || "—"}</span></p>
          <h3>سجل المتابعة</h3>
          <div className="addnote">
            <select id="act-kind" value={kind} onChange={(e) => setKind(e.target.value)}>{kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <input id="act-note" placeholder="اكتب اللي حصل…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(e); }} />
            <button type="button" className="abtn" onClick={addNote}>إضافة</button>
          </div>
          <ul className="timeline">{acts.map((a) => <li key={a.id}><b>{kinds.find(([k]) => k === a.kind)?.[1] || "تحديث"}</b> {a.body}<small>{fmtDate(a.created_at)}</small></li>)}</ul>
        </div>
      } />
    </>
  );
}

/* ---------------- customers ---------------- */
export const STAGES: [string, string][] = [["lead", "عميل محتمل"], ["customer", "عميل"]];
export function Customers() {
  const fields: Field[] = [
    { key: "code", label: "كود العميل", readonly: true, list: true },
    { key: "stage", label: "التصنيف", type: "select", options: STAGES, required: true, list: true },
    { key: "name", label: "الاسم", required: true, list: true }, { key: "phone", label: "الموبايل", ltr: true, list: true },
    { key: "company", label: "الشركة", list: true },
    { key: "type", label: "نوع النشاط", type: "select", options: CTYPES, list: true },
    { key: "governorate", label: "المحافظة / الموقع", list: true }, { key: "map_url", label: "لوكيشن الخريطة (رابط)", ltr: true }, { key: "email", label: "الإيميل", ltr: true },
    { key: "notes", label: "ملاحظات", type: "textarea" }, { key: "created_at", label: "تاريخ الإضافة", readonly: true, list: true },
  ];
  return <><p className="emptyst">أي حد يبعت طلب أو يدوس واتساب في الموقع بيتسجل هنا كـ<b>عميل محتمل</b>. أول ما طلب ليه يتحول لـ"اتكسب"، أو تغيّر تصنيفه لـ"عميل"، بياخد كود تلقائي (KP-0001).</p>
  <Crud table="customers" title="عميل" fields={fields} order="created_at" newRow={{ type: "contractor", stage: "lead" }} filters={{ key: "stage", options: STAGES }} csvName="customers" extraFor={(r) => <CustomerHistory id={r.id} />} /></>;
}
function CustomerHistory({ id }: { id: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { sb().from("quote_requests").select("id,created_at,product,quantity,status,quoted_amount").eq("customer_id", id).order("created_at", { ascending: false }).then(({ data }: any) => setRows(data || [])); }, [id]);
  const total = rows.filter((r) => r.status === "won").reduce((a, r) => a + Number(r.quoted_amount || 0), 0);
  return (
    <div className="acts"><h3>طلبات العميل ({rows.length}) · إجمالي المكسوب {money(total)}</h3>
      <ul className="list">{rows.map((r) => <li key={r.id}><Link href={`/admin/quotes/?id=${r.id}`}>#{r.id} {r.product} {r.quantity ? `· ${r.quantity}` : ""}</Link><span className={"pill s-" + r.status}>{Q_STATUS.find(([k]) => k === r.status)?.[1]}</span></li>)}</ul>
    </div>
  );
}

/* ---------------- suppliers ---------------- */
export function Suppliers() {
  const fields: Field[] = [
    { key: "company_name", label: "الشركة", required: true, list: true }, { key: "contact_name", label: "المسؤول", list: true },
    { key: "phone", label: "الموبايل", ltr: true, list: true }, { key: "email", label: "الإيميل", ltr: true },
    { key: "governorate", label: "المحافظة", type: "select", options: GOV_OPTS, list: true },
    { key: "categories", label: "الأقسام", type: "multi", options: TOP_OPTS, list: true },
    { key: "products", label: "المنتجات والماركات", type: "textarea" },
    { key: "cr_number", label: "السجل التجاري", ltr: true }, { key: "tax_number", label: "البطاقة الضريبية", ltr: true }, { key: "website", label: "الموقع", ltr: true },
    { key: "status", label: "الحالة", type: "select", options: [["pending", "تحت المراجعة"], ["approved", "معتمد"], ["rejected", "مرفوض"]], required: true, list: true },
    { key: "rating", label: "التقييم (1-5)", type: "number" },
    { key: "internal_notes", label: "ملاحظات داخلية", type: "textarea" },
    { key: "created_at", label: "تاريخ التسجيل", readonly: true, list: true },
  ];
  return <Crud table="suppliers" title="مورد" fields={fields} order="created_at" newRow={{ status: "approved", categories: [], files: [] }} csvName="suppliers"
    filters={{ key: "status", options: [["pending", "تحت المراجعة"], ["approved", "معتمد"], ["rejected", "مرفوض"]] }} extraFor={(r) => <SupplierDocs row={r} />} />;
}
function SupplierDocs({ row }: { row: any }) {
  const [links, setLinks] = useState<Record<string, string>>({});
  useEffect(() => {
    (row.files || []).forEach(async (f: any) => {
      const { data } = await sb().storage.from("supplier-docs").createSignedUrl(f.path, 3600);
      if (data) setLinks((p) => ({ ...p, [f.path]: data.signedUrl }));
    });
  }, [row.id]);
  return (
    <div className="acts"><h3>مستندات المورد</h3>
      {(row.files || []).length === 0 ? <p className="emptyst">مرفعش مستندات لسه.</p> : <ul className="list">{row.files.map((f: any) => <li key={f.path}><a href={links[f.path]} target="_blank" rel="noopener">{f.name}</a><small>{new Date(f.at).toLocaleDateString("ar-EG")}</small></li>)}</ul>}
    </div>
  );
}

/* ---------------- products ---------------- */
export function Products() {
  const catOpts = useCatOpts();
  const fields: Field[] = [
    { key: "image_url", label: "الصورة", type: "image", list: true },
    { key: "category", label: "القسم", type: "select", options: catOpts, required: true, list: true },
    { key: "name_ar", label: "الاسم بالعربي", required: true, list: true }, { key: "name_en", label: "الاسم بالإنجليزي", ltr: true },
    { key: "spec_ar", label: "المواصفات بالعربي", type: "textarea" }, { key: "spec_en", label: "المواصفات بالإنجليزي", type: "textarea" },
    { key: "unit_ar", label: "الوحدة بالعربي", list: true }, { key: "unit_en", label: "الوحدة بالإنجليزي", ltr: true },
    { key: "price", label: "السعر (ج.م)", type: "number", list: true }, { key: "show_price", label: "اعرض السعر على الموقع", type: "bool", list: true },
    { key: "active", label: "ظاهر على الموقع", type: "bool", list: true }, { key: "sort", label: "الترتيب (الأصغر الأول)", type: "number" },
  ];
  return (
    <>
      <p className="tip">أي تعديل هنا بيظهر على الموقع خلال 5 دقايق. لو قسم مفيهوش منتجات هنا، الموقع بيعرض المنتجات الافتراضية.</p>
      <Crud table="products" title="منتج" fields={fields} order="category" asc newRow={{ active: true, show_price: false, sort: 100 }} folder="products" csvName="products"
        filters={{ key: "category", options: catOpts }} />
    </>
  );
}

/* ---------------- offers ---------------- */
export function Offers() {
  const catOpts = useCatOpts();
  const fields: Field[] = [
    { key: "image_url", label: "صورة العرض", type: "image", list: true },
    { key: "title_ar", label: "عنوان العرض بالعربي", required: true, list: true }, { key: "title_en", label: "العنوان بالإنجليزي", ltr: true },
    { key: "discount_label", label: "شارة الخصم (مثال: خصم 10%)", list: true },
    { key: "body_ar", label: "التفاصيل بالعربي", type: "textarea" }, { key: "body_en", label: "التفاصيل بالإنجليزي", type: "textarea" },
    { key: "category", label: "القسم", type: "select", options: catOpts },
    { key: "old_price", label: "السعر قبل الخصم", type: "number" }, { key: "new_price", label: "السعر بعد الخصم", type: "number", list: true },
    { key: "unit_ar", label: "الوحدة بالعربي" }, { key: "unit_en", label: "الوحدة بالإنجليزي", ltr: true },
    { key: "starts_on", label: "يبدأ من", type: "date" }, { key: "ends_on", label: "ينتهي في", type: "date", list: true },
    { key: "active", label: "ظاهر على الموقع", type: "bool", list: true }, { key: "sort", label: "الترتيب", type: "number" },
  ];
  return (
    <>
      <p className="tip">العروض بتظهر في صفحة <a href="/offers/" target="_blank" rel="noopener">العروض</a> وفي الصفحة الرئيسية، وبتختفي لوحدها بعد تاريخ الانتهاء.</p>
      <Crud table="offers" title="عرض" fields={fields} order="created_at" newRow={{ active: true, sort: 100 }} folder="offers" csvName="offers" />
    </>
  );
}

/* ---------------- website sections: images/icons, hide built-in, add/delete new ---------------- */
const RESERVED = ["about", "contact", "offers", "suppliers", "calculator", "guides", "prices", "account", "admin", "en", "assets", "img"];

// section options for product/offer forms: built-in sections + sections added in the admin panel
function useCatOpts() {
  const [opts, setOpts] = useState<[string, string][]>(CAT_OPTS);
  useEffect(() => {
    sb().from("categories").select("slug,nav_ar,hidden").eq("custom", true).then(({ data, error }: any) => {
      if (!error && data?.length) setOpts([...CAT_OPTS, ...data.map((r: any) => [r.slug, r.nav_ar + (r.hidden ? " (مخفي)" : "")] as [string, string])]);
    });
  }, []);
  return opts;
}

export function Categories() {
  const [rows, setRows] = useState<Record<string, any>>({});
  const [edit, setEdit] = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [ready, setReady] = useState(true);
  const load = () => sb().from("categories").select("*").then(({ data }: any) => {
    const m: any = {}; (data || []).forEach((r: any) => (m[r.slug] = r)); setRows(m);
    // the "hidden"/"custom" columns come from supabase/007_categories_manage.sql
    setReady(!(data || []).length || "custom" in (data || [])[0]);
  });
  useEffect(() => { load(); }, []);
  const custom = Object.values(rows).filter((r: any) => r.custom).sort((a: any, b: any) => (a.sort ?? 100) - (b.sort ?? 100));
  const parents: [string, string][] = [...TOP.map((c) => [c.slug, c.ar.nav] as [string, string]), ...custom.filter((r: any) => !r.parent).map((r: any) => [r.slug, r.nav_ar] as [string, string])];

  const imgFields: Field[] = [
    { key: "icon_url", label: "الأيقونة (مربعة، PNG أو SVG)", type: "image" }, { key: "image_url", label: "صورة القسم", type: "image" },
  ];
  const builtInFields: Field[] = [{ key: "hidden", label: "إخفاء القسم من الموقع (القائمة والصفحة الرئيسية والفوتر، وصفحته بتقفل)", type: "bool" }, ...imgFields];
  const customFields = (isNew: boolean): Field[] => [
    { key: "nav_ar", label: "اسم القسم (عربي)", required: true },
    isNew ? { key: "slug_part", label: "رابط القسم بالإنجليزي (حروف صغيرة وأرقام وشرطة، مثلاً upvc-doors)", ltr: true, required: true }
      : { key: "slug", label: "رابط القسم", readonly: true },
    isNew ? { key: "parent", label: "تابع لقسم (اختياري: سيبه فاضي لو قسم رئيسي)", type: "select", options: parents }
      : { key: "parent", label: "تابع لقسم", type: "select", options: parents, readonly: true },
    { key: "hidden", label: "مخفي (مش ظاهر على الموقع)", type: "bool" },
    { key: "menu", label: "يظهر في القائمة العلوية (للأقسام الرئيسية)", type: "bool" },
    { key: "sort", label: "الترتيب (الأصغر الأول)", type: "number" },
    ...imgFields,
    { key: "h1_ar", label: "العنوان الكبير في الصفحة (عربي)" },
    { key: "lead_ar", label: "المقدمة (عربي)", type: "textarea" },
    { key: "body_ar", label: "محتوى الصفحة (عربي): افصل الفقرات بسطر فاضي، وابدأ العنوان الفرعي بـ #", type: "textarea" },
    { key: "title_ar", label: "عنوان جوجل (SEO) — حوالي 60 حرف" },
    { key: "desc_ar", label: "وصف جوجل (SEO) — حوالي 155 حرف", type: "textarea" },
    { key: "nav_en", label: "Section name (English) — لو فاضي القسم مش هيظهر في النسخة الإنجليزي", ltr: true },
    { key: "h1_en", label: "Page heading (English)", ltr: true }, { key: "lead_en", label: "Intro (English)", type: "textarea" },
    { key: "body_en", label: "Page content (English)", type: "textarea" },
    { key: "title_en", label: "Google title (English)", ltr: true }, { key: "desc_en", label: "Google description (English)", type: "textarea" },
  ];

  async function save(r: any) {
    const client = sb();
    if (edit.__builtin) {
      const { error } = await client.from("categories").upsert({ slug: edit.slug, hidden: r.hidden, icon_url: r.icon_url, image_url: r.image_url });
      if (error) return error.message;
    } else if (edit.__new) {
      const part = String(r.slug_part || "").trim().toLowerCase();
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(part)) return "الرابط لازم يكون حروف إنجليزي صغيرة وأرقام وشرطة بس، مثلاً upvc-doors.";
      const slug = r.parent ? `${r.parent}/${part}` : part;
      if (RESERVED.includes(part) || CATEGORIES.some((c) => c.slug === slug) || rows[slug]) return "الرابط ده مستخدم قبل كده، اختار رابط تاني.";
      const { slug_part, ...rest } = r;
      const { error } = await client.from("categories").insert({ ...rest, slug, custom: true, parent: r.parent || null, sort: r.sort ?? 100, menu: r.menu ?? true });
      if (error) return error.message;
    } else {
      const { slug, parent, ...rest } = r;
      const { error } = await client.from("categories").update(rest).eq("slug", edit.slug);
      if (error) return error.message;
    }
    setEdit(null); load(); return null;
  }
  async function del() {
    if (custom.some((r: any) => r.parent === edit.slug)) { alert("القسم ده تحته أقسام فرعية. امسحها أو انقلها الأول."); return; }
    if (!confirmDel) { setConfirmDel(true); return; }
    await sb().from("categories").delete().eq("slug", edit.slug);
    setConfirmDel(false); setEdit(null); load();
  }
  const open = (row: any) => { setConfirmDel(false); setEdit(row); };
  const status = (r: any) => <span className={"pill " + (r.hidden ? "s-lost" : "s-won")}>{r.hidden ? "مخفي" : "ظاهر"}</span>;

  return (
    <>
      {!ready && <p className="err">لإضافة وإخفاء الأقسام لازم يتشغل ملف supabase/007_categories_manage.sql مرة واحدة في Supabase. تعديل الصور والأيقونات شغال عادي.</p>}
      <p className="tip">اضغط على أي قسم لتعديل صورته وأيقونته أو إخفائه. الأقسام الأساسية مكتوب محتواها في الموقع فينفع تخفيها بس، والأقسام اللي بتضيفها انت تقدر تعدّل كل نصوصها أو تمسحها. التعديلات بتظهر خلال 5 دقايق. <b>تنبيه:</b> إخفاء قسم بيقفل صفحته، فلو جوجل كان مفهرسها هتطلع "مش موجودة".</p>
      <div className="toolbar"><b>الأقسام الأساسية</b><span className="count">{CATEGORIES.length} قسم</span></div>
      <div className="catgrid">
        {CATEGORIES.map((c) => {
          const r = rows[c.slug] || {};
          return (
            <button key={c.slug} className={"catcard" + (r.hidden ? " off" : "")} onClick={() => open({ slug: c.slug, hidden: false, ...r, __builtin: true })}>
              {r.image_url ? <img src={r.image_url} alt="" className="cimg" /> : catArt(c.slug) ? <img src={catArt(c.slug)} alt="" className="cimg" title="الصورة الافتراضية" /> : <div className="cimg ph">بدون صورة</div>}
              <span className="ic">{r.icon_url ? <img src={r.icon_url} alt="" /> : "—"}</span>
              <b>{c.ar.nav}</b><small dir="ltr">/{c.slug}/</small>{status(r)}
            </button>
          );
        })}
      </div>
      <div className="toolbar" style={{ marginTop: 22 }}>
        <b>أقسام أضفتها</b><span className="count">{custom.length} قسم</span>
        <button className="abtn primary" disabled={!ready} onClick={() => open({ __new: true, menu: true, hidden: false, sort: 100 })}>+ إضافة قسم جديد</button>
      </div>
      {custom.length === 0 ? <p className="emptyst">لسه مفيش أقسام مضافة.</p> : (
        <div className="catgrid">
          {custom.map((r: any) => (
            <button key={r.slug} className={"catcard" + (r.hidden ? " off" : "")} onClick={() => open({ ...r })}>
              {r.image_url ? <img src={r.image_url} alt="" className="cimg" /> : <div className="cimg ph">بدون صورة</div>}
              <span className="ic">{r.icon_url ? <img src={r.icon_url} alt="" /> : "—"}</span>
              <b>{r.nav_ar}</b><small dir="ltr">/{r.slug}/</small>{status(r)}
            </button>
          ))}
        </div>
      )}
      {edit && <><div className="scrim" onClick={() => setEdit(null)} />
        <Editor key={edit.slug || "new"} fields={edit.__builtin ? builtInFields : customFields(Boolean(edit.__new))} row={edit} folder="categories" onSave={save} onCancel={() => setEdit(null)}
          onDelete={!edit.__builtin && !edit.__new ? del : undefined}
          extra={<>{confirmDel && <p className="err">دوس "حذف" تاني للتأكيد. المنتجات اللي في القسم ده مش هتتمسح، بس مش هتظهر لحد ما تنقلها لقسم تاني.</p>}
            {!edit.__new && <a className="abtn" href={`/${edit.slug}/`} target="_blank" rel="noopener">فتح صفحة القسم</a>}</>} />
      </>}
    </>
  );
}

/* ---------------- partner logos (clients / agents & distributors) ---------------- */
const P_KINDS: [string, string][] = [["client", "شركاء النجاح (عميل)"], ["brand", "وكلاء وموزعون (مورد/براند)"]];
export function Partners() {
  const fields: Field[] = [
    { key: "logo_url", label: "اللوجو", type: "image", required: true, list: true, hint: "PNG شفاف أو SVG أو WebP، يفضّل ارتفاع 160 بكسل تقريبًا." },
    { key: "kind", label: "يظهر في", type: "select", options: P_KINDS, required: true, list: true },
    { key: "name_ar", label: "الاسم بالعربي", required: true, list: true }, { key: "name_en", label: "الاسم بالإنجليزي", ltr: true },
    { key: "website", label: "موقع الشركة (اختياري)", ltr: true },
    { key: "active", label: "ظاهر على الموقع", type: "bool", list: true }, { key: "sort", label: "الترتيب (الأصغر الأول)", type: "number", list: true },
  ];
  return (
    <>
      <p className="tip">اللوجوهات دي بتظهر في الشريط المتحرك في الصفحة الرئيسية وصفحة من نحن. لإخفاء لوجو من غير ما تمسحه شيل علامة "ظاهر على الموقع". التعديل بيظهر على الموقع خلال 5 دقايق.</p>
      <Crud table="partners" title="لوجو" fields={fields} order="sort" asc newRow={{ kind: "client", active: true, sort: 100 }} folder="partners" csvName="partners" filters={{ key: "kind", options: P_KINDS }} />
    </>
  );
}

/* ---------------- site design (admin only) ---------------- */
export function Design() {
  const [row, setRow] = useState<any>(undefined);
  const [key, setKey] = useState(0);
  useEffect(() => { sb().from("site_design").select("*").eq("id", 1).maybeSingle().then(({ data, error }: any) => setRow(error ? null : data || null)); }, [key]);
  const fields: Field[] = [
    { key: "logo_url", label: "لوجو الهيدر (أعلى الصفحة)", type: "image", hint: "لو فاضي بيظهر لوجو KPLUS الحالي. يفضّل PNG شفاف بارتفاع 96 بكسل." },
    { key: "logo_white_url", label: "لوجو الفوتر (أبيض على خلفية غامقة)", type: "image" },
    { key: "favicon_url", label: "أيقونة تبويب المتصفح (Favicon)", type: "image", hint: "مربعة PNG مقاس 512×512." },
    { key: "color_primary", label: "اللون الأساسي (الكحلي)", type: "color", hint: "الافتراضي ‎#0B2545" },
    { key: "color_accent", label: "لون الأزرار والتمييز (البرتقالي)", type: "color", hint: "الافتراضي ‎#F29F05" },
    { key: "hero_title_ar", label: "عنوان الصفحة الرئيسية (عربي)" }, { key: "hero_text_ar", label: "نص الصفحة الرئيسية (عربي)", type: "textarea" },
    { key: "hero_title_en", label: "عنوان الصفحة الرئيسية (إنجليزي)", ltr: true }, { key: "hero_text_en", label: "نص الصفحة الرئيسية (إنجليزي)", type: "textarea" },
    { key: "hero_img_1", label: "صورة الواجهة 1", type: "image" }, { key: "hero_img_2", label: "صورة الواجهة 2", type: "image" },
    { key: "hero_img_3", label: "صورة الواجهة 3", type: "image" }, { key: "hero_img_4", label: "صورة الواجهة 4", type: "image" },
    { key: "show_partners", label: "إظهار شريط شركاء النجاح والوكلاء", type: "bool" },
    { key: "show_offers", label: "إظهار العروض في الصفحة الرئيسية", type: "bool" },
  ];
  async function save(r: any) {
    const { error } = await sb().from("site_design").update(r).eq("id", 1);
    if (error) return error.message;
    setKey((k) => k + 1); return null;
  }
  if (row === undefined) return <p>جاري التحميل…</p>;
  if (row === null) return <p className="err">جدول التصميم لسه مش موجود في قاعدة البيانات. لازم يتشغل ملف supabase/006_partners_design.sql مرة واحدة في Supabase.</p>;
  return (
    <>
      <p className="tip">أي خانة تسيبها فاضية بيرجع فيها التصميم الافتراضي. التعديلات بتظهر على الموقع خلال 5 دقايق. <a href="/" target="_blank" rel="noopener">فتح الموقع</a></p>
      <div className="inline-editor"><Editor key={key} fields={fields} row={row} folder="design" onSave={save} onCancel={() => setKey((k) => k + 1)} /></div>
    </>
  );
}

/* ---------------- users & roles (admin only) ---------------- */
export function Users() {
  const me = useMe();
  if (me.role !== "admin") return <p>الصفحة دي للمدير بس.</p>;
  const fields: Field[] = [
    { key: "email", label: "الإيميل", readonly: true, list: true }, { key: "full_name", label: "الاسم", list: true }, { key: "phone", label: "الموبايل", ltr: true, list: true },
    { key: "company", label: "الشركة", list: true },
    { key: "role", label: "الصلاحية", type: "select", options: [["admin", "مدير"], ["sales", "مبيعات"], ["customer", "عميل"], ["supplier", "مورد"]], required: true, list: true },
    { key: "created_at", label: "تاريخ التسجيل", readonly: true, list: true },
  ];
  return (
    <>
      <WaAlerts />
      <p className="tip">علشان تضيف موظف: خليه يعمل حساب من صفحة "حسابي" على الموقع، وبعدين غيّر صلاحيته هنا لـ "مبيعات" أو "مدير".</p>
      <Crud table="profiles" title="مستخدم" fields={fields} order="created_at" canDelete={false} csvName="users"
        filters={{ key: "role", options: [["admin", "مدير"], ["sales", "مبيعات"], ["customer", "عميل"], ["supplier", "مورد"]] }} />
    </>
  );
}

/* ---------------- whatsapp alerts (CallMeBot) ---------------- */
function WaAlerts() {
  const [v, setV] = useState<{ phone: string; key: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    sb().from("app_settings").select("key,value").in("key", ["callmebot_phone", "callmebot_apikey"]).then(({ data, error }: any) => {
      if (error) { setMsg("لازم تشغّل ملف التحديث 005 في Supabase الأول."); setV({ phone: "+201028879918", key: "" }); return; }
      const m: any = {}; (data || []).forEach((r: any) => (m[r.key] = r.value));
      setV({ phone: m.callmebot_phone || "+201028879918", key: m.callmebot_apikey || "" });
    });
  }, []);
  async function save(test: boolean) {
    if (!v) return;
    setBusy(true); setMsg("");
    const { error } = await sb().from("app_settings").upsert([
      { key: "callmebot_phone", value: v.phone.replace(/[^\d+]/g, ""), updated_at: new Date().toISOString() },
      { key: "callmebot_apikey", value: v.key.trim(), updated_at: new Date().toISOString() },
    ]);
    if (error) { setBusy(false); return setMsg("مااتحفظش: " + error.message); }
    if (test) {
      const r = await sb().rpc("wa_notify_test");
      setMsg(r.error ? "اتحفظ، بس التجربة فشلت: " + r.error.message : "اتحفظ، وبعتنا رسالة تجربة. لو ماوصلتش خلال دقيقة راجع الرقم والمفتاح.");
    } else setMsg("اتحفظ.");
    setBusy(false);
  }
  if (!v) return null;
  return (
    <section className="box" style={{ marginBottom: 16 }}>
      <h2>تنبيهات واتساب للطلبات الجديدة</h2>
      <p className="tip">كل طلب جديد من الموقع بيوصل رسالة أوتوماتيك على الرقم ده. المفتاح بيوصلك من CallMeBot مرة واحدة بس (الخطوات في رسالة التفعيل).</p>
      <div className="aform" style={{ maxWidth: 520 }}>
        <label>رقم واتساب اللي هيستقبل التنبيهات (بكود الدولة)<input id="cmb-phone" dir="ltr" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></label>
        <label>مفتاح CallMeBot (apikey)<input id="cmb-key" dir="ltr" value={v.key} onChange={(e) => setV({ ...v, key: e.target.value })} /></label>
        <div className="row">
          <button className="abtn primary" disabled={busy} onClick={() => save(true)}>حفظ وتجربة</button>
          <button className="abtn" disabled={busy} onClick={() => save(false)}>حفظ بس</button>
        </div>
        {msg && <p className="okmsg" role="status">{msg}</p>}
      </div>
    </section>
  );
}

/* ---------------- whatsapp clicks ---------------- */
export const WA_SOURCES: [string, string][] = [["float", "الزرار العائم"], ["product", "زرار منتج"], ["page", "زرار في الصفحة"], ["header", "أعلى الصفحة"], ["footer", "أسفل الصفحة"], ["quote_form", "بعد طلب السعر"]];
export function WhatsApp() {
  const fields: Field[] = [
    { key: "created_at", label: "الوقت", list: true, readonly: true },
    { key: "source", label: "مكان الزرار", type: "select", options: WA_SOURCES, list: true, readonly: true },
    { key: "message", label: "الرسالة / المنتج", list: true, readonly: true },
    { key: "page", label: "الصفحة", list: true, readonly: true, ltr: true },
  ];
  return (
    <div>
      <p className="emptyst">كل مرة زائر يدوس على زرار واتساب في الموقع بتتسجل هنا، ومعاها المنتج والصفحة. الرسايل نفسها بتوصل على واتساب الشركة، ولو الزائر بعت بياناته في الرسالة سجّله كعميل أو طلب سعر.</p>
      <Crud table="wa_clicks" title="ضغطة" fields={fields} filters={{ key: "source", options: WA_SOURCES }} csvName="whatsapp-clicks" />
    </div>
  );
}
