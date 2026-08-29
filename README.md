# کافه ژوان — سیستم منوی دیجیتال و مدیریت سفارش

سیستم کامل سفارش‌گیری آنلاین برای یک کافه‌ی واقعی — ساخته‌شده با **Vue 3 (Composition API)**، **Vite**، و **Supabase** به‌عنوان بک‌اند.

## قابلیت‌ها

### برای مشتری
- منوی دیجیتال با ۱۳ دسته‌بندی و بیش از ۱۵۰ آیتم، شامل عکس و توضیحات برای محصولات ویژه
- جست‌وجوی زنده‌ی محصولات
- بخش «محصولات ویژه»
- تشخیص خودکار شماره‌ی میز از روی QR کد (بدون نیاز به وارد کردن دستی)
- سبد خرید با ذخیره‌سازی موقت (`sessionStorage`) — با هر مشتری جدید خودکار خالی می‌شه
- انتخاب محل سفارش (سالن / فضای باز / بیرون‌بر) و یادداشت سفارش
- سیستم امتیازدهی ۵ ستاره‌ی محصولات — فقط برای مشتریانی که واقعاً همون محصول رو سفارش داده باشن

### برای مدیر کافه (`/admin`)
- ورود با **Supabase Auth** (ایمیل / رمز) — بدون رمز هاردکد در فرانت
- خروج از حساب
- داشبورد آمار لحظه‌ای (تعداد سفارش، فروش، در انتظار، آماده، تحویل‌شده)
- بروزرسانی زنده‌ی لیست سفارش‌ها (Supabase Realtime) — بدون نیاز به رفرش صفحه
- هشدار (toast + بوق) برای سفارش تازه‌رسیده
- صف سفارش‌ها با اولویت‌بندی FIFO (اول‌اومده اول‌سرو)
- هایلایت بصری برای سفارش‌های بیش از ۱۰ دقیقه معطل‌مونده
- چرخه‌ی وضعیت سفارش: در انتظار -> آماده شد -> تحویل داده شد
- فیلتر وضعیت سفارش‌ها
- نوار تاریخ شمسی و درآمد امروز
- حذف تکی سفارش، یا پاک‌سازی گروهی سفارش‌های تحویل‌داده‌شده

## تکنولوژی‌ها

| بخش | ابزار |
|---|---|
| فرانت‌اند | Vue 3 (Composition API + script setup) |
| Build Tool | Vite |
| مدیریت مسیر | Vue Router |
| بک‌اند / دیتابیس | Supabase (PostgreSQL + Realtime) |
| استایل | CSS خالص، ریسپانسیو |

## معماری پروژه

```
src/
├── components/
│   ├── customer/     کامپوننت‌های سمت مشتری (منو، سبد خرید، ستاره، جستجو)
│   └── admin/         کامپوننت‌های پنل مدیریت
├── views/              صفحات اصلی (مشتری / ادمین)
├── data/               دیتای منو + توابع کمکی
├── services/           supabase client, orders, ratings, auth
├── composables/        منطق قابل‌استفاده‌ی مجدد (امتیازدهی)
└── styles/             فایل استایل مرکزی
```

## اجرای محلی

```bash
npm install
cp .env.example .env
npm run dev
```

برای ساخت نسخه‌ی نهایی:
```bash
npm run build
```

## دیپلوی

پروژه برای دیپلوی روی Vercel یا Netlify آماده‌ست (فایل‌های vercel.json و public/_redirects برای مسیریابی درست SPA از قبل تنظیم شدن).

## راه‌اندازی Supabase (اجباری برای نسخه‌ی امن)

ترتیب اجرا در **SQL Editor**:

1. `supabase/01_orders_schema.sql` — ستون‌های رابطه‌ای، مهاجرت از JSON قدیمی `data`، حذف ستون `data`
2. `supabase/rls_policies.sql` (همان `02_rls_policies.sql`) — RLS
3. `supabase/keepalive.sql` — RPC بیدارماندن (اختیاری ولی توصیه‌شده)

### Auth ادمین

1. Authentication → Providers → **Email** را روشن کنید.
2. **Allow new users to sign up** را خاموش کنید تا مشتری نتواند از لاگین ادمین حساب بسازد.
3. Authentication → Users → **Add user** با ایمیل و رمز مدیر کافه (Confirm email اگر لازم است دستی تأیید شود).
4. فقط همین کاربر باید بتواند `/admin` را ببیند. Route گارد جلوی کاربر مهمان را می‌گیرد؛ RLS جلوی anon برای خواندن/حذف سفارش را می‌گیرد.

### Realtime

Database → Replication: جدول `orders` باید در publication باشد. اسکریپت RLS سعی می‌کند `supabase_realtime` را آپدیت کند.

### نکته‌ی امنیتی

Anon key هنوز در باندل فرانت دیده می‌شود؛ این عادی است. امنیت واقعی از **RLS + Auth** است: مشتری فقط INSERT سفارش با وضعیت `در انتظار` دارد و نمی‌تواند UPDATE/DELETE/SELECT روی `orders` بزند.

## بیدار نگه داشتن Supabase (free-tier pause)

پروژه‌ی رایگان Supabase بعد از بی‌استفاده ماندن pause می‌شه. فرانت‌اند وقتی هیچ مشتری‌ای سایت را باز نکرده نمی‌تواند ping بزند. یکی از این روش‌ها را راه‌اندازی کنید (هر ۶ ساعت کافی است):

### 1) GitHub Actions (پیشنهادی)

1. در SQL Editor سوپابیس فایل `supabase/keepalive.sql` را اجرا کنید تا RPC `keepalive` ساخته شود.
2. در ریپو، Secrets بگذارید: `SUPABASE_URL` و `SUPABASE_ANON_KEY`.
3. ورک‌فلو `.github/workflows/supabase-keepalive.yml` هر ۶ ساعت `POST /rest/v1/rpc/keepalive` می‌زند (بعد از RLS دیگر نمی‌شود با anon جدول `orders` را خواند).

### 2) UptimeRobot (یا هر cron خارجی)

- نوع: HTTP(s)
- فاصله: هر ۵–۱۰ دقیقه (یا حداکثر هر ۶ ساعت)
- URL اگر روی Vercel دیپلوی کردید: `https://YOUR_DOMAIN/api/keepalive`
- یا مستقیم: `POST https://YOUR_PROJECT.supabase.co/rest/v1/rpc/keepalive` با هدرهای `apikey` و `Authorization: Bearer ANON_KEY`

تابع `api/keepalive.js` برای Vercel فقط RPC `keepalive` را صدا می‌زند. Env های `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` را در Vercel ست کنید.

