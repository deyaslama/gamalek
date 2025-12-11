# ⚠️ مهم جداً: إعادة تشغيل السيرفر

## المشكلة:
الـ API endpoints للشكاوى لا تعمل لأن السيرفر لم يتم إعادة تشغيله بعد التغييرات.

## الحل:
1. أوقف السيرفر الحالي:
   - اضغط `Ctrl + C` في terminal السيرفر

2. أعد تشغيل السيرفر:
   ```bash
   cd backend
   node server.js
   ```

3. تحقق من أن السيرفر يعمل:
   - يجب أن ترى: `✔ Server running at http://localhost:3000`
   - افتح المتصفح واذهب إلى: `http://localhost:3000/api/complaints/test`
   - يجب أن ترى: `{"message":"Complaints API is working!"}`

## بعد إعادة التشغيل:
- يجب أن يعمل `/api/complaints` (POST)
- يجب أن يعمل `/api/admin/complaints` (GET)
- يجب أن يعمل `/api/admin/complaints/:id/status` (PUT)







