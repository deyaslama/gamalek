# 🔧 استكشاف أخطاء Render.com

## المشاكل الشائعة وحلولها

### ❌ المشكلة: رفع الملفات لا يعمل

#### الأعراض:
- عند رفع ملف Excel أو منتج، يظهر خطأ
- `ERR_CONNECTION_REFUSED` أو `Failed to fetch`

#### الحلول:

##### 1. تحقق من Logs على Render
1. اذهب إلى Render Dashboard
2. اختر خدمتك `gamalek-store`
3. اضغط على تبويب **Logs**
4. ابحث عن أخطاء في:
   - `Error creating uploads folder`
   - `Database connection error`
   - `Excel Upload Error`

##### 2. تحقق من متغيرات البيئة
في Render Dashboard → Settings → Environment:
- ✅ `EMAIL_USER` موجود
- ✅ `EMAIL_PASS` موجود
- ✅ `NODE_ENV` = `production`
- ✅ `PORT` موجود (عادة Render يضبطه تلقائياً)

##### 3. تحقق من مسارات الملفات
في Logs، يجب أن ترى:
```
✔ Uploads folder exists at: /opt/render/project/src/backend/uploads
✔ Database file path: /opt/render/project/src/backend/database.db
```

إذا لم ترى هذه الرسائل، هناك مشكلة في إنشاء المجلدات.

##### 4. مشكلة قاعدة البيانات SQLite على Render

⚠️ **مهم**: قاعدة البيانات SQLite **ستُفقد** عند:
- إعادة النشر
- إعادة تشغيل الخدمة
- حذف الخدمة

**الحلول**:
- استخدم **PostgreSQL** (متوفر على Render)
- أو استخدم **Disk Storage** (مدفوع)
- أو استخدم قاعدة بيانات خارجية

### ❌ المشكلة: الخدمة لا تبدأ

#### تحقق من:
1. **Build Logs**: هل `npm install` نجح؟
2. **Start Command**: هل `npm start` يعمل؟
3. **Port**: هل PORT مضبوط بشكل صحيح؟

#### الحل:
```yaml
# في render.yaml
startCommand: cd backend && npm start
```

### ❌ المشكلة: CSS/JS لا يعمل

#### الحل:
تحقق من مسارات الملفات في `server.js`:
```javascript
app.use("/", express.static(path.join(process.cwd(), "..")));
```

### ❌ المشكلة: النطاق لا يعمل

#### الحل:
1. في Render → Settings → Custom Domains
2. تأكد من إضافة:
   - `gamalek.store`
   - `www.gamalek.store`
3. اتبع تعليمات DNS التي يظهرها Render

### 📊 كيفية قراءة Logs

في Render Dashboard → Logs، ابحث عن:

#### ✅ رسائل النجاح:
```
🚀 Server started successfully!
✔ Server running on port: 10000
✔ Uploads folder exists at: [path]
✔ Database connected successfully
```

#### ❌ رسائل الخطأ:
```
❌ Error creating uploads folder: [error]
❌ Database connection error: [error]
❌ Excel Upload Error: [error]
```

### 🔍 اختبار API

بعد النشر، اختبر:

1. **الصفحة الرئيسية**:
   ```
   https://gamalek.store
   ```

2. **API Products**:
   ```
   https://gamalek.store/api/admin/products
   ```

3. **API Brands**:
   ```
   https://gamalek.store/api/admin/brands
   ```

### 📝 ملاحظات مهمة

1. **قاعدة البيانات**: SQLite محلية وستُفقد - استخدم PostgreSQL للإنتاج
2. **الملفات المرفوعة**: ستُفقد عند إعادة النشر - استخدم S3 أو Cloudinary
3. **Logs**: محفوظة لمدة 7 أيام في الخطة المجانية
4. **Auto-Deploy**: Render يعيد النشر تلقائياً عند Push إلى GitHub

### 🆘 إذا استمرت المشكلة

1. **انسخ Logs كاملة** من Render Dashboard
2. **تحقق من**:
   - متغيرات البيئة
   - إعدادات Build & Deploy
   - Custom Domains
3. **راجع** ملف `RENDER_SETTINGS.md` للإعدادات الكاملة

---

**نصيحة**: استخدم PostgreSQL بدلاً من SQLite للإنتاج! 🗄️
