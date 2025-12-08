# كيفية تشغيل الخادم محلياً

## المشكلة الحالية
الخادم لا يعمل على `localhost:3000` مما يسبب أخطاء `ERR_CONNECTION_REFUSED`.

## الحل

### 1. افتح Terminal/Command Prompt

### 2. انتقل إلى مجلد backend:
```bash
cd backend
```

### 3. تأكد من تثبيت التبعيات:
```bash
npm install
```

### 4. تأكد من وجود ملف .env:
أنشئ ملف `.env` في مجلد `backend` إذا لم يكن موجوداً:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3000
```

### 5. شغّل الخادم:
```bash
npm start
```

### 6. يجب أن ترى:
```
✔ Server running at http://localhost:3000
✔ Uploads directory: [path]
✔ Database file: [path]
```

## التحقق من عمل الخادم

بعد تشغيل الخادم، افتح المتصفح على:
- `http://localhost:3000`
- `http://localhost:3000/api/admin/products`

## استكشاف الأخطاء

### إذا ظهر خطأ "Cannot find module":
```bash
cd backend
npm install
```

### إذا ظهر خطأ في المنفذ (Port already in use):
غيّر PORT في ملف `.env`:
```
PORT=3001
```

### إذا لم يعمل رفع الملفات:
- تأكد من وجود مجلد `uploads` في `backend/uploads`
- تأكد من صلاحيات الكتابة

## ملاحظات

- الخادم يجب أن يعمل قبل فتح صفحات Admin
- تأكد من أن الخادم يعمل في Terminal قبل استخدام الموقع
- إذا أغلقت Terminal، سيتوقف الخادم
