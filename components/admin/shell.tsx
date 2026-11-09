"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { sb, sbConfigured } from "@/lib/supabase/client";

export type Me = { id: string; email: string; full_name: string | null; role: "admin" | "sales" | "customer" | "supplier" };
const MeCtx = createContext<Me | null>(null);
export const useMe = () => useContext(MeCtx)!;

const NAV: [string, string, boolean?][] = [
  ["/admin/", "الرئيسية"],
  ["/admin/quotes/", "طلبات الأسعار"],
  ["/admin/customers/", "العملاء"],
  ["/admin/suppliers/", "الموردين"],
  ["/admin/products/", "المنتجات"],
  ["/admin/offers/", "العروض والخصومات"],
  ["/admin/categories/", "صور وأيقونات الأقسام"],
  ["/admin/users/", "المستخدمين والصلاحيات", true],
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const loadSeq = useRef(0);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  async function load() {
    const seq = ++loadSeq.current;
    const client = sb();
    const { data } = await client.auth.getUser();
    if (seq !== loadSeq.current) return;
    if (!data.user) return setMe(null);
    const { data: p } = await client.from("profiles").select("id,email,full_name,role").eq("id", data.user.id).single();
    if (seq !== loadSeq.current) return;
    setMe((p as Me) || null);
  }
  useEffect(() => {
    if (!sbConfigured) return setMe(null);
    load();
    const { data } = sb().auth.onAuthStateChange((ev: string) => { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") load(); });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => setOpen(false), [path]);

  if (!sbConfigured) return <Center><h1>لوحة التحكم</h1><p>قاعدة البيانات لسه مش متوصلة. ضيف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في إعدادات الاستضافة.</p></Center>;
  if (me === undefined) return <Center><p>جاري التحميل…</p></Center>;
  if (me === null) return <Login />;
  if (me.role !== "admin" && me.role !== "sales") return <Center><h1>مفيش صلاحية</h1><p>الحساب ده ({me.email}) مش من فريق كي بلس.</p><button className="abtn" onClick={() => sb().auth.signOut()}>خروج</button></Center>;

  return (
    <MeCtx.Provider value={me}>
      <div className="adm">
        <aside className={"side" + (open ? " open" : "")}>
          <div className="brand"><img src="/assets/logo-white.png" alt="KPLUS" height={34} /><span>لوحة التحكم</span></div>
          <nav>
            {NAV.filter(([, , adminOnly]) => !adminOnly || me.role === "admin").map(([href, label]) => (
              <Link key={href} href={href} className={path === href ? "on" : ""}>{label}</Link>
            ))}
          </nav>
          <div className="who">
            <div>{me.full_name || me.email}<small>{me.role === "admin" ? "مدير" : "مبيعات"}</small></div>
            <a href="/" target="_blank" rel="noopener">فتح الموقع</a>
            <button onClick={() => sb().auth.signOut()}>خروج</button>
          </div>
        </aside>
        <div className="main">
          <header className="atop"><button className="burger" aria-label="القائمة" onClick={() => setOpen(!open)}>☰</button><b>{NAV.find(([h]) => h === path)?.[1] || "لوحة التحكم"}</b></header>
          <div className="content">{children}</div>
        </div>
      </div>
    </MeCtx.Provider>
  );
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
    setBusy(true);
    const { error } = await sb().auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
    setBusy(false);
    if (error) setMsg("الإيميل أو كلمة السر غلط.");
  }
  return (
    <Center>
      <img src="/assets/logo.png" alt="KPLUS" height={44} />
      <h1>دخول لوحة التحكم</h1>
      <form className="aform" onSubmit={submit}>
        <label>الإيميل<input id="l-email" name="email" type="email" required dir="ltr" autoComplete="email" /></label>
        <label>كلمة السر<input id="l-pass" name="password" type="password" required dir="ltr" autoComplete="current-password" /></label>
        <button className="abtn primary" disabled={busy}>دخول</button>
        {msg && <p className="err" role="alert">{msg}</p>}
      </form>
    </Center>
  );
}
