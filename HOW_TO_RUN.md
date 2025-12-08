# ⚠️ مهم جداً: كيفية تشغيل الخادم

## المشكلة
الخطأ `ERR_CONNECTION_REFUSED` يعني أن **الخادم غير قيد التشغيل**.

## الحل السريع

### الخطوة 1: افتح PowerShell أو Command Prompt

### الخطوة 2: انتقل إلى مجلد المشروع
```powershell
cd "d:\New folder (2)\backend"
```

### الخطوة 3: تأكد من تثبيت التبعيات
```powershell
npm install
```

### الخطوة 4: شغّل الخادم
```powershell
npm start
```

### الخطوة 5: يجب أن ترى هذه الرسالة:
```
✔ Server running at http://localhost:3000
✔ Uploads directory: [path]
✔ Database file: [path]
```

**⚠️ لا تغلق نافذة Terminal - يجب أن تبقى مفتوحة!**

## التحقق من عمل الخادم

بعد أن ترى الرسالة أعلاه، افتح متصفح جديد واذهب إلى:
- `http://localhost:3000`
- `http://localhost:3000/api/admin/products`

إذا ظهرت بيانات JSON أو صفحة HTML، فمعنى ذلك أن الخادم يعمل!

## استكشاف الأخطاء

### 1. إذا ظهر خطأ "Cannot find module 'express'":
```powershell
cd "d:\New folder (2)\backend"
npm install
```

### 2. إذا ظهر خطأ "Port 3000 is already in use":
- أغلق البرامج الأخرى التي تستخدم المنفذ 3000
- أو غيّر PORT في ملف `.env`:
```
PORT=3001
```

### 3. إذا لم يظهر أي شيء بعد `npm start`:
- تحقق من وجود ملف `server.js` في مجلد `backend`
- تحقق من وجود ملف `package.json` في مجلد `backend`
- تأكد من تثبيت Node.js على جهازك

## ملاحظات مهمة

1. **الخادم يجب أن يعمل دائماً** - إذا أغلقت Terminal، سيتوقف الخادم
2. **افتح Terminal جديد** - لا تستخدم نفس Terminal الذي تستخدمه لفتح الملفات
3. **اترك Terminal مفتوحاً** - الخادم يعمل في Terminal ويجب أن يبقى مفتوحاً

## طريقة بديلة: استخدام VS Code Terminal

1. افتح VS Code
2. اضغط `Ctrl + ~` لفتح Terminal
3. اكتب:
```powershell
cd backend
npm start
```

## اختبار سريع

بعد تشغيل الخادم، افتح متصفح جديد واكتب في شريط العنوان:
```
http://localhost:3000/api/admin/products
```

إذا ظهرت بيانات JSON، فمعنى ذلك أن كل شيء يعمل! ✅
