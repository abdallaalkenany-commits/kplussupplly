# تشغيل تطبيق كي بلس (Next.js + Supabase)

## 1) قاعدة البيانات — Supabase (مجاني)
1. اعمل حساب على https://supabase.com واعمل مشروع جديد اسمه `kplus` (المنطقة: Frankfurt أو أقرب حاجة لمصر).
2. افتح **SQL Editor → New query** والصق محتوى `supabase/schema.sql` ودوس **Run**.
3. في query جديدة الصق `supabase/seed_products.sql` ودوس **Run** (بيضيف المنتجات الحالية).
4. **Authentication → URL Configuration**: خلي Site URL = `https://www.kplussupply.com`.
5. **Project Settings → API**: انسخ `Project URL` و `anon public key`.

## 2) الاستضافة — Netlify (مجاني ومسموح للاستخدام التجاري)
1. اعمل حساب على https://netlify.com بحساب GitHub.
2. **Add new site → Import an existing project → GitHub →** `kplussupplly`، والفرع `next-app` (أو `main` بعد الدمج).
3. في **Environment variables** ضيف:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
4. Deploy. بعدها **Domain management → Add domain** → `www.kplussupply.com`.

## 3) أول مدير
1. افتح `https://www.kplussupply.com/account/` واعمل حساب بإيميلك.
2. في Supabase SQL Editor شغّل:
   `update public.profiles set role = 'admin' where email = 'إيميلك';`
3. ادخل `https://www.kplussupply.com/admin/`.

لإضافة موظف مبيعات: يعمل حساب من /account، وانت تغيّر صلاحيته من لوحة التحكم → المستخدمين.

## ملاحظات
- المنتجات والعروض والصور اللي بتتعدل من اللوحة بتظهر على الموقع خلال 5 دقايق.
- لو Supabase مش متوصل، الموقع بيشتغل عادي بالمحتوى الافتراضي وفورم السعر بيبعت واتساب بس.
- الكود: `components/` (الصفحات ولوحة التحكم)، `lib/data.json` (النصوص والأقسام)، `supabase/` (قاعدة البيانات).
