# متجر جمالك - Gamalek Store

متجر إلكتروني متكامل لإدارة المنتجات والطلبات.

## متطلبات النشر على Render.com

### 1. إعدادات Render.com

1. قم بإنشاء حساب على [Render.com](https://render.com)
2. اربط مستودع GitHub الخاص بك
3. اختر "New Web Service"
4. اختر المستودع الخاص بك

### 2. متغيرات البيئة (Environment Variables)

في لوحة تحكم Render، أضف المتغيرات التالية:

- `EMAIL_USER`: عنوان البريد الإلكتروني لإرسال الرسائل
- `EMAIL_PASS`: كلمة مرور التطبيق (App Password) من Gmail
- `NODE_ENV`: `production`
- `PORT`: سيتم تعيينه تلقائياً من Render (لا حاجة لتعديله)

### 3. إعداد Gmail App Password

1. اذهب إلى [حساب Google](https://myaccount.google.com/)
2. اختر "الأمان" (Security)
3. فعّل "التحقق بخطوتين" (2-Step Verification)
4. أنشئ "كلمة مرور التطبيق" (App Password)
5. استخدم هذه الكلمة في `EMAIL_PASS`

### 4. إعداد النطاق (Domain)

1. في إعدادات الخدمة على Render، اذهب إلى "Custom Domains"
2. أضف النطاق: `gamalek.store`
3. أضف النطاق الفرعي: `www.gamalek.store`
4. اتبع التعليمات لإعداد DNS

### 5. إعدادات DNS

أضف السجلات التالية في DNS provider:

```
Type: CNAME
Name: www
Value: [your-render-service].onrender.com

Type: A
Name: @
Value: [Render IP Address]
```

أو استخدم:

```
Type: CNAME
Name: @
Value: [your-render-service].onrender.com
```

### 6. الملفات المهمة

- `render.yaml`: ملف إعدادات Render
- `backend/package.json`: تبعيات المشروع
- `backend/server.js`: ملف الخادم الرئيسي
- `.gitignore`: ملفات مستثناة من Git

### 7. ملاحظات مهمة

⚠️ **قاعدة البيانات**: قاعدة البيانات SQLite محلية وستفقد البيانات عند إعادة النشر. للحلول الدائمة، استخدم قاعدة بيانات خارجية مثل PostgreSQL.

⚠️ **الملفات المرفوعة**: الملفات المرفوعة في مجلد `uploads` ستُفقد عند إعادة النشر. استخدم خدمة تخزين خارجية مثل AWS S3 أو Cloudinary.

### 8. البنية

```
.
├── backend/          # خادم Node.js/Express
│   ├── server.js     # ملف الخادم الرئيسي
│   ├── package.json  # التبعيات
│   └── .env          # متغيرات البيئة (غير موجود في Git)
├── frontend/         # واجهة المستخدم
│   ├── index.html
│   ├── css/
│   └── js/
├── admin/            # لوحة التحكم
│   └── *.html
├── render.yaml       # إعدادات Render
└── .gitignore        # ملفات مستثناة
```

## التطوير المحلي

1. تثبيت التبعيات:
```bash
cd backend
npm install
```

2. إنشاء ملف `.env` في مجلد `backend`:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3000
```

3. تشغيل الخادم:
```bash
npm start
```

4. افتح المتصفح على: `http://localhost:3000`

## الدعم

للمساعدة أو الاستفسارات، يرجى التواصل مع فريق الدعم.

