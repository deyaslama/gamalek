// ===================== نظام شات الدعم للعملاء =====================
// سكربت منفصل لإدارة شات الدعم بين العملاء والإدارة

// استخدام API الموجود مسبقاً من index.html (window.API)
// إذا لم يكن متاحاً، نستخدم القيمة الافتراضية
let SUPPORT_API = (typeof window !== 'undefined' && window.API) 
  ? window.API 
  : (typeof API !== 'undefined' ? API : "http://localhost:3000");

let currentChatId = null;
let currentChatStatus = 'open'; // 'open' or 'closed'
let messagePollInterval = null;

// فتح نافذة الشات - جعلها متاحة على window للاستدعاء من onclick
window.openSupportChat = async function openSupportChat() {
  if (!window.user || !window.user.phone) {
    alert("يجب تسجيل الدخول أولاً");
    go("login");
    return;
  }

  const modal = document.getElementById("supportChatModal");
  if (!modal) {
    console.error("نافذة الشات غير موجودة");
    return;
  }

  modal.style.display = "flex";

  // الحصول على أو إنشاء شات
  try {
    const res = await fetch(`${SUPPORT_API}/api/support/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_phone: window.user.phone,
        user_name: window.user.name,
        user_email: window.user.email
      })
    });

    const data = await res.json();
    if (data.success) {
      currentChatId = data.chat.id;
      currentChatStatus = data.chat.status || 'open';
      await loadChatMessages();
      updateChatUI();
      startMessagePolling();
    } else {
      alert("خطأ في فتح الشات: " + (data.message || "خطأ غير معروف"));
    }
  } catch (error) {
    console.error("خطأ في فتح الشات:", error);
    alert("حدث خطأ في الاتصال بالسيرفر");
  }
}

// إغلاق نافذة الشات - جعلها متاحة على window
window.closeSupportChat = function closeSupportChat() {
  const modal = document.getElementById("supportChatModal");
  if (modal) {
    modal.style.display = "none";
  }
  stopMessagePolling();
  currentChatId = null;
  currentChatStatus = 'open';
}

// دالة مساعدة لإظهار الإشعارات
function showNotification(message, type = 'info') {
  // إنشاء عنصر إشعار
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#4caf50' : '#2196f3'};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10002;
    font-weight: 600;
    animation: slideDown 0.3s ease;
  `;
  notification.textContent = message;
  
  // إضافة animation style إذا لم يكن موجوداً
  if (!document.getElementById("notificationStyle")) {
    const style = document.createElement("style");
    style.id = "notificationStyle";
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // إزالة الإشعار بعد 4 ثوان
  setTimeout(() => {
    notification.style.animation = "slideDown 0.3s ease reverse";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// تحميل رسائل الشات
async function loadChatMessages() {
  if (!currentChatId) return;

  try {
    // جلب معلومات الشات أولاً
    const chatRes = await fetch(`${SUPPORT_API}/api/support/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_phone: window.user.phone,
        user_name: window.user.name,
        user_email: window.user.email
      })
    });
    const chatData = await chatRes.json();
    if (chatData.success && chatData.chat) {
      const previousStatus = currentChatStatus;
      currentChatStatus = chatData.chat.status || 'open';
      
      // إذا تم إغلاق الشات من الإدارة (تغير من open إلى closed)
      if (previousStatus === 'open' && currentChatStatus === 'closed') {
        // سيتم عرض الرسالة التلقائية من الإدارة في renderMessages
        // لكن نضيف إشعار أيضاً
        showNotification("تم إغلاق المحادثة من قبل الإدارة", "info");
      }
    }

    const res = await fetch(`${SUPPORT_API}/api/support/chat/${currentChatId}/messages?user_phone=${window.user.phone}`);
    const data = await res.json();

    if (data.success) {
      renderMessages(data.messages);
      updateChatUI();
    } else {
      console.error("خطأ في تحميل الرسائل:", data.message);
    }
  } catch (error) {
    console.error("خطأ في تحميل الرسائل:", error);
  }
}

// تحديث واجهة الشات بناءً على الحالة
function updateChatUI() {
  const inputArea = document.getElementById("supportChatInputArea");
  const input = document.getElementById("supportChatInput");
  const messagesArea = document.getElementById("supportChatMessages");
  
  if (!inputArea || !input) return;

  if (currentChatStatus === 'closed') {
    // إظهار رسالة أن الشات مغلق
    const closedBanner = document.getElementById("chatClosedBanner");
    if (!closedBanner) {
      const banner = document.createElement("div");
      banner.id = "chatClosedBanner";
      banner.style.cssText = "background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:15px;margin-bottom:15px;text-align:center;color:#856404;font-weight:600;";
      banner.innerHTML = "⚠️ تم إغلاق هذا الشات. يمكنك إرسال رسالة جديدة وسيتم الرد عليك بمجرد رؤية الرسالة.";
      if (messagesArea) {
        messagesArea.insertBefore(banner, messagesArea.firstChild);
      }
    }
    
    input.placeholder = "اكتب رسالتك هنا... (سيتم فتح الشات تلقائياً)";
    input.disabled = false; // السماح بإرسال الرسائل
  } else {
    // إزالة البانر إذا كان موجوداً
    const closedBanner = document.getElementById("chatClosedBanner");
    if (closedBanner) {
      closedBanner.remove();
    }
    input.placeholder = "اكتب رسالتك هنا...";
    input.disabled = false;
  }
}

// عرض الرسائل
function renderMessages(messages) {
  const container = document.getElementById("supportChatMessages");
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;color:#999;padding:20px;">
        لا توجد رسائل بعد. ابدأ المحادثة الآن!
      </div>
    `;
    return;
  }

  let html = "";
  messages.forEach(msg => {
    const isUser = msg.sender_type === "user";
    const time = new Date(msg.created_at).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit"
    });

    html += `
      <div style="display:flex;justify-content:${isUser ? "flex-end" : "flex-start"};margin-bottom:15px;">
        <div style="max-width:70%;background:${isUser ? "linear-gradient(135deg, #8a004a 0%, #6a0038 100%)" : "#e0e0e0"};color:${isUser ? "#fff" : "#333"};padding:12px 16px;border-radius:${isUser ? "16px 16px 0 16px" : "16px 16px 16px 0"};box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-size:14px;line-height:1.5;word-wrap:break-word;">${escapeHtml(msg.message)}</div>
          <div style="font-size:11px;opacity:0.7;margin-top:5px;text-align:${isUser ? "left" : "right"};">${time}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

// إرسال رسالة - جعلها متاحة على window
window.sendSupportMessage = async function sendSupportMessage() {
  if (!currentChatId) {
    await openSupportChat();
    return;
  }

  const input = document.getElementById("supportChatInput");
  const message = input.value.trim();

  if (!message) return;

  // إضافة الرسالة فوراً للواجهة (optimistic update)
  const tempMessage = {
    id: "temp_" + Date.now(),
    sender_type: "user",
    message: message,
    created_at: new Date().toISOString()
  };
  const currentMessages = getCurrentMessages();
  currentMessages.push(tempMessage);
  renderMessages(currentMessages);

  input.value = "";

  try {
    const res = await fetch(`${SUPPORT_API}/api/support/chat/${currentChatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        user_phone: window.user.phone
      })
    });

    const data = await res.json();
    if (!data.success) {
      alert("خطأ في إرسال الرسالة: " + (data.message || "خطأ غير معروف"));
      // إعادة تحميل الرسائل لإزالة الرسالة المؤقتة
      await loadChatMessages();
    } else {
      // إذا كانت هذه أول رسالة، إظهار إشعار
      if (data.isFirstMessage && data.notification) {
        showNotification(data.notification, "success");
      }
      // إذا تم إعادة فتح الشات، تحديث الحالة
      if (data.chatReopened) {
        currentChatStatus = 'open';
        // إظهار إشعار
        const notificationText = data.notification || "تم إرسال رسالتك. سيتم الرد عليك بمجرد رؤية الرسالة.";
        showNotification(notificationText, "success");
      }
      // تحديث الرسائل بعد الإرسال الناجح
      await loadChatMessages();
    }
  } catch (error) {
    console.error("خطأ في إرسال الرسالة:", error);
    alert("حدث خطأ في الاتصال بالسيرفر");
    // إعادة تحميل الرسائل
    await loadChatMessages();
  }
}

// الحصول على الرسائل الحالية من الواجهة
function getCurrentMessages() {
  const container = document.getElementById("supportChatMessages");
  if (!container) return [];

  // هذا بسيط - سنعيد تحميل الرسائل من السيرفر بدلاً من ذلك
  return [];
}

// بدء استطلاع الرسائل الجديدة
function startMessagePolling() {
  stopMessagePolling(); // إيقاف أي استطلاع سابق
  messagePollInterval = setInterval(() => {
    if (currentChatId && document.getElementById("supportChatModal")?.style.display === "flex") {
      loadChatMessages();
    }
  }, 3000); // كل 3 ثواني
}

// إيقاف استطلاع الرسائل
function stopMessagePolling() {
  if (messagePollInterval) {
    clearInterval(messagePollInterval);
    messagePollInterval = null;
  }
}

// دالة مساعدة لتنظيف HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// إغلاق الشات عند الضغط خارج النافذة
document.addEventListener("click", (e) => {
  const modal = document.getElementById("supportChatModal");
  if (modal && e.target === modal) {
    closeSupportChat();
  }
});

