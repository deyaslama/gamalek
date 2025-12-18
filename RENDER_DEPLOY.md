# دليل رفع المشروع على Render.com

## المتطلبات الأساسية

1. حساب على Render.com
2. مستودع Git (GitHub/GitLab/Bitbucket)

## خطوات الرفع

### 1. إعداد متغيرات البيئة في Render

في لوحة التحكم في Render، أضف متغيرات البيئة التالية:

```
BASE_URL=https://gamalek.store
PORT=10000
SESSION_SECRET=your-secret-key-here-change-this
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
ADMIN_USERNAME=outlet
ADMIN_PASSWORD=123456
```

### 2. إعدادات Build Command

```
cd backend && npm install
```

### 3. إعدادات Start Command

```
cd backend && node server.js
```

### 4. إعدادات Root Directory

```
backend
```

### 5. ملفات مهمة يجب رفعها

- ✅ `backend/` - مجلد السيرفر
- ✅ `frontend/` - مجلد الواجهة الأمامية
- ✅ `admin/` - مجلد لوحة التحكم
- ✅ `layout.html` - ملف التخطيط
- ✅ `login.html` - صفحة تسجيل الدخول
- ✅ `backend/database.db` - قاعدة البيانات (إذا كانت موجودة)
- ✅ `backend/uploads/` - مجلد الصور المرفوعة

### 6. ملاحظات مهمة

- **قاعدة البيانات**: SQLite ستعمل على Render، لكن البيانات قد تُفقد عند إعادة التشغيل. للحل الدائم، استخدم PostgreSQL.
- **الصور**: مجلد `uploads/` يجب أن يبقى في المشروع. للاستخدام الإنتاجي، استخدم خدمة تخزين سحابي (S3, Cloudinary).
- **المنفذ**: Render يحدد PORT تلقائياً، لكن يجب أن يكون الكود جاهزاً لاستخدام `process.env.PORT`.

## التحقق من العمل

بعد الرفع، تحقق من:
1. ✅ الموقع يعمل على `https://gamalek.store`
2. ✅ لوحة التحكم تعمل على `https://gamalek.store/admin/`
3. ✅ جميع API endpoints تعمل
4. ✅ الصور تظهر بشكل صحيح

## استكشاف الأخطاء

إذا واجهت مشاكل:
1. تحقق من logs في Render Dashboard
2. تأكد من أن جميع متغيرات البيئة محددة
3. تحقق من أن BASE_URL صحيح
4. تأكد من أن PORT يستخدم `process.env.PORT`

