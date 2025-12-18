// ===================== نظام المفضلة =====================
// ملف منفصل لإدارة المفضلة بالكامل

// متغير المفضلة - IDs فقط
let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

// استخدام دالة go من النطاق العام
// تأكد من أن window.go متاحة قبل استخدامها

// حفظ المفضلة في localStorage
function saveWishlist(){
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

// تحديث عداد المفضلة في الهيدر
function updateWishlistCount() {
  const countBadge = document.getElementById("wishlistCount");
  const mobileCountBadge = document.getElementById("wishlistCountMobile");
  
  const count = wishlist.length;
  
  if (countBadge) {
    if (count > 0) {
      countBadge.innerText = count;
      countBadge.style.display = "inline-block";
    } else {
      countBadge.style.display = "none";
    }
  }
  
  if (mobileCountBadge) {
    if (count > 0) {
      mobileCountBadge.innerText = count;
      mobileCountBadge.style.display = "inline-block";
    } else {
      mobileCountBadge.style.display = "none";
    }
  }
}

// تأثير دخول شيء داخل المفضلة في الهيدر
function animateWishlistIcon() {
  const wishlistIcon = document.getElementById("wishlistIcon");
  const wishlistIconMobile = document.getElementById("wishlistIconMobile");
  
  // تأثير على أيقونة الكمبيوتر
  if(wishlistIcon) {
    wishlistIcon.style.animation = 'none';
    wishlistIcon.offsetHeight; // Force reflow
    wishlistIcon.style.animation = 'wishlistPulse 0.6s ease';
  }
  
  // تأثير على أيقونة الجوال
  if(wishlistIconMobile) {
    wishlistIconMobile.style.animation = 'none';
    wishlistIconMobile.offsetHeight; // Force reflow
    wishlistIconMobile.style.animation = 'wishlistPulse 0.6s ease';
  }
  
  // تأثير على العداد
  const countBadge = document.getElementById("wishlistCount");
  const mobileCountBadge = document.getElementById("wishlistCountMobile");
  
  if(countBadge && wishlist.length > 0) {
    countBadge.style.animation = 'none';
    countBadge.offsetHeight;
    countBadge.style.animation = 'wishlistBadgeBounce 0.5s ease';
  }
  
  if(mobileCountBadge && wishlist.length > 0) {
    mobileCountBadge.style.animation = 'none';
    mobileCountBadge.offsetHeight;
    mobileCountBadge.style.animation = 'wishlistBadgeBounce 0.5s ease';
  }
}

// إضافة/إزالة منتج من المفضلة
async function toggleWishlist(id){
  // التحقق من تسجيل الدخول قبل الإضافة
  // السماح بالإزالة حتى لو لم يكن مسجل دخول (لتنظيف البيانات القديمة)
  const isCurrentlyFav = wishlist.includes(id);
  
  // إذا كان يحاول الإضافة ولم يكن مسجل دخول، عرض modal
  if (!isCurrentlyFav && (!window.user || !window.user.phone)) {
    // عرض modal مخصص بدلاً من confirm
    if (typeof showWishlistLoginModal === 'function') {
      showWishlistLoginModal();
    } else if (typeof window.showWishlistLoginModal === 'function') {
      window.showWishlistLoginModal();
    } else {
      // Fallback: استخدام confirm إذا لم تكن الدالة متاحة
      if (confirm("⚠️ يجب تسجيل الدخول لإضافة المنتجات للمفضلة.\n\nهل تريد الانتقال لصفحة تسجيل الدخول؟")) {
        if (typeof go === 'function') {
          go("login");
        } else if (typeof window.go === 'function') {
          window.go("login");
        } else {
          window.location.hash = "#login";
        }
      }
    }
    return;
  }

  // لو المنتج موجود → احذفه
  if(isCurrentlyFav){
    wishlist = wishlist.filter(x => x !== id);
  } 
  else {
    wishlist.push(id);
    // تأثير دخول شيء داخل المفضلة عند الإضافة فقط
    animateWishlistIcon();
  }

  saveWishlist();
  updateWishlistCount();
  
  const isNowFav = !isCurrentlyFav;
  
  // تحديث القلب في صفحة المنتج مباشرة دون إعادة تحميل الصفحة
  const productWishlistBtn = document.getElementById("productWishlistBtn");
  if(productWishlistBtn && window.currentProductId === id) {
    productWishlistBtn.style.color = isNowFav ? '#E91E63' : '#bbb';
    productWishlistBtn.title = isNowFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة';
    
    // تأثير اهتزاز للصورة فقط
    const imageWrapper = document.querySelector('.product-image-wrapper');
    if(imageWrapper) {
      imageWrapper.style.animation = 'none';
      setTimeout(() => {
        imageWrapper.style.animation = 'heartShake 0.5s ease';
      }, 10);
    }
  }
  
  // تحديث جميع القلوب في كروت المنتجات في الصفحة الحالية
  const allWishlistButtons = document.querySelectorAll('div[onclick*="toggleWishlist"]');
  allWishlistButtons.forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick') || '';
    // التحقق من أن هذا الزر خاص بهذا المنتج
    if(onclickAttr.includes(`toggleWishlist(${id})`)) {
      // تحديث اللون
      btn.style.color = isNowFav ? '#E91E63' : '#bbb';
      // تحديث العنوان
      btn.title = isNowFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة';
      
      // تأثير بسيط عند التغيير
      btn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 200);
    }
  });
}

// تحميل صفحة المفضلة
async function loadWishlist(){
  // التحقق من تسجيل الدخول
  if (!window.user || !window.user.phone) {
    // عرض Modal بدلاً من alert
    if (typeof showWishlistLoginModal === 'function') {
      showWishlistLoginModal();
    } else if (typeof window.showWishlistLoginModal === 'function') {
      window.showWishlistLoginModal();
    } else {
      // Fallback: استخدام alert إذا لم تكن الدالة متاحة
      alert("⚠️ يجب تسجيل الدخول لعرض المفضلة");
      if (typeof go === 'function') {
        go("login");
      } else if (typeof window.go === 'function') {
        window.go("login");
      } else {
        window.location.hash = "#login";
      }
    }
    return;
  }

  const res = await fetch(API + "/api/products");
  const allList = await res.json();
  
  // التأكد من أن جميع المنتجات لديها stock و quantity
  const all = allList.map(p => ({
    ...p,
    stock: parseInt(p.stock || p.quantity || 0),
    quantity: parseInt(p.quantity || p.stock || 0),
    stock_qty: parseInt(p.stock || p.quantity || 0) // للتوافق مع الكود القديم
  }));
  
  // تحديث productsCache
  window.productsCache = all;

  const favList = all.filter(p => wishlist.includes(p.id));

  // إنشاء شريط التصفية
  const container = document.getElementById('wishlistContainer');
  if(container && favList.length > 0) {
    // إزالة الشريط القديم إن وجد
    const oldFilter = document.getElementById('filterBar-wishlistContainer');
    if(oldFilter) oldFilter.remove();
    createFilterBar('wishlistContainer', favList);
  }

  if(favList.length === 0){
    const grid = document.getElementById("wishlistGrid");
    grid.innerHTML = "<p>لا توجد منتجات في المفضّلة.</p>";
    const pagination = document.getElementById("wishlistPagination");
    if(pagination) pagination.style.display = 'none';
    return;
  }

  // عرض المنتجات باستخدام النظام الجديد
  renderProductsWithPagination('wishlistGrid', favList, 'wishlistPagination', true);

  refreshAllAddToCartButtons();
}

