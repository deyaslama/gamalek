// ===================== نظام البانرات =====================
// ملف منفصل لإدارة البانرات بالكامل

// متغيرات السلايدر التلقائي
let bannerAutoIntervals = {};
let bannerCurrentIndices = {};
let bannerPausedStates = {};

/**
 * يحول hash الصورة إلى URL كامل
 * إذا كانت الصورة hash فقط، يضيف مسار /uploads/
 * إذا كانت URL كاملة، يعيدها كما هي
 */
function getBannerImageURL(imagePath) {
  if (!imagePath || imagePath.trim() === "") {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'%3E%3Crect fill='%23ddd' width='1200' height='400'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3Eلا توجد صورة%3C/text%3E%3C/svg%3E";
  }
  
  imagePath = imagePath.trim();
  
  // إذا كانت URL كاملة (http/https/data), أعيدها كما هي
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  
  // إذا كانت مسار نسبي يبدأ بـ /، أعيدها كما هي
  if (imagePath.startsWith("/")) {
    return imagePath;
  }
  
  // إذا كانت hash فقط (مثل "9b5a930c5d096f4c88b345aa9126102b")
  // أضيف مسار /uploads/
  return "/uploads/" + imagePath;
}

// تحميل البانرات من السيرفر
async function loadBannersNew(){
  const positions = [
    { key: 'main_slider', id: 'mainSlider' },
    { key: 'above_brands', id: 'bannersAboveBrands' },
    { key: 'above_featured', id: 'bannersAboveFeatured' },
    { key: 'above_offers', id: 'bannersAboveOffers' }
  ];
  
  for(const pos of positions){
    try {
      const res = await fetch(API + "/api/banners/" + pos.key);
      const banners = await res.json();
      
      console.log(`Loaded banners for ${pos.key}:`, banners);
      
      if(banners.error){
        console.error(`Error in banners response for ${pos.key}:`, banners.error);
        document.getElementById(pos.id).innerHTML = "";
        continue;
      }
      
      if(!Array.isArray(banners)){
        console.error(`Banners for ${pos.key} is not an array:`, banners);
        document.getElementById(pos.id).innerHTML = "";
        continue;
      }
      
      if(banners.length === 0){
        console.log(`No active banners for ${pos.key}`);
        document.getElementById(pos.id).innerHTML = "";
        continue;
      }
      
      console.log(`Rendering ${banners.length} banners for ${pos.key}`);
      renderBannersNew(pos.id, banners);
    } catch (error) {
      console.error(`Error loading banners for ${pos.key}:`, error);
      document.getElementById(pos.id).innerHTML = "";
    }
  }
}

// عرض البانرات في الحاوية المحددة
function renderBannersNew(containerId, banners){
  const container = document.getElementById(containerId);
  if(!container || banners.length === 0) {
    if(container) container.innerHTML = "";
    return;
  }
  
  // إنشاء معرف فريد للسلايدر وتحديد نوع التأثير
  let uniqueId;
  let transitionType = 'fade'; // افتراضي
  if(containerId === 'mainSlider') {
    uniqueId = 'mainSlider';
    transitionType = 'fade'; // البانر الثابت يبقى كما هو
  } else if(containerId === 'bannersAboveBrands') {
    uniqueId = 'bannerAboveBrands';
    transitionType = 'slide'; // تأثير slide
  } else if(containerId === 'bannersAboveFeatured') {
    uniqueId = 'bannerAboveFeatured';
    transitionType = 'zoom'; // تأثير zoom
  } else if(containerId === 'bannersAboveOffers') {
    uniqueId = 'bannerAboveOffers';
    transitionType = 'flip'; // تأثير flip
  } else {
    uniqueId = containerId.replace('banners', 'banner');
  }
  
  let html = `<div class="banner-carousel banner-transition-${transitionType}" id="carousel_${uniqueId}" data-transition="${transitionType}">`;
  
  banners.forEach((banner, idx) => {
    const productIds = JSON.parse(banner.product_ids || "[]");
    const productIdsStr = productIds.join(',');
    const desktopImg = banner.desktop_image || '';
    const mobileImg = banner.mobile_image || '';
    
    // تحويل الـ hash إلى مسار كامل إذا لزم الأمر
    const desktopImgUrl = getBannerImageURL(desktopImg);
    const mobileImgUrl = getBannerImageURL(mobileImg);
    
    html += `
      <div class="banner-item-carousel ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <img src="${desktopImgUrl}" class="banner-img-desktop" alt="${banner.title || ''}" onerror="this.style.display='none'">
        <img src="${mobileImgUrl}" class="banner-img-mobile" alt="${banner.title || ''}" onerror="this.style.display='none'">
      </div>
    `;
  });
  
  if(banners.length > 1){
    html += `
      <div class="banner-nav">
        <button class="banner-nav-btn prev" onclick="bannerNav('${uniqueId}', -1)">‹</button>
        <button class="banner-nav-btn next" onclick="bannerNav('${uniqueId}', 1)">›</button>
      </div>
      <div class="banner-indicators">
        ${banners.map((_, i) => `<span class="banner-indicator ${i === 0 ? 'active' : ''}" onclick="bannerGoToNew('${uniqueId}', ${i})"></span>`).join('')}
      </div>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
  
  // إضافة event listeners للصور
  const bannerItems = container.querySelectorAll('.banner-item-carousel');
  bannerItems.forEach((item, idx) => {
    const productIds = JSON.parse(banners[idx].product_ids || "[]");
    if(productIds.length > 0){
      item.style.cursor = 'pointer';
      item.onclick = () => handleBannerClick(productIds.join(','));
    }
  });
  
  // بدء السلايدر التلقائي
  if(banners.length > 1){
    // الحصول على العنصر carousel من DOM
    const carousel = document.getElementById(`carousel_${uniqueId}`);
    if(carousel){
      startBannerAutoSlideNew(uniqueId, banners.length);
      
      // إضافة pause/resume عند hover
      carousel.addEventListener('mouseenter', () => {
        pauseBannerAutoSlideNew(uniqueId);
      });
      
      carousel.addEventListener('mouseleave', () => {
        resumeBannerAutoSlideNew(uniqueId);
      });
    }
  }
}

// بدء السلايدر التلقائي
function startBannerAutoSlideNew(uniqueId, count){
  if(bannerAutoIntervals[uniqueId]){
    clearInterval(bannerAutoIntervals[uniqueId]);
  }
  
  if(!bannerCurrentIndices[uniqueId]){
    bannerCurrentIndices[uniqueId] = 0;
  }
  
  bannerPausedStates[uniqueId] = false;
  
  bannerAutoIntervals[uniqueId] = setInterval(() => {
    if(bannerPausedStates[uniqueId]) return;
    
    bannerCurrentIndices[uniqueId] = (bannerCurrentIndices[uniqueId] + 1) % count;
    bannerGoToNew(uniqueId, bannerCurrentIndices[uniqueId], true);
  }, 3500); // أسرع - كل 3.5 ثواني
}

// إيقاف السلايدر التلقائي مؤقتاً
function pauseBannerAutoSlideNew(uniqueId){
  bannerPausedStates[uniqueId] = true;
}

// استئناف السلايدر التلقائي
function resumeBannerAutoSlideNew(uniqueId){
  bannerPausedStates[uniqueId] = false;
}

// التنقل بين البانرات (السابق/التالي)
function bannerNav(uniqueId, direction){
  const carousel = document.getElementById(`carousel_${uniqueId}`);
  if(!carousel) return;
  
  const items = carousel.querySelectorAll('.banner-item-carousel');
  const currentIdx = bannerCurrentIndices[uniqueId] || 0;
  let newIdx = currentIdx + direction;
  
  if(newIdx < 0) newIdx = items.length - 1;
  if(newIdx >= items.length) newIdx = 0;
  
  bannerGoToNew(uniqueId, newIdx);
}

// الانتقال إلى بانر محدد
function bannerGoToNew(uniqueId, index, isAuto = false){
  const carousel = document.getElementById(`carousel_${uniqueId}`);
  if(!carousel) return;
  
  const items = carousel.querySelectorAll('.banner-item-carousel');
  const indicators = carousel.querySelectorAll('.banner-indicator');
  
  if(index < 0) index = items.length - 1;
  if(index >= items.length) index = 0;
  
  const currentIndex = bannerCurrentIndices[uniqueId] || 0;
  const transitionType = carousel.getAttribute('data-transition') || 'fade';
  
  // إخفاء جميع البانرات أولاً مع التأثير المناسب
  items.forEach((item, idx) => {
    if(item.classList.contains('active')){
      // تطبيق تأثير الخروج حسب النوع
      if(transitionType === 'slide'){
        item.style.transform = 'translateX(-100%)';
      } else if(transitionType === 'zoom'){
        item.style.transform = 'scale(1.2)';
      } else if(transitionType === 'flip'){
        item.style.transform = 'rotateY(90deg)';
      } else {
        // fade (الافتراضي)
        item.style.transform = 'scale(0.95)';
      }
      item.style.opacity = '0';
      setTimeout(() => {
        item.classList.remove('active');
        item.style.display = 'none';
        item.style.transform = '';
      }, transitionType === 'fade' ? 300 : 600);
    }
  });
  
  // إخفاء جميع المؤشرات
  indicators.forEach(ind => ind.classList.remove('active'));
  
  // إظهار البانر الجديد مع التأثير المناسب
  setTimeout(() => {
    bannerCurrentIndices[uniqueId] = index;
    
    // إخفاء جميع البانرات مرة أخرى للتأكد
    items.forEach(item => {
      item.classList.remove('active');
      item.style.display = 'none';
      item.style.transform = '';
      item.style.opacity = '0';
    });
    
    // تطبيق تأثير الدخول حسب النوع
    const newItem = items[index];
    if(transitionType === 'slide'){
      newItem.style.transform = 'translateX(100%)';
    } else if(transitionType === 'zoom'){
      newItem.style.transform = 'scale(0.8)';
    } else if(transitionType === 'flip'){
      newItem.style.transform = 'rotateY(-90deg)';
    }
    
    newItem.style.display = 'block';
    newItem.style.opacity = '0';
    
    // تفعيل الانتقال
    setTimeout(() => {
      newItem.classList.add('active');
      newItem.style.transform = '';
      newItem.style.opacity = '1';
    }, 10);
    items[index].classList.add('active');
    items[index].style.opacity = '0';
    items[index].style.transform = 'scale(0.95)';
    
    // تفعيل animation
    setTimeout(() => {
      items[index].style.opacity = '1';
      items[index].style.transform = 'scale(1)';
    }, 50);
    
    if(indicators[index]) indicators[index].classList.add('active');
  }, 300);
  
  // إعادة تشغيل السلايدر التلقائي فقط إذا لم يكن تلقائياً
  if(!isAuto && bannerAutoIntervals[uniqueId]){
    clearInterval(bannerAutoIntervals[uniqueId]);
    startBannerAutoSlideNew(uniqueId, items.length);
  }
}

// معالجة النقر على البانر
function handleBannerClick(productIdsStr){
  if(!productIdsStr || productIdsStr.trim() === ''){
    go('products');
    return;
  }
  
  const productIds = productIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  
  if(productIds.length === 0){
    go('products');
    return;
  }
  
  // حفظ المنتجات المحددة في متغير عام
  window.bannerProducts = productIds;
  
  // عرض المنتجات المحددة
  go('products');
}

