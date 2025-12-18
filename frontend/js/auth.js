// ===================== ملف المصادقة والتسجيل =====================
// يحتوي على جميع دوال التسجيل وتسجيل الدخول وإدارة الحساب

// ===================== تسجيل الدخول =====================
async function doLogin() {
  const loginPhone = document.getElementById("loginPhone");
  const loginPass = document.getElementById("loginPass");
  const loginMsg = document.getElementById("loginMsg");

  if (!loginPhone || !loginPass) {
    console.error("عناصر تسجيل الدخول غير موجودة");
    return;
  }

  let phone = loginPhone.value.trim();
  const pass = loginPass.value.trim();

  // التحقق من الحقول
  if (!phone || !pass) {
    if (loginMsg) {
      loginMsg.innerText = "❌ الرجاء إدخال رقم الجوال وكلمة المرور";
      loginMsg.style.color = "#e74c3c";
    }
    return;
  }

  phone = phone.replace(/\s+/g, "");

  if (phone.startsWith("0")) phone = phone.substring(1);
  if (phone.startsWith("966")) phone = phone.substring(3);
  if (phone.startsWith("00966")) phone = phone.substring(5);

  try {
    const res = await fetch(API + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password: pass })
    });

    const data = await res.json();

    if (!data.success) {
      if (loginMsg) {
        loginMsg.innerText = "❌ " + data.message;
        loginMsg.style.color = "#e74c3c";
      }
      return;
    }

    // مسح رسالة الخطأ عند النجاح
    if (loginMsg) {
      loginMsg.innerText = "";
    }

    window.user = data.user;
    localStorage.setItem("user", JSON.stringify(data.user));
    
    // تحديث رابط الحساب في الهيدر
    if (typeof updateHeaderProfile === 'function') {
      updateHeaderProfile();
    }
    
    // تحديث شريط الكوبون بعد تسجيل الدخول
    if (typeof loadCouponBanner === 'function') {
      setTimeout(() => {
        loadCouponBanner();
      }, 300);
    }
    
    // الانتقال لصفحة الملف الشخصي
    if (typeof go === 'function') {
      go("profile");
    } else {
      console.error("دالة go غير موجودة");
    }
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    if (loginMsg) {
      loginMsg.innerText = "❌ حدث خطأ في الاتصال بالسيرفر";
      loginMsg.style.color = "#e74c3c";
    }
  }
}

// ===================== إنشاء حساب جديد =====================
async function doRegister() {
  const regName = document.getElementById("regName");
  const regPhone = document.getElementById("regPhone");
  const regEmail = document.getElementById("regEmail");
  const regPass = document.getElementById("regPass");
  const regPass2 = document.getElementById("regPass2");
  const regAddress = document.getElementById("regAddress");
  const registerMsg = document.getElementById("registerMsg");

  if (!regName || !regPhone || !regEmail || !regPass || !regPass2 || !regAddress) {
    console.error("عناصر التسجيل غير موجودة");
    return;
  }

  const name = regName.value.trim();
  let phone = regPhone.value.trim();
  const email = regEmail.value.trim();
  const pass = regPass.value.trim();
  const pass2 = regPass2.value.trim();
  const address = regAddress.value.trim();

  // التحقق
  if (!name || !phone || !email || !pass || !pass2 || !address) {
    if (registerMsg) {
      registerMsg.innerText = "❌ الرجاء إدخال جميع البيانات";
      registerMsg.style.color = "#e74c3c";
    }
    return;
  }

  // تنظيف رقم الهاتف
  phone = phone.replace(/\s+/g, "");
  if (phone.startsWith("0")) phone = phone.substring(1);
  if (phone.startsWith("966")) phone = phone.substring(3);
  if (phone.startsWith("00966")) phone = phone.substring(5);

  if (!phone.match(/^5\d{8}$/)) {
    if (registerMsg) {
      registerMsg.innerText = "❌ رقم الجوال يجب أن يبدأ بـ 5 وطوله 9 أرقام";
      registerMsg.style.color = "#e74c3c";
    }
    return;
  }

  // تحسين كلمة المرور - على الأقل 8 أحرف
  if (pass.length < 8) {
    if (registerMsg) {
      registerMsg.innerText = "❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل";
      registerMsg.style.color = "#e74c3c";
    }
    return;
  }

  if (pass !== pass2) {
    if (registerMsg) {
      registerMsg.innerText = "❌ كلمة المرور غير متطابقة";
      registerMsg.style.color = "#e74c3c";
    }
    return;
  }

  try {
    const res = await fetch(API + "/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email,
        password: pass,
        address
      })
    });

    if (!res.ok) {
      throw new Error("Network error");
    }

    const data = await res.json();

    if (!data.success) {
      if (registerMsg) {
        registerMsg.innerText = "❌ " + data.message;
        registerMsg.style.color = "#e74c3c";
      }
      return;
    }

    if (registerMsg) {
      registerMsg.innerHTML = "✔ تم إنشاء الحساب — تم إرسال كود التفعيل";
      registerMsg.style.color = "#4caf50";
    }

    // حفظ الهاتف لصفحة التفعيل
    const vPhone = document.getElementById("vPhone");
    if (vPhone) {
      vPhone.value = phone;
    }

    // تشغيل المؤقت
    if (typeof startVerifyTimer === 'function') {
      startVerifyTimer();
    }

    // الذهاب لصفحة التفعيل
    if (typeof go === 'function') {
      go("verify");
    } else {
      console.error("دالة go غير موجودة");
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (registerMsg) {
      registerMsg.innerText = "❌ حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.";
      registerMsg.style.color = "#e74c3c";
    }
  }
}

// ===================== نسيان كلمة المرور - إرسال الكود =====================
async function sendResetCode() {
  const fpEmail = document.getElementById("fpEmail");
  const fpMsg = document.getElementById("fpMsg");

  if (!fpEmail) {
    console.error("عنصر البريد الإلكتروني غير موجود");
    return;
  }

  const email = fpEmail.value.trim();

  if (!email) {
    if (fpMsg) {
      fpMsg.innerText = "❌ الرجاء إدخال البريد الإلكتروني";
      fpMsg.style.color = "#e74c3c";
    }
    return;
  }

  try {
    const res = await fetch(API + "/api/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!data.success) {
      if (fpMsg) {
        fpMsg.innerText = "❌ " + data.message;
        fpMsg.style.color = "#e74c3c";
      }
      return;
    }

    alert("✔ تم إرسال كود الاستعادة إلى بريدك الإلكتروني");
    
    // حفظ البريد في صفحة إعادة تعيين كلمة المرور
    const rpEmail = document.getElementById("rpEmail");
    if (rpEmail) {
      rpEmail.value = email;
    }

    // الانتقال لصفحة إعادة تعيين كلمة المرور
    if (typeof go === 'function') {
      go("reset");
    } else {
      console.error("دالة go غير موجودة");
    }
  } catch (error) {
    console.error("خطأ في إرسال كود الاستعادة:", error);
    if (fpMsg) {
      fpMsg.innerText = "❌ حدث خطأ في الاتصال بالسيرفر";
      fpMsg.style.color = "#e74c3c";
    }
  }
}

// ===================== إعادة ضبط كلمة المرور =====================
async function resetPassword() {
  const rpEmail = document.getElementById("rpEmail");
  const rpCode = document.getElementById("rpCode");
  const rpPass = document.getElementById("rpPass");
  const rpMsg = document.getElementById("rpMsg");

  if (!rpEmail || !rpCode || !rpPass) {
    console.error("عناصر إعادة ضبط كلمة المرور غير موجودة");
    return;
  }

  const email = rpEmail.value.trim();
  const code = rpCode.value.trim();
  const new_password = rpPass.value.trim();

  if (!email || !code || !new_password) {
    if (rpMsg) {
      rpMsg.innerText = "❌ الرجاء إدخال جميع البيانات";
      rpMsg.style.color = "#e74c3c";
    }
    return;
  }

  if (new_password.length < 8) {
    if (rpMsg) {
      rpMsg.innerText = "❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل";
      rpMsg.style.color = "#e74c3c";
    }
    return;
  }

  try {
    const res = await fetch(API + "/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, new_password })
    });

    const data = await res.json();

    if (!data.success) {
      if (rpMsg) {
        rpMsg.innerText = "❌ " + (data.message || "حدث خطأ أثناء إعادة ضبط كلمة المرور");
        rpMsg.style.color = "#e74c3c";
      }
      return;
    }

    alert("✔ تم تغيير كلمة المرور بنجاح!");
    
    // الانتقال لصفحة تسجيل الدخول
    if (typeof go === 'function') {
      go("login");
    } else {
      console.error("دالة go غير موجودة");
    }
  } catch (error) {
    console.error("خطأ في إعادة ضبط كلمة المرور:", error);
    if (rpMsg) {
      rpMsg.innerText = "❌ حدث خطأ في الاتصال بالسيرفر";
      rpMsg.style.color = "#e74c3c";
    }
  }
}

// ===================== تفعيل الحساب =====================
async function verifyAccount() {
  const vPhone = document.getElementById("vPhone");
  const vCode = document.getElementById("vCode");
  const verifyMsg = document.getElementById("verifyMsg");

  if (!vPhone || !vCode) {
    console.error("عناصر التفعيل غير موجودة");
    return;
  }

  const phone = vPhone.value.trim();
  const code = vCode.value.trim();

  if (!code || code.length !== 6) {
    if (verifyMsg) {
      verifyMsg.innerText = "❌ يرجى إدخال كود التفعيل المكون من 6 أرقام";
      verifyMsg.style.color = "#e74c3c";
      verifyMsg.style.display = "block";
    }
    return;
  }

  try {
    const res = await fetch(API + "/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code })
    });

    if (!res.ok) {
      throw new Error("Network error");
    }

    const data = await res.json();

    if (!data.success) {
      if (verifyMsg) {
        verifyMsg.innerText = "❌ كود التفعيل غير صحيح. يرجى المحاولة مرة أخرى";
        verifyMsg.style.color = "#e74c3c";
        verifyMsg.style.display = "block";
      }
      // مسح الحقل لإعادة المحاولة
      if (vCode) {
        vCode.value = "";
        vCode.focus();
      }
      return;
    }

    if (verifyMsg) {
      verifyMsg.innerHTML = "✔ تم تفعيل الحساب بنجاح — سيتم تحويلك الآن...";
      verifyMsg.style.color = "#4caf50";
      verifyMsg.style.display = "block";
    }

    setTimeout(() => {
      if (typeof go === 'function') {
        go("login");
      } else {
        console.error("دالة go غير موجودة");
      }
    }, 1500);
  } catch (error) {
    console.error("خطأ في تفعيل الحساب:", error);
    if (verifyMsg) {
      verifyMsg.innerText = "❌ حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.";
      verifyMsg.style.color = "#e74c3c";
      verifyMsg.style.display = "block";
    }
  }
}

// ===================== إعادة إرسال كود التفعيل =====================
async function resendVerifyCode() {
  const vPhone = document.getElementById("vPhone");
  const verifyMsg = document.getElementById("verifyMsg");

  if (!vPhone || !vPhone.value.trim()) {
    if (verifyMsg) {
      verifyMsg.innerText = "❌ رقم الجوال غير موجود";
      verifyMsg.style.color = "#e74c3c";
      verifyMsg.style.display = "block";
    }
    return false;
  }

  const phone = vPhone.value.trim();

  try {
    const res = await fetch(API + "/api/resend-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });

    if (!res.ok) {
      throw new Error("Network error");
    }

    const data = await res.json();

    if (data.success) {
      if (verifyMsg) {
        verifyMsg.innerHTML = "✔ تم إرسال كود جديد إلى بريدك الإلكتروني";
        verifyMsg.style.color = "#4caf50";
        verifyMsg.style.display = "block";
      }

      // تشغيل المؤقت
      if (typeof startVerifyTimer === 'function') {
        startVerifyTimer();
      }

      // مسح الحقل القديم
      const vCode = document.getElementById("vCode");
      if (vCode) {
        vCode.value = "";
        vCode.focus();
      }
    } else {
      if (verifyMsg) {
        verifyMsg.innerText = "❌ " + (data.message || "حدث خطأ في إرسال الكود");
        verifyMsg.style.color = "#e74c3c";
        verifyMsg.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Resend code error:", error);
    if (verifyMsg) {
      verifyMsg.innerText = "❌ حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى";
      verifyMsg.style.color = "#e74c3c";
      verifyMsg.style.display = "block";
    }
  }

  return false;
}

// ===================== مؤقت إعادة إرسال الكود =====================
let verifyTimer = null;
function startVerifyTimer() {
  let sec = 60;
  const resendBox = document.getElementById("resendBox");
  const timerBox = document.getElementById("timerBox");
  const timer = document.getElementById("timer");

  if (resendBox) resendBox.style.display = "none";
  if (timerBox) timerBox.style.display = "inline";

  if (timer) timer.innerText = sec;

  if (verifyTimer) {
    clearInterval(verifyTimer);
  }

  verifyTimer = setInterval(() => {
    sec--;
    if (timer) timer.innerText = sec;

    if (sec <= 0) {
      clearInterval(verifyTimer);
      if (timerBox) timerBox.style.display = "none";
      if (resendBox) resendBox.style.display = "inline";
    }
  }, 1000);
}

// ===================== التحقق الفوري من الإيميل =====================
let emailCheckTimeout;
async function checkEmail(email) {
  const emailIcon = document.getElementById("regEmailIcon");
  const emailMsg = document.getElementById("regEmailMsg");

  if (!email || !email.includes("@") || !email.includes(".")) {
    if (emailIcon) {
      emailIcon.classList.remove("show", "valid", "invalid");
    }
    if (emailMsg) {
      emailMsg.textContent = "";
    }
    return;
  }

  clearTimeout(emailCheckTimeout);
  emailCheckTimeout = setTimeout(async () => {
    try {
      const res = await fetch(API + "/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        throw new Error("Network error");
      }

      const data = await res.json();

      if (data.exists) {
        if (emailIcon) {
          emailIcon.classList.add("show", "invalid");
          emailIcon.classList.remove("valid");
        }
        if (emailMsg) {
          emailMsg.textContent = "❌ هذا الإيميل مسجل مسبقاً";
          emailMsg.className = "validation-message error";
        }
      } else {
        if (emailIcon) {
          emailIcon.classList.add("show", "valid");
          emailIcon.classList.remove("invalid");
        }
        if (emailMsg) {
          emailMsg.textContent = "✓ الإيميل متاح";
          emailMsg.className = "validation-message success";
        }
      }
    } catch (error) {
      // في حالة الخطأ، لا نعرض أي شيء
      if (emailIcon) {
        emailIcon.classList.remove("show", "valid", "invalid");
      }
      if (emailMsg) {
        emailMsg.textContent = "";
      }
    }
  }, 500);
}

// ===================== التحقق الفوري من رقم الجوال =====================
let phoneCheckTimeout;
async function checkPhone(phone) {
  const phoneIcon = document.getElementById("regPhoneIcon");
  const phoneMsg = document.getElementById("regPhoneMsg");

  let cleanPhone = phone.replace(/\s+/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);
  if (cleanPhone.startsWith("966")) cleanPhone = cleanPhone.substring(3);
  if (cleanPhone.startsWith("00966")) cleanPhone = cleanPhone.substring(5);

  if (!cleanPhone || !cleanPhone.match(/^5\d{8}$/)) {
    if (phoneIcon) {
      phoneIcon.classList.remove("show", "valid", "invalid");
    }
    if (phoneMsg) {
      phoneMsg.textContent = "";
    }
    return;
  }

  clearTimeout(phoneCheckTimeout);
  phoneCheckTimeout = setTimeout(async () => {
    try {
      const res = await fetch(API + "/api/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone })
      });

      if (!res.ok) {
        throw new Error("Network error");
      }

      const data = await res.json();

      if (data.exists) {
        if (phoneIcon) {
          phoneIcon.classList.add("show", "invalid");
          phoneIcon.classList.remove("valid");
        }
        if (phoneMsg) {
          phoneMsg.textContent = "❌ هذا الرقم مسجل مسبقاً";
          phoneMsg.className = "validation-message error";
        }
      } else {
        if (phoneIcon) {
          phoneIcon.classList.add("show", "valid");
          phoneIcon.classList.remove("invalid");
        }
        if (phoneMsg) {
          phoneMsg.textContent = "✓ الرقم متاح";
          phoneMsg.className = "validation-message success";
        }
      }
    } catch (error) {
      // في حالة الخطأ، لا نعرض أي شيء
      if (phoneIcon) {
        phoneIcon.classList.remove("show", "valid", "invalid");
      }
      if (phoneMsg) {
        phoneMsg.textContent = "";
      }
    }
  }, 500);
}

// ===================== تحسين كلمة المرور =====================
function checkPasswordStrength(password) {
  const strengthBar = document.getElementById("regPassStrength");
  const passMsg = document.getElementById("regPassMsg");
  const passIcon = document.getElementById("regPassIcon");

  if (!password) {
    if (strengthBar) strengthBar.innerHTML = "";
    if (passMsg) passMsg.textContent = "";
    if (passIcon) passIcon.classList.remove("show", "valid", "invalid");
    return;
  }

  let strength = 0;
  let feedback = [];

  if (password.length >= 8) strength++;
  else feedback.push("8 أحرف على الأقل");

  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  let strengthClass = "weak";
  let strengthText = "ضعيفة";

  if (strength >= 4) {
    strengthClass = "strong";
    strengthText = "قوية";
    if (passIcon) {
      passIcon.classList.add("show", "valid");
      passIcon.classList.remove("invalid");
    }
    if (passMsg) {
      passMsg.textContent = "✓ كلمة مرور قوية";
      passMsg.className = "validation-message success";
    }
  } else if (strength >= 2) {
    strengthClass = "medium";
    strengthText = "متوسطة";
    if (passIcon) {
      passIcon.classList.remove("show", "valid", "invalid");
    }
    if (passMsg) {
      passMsg.textContent = "كلمة المرور متوسطة - أضف أرقام ورموز لزيادة القوة";
      passMsg.className = "validation-message";
    }
  } else {
    if (passIcon) {
      passIcon.classList.remove("show", "valid", "invalid");
    }
    if (passMsg) {
      passMsg.textContent = feedback.length > 0 ? feedback.join("، ") : "كلمة المرور ضعيفة";
      passMsg.className = "validation-message error";
    }
  }

  if (strengthBar) {
    strengthBar.innerHTML = `<div class="password-strength-bar ${strengthClass}"></div>`;
  }
}

// ===================== تهيئة التحقق الفوري عند تحميل الصفحة =====================
function initValidationListeners() {
  const regEmail = document.getElementById("regEmail");
  const regPhone = document.getElementById("regPhone");
  const regPass = document.getElementById("regPass");

  if (regEmail) {
    regEmail.addEventListener("input", (e) => checkEmail(e.target.value));
  }

  if (regPhone) {
    regPhone.addEventListener("input", (e) => checkPhone(e.target.value));
  }

  if (regPass) {
    regPass.addEventListener("input", (e) => checkPasswordStrength(e.target.value));
  }
}

// تهيئة عند تحميل DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initValidationListeners);
} else {
  initValidationListeners();
}

