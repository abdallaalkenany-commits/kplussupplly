"use client";
import { useEffect, useMemo, useState } from "react";
import { sb } from "@/lib/supabase/client";

export type Field = {
  key: string; label: string;
  type?: "text" | "textarea" | "number" | "bool" | "date" | "select" | "image" | "multi";
  options?: [string, string][]; required?: boolean; list?: boolean; ltr?: boolean; readonly?: boolean;
};

export function toCsv(rows: any[], fields: Field[], name: string) {
  const head = fields.map((f) => f.label);
  const body = rows.map((r) => fields.map((f) => {
    const v = r[f.key]; const s = Array.isArray(v) ? v.join(" | ") : v == null ? "" : String(v);
    return '"' + s.replace(/"/g, '""') + '"';
  }).join(","));
  const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function uploadImage(file: File, folder: string) {
  const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const client = sb();
  const { error } = await client.storage.from("media").upload(path, file, { upsert: false, cacheControl: "31536000" });
  if (error) throw error;
  return client.storage.from("media").getPublicUrl(path).data.publicUrl as string;
}

export function display(f: Field, v: any) {
  if (v == null || v === "") return "—";
  if (f.type === "bool") return v ? "✓" : "✗";
  if (f.type === "select") return f.options?.find(([k]) => k === v)?.[1] || v;
  if (f.type === "multi") return (v as string[]).map((x) => f.options?.find(([k]) => k === x)?.[1] || x).join("، ");
  if (f.type === "image") return <img src={v} alt="" className="thumb" />;
  if (f.type === "number") return Number(v).toLocaleString("ar-EG");
  if (f.key.endsWith("_at")) return new Date(v).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  return String(v);
}

export function Editor({ fields, row, onSave, onCancel, onDelete, folder = "misc", extra }: {
  fields: Field[]; row: any; onSave: (r: any) => Promise<string | null>; onCancel: () => void; onDelete?: () => void; folder?: string; extra?: React.ReactNode;
}) {
  const [v, setV] = useState<any>({ ...row });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, val: any) => { setOk(false); setV((p: any) => ({ ...p, [k]: val })); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const out: any = {};
    fields.filter((f) => !f.readonly).forEach((f) => {
      let x = v[f.key];
      if (f.type === "number") x = x === "" || x == null ? null : Number(x);
      else if (f.type === "bool") x = Boolean(x);
      else if (typeof x === "string") x = x.trim() || null;
      out[f.key] = x;
    });
    const e2 = await onSave(out);
    setBusy(false);
    if (e2) setErr(e2); else setOk(true);
  }

  return (
    <div className="drawer" role="dialog" aria-modal="true">
      <form className="aform" onSubmit={save}>
        {fields.map((f) => {
          const id = "f-" + f.key;
          const val = v[f.key];
          if (f.readonly) return <div key={f.key} className="ro"><span>{f.label}</span><b>{display(f, val)}</b></div>;
          if (f.type === "bool") return <label key={f.key} className="chk"><input id={id} type="checkbox" checked={Boolean(val)} onChange={(e) => set(f.key, e.target.checked)} /> {f.label}</label>;
          if (f.type === "textarea") return <label key={f.key}>{f.label}<textarea id={id} rows={4} value={val ?? ""} required={f.required} onChange={(e) => set(f.key, e.target.value)} /></label>;
          if (f.type === "select") return <label key={f.key}>{f.label}<select id={id} value={val ?? ""} required={f.required} onChange={(e) => set(f.key, e.target.value)}><option value="">—</option>{f.options!.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>;
          if (f.type === "multi") return (
            <fieldset key={f.key}><legend>{f.label}</legend>{f.options!.map(([k, l]) => (
              <label key={k} className="chk"><input type="checkbox" checked={(val || []).includes(k)} onChange={(e) => set(f.key, e.target.checked ? [...(val || []), k] : (val || []).filter((x: string) => x !== k))} /> {l}</label>
            ))}</fieldset>
          );
          if (f.type === "image") return (
            <div key={f.key} className="imgf"><span>{f.label}</span>
              {val && <img src={val} alt="" />}
              <div className="row">
                <label className="abtn">رفع صورة<input type="file" accept="image/*" hidden onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setBusy(true);
                  try { set(f.key, await uploadImage(file, folder)); } catch (x: any) { setErr(x.message); }
                  setBusy(false);
                }} /></label>
                {val && <button type="button" className="abtn" onClick={() => set(f.key, null)}>إزالة</button>}
              </div>
              <input id={id} dir="ltr" placeholder="أو الصق رابط صورة" value={val ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            </div>
          );
          return <label key={f.key}>{f.label}<input id={id} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} step="any" dir={f.ltr ? "ltr" : undefined} value={val ?? ""} required={f.required} onChange={(e) => set(f.key, e.target.value)} /></label>;
        })}
        {extra}
        {err && <p className="err" role="alert">{err}</p>}
        {ok && !err && <p className="okmsg" role="status">اتحفظ.</p>}
        <div className="row sticky">
          <button className="abtn primary" disabled={busy}>حفظ</button>
          <button type="button" className="abtn" onClick={onCancel}>إلغاء</button>
          {onDelete && <button type="button" className="abtn danger" onClick={onDelete}>حذف</button>}
        </div>
      </form>
    </div>
  );
}

export default function Crud({ table, title, fields, order = "id", asc = false, idKey = "id", folder, newRow, filters, canDelete = true, extraFor, csvName }: {
  table: string; title: string; fields: Field[]; order?: string; asc?: boolean; idKey?: string; folder?: string; newRow?: any;
  filters?: { key: string; options: [string, string][] }; canDelete?: boolean; extraFor?: (row: any) => React.ReactNode; csvName?: string;
}) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [edit, setEdit] = useState<any>(null);
  const [q, setQ] = useState("");
  const [flt, setFlt] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  async function load() {
    const { data, error } = await sb().from(table).select("*").order(order, { ascending: asc }).limit(2000);
    setRows(error ? [] : data);
  }
  useEffect(() => { load(); }, [table]);

  const shown = useMemo(() => (rows || []).filter((r) =>
    (!flt || r[filters!.key] === flt) &&
    (!q || fields.some((f) => String(r[f.key] ?? "").toLowerCase().includes(q.toLowerCase())))), [rows, q, flt]);

  async function save(r: any) {
    const client = sb();
    const isNew = edit[idKey] == null || edit.__new;
    const res = isNew ? await client.from(table).insert(r) : await client.from(table).update(r).eq(idKey, edit[idKey]);
    if (res.error) return res.error.message;
    setEdit(null); load(); return null;
  }
  async function del() {
    if (!confirmDel) { setConfirmDel(true); return; }
    await sb().from(table).delete().eq(idKey, edit[idKey]);
    setConfirmDel(false); setEdit(null); load();
  }
  const listF = fields.filter((f) => f.list);

  return (
    <div>
      <div className="toolbar">
        <input id={"search-" + table} className="search" placeholder="بحث…" value={q} onChange={(e) => setQ(e.target.value)} />
        {filters && <select id={"filter-" + table} value={flt} onChange={(e) => setFlt(e.target.value)}><option value="">الكل</option>{filters.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
        <span className="count">{shown.length} {title}</span>
        <button className="abtn" onClick={() => toCsv(shown, fields, csvName || table)}>تصدير Excel</button>
        {newRow !== undefined && <button className="abtn primary" onClick={() => setEdit({ ...newRow, __new: true })}>+ إضافة</button>}
      </div>
      {rows === null ? <p>جاري التحميل…</p> : shown.length === 0 ? <p className="emptyst">مفيش بيانات لسه.</p> : (
        <div className="tablewrap"><table className="atbl">
          <thead><tr>{listF.map((f) => <th key={f.key}>{f.label}</th>)}</tr></thead>
          <tbody>{shown.map((r) => <tr key={r[idKey]} onClick={() => { setConfirmDel(false); setEdit(r); }} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setEdit(r)}>{listF.map((f) => <td key={f.key}>{display(f, r[f.key])}</td>)}</tr>)}</tbody>
        </table></div>
      )}
      {edit && (
        <>
          <div className="scrim" onClick={() => setEdit(null)} />
          <Editor fields={fields} row={edit} folder={folder} onSave={save} onCancel={() => setEdit(null)}
            onDelete={canDelete && !edit.__new ? del : undefined}
            extra={<>{confirmDel && <p className="err">دوس "حذف" تاني للتأكيد.</p>}{!edit.__new && extraFor?.(edit)}</>} />
        </>
      )}
    </div>
  );
}
