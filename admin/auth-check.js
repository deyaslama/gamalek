// ملف التحقق من المصادقة لصفحات Admin
// يجب تضمينه في جميع صفحات admin

const API = window.location.origin;

(async function() {
  try {
    const response = await fetch(API + "/api/admin/check-auth", {
      credentials: "include"
    });
    const data = await response.json();
    
    if (!data.success || !data.authenticated) {
      // إذا لم يكن المستخدم مسجلاً دخولاً، إعادة التوجيه
      window.location.href = window.location.origin + "/login.html";
    }
  } catch (error) {
    console.error("خطأ في التحقق من الجلسة:", error);
    window.location.href = window.location.origin + "/login.html";
  }
})();

