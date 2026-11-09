"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/client";
import { CATEGORIES, GOVS, TOP } from "@/lib/content";
import Crud, { Editor, toCsv, type Field } from "./crud";
import { useMe } from "./shell";

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
    { key: "company", label: "الشركة" }, { key: "product", label: "المنتج" }, { key: "quantity", label: "الكمية" }, { key: "location", label: "الموقع" },
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
    { key: "company", label: "الشركة" }, { key: "email", label: "الإيميل", ltr: true },
    { key: "product", label: "المنتج" }, { key: "quantity", label: "الكمية" }, { key: "location", label: "موقع المشروع" },
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
    { key: "type", label: "النوع", type: "select", options: [["contractor", "مقاول"], ["developer", "مطور عقاري"], ["company", "شركة"], ["individual", "فرد"], ["other", "أخرى"]], list: true },
    { key: "governorate", label: "المحافظة / الموقع", list: true }, { key: "email", label: "الإيميل", ltr: true },
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
  const fields: Field[] = [
    { key: "image_url", label: "الصورة", type: "image", list: true },
    { key: "category", label: "القسم", type: "select", options: CAT_OPTS, required: true, list: true },
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
        filters={{ key: "category", options: CAT_OPTS }} />
    </>
  );
}

/* ---------------- offers ---------------- */
export function Offers() {
  const fields: Field[] = [
    { key: "image_url", label: "صورة العرض", type: "image", list: true },
    { key: "title_ar", label: "عنوان العرض بالعربي", required: true, list: true }, { key: "title_en", label: "العنوان بالإنجليزي", ltr: true },
    { key: "discount_label", label: "شارة الخصم (مثال: خصم 10%)", list: true },
    { key: "body_ar", label: "التفاصيل بالعربي", type: "textarea" }, { key: "body_en", label: "التفاصيل بالإنجليزي", type: "textarea" },
    { key: "category", label: "القسم", type: "select", options: CAT_OPTS },
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

/* ---------------- category icons/images ---------------- */
export function Categories() {
  const [rows, setRows] = useState<Record<string, any>>({});
  const [edit, setEdit] = useState<any>(null);
  const load = () => sb().from("categories").select("*").then(({ data }: any) => { const m: any = {}; (data || []).forEach((r: any) => (m[r.slug] = r)); setRows(m); });
  useEffect(() => { load(); }, []);
  const fields: Field[] = [{ key: "icon_url", label: "الأيقونة (مربعة، PNG أو SVG)", type: "image" }, { key: "image_url", label: "صورة القسم", type: "image" }];
  async function save(r: any) {
    const { error } = await sb().from("categories").upsert({ slug: edit.slug, ...r });
    if (error) return error.message;
    setEdit(null); load(); return null;
  }
  return (
    <>
      <p className="tip">لو مرفعتش أيقونة لقسم، الموقع بيستخدم الأيقونة الافتراضية.</p>
      <div className="catgrid">
        {CATEGORIES.map((c) => {
          const r = rows[c.slug] || {};
          return (
            <button key={c.slug} className="catcard" onClick={() => setEdit({ slug: c.slug, ...r })}>
              {r.image_url ? <img src={r.image_url} alt="" className="cimg" /> : <div className="cimg ph">بدون صورة</div>}
              <span className="ic">{r.icon_url ? <img src={r.icon_url} alt="" /> : "—"}</span>
              <b>{c.ar.nav}</b><small dir="ltr">/{c.slug}/</small>
            </button>
          );
        })}
      </div>
      {edit && <><div className="scrim" onClick={() => setEdit(null)} /><Editor fields={fields} row={edit} folder="categories" onSave={save} onCancel={() => setEdit(null)} /></>}
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
      <p className="tip">علشان تضيف موظف: خليه يعمل حساب من صفحة "حسابي" على الموقع، وبعدين غيّر صلاحيته هنا لـ "مبيعات" أو "مدير".</p>
      <Crud table="profiles" title="مستخدم" fields={fields} order="created_at" canDelete={false} csvName="users"
        filters={{ key: "role", options: [["admin", "مدير"], ["sales", "مبيعات"], ["customer", "عميل"], ["supplier", "مورد"]] }} />
    </>
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
