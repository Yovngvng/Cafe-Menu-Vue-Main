# کافه ژوان

سیستم منوی دیجیتال و مدیریت سفارش برای کافه ژوان، ساخته‌شده با **Vue 3** و **Supabase**.

مشتری از روی میز (با QR) منو را می‌بیند و سفارش می‌دهد؛ آشپزخانه سفارش را زنده روی پنل ادمین می‌گیرد.

---

## قابلیت‌ها

| بخش | توضیح |
|---|---|
| منوی مشتری | دسته‌بندی تب‌دار، جستجو، محصولات ویژه |
| سفارش | انتخاب سایز، افزودنی ساندویچ (قارچ و پنیر)، سبد خرید |
| مالیات | ۱۰٪ برای جمع جزء بالای ۲۰۰ هزار تومان |
| QR میز | لینک مستقیم به میز سالن یا فضای باز |
| ادمین | ورود با Supabase Auth، سفارش زنده، فیلتر وضعیت، بوق سفارش جدید |
| گزارش | درآمد امروز، گزارش روز شمسی، پرفروش‌ها در مودال |
| امتیاز | امتیاز ۵ ستاره فقط بعد از سفارش همان محصول |
| Keep-alive | بیدار نگه داشتن پروژه رایگان Supabase (GitHub Actions + تابع Vercel) |

---

## تکنولوژی

| لایه | ابزار |
|---|---|
| فرانت | Vue 3 (Composition API) + Vite |
| بک‌اند | Supabase (Auth، PostgreSQL، Realtime، RLS) |
| میزبانی | GitHub Pages |
| CI/CD | GitHub Actions (بیلد و دیپلوی) |
| Keep-alive | GitHub Actions زمان‌بندی‌شده + `api/keepalive.js` روی Vercel |

---

## شروع کار

```bash
git clone https://github.com/Yovngvng/Cafe-Menu-Vue-Main.git
cd Cafe-Menu-Vue-Main
npm install
cp .env.example .env
```

در `.env` این دو مقدار را از داشبورد Supabase بگذارید:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
```

سپس:

```bash
npm run dev
```

منوی مشتری روی مسیر ریشه است. پنل ادمین: `/admin` (بعد از ورود).

---

## دیپلوی روی GitHub Pages

هر پوش روی `main` ورک‌فلو `.github/workflows/deploy.yml` را اجرا می‌کند: `npm ci`، ساخت `.env` از Secrets، `npm run build`، و دیپلوی پوشه `dist` تولیدی.

**Secrets لازم** (Settings → Secrets and variables → Actions):

| Secret | مقدار |
|---|---|
| `SUPABASE_URL` | آدرس پروژه Supabase |
| `SUPABASE_ANON_KEY` | کلید anon |

**فعال‌سازی Pages:** Settings → Pages → Source را روی **GitHub Actions** بگذارید (نه Deploy from a branch).

آدرس پیش‌فرض سایت:

`https://yovngvng.github.io/Cafe-Menu-Vue-Main/`

`vite.config.js` مقدار `base` را `/Cafe-Menu-Vue-Main/` می‌گذارد تا مسیر دارایی‌ها درست باشد.

---

## راه‌اندازی Supabase

در SQL Editor به این ترتیب اجرا کنید:

1. `supabase/01_orders_schema.sql` — جدول سفارش و ستون‌های رابطه‌ای
2. `supabase/rls_policies.sql` — سیاست‌های RLS (همان محتوای `02_rls_policies.sql`)
3. `supabase/keepalive.sql` — تابع RPC برای بیدارماندن

سپس:

1. Authentication → Users → یک کاربر ادمین بسازید (ایمیل / رمز).
2. Authentication → Providers → Email را روشن کنید.
3. Authentication → Providers / Settings → ثبت‌نام عمومی را **خاموش** کنید تا فقط ادمین ساخته‌شده وارد شود.
4. Database → Replication: جدول `orders` را در Realtime فعال کنید.

---

## تولید QR میز

```bash
npm run qr
```

خروجی در پوشه `qr-codes/` است (مثلاً `salon-table-1.png` و `outdoor-table-3.png`). زیر هر QR نوشته می‌شود: نام کافه، شماره میز، نوع محل.

آدرس پایه را می‌توانید عوض کنید:

```bash
# Windows (PowerShell)
$env:QR_BASE_URL="https://yovngvng.github.io/Cafe-Menu-Vue-Main/"; npm run qr
```

میزها به‌صورت پیش‌فرض ۱ تا ۵ و دو محل **سالن** و **فضای باز** هستند؛ در `scripts/generate-qr.js` قابل تغییر است.

لینک نمونه: `/?table=1` و `/?table=1&location=outdoor`

---

## ساختار پوشه‌ها

```
api/                    تابع keep-alive برای Vercel
public/                 تصاویر منو و _redirects
scripts/generate-qr.js  تولید تصویر QR میزها
src/
  components/customer/  منو، سبد، جستجو، امتیاز
  components/admin/     داشبورد و کارت سفارش
  data/                 منو و توابع کمکی
  services/             Supabase، سفارش، امتیاز، ورود
  utils/                قیمت، وضعیت، مالیات، تاریخ شمسی
  views/                صفحه مشتری
supabase/               اسکریپت‌های SQL
.github/workflows/      دیپلوی Pages و keep-alive
```

---

## مجوز

این پروژه تحت مجوز [MIT](LICENSE) منتشر شده است.
