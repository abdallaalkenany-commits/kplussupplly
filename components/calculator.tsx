"use client";

import { useState } from "react";

type Lang = "ar" | "en";

const MIX: Record<string, { cement: number; sand: number; gravel: number }> = {
  rc: { cement: 350, sand: 0.4, gravel: 0.8 },
  plain: { cement: 250, sand: 0.4, gravel: 0.8 },
};
const BRICKS: Record<string, { per: number; mortar: number }> = {
  s12: { per: 60, mortar: 0.025 },
  s25: { per: 120, mortar: 0.06 },
  b20: { per: 12.5, mortar: 0.015 },
  b12: { per: 12.5, mortar: 0.01 },
};

const L = {
  ar: {
    concrete: "خرسانة", bricks: "طوب ومباني",
    len: "الطول (م)", wid: "العرض (م)", thick: "السمك (سم)", type: "نوع الخرسانة", rc: "مسلحة (أسقف/أعمدة/أساسات)", plain: "عادية (فرشة نظافة)",
    wl: "طول الحوائط (م)", wh: "الارتفاع (م)", open: "مساحة الأبواب والشبابيك (م²)", btype: "نوع الطوب",
    s12: "مصمت 25×12×6 — حيطة 12 سم", s25: "مصمت 25×12×6 — حيطة 25 سم", b20: "بلوك 20×20×40", b12: "بلوك 20×12×40",
    vol: "حجم الخرسانة", cement: "أسمنت", bags: "شكارة", ton: "طن", sand: "رمل", gravel: "زلط", m3: "م³", m2: "م²",
    area: "صافي المساحة", count: "عدد الطوب (شامل 5% هالك)", pcs: "طوبة",
    note: "الأرقام تقريبية وبتفترض نسب الخلط الشائعة في مصر، والنسبة النهائية يحددها المهندس. محسوب فيها 5% هالك.",
    ask: "اطلب سعر الكمية دي على واتساب", msg: "عايز عرض سعر لـ",
  },
  en: {
    concrete: "Concrete", bricks: "Bricks & masonry",
    len: "Length (m)", wid: "Width (m)", thick: "Thickness (cm)", type: "Concrete type", rc: "Reinforced (slabs/columns/footings)", plain: "Plain (blinding)",
    wl: "Wall length (m)", wh: "Height (m)", open: "Doors & windows area (m²)", btype: "Brick type",
    s12: "Solid 25×12×6 — 12 cm wall", s25: "Solid 25×12×6 — 25 cm wall", b20: "Block 20×20×40", b12: "Block 20×12×40",
    vol: "Concrete volume", cement: "Cement", bags: "bags", ton: "t", sand: "Sand", gravel: "Gravel", m3: "m³", m2: "m²",
    area: "Net wall area", count: "Bricks (incl. 5% waste)", pcs: "pcs",
    note: "Estimates based on common Egyptian mix ratios; your engineer sets the final mix. Includes 5% waste.",
    ask: "Get a price for this quantity on WhatsApp", msg: "I need a quote for",
  },
};

const n = (v: string) => Math.max(0, parseFloat(v.replace(",", ".")) || 0);
const r1 = (v: number) => Math.round(v * 10) / 10;

export default function Calculator({ lang, wa }: { lang: Lang; wa: string }) {
  const t = L[lang];
  const [tab, setTab] = useState<"concrete" | "bricks">("concrete");
  const [c, setC] = useState({ len: "10", wid: "10", thick: "14", type: "rc" });
  const [b, setB] = useState({ wl: "20", wh: "3", open: "4", type: "s12" });
  const fmt = (v: number) => v.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 1 });

  const sep = lang === "ar" ? "، " : ", ";
  let rows: [string, string][] = [];
  let summary = "";
  if (tab === "concrete") {
    const vol = n(c.len) * n(c.wid) * (n(c.thick) / 100) * 1.05;
    const m = MIX[c.type];
    const kg = vol * m.cement;
    const bags = Math.ceil(kg / 50);
    rows = [
      [t.vol, `${fmt(r1(vol))} ${t.m3}`],
      [t.cement, `${fmt(bags)} ${t.bags} (${fmt(r1(kg / 1000))} ${t.ton})`],
      [t.sand, `${fmt(r1(vol * m.sand))} ${t.m3}`],
      [t.gravel, `${fmt(r1(vol * m.gravel))} ${t.m3}`],
    ];
    summary = [`${t.cement}: ${bags} ${t.bags}`, `${t.sand}: ${r1(vol * m.sand)} ${t.m3}`, `${t.gravel}: ${r1(vol * m.gravel)} ${t.m3}`].join(sep);
  } else {
    const area = Math.max(0, n(b.wl) * n(b.wh) - n(b.open));
    const k = BRICKS[b.type];
    const count = Math.ceil(area * k.per * 1.05);
    const mortar = area * k.mortar * 1.05;
    const bags = Math.ceil((mortar * 275) / 50);
    rows = [
      [t.area, `${fmt(r1(area))} ${t.m2}`],
      [t.count, `${fmt(count)} ${t.pcs}`],
      [t.cement, `${fmt(bags)} ${t.bags}`],
      [t.sand, `${fmt(r1(mortar))} ${t.m3}`],
    ];
    summary = [`${t[b.type as "s12"]}: ${count} ${t.pcs}`, `${t.cement}: ${bags} ${t.bags}`].join(sep);
  }

  const field = (label: string, value: string, set: (v: string) => void) => (
    <label>{label}<input inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} dir="ltr" /></label>
  );

  return (
    <div className="calc">
      <div className="calc-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "concrete"} className={tab === "concrete" ? "on" : ""} onClick={() => setTab("concrete")}>{t.concrete}</button>
        <button type="button" role="tab" aria-selected={tab === "bricks"} className={tab === "bricks" ? "on" : ""} onClick={() => setTab("bricks")}>{t.bricks}</button>
      </div>
      <div className="calc-in">
        {tab === "concrete" ? (
          <>
            {field(t.len, c.len, (v) => setC({ ...c, len: v }))}
            {field(t.wid, c.wid, (v) => setC({ ...c, wid: v }))}
            {field(t.thick, c.thick, (v) => setC({ ...c, thick: v }))}
            <label>{t.type}<select value={c.type} onChange={(e) => setC({ ...c, type: e.target.value })}><option value="rc">{t.rc}</option><option value="plain">{t.plain}</option></select></label>
          </>
        ) : (
          <>
            {field(t.wl, b.wl, (v) => setB({ ...b, wl: v }))}
            {field(t.wh, b.wh, (v) => setB({ ...b, wh: v }))}
            {field(t.open, b.open, (v) => setB({ ...b, open: v }))}
            <label>{t.btype}<select value={b.type} onChange={(e) => setB({ ...b, type: e.target.value })}>{(["s12", "s25", "b20", "b12"] as const).map((k) => <option key={k} value={k}>{t[k]}</option>)}</select></label>
          </>
        )}
      </div>
      <dl className="calc-out">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <p className="calc-note">{t.note}</p>
      <a className="btn wa" rel="noopener" href={`https://wa.me/${wa}?text=${encodeURIComponent(`${t.msg} ${summary}`)}`}>{t.ask}</a>
    </div>
  );
}
