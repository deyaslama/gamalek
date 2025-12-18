
async function loadProductsCache(forceReload = false) {
  if (!window.productsCache || forceReload) {
    const res = await fetch(API + "/api/products");
    window.productsCache = await res.json();
    
    // التأكد من أن جميع المنتجات لديها stock و quantity
    window.productsCache = window.productsCache.map(p => ({
      ...p,
      stock: parseInt(p.stock || p.quantity || 0),
      quantity: parseInt(p.quantity || p.stock || 0),
      stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
    }));
  }
}

function safeImageURL(url) {
  // Default placeholder URL (using data URI as fallback to avoid network issues)
  const defaultPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23ddd' width='300' height='300'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3Eلا توجد صورة%3C/text%3E%3C/svg%3E";
  
  if (!url || typeof url !== 'string' || url.trim() === "" || url.length < 3) {
    return defaultPlaceholder;
  }

  url = url.trim();

  // Google Drive
  if (url.includes("drive.google.com")) {
    const id = url.match(/[-\w]{25,}/);
    if (id) {
      return `https://lh3.googleusercontent.com/d/${id[0]}`;
    }
    return defaultPlaceholder;
  }

  // Googleusercontent direct image
  if (url.includes("googleusercontent.com")) {
    return url;
  }

  // Full HTTP/HTTPS link
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Data URI
  if (url.startsWith("data:")) {
    return url;
  }

  // Relative path starting with /uploads (serve from backend)
  if (url.includes("uploads") || url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    // Ensure it starts with /uploads/
    if (url.startsWith("/uploads/")) {
      return url;
    } else if (url.startsWith("uploads/")) {
      return "/" + url;
    } else {
      // If uploads is in the middle of the path
      return url.startsWith("/") ? url : "/" + url;
    }
  }

  // If it's not a valid link → return a placeholder
  return defaultPlaceholder;
}

// ===================== Ø®Ø§ØµÙŠØ© Ø§Ù„Ø²ÙˆÙ… Ø¹Ù„Ù‰ ØµÙˆØ±Ø© Ø§Ù„Ù…Ù†ØªØ¬ =====================
function openImageZoom(imageUrl) {
  // Ø¥Ù†Ø´Ø§Ø¡ overlay Ù„Ù„Ø²ÙˆÙ…
  let overlay = document.getElementById("imageZoomOverlay");
  
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "imageZoomOverlay";
    overlay.innerHTML = `<img id="zoomedImage" src="${imageUrl}" alt="ØµÙˆØ±Ø© Ø§Ù„Ù…Ù†ØªØ¬">`;
    document.body.appendChild(overlay);
    
    // Ø¥ØºÙ„Ø§Ù‚ Ø¹Ù†Ø¯ Ø§Ù„Ø¶ØºØ· ÙÙŠ Ø£ÙŠ Ù…ÙƒØ§Ù†
    overlay.onclick = function(e) {
      if (e.target === overlay || e.target.id === "zoomedImage") {
        closeImageZoom();
      }
    };
    
    // Ø¥ØºÙ„Ø§Ù‚ Ø¹Ù†Ø¯ Ø§Ù„Ø¶ØºØ· Ø¹Ù„Ù‰ ESC
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && overlay.style.display === "flex") {
        closeImageZoom();
      }
    });
  } else {
    document.getElementById("zoomedImage").src = imageUrl;
  }
  
  overlay.style.display = "flex";
  document.body.style.overflow = "hidden"; // Ù…Ù†Ø¹ Ø§Ù„ØªÙ…Ø±ÙŠØ±
}

function closeImageZoom() {
  const overlay = document.getElementById("imageZoomOverlay");
  if (overlay) {
    overlay.style.display = "none";
    document.body.style.overflow = ""; // Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªÙ…Ø±ÙŠØ±
  }
}



// دالة go() موجودة في index.html - تم حذفها من هنا لتجنب التعارض
// لا تستخدم هذه الدالة - استخدم go() من index.html
  // Ø¥Ø®ÙØ§Ø¡ Ø§Ù„ØµÙØ­Ø§Øª
  document.querySelectorAll(".page").forEach(
    p => p.classList.remove("active")
  );

  // Ø¥Ø¸Ù‡Ø§Ø± Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©
  const targetPage = document.getElementById("page-" + page);
  if (targetPage) targetPage.classList.add("active");

  // ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø­Ø³Ø¨ Ø§Ù„ØµÙØ­Ø©

  if (page === "home") loadHome();
  if (page === "products") loadAllProducts();
  if (page === "product") loadProductDetails(data);
  if (page === "brands") loadBrandsList();

  if (page === "brand") {
    window.currentBrand = data;
    loadBrandProducts(data);
  }

  if(page === "checkout") {
    renderCheckoutPage();
    autoFillUserInCheckout();   // â­ Ø¥Ø¶Ø§ÙØ© Ù…Ù‡Ù…Ø© Ù‡Ù†Ø§
}


  // â­ Ø¥ØµÙ„Ø§Ø­ track (Ù…Ø´Ø±ÙˆØ· Ø¨ÙˆØ¬ÙˆØ¯ Ø§Ù„ØµÙØ­Ø©)
  if (page === "track" && document.getElementById("page-track")) {
  loadTrackPage(data);   // â† Ø¥Ø±Ø³Ø§Ù„ Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨
}


  // â­ Ø¥ØµÙ„Ø§Ø­ offers (Ù…Ø´Ø±ÙˆØ· Ø¨ÙˆØ¬ÙˆØ¯ Ø§Ù„ØµÙØ­Ø©)
  if (page === "offers" && document.getElementById("page-offers")) {
    loadOffers();
  }

  if (page === "categories") loadCategories();

  if (page === "category") {
    window.currentCategory = data;
    loadCategoryProducts(data);
  }

  if (page === "thanks") {
    loadInvoice(data);   // â† Ù‡Ù†Ø§ Ù†Ø­Ù…Ù‘Ù„ Ø§Ù„ÙØ§ØªÙˆØ±Ø©
}


  if (page === "wishlist") loadWishlist();

  // â­ ØµÙØ­Ø© Ø­Ø³Ø§Ø¨ÙŠ
  if (page === "profile" && typeof loadProfile === "function") {
    loadProfile();
  }

  // â­ ØµÙØ­Ø© Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠ
  if (page === "page" && data) {
    loadPageContent(data);
  }

  // ØªØ­Ø¯ÙŠØ« Ø±Ø§Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨ ÙÙŠ Ø§Ù„Ù‡ÙŠØ¯Ø± Ø¹Ù†Ø¯ Ø§Ù„ØªÙ†Ù‚Ù„
  updateHeaderProfile();
  updateWishlistCount();
}





// API will be set from window.API (loaded from /api/config in index.html)
const API = window.API || "http://localhost:3000";
// ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø§Ù„Ù…Ø­Ù„ÙŠ Ø¨Ø¹Ø¯ ÙØªØ­ Ø§Ù„ØµÙØ­Ø©
window.user = JSON.parse(localStorage.getItem("user") || "null");


// ======================= ØµÙØ­Ø© ÙƒÙ„ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª =======================
async function loadAllProducts(){

  // جلب المنتجات
  const res = await fetch(API + "/api/products");
  const list = await res.json();

  // التأكد من أن جميع المنتجات لديها stock و quantity وتطبيق مسارات الصور
  const normalizedList = list.map(p => {
    // تطبيع مسار الصورة إذا كان نسبياً
    let imageUrl = p.image_url;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      // إذا كان المسار نسبياً وليس يبدأ بـ /، أضف /
      if (!imageUrl.startsWith('/')) {
        imageUrl = '/' + imageUrl;
      }
      // إذا كان المسار يبدأ بـ uploads بدون /، أضف /
      if (imageUrl.startsWith('uploads/')) {
        imageUrl = '/' + imageUrl;
      }
    }
    
    return {
      ...p,
      image_url: imageUrl || p.image_url,
      stock: parseInt(p.stock || p.quantity || 0),
      quantity: parseInt(p.quantity || p.stock || 0),
      stock_qty: parseInt(p.stock || p.quantity || 0) // للتوافق مع الكود القديم
    };
  });

  // Ø­ÙØ¸Ù‡Ø§ ÙÙŠ Ø§Ù„Ù…ØªØºÙŠØ± Ø§Ù„Ø¹Ø§Ù…
  window.allProducts = normalizedList;
  window.productsCache = normalizedList;

  // ØªØ¹Ø¨Ø¦Ø© Ø§Ù„ÙÙ„ØªØ± (Ø§Ù„Ù…Ø§Ø±ÙƒØ§Øª)
  fillBrandSelect();

  // عرض جميع المنتجات
  renderProducts(list);

  // تحديث أزرار السلة
  refreshAllAddToCartButtons();
}



function fillBrandSelect(){
  const sel = document.getElementById("brandSelect");
  sel.innerHTML = '<option value="">ÙƒÙ„ Ø§Ù„Ù…Ø§Ø±ÙƒØ§Øª</option>';

  // استخراج الماركات بدون تكرار
  let brands = {};
  allProducts.forEach(p => {
    if(p.brand_id && !brands[p.brand_id]){
      brands[p.brand_id] = p.brand_name;
    }
  });

  for(let id in brands){
    sel.innerHTML += `<option value="${id}">${brands[id]}</option>`;
  }
}

function renderProducts(list){
  const grid = document.getElementById("productsPageGrid");
  grid.innerHTML = "";

  if(list.length === 0){
    grid.innerHTML = "<p>Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª</p>";
    return;
  }

  list.forEach(p=>{
    grid.innerHTML += makeProductCard(p);
  });

  refreshAllAddToCartButtons();   // âœ” Ù‡Ù†Ø§ Ø§Ù„Ù…ÙƒØ§Ù† Ø§Ù„ØµØ­ÙŠØ­
}



function filterProducts(){
  const text = document.getElementById("productsSearch").value.toLowerCase();
  const brand = document.getElementById("brandSelect").value;

  let filtered = allProducts.filter(p=>
    (!text || p.name.toLowerCase().includes(text)) &&
    (!brand || p.brand_id == brand)
  );

  renderProducts(filtered);
}
//------------------ ØµÙØ­Ø© Ø®ØµÙ… Ø§Ù„Ø³Ø¹Ø± --------------------
function calculateFinalPrice(p){
  const base = parseFloat(p.base_price) || 0;
  const discountValue = parseFloat(p.discount_value) || 0;
  const discountType = p.discount_type || "none";

  let priceAfterDiscount = base;

  // Ø§Ù„Ø®ØµÙ…
  if(discountType === "percent"){
    priceAfterDiscount = base - (base * (discountValue / 100));
  }
  else if(discountType === "fixed"){
    priceAfterDiscount = base - discountValue;
  }

  if(priceAfterDiscount < 0) priceAfterDiscount = 0;

  // الضريبة (استخدام VATCalculator)
  const beforeVat = VATCalculator.addVAT(base);
  const finalWithVat = VATCalculator.addVAT(priceAfterDiscount);

  return {
    before: beforeVat.toFixed(2),     // السعر قبل الخصم + الضريبة
    final: finalWithVat.toFixed(2),   // السعر بعد الخصم + الضريبة
  };
}



// ======================= ØµÙØ­Ø© Ø§Ù„ØªÙØ§ØµÙŠÙ„ =======================
// ======================= ØµÙØ­Ø© Ø§Ù„ØªÙØ§ØµÙŠÙ„ =======================
async function loadProductDetails(id) {

  // â­ Ø¥ØµÙ„Ø§Ø­ Ù‚ÙØ² Ø§Ù„ØµÙØ­Ø© Ù„Ù„Ø£Ø³ÙÙ„
  window.scrollTo(0, 0);
  const res = await fetch(API + "/api/products");
  const productsList = await res.json();
  
  // Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ø¯ÙŠÙ‡Ø§ stock Ùˆ quantity
  const products = productsList.map(p => ({
    ...p,
    stock: parseInt(p.stock || p.quantity || 0),
    quantity: parseInt(p.quantity || p.stock || 0),
    stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
  }));
  
  // ØªØ­Ø¯ÙŠØ« productsCache
  window.productsCache = products;

  const p = products.find(x => x.id == id);
  if (!p) {
    document.getElementById("productDetailsBox").innerHTML =
      "<p>âŒ Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯</p>";
    return;
  }

  /* â­ Ø­Ø³Ø§Ø¨ Ø§Ù„Ø£Ø³Ø¹Ø§Ø± â­ */

  const base = parseFloat(p.base_price) || 0;               // السعر الأساسي بدون ضريبة
  const discountValue = parseFloat(p.discount_value) || 0;  // قيمة الخصم
  const discountType = p.discount_type || "none";           // نوع الخصم

  // تطبيق الخصم
  let afterDiscount = base;
  if (discountType === "percent") {
    afterDiscount = base - (base * (discountValue / 100));
  }
  else if (discountType === "fixed") {
    afterDiscount = base - discountValue;
  }

  if (afterDiscount < 0) afterDiscount = 0;

  // Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¶Ø±ÙŠØ¨Ø© 15%
  const beforeVat = VATCalculator.addVAT(base);         // السعر الأساسي + الضريبة
  const afterVat = VATCalculator.addVAT(afterDiscount); // السعر بعد الخصم + الضريبة

  /* â­ Ø¹Ø±Ø¶ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬ â­ */
  document.getElementById("productDetailsBox").innerHTML = `
    <div class="product-details-container">
      <div class="product-main-content">
        <!-- صورة المنتج مع خاصية الزوم -->
        <div class="product-image-wrapper">
          <img id="productMainImage" 
               src="${safeImageURL(p.image_url)}"
               onerror="this.src='https://via.placeholder.com/400?text=No+Image'"
               class="product-main-image"
               onclick="openImageZoom('${safeImageURL(p.image_url)}')"
               alt="${p.name}">
          <div class="zoom-hint">ðŸ” Ø§Ø¶ØºØ· Ù„Ù„ØªÙƒØ¨ÙŠØ±</div>
        </div>

        <!-- بيانات المنتج -->
        <div class="product-info-section">
          <div class="product-header">
            <h1 class="product-title">${p.name}</h1>
            ${p.intl_code ? `
              <div class="product-barcode">
                <span class="barcode-label">Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠ:</span>
                <span class="barcode-value">${p.intl_code}</span>
              </div>
            ` : ""}
          </div>

          <!-- الأسعار -->
          <div class="product-pricing">
            ${(discountType !== "none" && discountValue > 0) ? `
              <div class="price-before-discount">
                <span class="old-price">${beforeVat.toFixed(2)} Ø±.Ø³</span>
                <span class="discount-badge">Ø®ØµÙ… ${discountType === "percent" ? discountValue + "%" : discountValue + " Ø±.Ø³"}</span>
              </div>
            ` : ""}
            <div class="price-final">
              <span class="price-amount">${afterVat.toFixed(2)}</span>
              <span class="price-currency">Ø±.Ø³</span>
            </div>
          </div>

          <!-- Ø§Ù„ÙˆØµÙ -->
          <div class="product-description">
            <h3 class="section-label">Ø§Ù„ÙˆØµÙ</h3>
            <p class="description-text">${p.description || "Ù„Ø§ ÙŠÙˆØ¬Ø¯ ÙˆØµÙ Ù„Ù„Ù…Ù†ØªØ¬"}</p>
          </div>

          ${(() => {
            const stock = parseInt(p.stock || p.quantity || p.stock_qty || 0);
            const isOutOfStock = stock <= 0;
            const showStockInfo = stock > 0 && stock <= 6;
            
            return `
              ${showStockInfo ? `
                <div class="product-stock-info">
                  <span class="stock-label">Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ©:</span>
                  <span class="stock-value">${stock} Ø­Ø¨Ø©</span>
                </div>
              ` : ''}
              
              <!-- Ø²Ø± Ø§Ù„Ø¥Ø¶Ø§ÙØ© Ù„Ù„Ø³Ù„Ø© -->
              <button id="productAddBtn"
                data-id="${p.id}"
                onclick="${isOutOfStock ? 'alert(\'âš ï¸ Ø¹Ø°Ø±Ø§Ù‹ØŒ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ØªÙˆÙØ± Ø­Ø§Ù„ÙŠØ§Ù‹\'); return false;' : `addToCart(${p.id})`}"
                class="product-add-btn ${isOutOfStock ? 'out-of-stock-btn' : ''}"
                ${isOutOfStock ? 'disabled' : ''}>
                <span>${isOutOfStock ? 'âŒ' : 'ðŸ›’'}</span>
                <span>${isOutOfStock ? 'Ø§Ù„ÙƒÙ…ÙŠØ© Ù…Ù†ØªÙ‡ÙŠØ©' : 'Ø£Ø¶Ù Ù„Ù„Ø³Ù„Ø©'}</span>
              </button>
            `;
          })()}
        </div>
      </div>
    </div>
  `;

  updateProductPageButton(id);

  
  /* ============================================================
   â­ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…Ø´Ø§Ø¨Ù‡Ø© â€” Ø³Ù„Ø§ÙŠØ¯Ø± Ø£ÙÙ‚ÙŠ â­
   ============================================================ */
/* ============================================================
     â­ Ù…Ù†ØªØ¬Ø§Øª Ù…Ø´Ø§Ø¨Ù‡Ø© â€” Ø³Ù„Ø§ÙŠØ¯Ø± ÙƒØ§Ù…Ù„ â­
   ============================================================ */

let similar = (window.productsCache || [])
  .filter(x => x.category === p.category && x.id != p.id)
  .slice(0, 10); // ÙÙ‚Ø· Ø£ÙˆÙ„ 10 Ù…Ù†ØªØ¬Ø§Øª

if (similar.length > 0) {

  let sliderHTML = `
    <div class="similar-products-section">
      <h2 class="similar-products-title">
        <span>âœ¨</span>
        <span>Ù…Ù†ØªØ¬Ø§Øª Ù…Ø´Ø§Ø¨Ù‡Ø©</span>
      </h2>

      <div class="similar-slider-wrapper">
        <!-- زر السابق -->
        <button id="simPrev" class="slider-nav-btn slider-nav-prev" aria-label="Ø§Ù„Ø³Ø§Ø¨Ù‚">
          â€¹
        </button>

        <!-- السلايدر -->
        <div id="simSlider" class="similar-products-slider">
  `;

  similar.forEach(sp => {
    const prices = calculateFinalPrice(sp);

    sliderHTML += `
      <div class="similar-product-card" onclick="go('product', ${sp.id})">
        <div class="similar-product-image-wrapper">
          <img src="${safeImageURL(sp.image_url)}"
               class="similar-product-image"
               alt="${sp.name}">
          ${sp.discount_value > 0 ? `
            <div class="similar-product-discount">
              Ø®ØµÙ… ${sp.discount_value}${sp.discount_type === 'percent' ? '%' : ''}
            </div>
          ` : ''}
        </div>
  
        <div class="similar-product-info">
          <h3 class="similar-product-name">${sp.name}</h3>
          
          <div class="similar-product-price">
            ${sp.discount_value > 0 ? `
              <span class="similar-price-old">${prices.before} Ø±.Ø³</span>
            ` : ''}
            <span class="similar-price-new">${prices.final} Ø±.Ø³</span>
          </div>
        </div>
      </div>
    `;
  });

  sliderHTML += `
        </div>

        <!-- زر التالي -->
        <button id="simNext" class="slider-nav-btn slider-nav-next" aria-label="Ø§Ù„ØªØ§Ù„ÙŠ">
          â€º
        </button>
      </div>
    </div>
  `;

  document.getElementById("productDetailsBox").innerHTML += sliderHTML;

  /* ===== Ø³Ù„ÙˆÙƒ Ø§Ù„Ø³Ù„Ø§ÙŠØ¯Ø± Ø§Ù„Ù…Ø­Ø³Ù‘Ù† ===== */
  const slider = document.getElementById("simSlider");
  const prevBtn = document.getElementById("simPrev");
  const nextBtn = document.getElementById("simNext");
  
  if (!slider || !prevBtn || !nextBtn) return;

  let isScrolling = false;
  const cardWidth = 220; // Ø¹Ø±Ø¶ ÙƒÙ„ Ø¨Ø·Ø§Ù‚Ø© + Ù…Ø³Ø§ÙØ©

  // ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ø£Ø²Ø±Ø§Ø±
  function updateSliderButtons() {
    prevBtn.style.opacity = slider.scrollLeft <= 0 ? "0.3" : "1";
    prevBtn.style.pointerEvents = slider.scrollLeft <= 0 ? "none" : "auto";
    
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    nextBtn.style.opacity = slider.scrollLeft >= maxScroll - 5 ? "0.3" : "1";
    nextBtn.style.pointerEvents = slider.scrollLeft >= maxScroll - 5 ? "none" : "auto";
  }

  prevBtn.onclick = () => {
    if (isScrolling) return;
    isScrolling = true;
    slider.scrollBy({ left: -cardWidth, behavior: "smooth" });
    setTimeout(() => { isScrolling = false; updateSliderButtons(); }, 500);
  };

  nextBtn.onclick = () => {
    if (isScrolling) return;
    isScrolling = true;
    slider.scrollBy({ left: cardWidth, behavior: "smooth" });
    setTimeout(() => { isScrolling = false; updateSliderButtons(); }, 500);
  };

  // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø£Ø²Ø±Ø§Ø± Ø¹Ù†Ø¯ Ø§Ù„ØªÙ…Ø±ÙŠØ±
  slider.addEventListener('scroll', updateSliderButtons);
  updateSliderButtons();

  // إلغاء السلايدر التلقائي القديم
}


}



async function loadBrandsList(){
  const res = await fetch(API + "/api/brands");
  const brands = await res.json();

  const grid = document.getElementById("brandsGrid");
  grid.innerHTML = "";

  brands.forEach(b=>{
    grid.innerHTML += `
      <div class="brand-box" onclick="go('brand', ${b.id})">
        <div class="brand-circle">
          <img src="${b.image_url || 'https://via.placeholder.com/100'}">
        </div>
        <div class="brand-name">${b.name}</div>
      </div>
    `;
  });
}

async function loadBrandProducts(brand_id){
  const res = await fetch(API + "/api/products");
  const allList = await res.json();
  
  // Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ø¯ÙŠÙ‡Ø§ stock Ùˆ quantity
  const all = allList.map(p => ({
    ...p,
    stock: parseInt(p.stock || p.quantity || 0),
    quantity: parseInt(p.quantity || p.stock || 0),
    stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
  }));
  
  // ØªØ­Ø¯ÙŠØ« productsCache
  window.productsCache = all;

  const list = all.filter(p => p.brand_id == brand_id);

  const brand = list.length ? list[0].brand_name : "Ù…Ø§Ø±ÙƒØ©";
  document.getElementById("brandTitle").innerText = brand;

  const grid = document.getElementById("brandProductsGrid");
  grid.innerHTML = "";

  list.forEach(p=>{
    grid.innerHTML += makeProductCard(p);
  });

  // â­ Ø§Ù„Ø­Ù„ Ù‡Ù†Ø§
  refreshAllAddToCartButtons();
}

function loadCheckout(){
  const box = document.getElementById("checkoutItems");
  box.innerHTML = "";

  let total = 0;

  cart.forEach(item=>{
    let t = item.qty * item.price;
    total += t;

    box.innerHTML += `
      <div style="padding:10px 0;border-bottom:1px solid #eee;">
        ${item.name}  
        <br>
        Ø§Ù„ÙƒÙ…ÙŠØ©: ${item.qty} Ã— ${item.price} = ${t.toFixed(2)} Ø±.Ø³
      </div>
    `;
  });

  document.getElementById("checkoutTotal").innerText = total.toFixed(2);
}

// Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù„Ù„Ø¨Ø§Ùƒ Ø§Ù†Ø¯
async function confirmOrder(){
  const name = checkoutName.value.trim();
  const phone = checkoutPhone.value.trim();

  if(!name || !phone){
    alert("Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø§Ø³Ù… ÙˆØ±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„");
    return;
  }

const body = {
    customer_name: window.user.name,
    customer_phone: window.user.phone,   // â­ Ù…Ù‡Ù… Ø¬Ø¯Ø§Ù‹ â€” Ø§Ù„Ø±Ù‚Ù… ÙŠØ£ØªÙŠ Ù…Ù† Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙ‚Ø·
    customer_phone2: phone,               // Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø°ÙŠ ÙŠØ¯Ø®Ù„Ù‡ Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙÙŠ Ø§Ù„ÙÙˆØ±Ù… (Ø±Ù‚Ù… Ø«Ø§Ù†ÙˆÙŠ)
    customer_address: document.getElementById("co_address").value.trim(),
    customer_location: document.getElementById("co_location").value.trim(),
    customer_notes: document.getElementById("co_notes").value.trim(),

    items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        base_price: item.base_price,
        discount_value: window.productsCache.find(p => p.id == item.id)?.discount_value || 0,
        discount_type: window.productsCache.find(p => p.id == item.id)?.discount_type || "none"
    }))
};




  const res = await fetch(API + "/api/orders", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if(data.success){
    // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙÙŠ productsCache Ø¨Ø¹Ø¯ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨
    if (window.productsCache) {
      cart.forEach(item => {
        const product = window.productsCache.find(p => p.id == item.id);
        if (product) {
          const currentStock = parseInt(product.stock || product.quantity || product.stock_qty || 0);
          const newStock = Math.max(0, currentStock - item.qty);
          product.stock = newStock;
          product.quantity = newStock;
          product.stock_qty = newStock; // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
        }
      });
    }
    
    cart = [];
    saveCart();
    updateCartIcon();
    go("thanks", data.order_id);
  }
}


async function trackOrder(){
  const id = trackInput.value.trim();
  if(!id) return;

  const res = await fetch(API + "/api/orders/" + id);
  const data = await res.json();

  const box = document.getElementById("trackResult");

  if(data.error){
    box.innerHTML = "âŒ Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯";
    return;
  }

  box.innerHTML = `
    <p>Ø§Ù„Ø§Ø³Ù…: ${data.order.customer_name}</p>
    <p>Ø§Ù„Ù‡Ø§ØªÙ: ${data.order.customer_phone}</p>
    <p>Ø§Ù„Ø­Ø§Ù„Ø©: <b>${data.order.status}</b></p>
    <p>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: ${data.order.total} Ø±.Ø³</p>
  `;
}
async function doLogin(){
  let phone = loginPhone.value.trim();
  const pass = loginPass.value.trim();

  phone = phone.replace(/\s+/g, "");

  if (phone.startsWith("0")) phone = phone.substring(1);
  if (phone.startsWith("966")) phone = phone.substring(3);
  if (phone.startsWith("00966")) phone = phone.substring(5);

  const res = await fetch(API + "/api/login", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ phone, password: pass })
  });

  const data = await res.json();

  if(!data.success){
    loginMsg.innerText = "âŒ " + data.message;
    loginMsg.style.color = "#e74c3c";
    return;
  }
  
  // Ù…Ø³Ø­ Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø®Ø·Ø£ Ø¹Ù†Ø¯ Ø§Ù„Ù†Ø¬Ø§Ø­
  loginMsg.innerText = "";

  window.user = data.user;
  localStorage.setItem("user", JSON.stringify(data.user));
  updateHeaderProfile(); // ØªØ­Ø¯ÙŠØ« Ø±Ø§Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨ ÙÙŠ Ø§Ù„Ù‡ÙŠØ¯Ø±
  go("profile");
}


async function doRegister(){

  const name = regName.value.trim();
  const phone = regPhone.value.trim();
  const email = regEmail.value.trim();
  const pass = regPass.value.trim();
  const pass2 = regPass2.value.trim();
  const address = regAddress.value.trim();

  // Ø§Ù„ØªØ­Ù‚Ù‚
  if(!name || !phone || !email || !pass || !pass2 || !address){
    registerMsg.innerText = "âŒ Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª";
    return;
  }

if (phone.startsWith("0")) phone = phone.substring(1);
if (phone.startsWith("966")) phone = phone.substring(3);
if (phone.startsWith("00966")) phone = phone.substring(5);

if(!phone.match(/^5\d{8}$/)){
  registerMsg.innerText = "âŒ Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„ ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 5 ÙˆØ·ÙˆÙ„Ù‡ 9 Ø£Ø±Ù‚Ø§Ù…";
  return;
}


  if(pass !== pass2){
    registerMsg.innerText = "âŒ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚Ø©";
    return;
  }

    const res = await fetch(API + "/api/register", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      name,
      phone,
      email,
      password: pass,
      address
    })
  });

  const data = await res.json();

  if(!data.success){
    registerMsg.innerText = "âŒ " + data.message;
    registerMsg.style.color = "#e74c3c";
    return;
  }

  registerMsg.innerHTML = "âœ” ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ â€” ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ÙƒÙˆØ¯ Ø§Ù„ØªÙØ¹ÙŠÙ„";
  registerMsg.style.color = "#4caf50";

  // Ø­ÙØ¸ Ø§Ù„Ù‡Ø§ØªÙ Ù„ØµÙØ­Ø© Ø§Ù„ØªÙØ¹ÙŠÙ„
  document.getElementById("vPhone").value = phone;

  // ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ø¤Ù‚Øª
  startVerifyTimer();

  // Ø§Ù„Ø°Ù‡Ø§Ø¨ Ù„ØµÙØ­Ø© Ø§Ù„ØªÙØ¹ÙŠÙ„
  go("verify");
}


async function loadProfile() {

  if (!window.user) {
    go("login");
    return;
  }

  // ØªØ¹Ø¨Ø¦Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„
  document.getElementById("pName").innerText = window.user.name || "â€”";
  document.getElementById("pPhone").innerText = "ðŸ“± " + (window.user.phone || "â€”");
  document.getElementById("pEmail").innerText = "ðŸ“§ " + (window.user.email || "â€”");
  document.getElementById("pAddress").innerText = "ðŸ“ " + (window.user.address || "â€”");

  // Ø¬Ù„Ø¨ Ø§Ù„Ø·Ù„Ø¨Ø§Øª
  const orders = await fetchUserOrders(window.user.phone);

  let html = "";

  if (orders.length === 0) {
    html = `<p style="text-align:center;color:#777;margin-top:20px;">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†</p>`;
  } else {
    orders.forEach(o => {
      
      let st = "";
      if (o.status === "new") st = "st-new";
      else if (o.status === "preparing") st = "st-preparing";
      else if (o.status === "completed") st = "st-completed";
      else if (o.status === "out") st = "st-out";
      else if (o.status === "cancelled") st = "st-cancelled";

      html += `
      <div class="order-box">
        <p><b>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨:</b> ${o.id}</p>
        <p><b>Ø§Ù„ØªØ§Ø±ÙŠØ®:</b> ${o.date}</p>
        <p><b>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ:</b> ${safeNum(o.total_with_shipping || o.total)} Ø±.Ø³</p>
        <p><span class="status-badge ${st}">${o.status}</span></p>
        <button onclick="go('track', ${o.id})" 
                style="margin-top:10px;background:#7a004b;color:white;border:none;padding:7px 12px;border-radius:6px;cursor:pointer;">
          ØªØªØ¨Ø¹ Ø§Ù„Ø·Ù„Ø¨
        </button>
      </div>
      `;
    });
  }

  document.getElementById("profileOrders").innerHTML = html;
}

function safeNum(n){
  return (!n || isNaN(n)) ? "0.00" : Number(n).toFixed(2);
}

// ===================== ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± =====================
function showChangePasswordModal(){
  document.getElementById("changePasswordModal").style.display = "flex";
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("changePasswordMsg").innerText = "";
}

function hideChangePasswordModal(){
  document.getElementById("changePasswordModal").style.display = "none";
}

async function changePassword(){
  const currentPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const msgBox = document.getElementById("changePasswordMsg");
  
  if(!currentPassword || !newPassword || !confirmPassword){
    msgBox.innerText = "âš ï¸ ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„";
    msgBox.style.color = "#e74c3c";
    return;
  }
  
  if(newPassword !== confirmPassword){
    msgBox.innerText = "âš ï¸ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚Ø©";
    msgBox.style.color = "#e74c3c";
    return;
  }
  
  if(newPassword.length < 6){
    msgBox.innerText = "âš ï¸ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„";
    msgBox.style.color = "#e74c3c";
    return;
  }
  
  try {
    const res = await fetch(API + "/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: window.user.phone,
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    const data = await res.json();
    
    if(data.success){
      msgBox.innerText = "âœ… ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­!";
      msgBox.style.color = "#28a745";
      setTimeout(() => {
        hideChangePasswordModal();
        alert("âœ… ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­!");
      }, 1500);
    } else {
      msgBox.innerText = "âŒ " + (data.message || "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±");
      msgBox.style.color = "#e74c3c";
    }
  } catch (error) {
    console.error("Ø®Ø·Ø£:", error);
    msgBox.innerText = "âŒ Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø³ÙŠØ±ÙØ±";
    msgBox.style.color = "#e74c3c";
  }
}

// Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù†Ø§ÙØ°Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø¶ØºØ· Ø®Ø§Ø±Ø¬Ù‡Ø§
document.addEventListener('click', function(event) {
  const modal = document.getElementById("changePasswordModal");
  if (event.target === modal) {
    hideChangePasswordModal();
  }
});



async function loadHome(){

  // ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø§Ø±ÙƒØ§Øª
  const brandsRes = await fetch(API + "/api/brands");
  const brands = await brandsRes.json();

  // ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª
  const prodRes = await fetch(API + "/api/products");
  const productsList = await prodRes.json();
  
  // التأكد من أن جميع المنتجات لديها stock و quantity وتطبيق مسارات الصور
  const products = productsList.map(p => {
    // تطبيع مسار الصورة إذا كان نسبياً
    let imageUrl = p.image_url;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      // إذا كان المسار نسبياً وليس يبدأ بـ /، أضف /
      if (!imageUrl.startsWith('/')) {
        imageUrl = '/' + imageUrl;
      }
      // إذا كان المسار يبدأ بـ uploads بدون /، أضف /
      if (imageUrl.startsWith('uploads/')) {
        imageUrl = '/' + imageUrl;
      }
    }
    
    return {
      ...p,
      image_url: imageUrl || p.image_url,
      stock: parseInt(p.stock || p.quantity || 0),
      quantity: parseInt(p.quantity || p.stock || 0),
      stock_qty: parseInt(p.stock || p.quantity || 0) // للتوافق مع الكود القديم
    };
  });
  
  // تحديث productsCache
  window.productsCache = products;

  // ==================== Ø§Ù„Ù…Ø§Ø±ÙƒØ§Øª Ø§Ù„Ù…Ù…ÙŠØ²Ø© ====================
  const slider = document.getElementById("brandsSlider");
  slider.innerHTML = "";

  brands
    .filter(b => b.featured == 1)         // â­ ÙÙ‚Ø· Ø§Ù„Ù…Ø§Ø±ÙƒØ§Øª Ø§Ù„Ù…Ù…ÙŠØ²Ø©
    .forEach(b => {
      slider.innerHTML += `
        <div class="brand-box" onclick="go('brand', ${b.id})">
          <div class="brand-circle">
            <img src="${b.image_url || 'https://via.placeholder.com/120'}">
          </div>
          <div class="brand-name">${b.name}</div>
        </div>
      `;
    });

  // ==================== المنتجات المميزة ====================
  const featuredGrid = document.getElementById("featuredGrid");
  featuredGrid.innerHTML = "";

  products
    .filter(p => p.featured == 1)        // â­ ÙÙ‚Ø· Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…Ù…ÙŠØ²Ø©
    .slice(0, 15)
    .forEach(p => {
      featuredGrid.innerHTML += makeProductCard(p);
    });

  // ==================== Ø§Ù„Ø¹Ø±ÙˆØ¶ (Ø®ØµÙˆÙ…Ø§Øª) ====================
  const discountGrid = document.getElementById("discountGrid");
  discountGrid.innerHTML = "";

  products
    .filter(p => p.discount_value > 0)
    .slice(0, 15)
    .forEach(p => {
      discountGrid.innerHTML += makeProductCard(p);
    });
	
  // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø£Ø²Ø±Ø§Ø± Ø¨Ø¹Ø¯ Ø¥Ø¹Ø§Ø¯Ø© Ø¨Ù†Ø§Ø¡ Ø§Ù„ØµÙØ­Ø©
  refreshAllAddToCartButtons();
}
function makeProductCard(p){
  const isFav = wishlist.includes(p.id);
  const stock = parseInt(p.stock || p.quantity || p.stock_qty || 0);
  const isOutOfStock = stock <= 0;
  const showStockBadge = stock > 0 && stock <= 6;

  return `
    <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" style="position:relative;" onclick="go('product', ${p.id})">

      <!-- Ø²Ø± Ø§Ù„Ù‚Ù„Ø¨ ÙÙŠ Ø£Ø¹Ù„Ù‰ Ø§Ù„ÙƒØ§Ø±Øª -->
      <div onclick="event.stopPropagation(); toggleWishlist(${p.id});"
           style="
             position:absolute;
             top:12px;
             left:12px;
             font-size:22px;
             cursor:pointer;
             z-index:20;
             color:${isFav ? '#E91E63' : '#bbb'};
             background:rgba(255,255,255,0.9);
             width:36px;
             height:36px;
             border-radius:50%;
             display:flex;
             align-items:center;
             justify-content:center;
             box-shadow:0 2px 8px rgba(0,0,0,0.1);
             transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
           "
           onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 4px 12px rgba(233, 30, 99, 0.3)'"
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
        â¤
      </div>

      <!-- الصورة + الخصم -->
      <div style="position:relative;padding:4px;">

        <!-- Ø§Ù„Ø®ØµÙ… ÙÙŠ Ø£Ø³ÙÙ„ ÙŠÙ…ÙŠÙ† Ø§Ù„ØµÙˆØ±Ø© -->
        ${
          p.discount_value > 0
          ? `<div style="
                position:absolute;
                bottom:0px;
                right:2px;
                background:#00a6ff;
                color:white;
                padding:3px 10px;
                font-size:12px;
                border-radius:20px;
                font-weight:600;
                white-space:nowrap;
                z-index:10;
              ">
              Ø®ØµÙ… ${p.discount_value}${p.discount_type === 'percent' ? "%" : ""}
             </div>`
          : ``
        }

        <!-- الصورة -->
        <img class="product-img"
             src="${safeImageURL(p.image_url)}"
             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'Arial\' font-size=\'12\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3Eلا توجد صورة%3C/text%3E%3C/svg%3E';"
             loading="lazy"
             style="${isOutOfStock ? 'filter: grayscale(100%); opacity: 0.5; cursor:pointer;' : 'cursor:pointer;'}"/>
        ${showStockBadge ? `
          <div style="
            position:absolute;
            top:8px;
            left:8px;
            background:linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color:white;
            padding:4px 10px;
            border-radius:12px;
            font-size:11px;
            font-weight:700;
            z-index:15;
            box-shadow:0 2px 8px rgba(255, 152, 0, 0.4);
          ">
            Ù…ØªØ¨Ù‚ÙŠ ${stock}
          </div>
        ` : ''}
      </div>

      <!-- اسم المنتج -->
      <h3 class="product-name"
          style="font-size:12px; line-height:1.35; height:40px; overflow:hidden; margin:4px 0 2px 0; cursor:pointer;">
        ${p.name}
      </h3>

      <!-- Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ø£Ø³Ø¹Ø§Ø± -->
      <div class="price-row"
           style="display:flex;align-items:center;gap:10px;margin-top:1px;flex-direction:row-reverse;">

        <!-- حساب السعر -->
${(() => {
  const prices = calculateFinalPrice(p);

  return `
    <div style="display:flex;align-items:center;gap:8px;flex-direction:row-reverse;">

      <!-- Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ -->
      <div style="
        font-size:18px;
        font-weight:800;
        color:${p.discount_value > 0 ? '#E91E63' : '#8a004a'};
        white-space:nowrap;
        background:linear-gradient(135deg, ${p.discount_value > 0 ? '#E91E63' : '#8a004a'} 0%, ${p.discount_value > 0 ? '#c2185b' : '#6a0038'} 100%);
        -webkit-background-clip:text;
        -webkit-text-fill-color:transparent;
        background-clip:text;
        text-shadow:0 2px 4px rgba(138, 0, 74, 0.1);
      ">
        ${prices.final} Ø±.Ø³
      </div>

      <!-- السعر قبل الخصم -->
      ${
        p.discount_value > 0 
        ? `<div style="
              font-size:13px;
              color:#999;
              text-decoration:line-through;
              white-space:nowrap;
              opacity:0.7;
              position:relative;
            ">
              ${prices.before} Ø±.Ø³
           </div>`
        : ``
      }

    </div>
  `;
})()}


      </div>

      <!-- زر السلة -->
      <button 
        id="cart-btn-${p.id}"
        onclick="event.stopPropagation(); ${isOutOfStock ? 'return false;' : `addToCart(${p.id})`}"
        class="add-cart"
        ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
        <span>${isOutOfStock ? '❌' : '🛒'}</span>
        <span>${isOutOfStock ? 'الكمية منتهية' : 'أضف للسلة'}</span>
      </button>

    </div>
  `;
}


// ========================== Ø§Ù„Ø³Ù„Ø© ==========================

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
}

function openCart(){
  const overlay = document.getElementById("cartOverlay");
  const panel = document.getElementById("cartPanel");
  
  if (!overlay || !panel) {
    console.error("Cart elements not found!");
    return;
  }
  
  // ØªØ­Ø¯ÙŠØ« Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø³Ù„Ø© Ø£ÙˆÙ„Ø§Ù‹
  renderCart();
  
  // Ø«Ù… ÙØªØ­ Ø§Ù„Ù„ÙˆØ­Ø©
  overlay.style.display = "block";
  panel.style.right = "0px";
}

function closeCart(){
  document.getElementById("cartOverlay").style.display = "none";
  document.getElementById("cartPanel").style.right = "-350px";
}

async function addToCart(id){

  // تحميل المنتجات من API (إعادة تحميل إذا لم تكن موجودة)
  if(!window.productsCache){
    const res = await fetch(API + "/api/products");
    const productsList = await res.json();
    
    // التأكد من أن جميع المنتجات لديها stock و quantity
    window.productsCache = productsList.map(p => ({
      ...p,
      stock: parseInt(p.stock || p.quantity || 0),
      quantity: parseInt(p.quantity || p.stock || 0),
      stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
    }));
  }
  
  // Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ù…Ø­Ø¯Ø¯ Ù…Ù† Ø§Ù„Ø³ÙŠØ±ÙØ± Ù„Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ø­Ø¯Ø« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
  const productRes = await fetch(API + "/api/products");
  const allProducts = await productRes.json();
  const updatedProduct = allProducts.find(p => p.id == id);
  if(updatedProduct && window.productsCache){
    const productIndex = window.productsCache.findIndex(p => p.id == id);
    if(productIndex !== -1){
      window.productsCache[productIndex] = {
        ...updatedProduct,
        stock: parseInt(updatedProduct.stock || updatedProduct.quantity || 0),
        quantity: parseInt(updatedProduct.quantity || updatedProduct.stock || 0),
        stock_qty: parseInt(updatedProduct.stock || updatedProduct.quantity || 0)
      };
    }
  }

  const p = window.productsCache.find(x => x.id == id);
  if(!p) return;

  // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
  const stock = parseInt(p.stock || p.quantity || p.stock_qty || 0);
  if(stock <= 0){
    alert("âš ï¸ Ø¹Ø°Ø±Ø§Ù‹ØŒ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ØªÙˆÙØ± Ø­Ø§Ù„ÙŠØ§Ù‹");
    return;
  }

  // Ù‡Ù„ Ø§Ù„Ù…Ù†ØªØ¬ Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Ø§Ù„Ø³Ù„Ø©
  let item = cart.find(x => x.id == id);
  const currentQty = item ? item.qty : 0;
  const newQty = currentQty + 1;

  // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø£Ù† Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ù„Ø§ ØªØªØ¬Ø§ÙˆØ² Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
  if(newQty > stock){
    alert(`âš ï¸ Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ§Ø­Ø© ÙÙŠ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ù‡ÙŠ ${stock} Ø­Ø¨Ø© ÙÙ‚Ø·`);
    return;
  }

  if(item){
    item.qty = newQty;
  } else {
    // Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ø£Ø³Ø¹Ø§Ø±
let base = parseFloat(p.base_price) || 0;
let discountValue = parseFloat(p.discount_value) || 0;
let discountType = p.discount_type;

let priceAfterDiscount = base;

if (discountValue > 0) {
    if (discountType === "percent") {
        priceAfterDiscount = base - (base * (discountValue / 100));
    } else if (discountType === "fixed") {
        priceAfterDiscount = base - discountValue;
    }
}

let priceWithVat = VATCalculator.addVAT(priceAfterDiscount);

item = {
    id: p.id,
    name: p.name,
    qty: 1,
    image: p.image_url,

    // Ù…Ù‡Ù… Ø¬Ø¯Ø§Ù‹ â€” ÙŠÙØ±Ø³Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ¥Ù„Ù‰ orders.html
    base_price: base,
    price_after_discount: priceAfterDiscount.toFixed(2),
    price_with_vat: priceWithVat.toFixed(2),
    total: priceWithVat.toFixed(2)   // Ù„Ù„Ù‚Ø·Ø¹Ø© Ø§Ù„ÙˆØ§Ø­Ø¯Ø©
};

    cart.push(item);
  }

  saveCart();
  renderCart();
  updateCartIcon();
  refreshCurrentPage();

  // ÙØªØ­ Ù„ÙˆØ­Ø© Ø§Ù„Ø³Ù„Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¹Ù†Ø¯ Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬
  openCart();

  // ØªØ­Ø¯ÙŠØ« Ø²Ø± Ø§Ù„ÙƒØ±Øª Ù„Ù„Ù…Ù†ØªØ¬
  const btn = document.getElementById(`cart-btn-${id}`);
  if(btn){
    btn.innerText = `Ù…Ø¶Ø§Ù Ù„Ù„Ø³Ù„Ø© +${item.qty}`;
    btn.style.background = "#8a004a";
    btn.style.color = "#fff";
    btn.classList.add("added");
  }

  // ØªØ­Ø¯ÙŠØ« Ø²Ø± ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬
  updateProductPageButton(id);
}



function removeItem(id){
  cart = cart.filter(x => x.id != id);

  saveCart();
  renderCart();          // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø³Ù„Ø© Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠØ©
  renderCheckoutPage();  // ØªØ­Ø¯ÙŠØ« ØµÙØ­Ø© Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨
  updateCartIcon();
  refreshAllAddToCartButtons();
  updateProductPageButton(id);
}





function changeQty(id, q){
  console.log("changeQty called:", {id, q, cartLength: cart.length});
  const item = cart.find(x => x.id == id);
  if(!item) {
    console.log("Item not found in cart");
    return;
  }
  
  console.log("Current item qty:", item.qty);

  // حماية مطلقة: منع تقليل الكمية عن 1 - فقط زر الحذف يحذف المنتج
  // هذا هو أول وأهم فحص - قبل أي شيء آخر
  if(q < 0 && item.qty <= 1){
    console.log("BLOCKED: Cannot decrease quantity below 1. Current qty:", item.qty, "Attempted change:", q);
    // لا تفعل شيئاً - اخرج من الدالة مباشرة
    return; // هذا يمنع أي تنفيذ إضافي بشكل نهائي
  }
  
  // التحقق من أن الكمية الجديدة لن تقل عن 1
  if(q < 0 && (item.qty + q) < 1){
    console.log("BLOCKED: New quantity would be less than 1. Current:", item.qty, "Change:", q, "Would be:", item.qty + q);
    return; // لا تسمح بتقليل الكمية عن 1
  }
    // التحقق من أن الكمية الجديدة لن تقل عن 1
    if(item.qty + q < 1){
      // لا تسمح بتقليل الكمية عن 1
      return; // هذا يمنع أي تنفيذ إضافي
    }
  }

  // إذا وصلنا هنا، يعني أن التقليل مسموح (الكمية > 1)

  // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
  if(!window.productsCache){
    // إذا لم يتم تحميل المنتجات، استمر بدون تحقق
    // حماية إضافية: التأكد من أن الكمية الجديدة لا تقل عن 1
    const newQty1 = item.qty + q;
    if(newQty1 < 1){
      return; // لا تسمح بتقليل الكمية عن 1
    }
    item.qty = newQty1;
  } else {
    const p = window.productsCache.find(x => x.id == id);
    if(p){
      const stock = parseInt(p.stock || p.quantity || p.stock_qty || 0);
      const newQty = item.qty + q;
      
      // حماية إضافية: التأكد من أن الكمية الجديدة لا تقل عن 1
      if(newQty < 1){
        return; // لا تسمح بتقليل الكمية عن 1
      }
      
      if(newQty > stock){
        alert(`âš ï¸ Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ§Ø­Ø© ÙÙŠ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ù‡ÙŠ ${stock} Ø­Ø¨Ø© ÙÙ‚Ø·`);
        return;
      }
    }
    
    // حماية إضافية: التأكد من أن الكمية الجديدة لا تقل عن 1
    const newQty2 = item.qty + q;
    if(newQty2 < 1){
      return; // لا تسمح بتقليل الكمية عن 1
    }
    item.qty = newQty2;
  }

  // التأكد من أن الكمية لا تقل عن 1
  if(item.qty < 1){
    item.qty = 1;
  }

  saveCart();
  renderCart();
    renderCheckoutPage();  // â† ØªØ­Ø¯ÙŠØ« ØµÙØ­Ø© Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨
  }

  updateCartIcon();
  refreshAllAddToCartButtons();
  updateProductPageButton(id);
}



function renderCart() {
  const box = document.getElementById("cartItems");
  const totalBox = document.getElementById("cartTotal");

  if (!box || !totalBox) {
    console.error("Cart elements not found!");
    return;
  }

  box.innerHTML = "";
  let total = 0;

  // Ø¥Ø°Ø§ ÙƒØ§Ù†Øª Ø§Ù„Ø³Ù„Ø© ÙØ§Ø±ØºØ©
  if (cart.length === 0) {
    box.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#999;">
        <div style="font-size:48px;margin-bottom:10px;">ðŸ›’</div>
        <div style="font-size:16px;">Ø§Ù„Ø³Ù„Ø© ÙØ§Ø±ØºØ©</div>
        <div style="font-size:14px;margin-top:5px;">Ø£Ø¶Ù Ù…Ù†ØªØ¬Ø§Øª Ù„Ù„Ø¨Ø¯Ø¡</div>
      </div>
    `;
    totalBox.innerText = "0.00";
    return;
  }

  cart.forEach(item => {

// Ø¬Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ø£ØµÙ„ÙŠØ©
let p = window.productsCache?.find(x => x.id == item.id);

// Ø¥Ø°Ø§ Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØªØ¬ØŒ Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø© ÙÙŠ Ø§Ù„Ø³Ù„Ø©
if (!p) {
  // Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø© ÙÙŠ Ø§Ù„Ø³Ù„Ø©
  box.innerHTML += `
    <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:15px;">
      <img src="${safeImageURL(item.image)}"
           onerror="this.src='https://via.placeholder.com/80?text=No+Img'"
           style="width:60px; height:60px; object-fit:cover; border-radius:10px;">
      <div style="flex:1;">
        <div style="font-weight:600; color:#333; margin-bottom:4px; font-size:14px;">
          ${item.name}
        </div>
        <div style="font-size:17px; font-weight:bold; color:#8a004a;">
          ${item.price_with_vat || item.total} Ø±.Ø³ Ã— ${item.qty}
        </div>
        <button onclick="removeItem(${item.id})" style="background:#ffd6e3;color:#E91E63;border:none;padding:5px 10px;border-radius:6px;font-size:13px;margin-top:5px;">Ø­Ø°Ù</button>
      </div>
    </div>
  `;
  total += parseFloat(item.price_with_vat || item.total || 0) * item.qty;
  return; // ØªØ®Ø·ÙŠ Ø¨Ø§Ù‚ÙŠ Ø§Ù„ÙƒÙˆØ¯ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¹Ù†ØµØ±
}

let base = parseFloat(p.base_price) || 0;
let discountValue = parseFloat(p.discount_value) || 0;
let discountType = p.discount_type || "none";

// السعر الأساسي مع الضريبة (استخدام VATCalculator)
let beforePrice = VATCalculator.addVAT(base);

// Ø§Ù„Ø³Ø¹Ø± Ø¨Ø¹Ø¯ Ø§Ù„Ø®ØµÙ…
let priceAfterDiscount = base;

if (discountValue > 0) {
  if (discountType === "percent") {
    priceAfterDiscount = base - (base * (discountValue / 100));
  } else if (discountType === "fixed") {
    priceAfterDiscount = base - discountValue;
  }
}

// Ø§Ù„Ø³Ø¹Ø± Ø¨Ø¹Ø¯ Ø§Ù„Ø®ØµÙ… + Ø§Ù„Ø¶Ø±ÙŠØ¨Ø© (Ø§Ø³ØªØ®Ø¯Ø§Ù… VATCalculator)
let finalPrice = VATCalculator.addVAT(priceAfterDiscount);

// Ù…Ø¬Ù…ÙˆØ¹ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬
let lineTotal = finalPrice * item.qty;
total += lineTotal;


    box.innerHTML += `
      <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:15px;">

        <img src="${safeImageURL(item.image)}"
             onerror="this.src='https://via.placeholder.com/80?text=No+Img'"
             style="width:60px; height:60px; object-fit:cover; border-radius:10px;">

        <div style="flex:1; display:flex; flex-direction:column;">

          <div style="font-weight:600; color:#333; margin-bottom:4px; line-height:1.4; font-size:14px;">
            ${item.name}
          </div>

          <div style="margin-bottom:5px;">

            ${
  discountValue > 0
  ? `
      <!-- السعر قبل الخصم -->
      <div style="
        font-size:12px;
        color:#999;
        text-decoration:line-through;
        white-space:nowrap;
      ">
        ${beforePrice.toFixed(2)} Ø±.Ø³
      </div>

      <!-- Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ -->
      <div style="
        font-size:17px;
        font-weight:bold;
        color:red;
        white-space:nowrap;
      ">
        ${finalPrice.toFixed(2)} Ø±.Ø³
      </div>
    `
  : `
      <!-- Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„Ù…Ù†ØªØ¬ Ø¨Ø¯ÙˆÙ† Ø®ØµÙ… -->
      <div style="
        font-size:17px;
        font-weight:bold;
        color:#006b6a;
        white-space:nowrap;
      ">
        ${beforePrice.toFixed(2)} Ø±.Ø³
      </div>
    `
}


          </div>

          <div style="display:flex; align-items:center; gap:6px;">

            ${item.qty <= 1 
              ? `<button disabled onclick="return false;" style="background:#e0e0e0; border:1px solid #ccc; border-radius:6px; padding:2px 8px; font-size:14px; cursor:not-allowed; opacity:0.7; color:#999; pointer-events:none; user-select:none;" title="الكمية لا يمكن أن تقل عن 1 - استخدم زر الحذف لحذف المنتج">-</button>`
              : `<button onclick="changeQty(${item.id}, -1)" style="background:#eee; border:none; border-radius:6px; padding:2px 8px; font-size:14px; cursor:pointer; opacity:1; color:#333;" title="تقليل الكمية">-</button>`
            }

            <span style="font-size:15px; font-weight:bold; min-width:18px; text-align:center;">
              ${item.qty}
            </span>

            <button onclick="changeQty(${item.id}, +1)"
              style="background:#eee; border:none; border-radius:6px;
                     padding:2px 8px; font-size:14px; cursor:pointer;">+</button>

            <button onclick="removeItem(${item.id})"
              style="background:#ffe6f0; border:none; border-radius:6px;
                     padding:3px 10px; font-size:13px; color:#8a004a; cursor:pointer;">Ø­Ø°Ù</button>

          </div>

        </div>
      </div>
    `;
  });

  totalBox.innerText = total.toFixed(2);
}

// ========== تحديث أزرار السلة لكل المنتجات ==========
function refreshAllAddToCartButtons() {
  document.querySelectorAll("[id^='cart-btn-']").forEach(btn => {

    const id = Number(btn.id.replace("cart-btn-", ""));
    const item = cart.find(x => x.id === id);

    if (item) {
      // Ø¥Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Ø§Ù„Ø³Ù„Ø©
      btn.innerHTML = `<span>🛒</span><span>مضاف للسلة +${item.qty}</span>`;
      btn.style.background = "#8a004a";
      btn.style.color = "#fff";
      btn.classList.add("added");
    } else {
      // Ø¥Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ â†' Ø£Ø±Ø¬Ø¹ Ø§Ù„Ø´ÙƒÙ„ Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠ
      btn.innerHTML = `<span>🛒</span><span>أضف للسلة</span>`;
      btn.style.background = "";
      btn.style.color = "";
      btn.classList.remove("added");
    }
  });

  // Ù†ÙØ³ Ø§Ù„Ø´ÙŠØ¡ Ù„Ø²Ø± ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬
  const productBtn = document.getElementById("productAddBtn");
  if (productBtn) {
    const productId = Number(productBtn.getAttribute("data-id"));
    const item = cart.find(x => x.id === productId);

    if (item) {
      productBtn.innerHTML = `<span>🛒</span><span>مضاف للسلة +${item.qty}</span>`;
      productBtn.style.background = "#8a004a";
      productBtn.style.color = "#fff";
      productBtn.classList.add("added");
    } else {
      productBtn.innerHTML = `<span>🛒</span><span>أضف للسلة</span>`;
      productBtn.style.background = "";
      productBtn.style.color = "";
      productBtn.classList.remove("added");
    }
  }
}



// ========== ØªØ­Ø¯ÙŠØ« Ø²Ø± Ø§Ù„Ø³Ù„Ø© Ø¯Ø§Ø®Ù„ ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬ ==========
function updateProductPageButton(id){
  const btn = document.getElementById("productAddBtn");
  if(!btn) return;

  const item = cart.find(x => x.id == id);

  if(item){
    btn.innerText = `Ù…Ø¶Ø§Ù Ù„Ù„Ø³Ù„Ø© +${item.qty}`;
    btn.classList.add("added");
  }
  else {
    btn.innerText = "Ø£Ø¶Ù Ù„Ù„Ø³Ù„Ø©";
    btn.classList.remove("added");
  }
}







// ========== ØªØ­Ø¯ÙŠØ« Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø³Ù„Ø© ÙÙŠ Ø§Ù„Ù‡ÙŠØ¯Ø± ==========
function updateCartIcon(){
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cartCount");

  if(!badge) return;

  if(count > 0){
    badge.style.display = "inline-block";
    badge.innerText = count;
  } else {
    badge.style.display = "none";
  }
}

function goToCheckout() {

  if (cart.length === 0) {
    alert("âš ï¸ Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨ â€” Ø§Ù„Ø³Ù„Ø© ÙØ§Ø±ØºØ©");
    return;
  }

  closeCart();
  go("checkout");
}

function scrollBrands(px){
  document.getElementById("brandsSlider").scrollBy({
    left: px,
    behavior: "smooth"
  });
}
async function loadOffers(){
  const res = await fetch(API + "/api/products");
  const productsList = await res.json();
  
  // Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ø¯ÙŠÙ‡Ø§ stock Ùˆ quantity
  const products = productsList.map(p => ({
    ...p,
    stock: parseInt(p.stock || p.quantity || 0),
    quantity: parseInt(p.quantity || p.stock || 0),
    stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
  }));
  
  // ØªØ­Ø¯ÙŠØ« productsCache
  window.productsCache = products;

  const offers = products.filter(p => p.discount_value > 0);

  const grid = document.getElementById("offersGrid");
  grid.innerHTML = "";

  offers.forEach(p=>{
    grid.innerHTML += makeProductCard(p);
  });

  // â­ Ø§Ù„Ø­Ù„ Ù‡Ù†Ø§
  refreshAllAddToCartButtons();
}

async function loadCategories(){
  const res = await fetch(API + "/api/products");
  const products = await res.json();

  // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„ØªØµÙ†ÙŠÙØ§Øª Ø¨Ø¯ÙˆÙ† ØªÙƒØ±Ø§Ø±
  let cats = {};

  products.forEach(p=>{
    if(p.category){
      cats[p.category] = true;
    }
  });

  const list = Object.keys(cats);

  const box = document.getElementById("categoriesList");
  box.innerHTML = "";

  if(list.length === 0){
    box.innerHTML = "<p>Ù„Ø§ ÙŠÙˆØ¬Ø¯ ØªØµÙ†ÙŠÙØ§Øª</p>";
    return;
  }

  list.forEach(cat=>{
    box.innerHTML += `
      <div onclick="go('category', '${cat}')" 
           style="background:#f9d9e6;padding:20px;border-radius:14px;text-align:center;font-size:16px;color:#8a004a;font-weight:600;cursor:pointer;">
        ${cat}
      </div>
    `;
  });

}
async function loadCategoryProducts(catName){
  const res = await fetch(API + "/api/products");
  const productsList = await res.json();
  
  // Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ø¯ÙŠÙ‡Ø§ stock Ùˆ quantity
  const products = productsList.map(p => ({
    ...p,
    stock: parseInt(p.stock || p.quantity || 0),
    quantity: parseInt(p.quantity || p.stock || 0),
    stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
  }));
  
  // ØªØ­Ø¯ÙŠØ« productsCache
  window.productsCache = products;

  const filtered = products.filter(p => p.category === catName);

  document.getElementById("categoryTitle").innerText = "ØªØµÙ†ÙŠÙ: " + catName;

  const grid = document.getElementById("categoryGrid");
  grid.innerHTML = "";

  filtered.forEach(p=>{
    grid.innerHTML += makeProductCard(p);
  });

  // â­ Ø§Ù„Ø­Ù„ Ù‡Ù†Ø§
  refreshAllAddToCartButtons();
}



let headerProductsCache = [];

async function headerLiveSearch(){
  const box = document.getElementById("headerSearchResults");
  const text = document.getElementById("headerSearch").value.toLowerCase();

  if(text.trim() === ""){
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }

  // ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø·
  if(headerProductsCache.length === 0){
    const res = await fetch(API + "/api/products");
    const productsList = await res.json();
    
    // التأكد من أن جميع المنتجات لديها stock و quantity
    headerProductsCache = productsList.map(p => ({
      ...p,
      stock: parseInt(p.stock || p.quantity || 0),
      quantity: parseInt(p.quantity || p.stock || 0),
      stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
    }));
  }

  const results = headerProductsCache.filter(p =>
    p.name.toLowerCase().includes(text)
  );

  if(results.length === 0){
    box.style.display = "block";
    box.innerHTML = `
      <div style="padding:10px;text-align:center;color:#888;">
        Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬
      </div>
    `;
    return;
  }

  // Ø¹Ø±Ø¶ Ø§Ù„Ù†ØªØ§Ø¦Ø¬
  box.style.display = "block";
  box.innerHTML = "";

  results.slice(0, 10).forEach(p=>{
    box.innerHTML += `
      <div onclick="go('product', ${p.id}); clearHeaderSearch();"
           style="padding:10px;display:flex;gap:10px;cursor:pointer;border-bottom:1px solid #f5f5f5;">
        <img src="${p.image_url}" style="width:45px;height:45px;border-radius:8px;object-fit:cover;">
        <div style="font-size:14px;color:#333;">
          ${p.name}
          <div style="color:#E91E63;font-weight:bold;">${p.base_price} Ø±.Ø³</div>
        </div>
      </div>
    `;
  });
}

function clearHeaderSearch(){
  document.getElementById("headerSearch").value = "";
  document.getElementById("headerSearchResults").style.display = "none";
}
document.addEventListener("click", function(e){
  const box = document.getElementById("headerSearchResults");
  const search = document.getElementById("headerSearch");

  if(!search.contains(e.target) && !box.contains(e.target)){
    box.style.display = "none";
  }
});
// ======================== Ø§Ù„Ù…ÙØ¶Ù‘Ù„Ø§Øª ========================
let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]"); // IDs ÙÙ‚Ø·


function saveWishlist(){
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

async function toggleWishlist(id){

  // Ù„Ùˆ Ø§Ù„Ù…Ù†ØªØ¬ Ù…ÙˆØ¬ÙˆØ¯ â†’ Ø§Ø­Ø°ÙÙ‡
  if(wishlist.includes(id)){
    wishlist = wishlist.filter(x => x !== id);
  } 
  else {
    wishlist.push(id);
  }

  saveWishlist();
  updateWishlistCount(); // ØªØ­Ø¯ÙŠØ« Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ù…ÙØ¶Ù„Ø©
  refreshCurrentPage();
}


function refreshCurrentPage(){
  const active = document.querySelector(".page.active").id;

  if(active === "page-products") loadAllProducts();
  if(active === "page-home") loadHome();
  if(active === "page-wishlist") loadWishlist();
  if(active === "page-brand") loadBrandProducts(window.currentBrand);
  if(active === "page-category") loadCategoryProducts(window.currentCategory);
}
function getSARIcon(){
  return `
    <svg width="18" height="18" viewBox="0 0 1228 1228" style="vertical-align:middle;">
    <path d="M699.62 1113.02c-20.06 44.48-33.32 92.75-38.4 143.37l424.51-90.24c20.06-44.47 33.31-92.75 38.4-143.37zM1085.73 895.8c20.06-44.47 33.32-92.75 38.4-143.37l-330.68 70.33v-135.2l292.27-62.11c20.06-44.47 33.32-92.75 38.4-143.37l-330.68 70.27V66.13c-50.67 28.45-95.67 66.32-132.25 110.99v403.35l-132.25 28.11V0c-50.67 28.44-95.67 66.32-132.25 110.99v525.69l-295.91 62.88c-20.06 44.47-33.33 92.75-38.42 143.37l334.33-71.05v170.26l-358.3 76.14c-20.06 44.47-33.32 92.75-38.4 143.37l375.04-79.7c30.53-6.35 56.77-24.4 73.83-49.24l68.78-101.97v-.02c7.14-10.55 11.3-23.27 11.3-36.97V743.77l132.25-28.11v270.4l424.53-90.28Z" fill="#8a004a"></path>
    </svg>
  `;
}

function renderCheckoutPage() {
  const box = document.getElementById("checkoutItems");
  box.innerHTML = "";

  let subtotal = 0;
  let totalQty = 0;

  cart.forEach(item => {

    // Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ
    let p = window.productsCache?.find(x => x.id == item.id);

    let base = parseFloat(p.base_price) || 0;
    let discountValue = p?.discount_value || 0;
    let discountType = p?.discount_type || "none";

    // Ø§Ù„Ø³Ø¹Ø± Ø¨Ø¹Ø¯ Ø§Ù„Ø®ØµÙ…
    let priceAfterDiscount = base;

    if (discountValue > 0) {
      if (discountType === "percent") priceAfterDiscount = base - (base * discountValue / 100);
      else if (discountType === "fixed") priceAfterDiscount = base - discountValue;
    }

    // السعر النهائي مع الضريبة (استخدام VATCalculator)
    let finalPrice = VATCalculator.addVAT(priceAfterDiscount);

    let lineTotal = finalPrice * item.qty;
    subtotal += lineTotal;
    totalQty += item.qty;

    box.innerHTML += `
      <div style="border-bottom:1px solid #eee;padding-bottom:15px;margin-bottom:15px;">

        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          
          <div style="flex:1;text-align:right;">
            <div style="font-weight:700;margin-bottom:5px;">${item.name}</div>

            <div style="margin-bottom:5px;font-weight:700;">
              ${
                discountValue > 0
                ? `
                    <span style="text-decoration:line-through;color:#999;font-size:14px;margin-left:8px;">
                      ${VATCalculator.addVAT(base).toFixed(2)} Ø±.Ø³
                    </span>

                    <span style="color:#8a004a;font-weight:700;">
                      ${finalPrice.toFixed(2)} Ø±.Ø³
                    </span>
                  `
                : `
                  <span style="color:#8a004a;font-weight:700;">
                    ${(base * 1.15).toFixed(2)} Ø±.Ø³
                  </span>
                `
              }
            </div>

            <div style="display:flex;align-items:center;gap:10px;justify-content:flex-end;">
              ${item.qty <= 1 
                ? `<button disabled onclick="return false;" class="qty-btn" style="opacity:0.6; cursor:not-allowed; background:#e0e0e0; border:1px solid #ccc; color:#999; pointer-events:none; user-select:none;" title="الكمية لا يمكن أن تقل عن 1 - استخدم زر الحذف لحذف المنتج">-</button>`
                : `<button onclick="changeQtyCheckout(${item.id}, -1)" class="qty-btn" title="تقليل الكمية">-</button>`
              }
              <span style="font-size:16px;font-weight:bold;">${item.qty}</span>
              <button onclick="changeQtyCheckout(${item.id}, +1)" class="qty-btn">+</button>
            </div>
          </div>

          <img src="${safeImageURL(item.image)}"
               style="width:70px;height:70px;border-radius:10px;object-fit:cover;margin-left:10px;">
        </div>

        <button onclick="removeItemCheckout(${item.id})"
          style="background:#ffd6e3;color:#E91E63;border:none;padding:5px 15px;border-radius:6px;font-size:14px;margin-top:10px;">
          Ø­Ø°Ù
        </button>

      </div>
    `;
  });

  // Ø¥Ø¬Ù…Ø§Ù„ÙŠØ§Øª
// ===== ØªÙØµÙŠÙ„ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø¨Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ù†Ù‡Ø¯ÙŠ =====
// ===== Ø­Ø³Ø§Ø¨ Ù‚ÙŠÙ… Ø§Ù„ÙØ§ØªÙˆØ±Ø© =====
let base_before_vat_total = 0;
let discount_amount_total = 0;
let subtotal_before_vat = 0;
let subtotal_with_vat = 0;
let vat_total = 0;

cart.forEach(item => {
    let p = window.productsCache.find(x => x.id == item.id);

    let base = parseFloat(p.base_price) || 0;
    let discountValue = p.discount_value || 0;
    let discountAmount = 0;

    // Ø§Ù„Ø®ØµÙ… Ù‚Ø¨Ù„ Ø§Ù„Ø¶Ø±ÙŠØ¨Ø©
    if (p.discount_type === "percent") {
        discountAmount = base * (discountValue / 100);
    } 
    else if (p.discount_type === "fixed") {
        discountAmount = discountValue;
    }

    let price_after_discount = base - discountAmount;
    // استخدام VATCalculator لحساب السعر مع الضريبة
    let final_price = VATCalculator.addVAT(price_after_discount);

    base_before_vat_total += base * item.qty;
    discount_amount_total += discountAmount * item.qty;
    subtotal_before_vat += price_after_discount * item.qty;
    subtotal_with_vat += final_price * item.qty;
});

// Ø§Ù„Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠØ©
vat_total = subtotal_with_vat - subtotal_before_vat;

// ÙƒÙˆØ¯ Ø§Ù„Ø®ØµÙ…
let coupon_discount = 0;

// Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ
let total_final = subtotal_with_vat - coupon_discount;

// --- Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø´Ø­Ù† ---
// استخدام ShippingAPI
const shippingData = ShippingAPI.getSimpleShipping();
let shipping = shippingData.shipping;
let shippingVat = shippingData.shipping_vat;
let finalTotalWithShipping = subtotal_with_vat + shipping + shippingVat;

// ===== Ø¹Ø±Ø¶ Ø§Ù„ÙØ§ØªÙˆØ±Ø© =====
box.innerHTML += `

  <div style="padding:12px;margin-top:15px;line-height:1.9;font-size:15px;">

    <div style="display:flex;justify-content:space-between;">
      <span>Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ (Ø¨Ø¯ÙˆÙ† Ø¶Ø±ÙŠØ¨Ø©)</span>
      <b>${base_before_vat_total.toFixed(2)} Ø±.Ø³</b>
    </div>

    <div style="display:flex;justify-content:space-between; color:green;">
      <span>Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø®ØµÙˆÙ…</span>
      <b>- ${discount_amount_total.toFixed(2)} Ø±.Ø³</b>
    </div>

    <hr style="margin:12px 0;">

    <div style="display:flex;justify-content:space-between;">
      <span>Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ (Ø¨Ø¯ÙˆÙ† Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ©)</span>
      <b>${subtotal_before_vat.toFixed(2)} Ø±.Ø³</b>
    </div>

    <div style="display:flex;justify-content:space-between;">
      <span>Ù‚ÙŠÙ…Ø© Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ©</span>
      <b>${vat_total.toFixed(2)} Ø±.Ø³</b>
    </div>

    <hr style="margin:12px 0;">

    <div style="display:flex;justify-content:space-between;">
      <span>Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ (Ø´Ø§Ù…Ù„ Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ©)</span>
      <b>${subtotal_with_vat.toFixed(2)} Ø±.Ø³</b>
    </div>

    <div style="display:flex;justify-content:space-between;">
      <span>Ø§Ù„Ø®ØµÙ… (ÙƒÙˆØ¯ Ø§Ù„Ø®ØµÙ…)</span>
      <b>${coupon_discount.toFixed(2)} Ø±.Ø³</b>
    </div>

    <div style="margin-top:15px;font-size:22px;font-weight:800;color:#E91E63;text-align:center;">
      Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ: ${total_final.toFixed(2)} Ø±.Ø³
    </div>

  </div>
  <div style="display:flex;justify-content:space-between;">
  <span>Ø§Ù„Ø´Ø­Ù†:</span>
  <b>${shipping.toFixed(2)} Ø±.Ø³</b>
</div>

<div style="display:flex;justify-content:space-between;">
  <span>Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ø´Ø­Ù† (15%):</span>
  <b>${shippingVat.toFixed(2)} Ø±.Ø³</b>
</div>

<hr style="margin:12px 0;">

<div style="display:flex;justify-content:space-between;font-size:20px;color:#8a004a;font-weight:900;">
  <span>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ + Ø§Ù„Ø´Ø­Ù†:</span>
  <b>${finalTotalWithShipping.toFixed(2)} Ø±.Ø³</b>
</div>

`;
}




async function payOnline() {
// ðŸ” Ù…Ù†Ø¹ Ø§Ù„Ø¯ÙØ¹ Ø¨Ø¯ÙˆÙ† ØªØ³Ø¬ÙŠÙ„ Ø¯Ø®ÙˆÙ„
if (!window.user) {
  alert("âš ï¸ ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù‚Ø¨Ù„ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ");
  go("login");
  return;
}


  if (cart.length === 0) {
    alert("âš ï¸ Ø§Ù„Ø³Ù„Ø© ÙØ§Ø±ØºØ©!");
    return;
  }

  // 1) Ø¬Ù…Ø¹ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„
  const name = document.getElementById("co_name").value.trim();
  const phone = document.getElementById("co_phone").value.trim();
  const phone2 = document.getElementById("co_phone2").value.trim();
  const notes = document.getElementById("co_notes").value.trim();
  const address = document.getElementById("co_address").value.trim();
  const location = document.getElementById("co_location").value.trim();

  if (!name || !phone) {
    alert("âš ï¸ Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø§Ø³Ù… ÙˆØ±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„ Ù‚Ø¨Ù„ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ");
    return;
  }

  // 2) ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø·Ù„Ø¨ Ù„Ù„Ø¨Ø§Ùƒ Ø§Ù†Ø¯
  const body = {
    customer_name: name,
    customer_phone: phone,
	// Ø§Ø³ØªØ®Ø¯Ø§Ù… ShippingAPI
	shipping: ShippingAPI.getSimpleShipping().shipping,
    shipping_vat: ShippingAPI.getSimpleShipping().shipping_vat,
	customer_phone2: phone2,
	customer_notes: notes,
    customer_address: address,
    customer_location: location,
    notes: notes,

    items: cart.map(item => ({
    id: item.id,
    name: item.name,
    qty: item.qty,
    base_price: item.base_price,
    discount_value: window.productsCache.find(p => p.id == item.id)?.discount_value || 0,
    discount_type: window.productsCache.find(p => p.id == item.id)?.discount_type || "none"
}))


  };

  // 3) Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ø¥Ù„Ù‰ Ø§Ù„Ø³ÙŠØ±ÙØ±
  
  const res = await fetch(API + "/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.success) {
    alert("âš ï¸ Ù„Ù… ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨! Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰");
    return;
  }

const orderId = data.order_id;

  // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙÙŠ productsCache Ø¨Ø¹Ø¯ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨
  if (window.productsCache) {
    cart.forEach(item => {
      const product = window.productsCache.find(p => p.id == item.id);
      if (product) {
        const currentStock = parseInt(product.stock || product.quantity || product.stock_qty || 0);
        const newStock = Math.max(0, currentStock - item.qty);
        product.stock = newStock;
        product.quantity = newStock;
        product.stock_qty = newStock; // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
      }
    });
  }

// ===== Ø­ÙØ¸ Ø§Ù„Ø·Ù„Ø¨ ÙÙŠ localStorage Ù„Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… =====
let dashboardOrders = JSON.parse(localStorage.getItem("orders") || "[]");

dashboardOrders.push({
    id: orderId,
    date: new Date().toLocaleString("ar-EG"),
    customer_name: name,
    customer_phone: phone,
    items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        base_price: item.base_price,
        price_after_discount: item.price_after_discount,
        price_with_vat: item.price_with_vat,
        total: (item.price_with_vat * item.qty).toFixed(2)
    })),
    total: cart.reduce((sum, i) => sum + (i.price_with_vat * i.qty), 0).toFixed(2),
    status: "new"
});


localStorage.setItem("orders", JSON.stringify(dashboardOrders));
// ====================================================


  // 4) ØªÙØ±ÙŠØº Ø§Ù„Ø³Ù„Ø© + ØªØ­Ø¯ÙŠØ« Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©
  cart = [];
  saveCart();
  updateCartIcon();

  // 5) Ø¹Ø±Ø¶ Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨ + ØµÙØ­Ø© Ø§Ù„Ø´ÙƒØ±
  go("thanks", orderId);
}


function changeQtyCheckout(id, amount){
  console.log("changeQtyCheckout called:", {id, amount, cartLength: cart.length});
  let item = cart.find(p => p.id == id);
  if(!item) {
    console.log("Item not found in cart");
    return;
  }
  
  console.log("Current item qty:", item.qty);

  // منع تقليل الكمية عن 1 - فقط زر الحذف يحذف المنتج
  // التحقق قبل أي تعديل - هذا هو الحماية الأساسية
  if(amount < 0){
    // إذا كانت الكمية 1 أو أقل، لا تسمح بالتقليل على الإطلاق
    if(item.qty <= 1){
      console.log("BLOCKED: Cannot decrease quantity below 1. Current qty:", item.qty);
      return; // لا تفعل شيئاً - اخرج من الدالة مباشرة
    }
    // التحقق من أن الكمية الجديدة لن تقل عن 1
    if(item.qty + amount < 1){
      return; // لا تسمح بتقليل الكمية عن 1
    }
  }

  // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
  if(window.productsCache){
    const p = window.productsCache.find(x => x.id == id);
    if(p){
      const stock = parseInt(p.stock || p.quantity || p.stock_qty || 0);
      const newQty = item.qty + amount;
      
      if(newQty > stock){
        alert(`âš ï¸ Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªØ§Ø­Ø© ÙÙŠ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ù‡ÙŠ ${stock} Ø­Ø¨Ø© ÙÙ‚Ø·`);
        return;
      }
    }
  }

  item.qty += amount;
  
  // التأكد من أن الكمية لا تقل عن 1
  if(item.qty < 1){
    item.qty = 1;
  }

  saveCart();
  renderCheckoutPage();
  updateCartIcon();          // â† ØªØ­Ø¯ÙŠØ« Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø³Ù„Ø©
  refreshAllAddToCartButtons(); // â† ØªØ­Ø¯ÙŠØ« Ø£Ø²Ø±Ø§Ø± Ø¥Ø¶Ø§ÙØ© Ù„Ù„Ø³Ù„Ø©
}


function removeItemCheckout(id){
  cart = cart.filter(p => p.id != id);

  saveCart();
  renderCheckoutPage();
  updateCartIcon();             // â† ØªØ­Ø¯ÙŠØ« Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø³Ù„Ø©
  refreshAllAddToCartButtons(); // â† ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø£Ø²Ø±Ø§Ø±
}


function pickLocation(){
  navigator.geolocation.getCurrentPosition(pos=>{
    let link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
    document.getElementById("co_location").value = link;
  });
}


async function loadWishlist(){
  const res = await fetch(API + "/api/products");
  const allList = await res.json();
  
  // Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ø¯ÙŠÙ‡Ø§ stock Ùˆ quantity
  const all = allList.map(p => ({
    ...p,
    stock: parseInt(p.stock || p.quantity || 0),
    quantity: parseInt(p.quantity || p.stock || 0),
    stock_qty: parseInt(p.stock || p.quantity || 0) // Ù„Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
  }));
  
  // ØªØ­Ø¯ÙŠØ« productsCache
  window.productsCache = all;

  const favList = all.filter(p => wishlist.includes(p.id));

  const grid = document.getElementById("wishlistGrid");
  grid.innerHTML = "";

  if(favList.length === 0){
    grid.innerHTML = "<p>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª ÙÙŠ Ø§Ù„Ù…ÙØ¶Ù‘Ù„Ø©.</p>";
    return;
  }

  favList.forEach(p=>{
  grid.innerHTML += makeProductCard(p);
});

refreshAllAddToCartButtons();

}
async function loadTrackPage(orderId) {

  const infoBox = document.getElementById("trackInfo");
  const timelineBox = document.getElementById("timeline");
  const itemsBox = document.getElementById("trackItems");

  infoBox.innerHTML = "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...";
  timelineBox.innerHTML = "";
  itemsBox.innerHTML = "";

  const res = await fetch(`${API}/api/orders/${orderId}`);
  const data = await res.json();

  if (data.error) {
    infoBox.innerHTML = `<p style="color:red;">Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯</p>`;
    return;
  }

  const o = data.order;

  /* ================================
     ðŸ›  Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚ÙŠÙ… Ù‚Ø¨Ù„ Ø§Ø³ØªØ®Ø¯Ø§Ù…Ù‡Ø§
     ================================ */
  o.total = Number(o.total) || 0;
  o.shipping = Number(o.shipping) || 0;
  o.shipping_vat = Number(o.shipping_vat) || 0;
  o.total_with_shipping = Number(o.total_with_shipping) || (o.total + o.shipping + o.shipping_vat);

  if (o.status === "delivery") o.status = "delivery";

  const items = data.items || [];

  // ---- Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø·Ù„Ø¨ ----
  infoBox.innerHTML = `
    <p><b>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨:</b> ${o.id}</p>
    <p><b>Ø§Ù„ØªØ§Ø±ÙŠØ®:</b> ${o.date}</p>
    <p><b>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ:</b> ${o.total_with_shipping.toFixed(2)} Ø±.Ø³</p>
  `;

  // ---- Ø§Ù„Ø­Ø§Ù„Ø§Øª ----
  const steps = [
    { key:"new", text:"ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ø·Ù„Ø¨" },
    { key:"processing", text:"Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ¬Ù‡ÙŠØ²" }, 
    { key:"completed", text:"Ø¬Ø§Ù‡Ø²" },
    { key:"out", text:"Ø®Ø±Ø¬ Ù„Ù„ØªÙˆØµÙŠÙ„" },
    { key:"delivery", text:"Ù‚ÙŠØ¯ Ø§Ù„ØªÙˆØµÙŠÙ„" },
    { key:"done", text:"ØªÙ… Ø§Ù„ØªØ³Ù„ÙŠÙ…" }, 
    { key:"cancelled", text:"ØªÙ… Ø§Ù„Ø¥Ù„ØºØ§Ø¡" }
  ];

  let activeFound = true;

  steps.forEach(s => {
    let active = "";
    if (activeFound) active = "step-active";
    if (o.status === s.key) activeFound = false;

    timelineBox.innerHTML += `
      <div class="step-item ${active}">
        <div class="step-circle"></div>
        <div class="step-text">${s.text}</div>
      </div>
    `;
  });

  // ---- Ø§Ù„Ø£ØµÙ†Ø§Ù ----
  items.forEach(i => {

    const lineTotal = Number(i.total) || 0;

    itemsBox.innerHTML += `
      <div class="item-card">
        <b>${i.name}</b> Ã— ${i.qty}<br>
        Ø§Ù„Ø³Ø¹Ø±: ${lineTotal.toFixed(2)} Ø±.Ø³
      </div>
    `;
  });
}




async function viewOrder(id){
  const res = await fetch(API + "/api/orders/" + id);
  const data = await res.json();

  if(data.error){
    alert("Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯");
    return;
  }

  let text = `
    Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: ${data.order.id}\n
    Ø§Ù„ØªØ§Ø±ÙŠØ®: ${data.order.date}\n
    Ø§Ù„Ø­Ø§Ù„Ø©: ${data.order.status}\n
    Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: ${data.order.total} Ø±.Ø³\n\n
    --- Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª ---\n
  `;

  data.items.forEach(i=>{
    text += `${i.name} Ã— ${i.qty}\n`;
  });

  alert(text);
}


async function fetchUserOrders(phone){
  const res = await fetch(API + "/api/orders?phone=" + phone);
  return await res.json();
}

function autoFillUserInCheckout() {
    if (window.user) {
        document.getElementById("co_name").value = window.user.name;
        document.getElementById("co_phone").value = window.user.phone;

        document.getElementById("co_name").setAttribute("readonly", true);
        document.getElementById("co_phone").setAttribute("readonly", true);
    }
}



// Ø²Ø± Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©


async function loadInvoice(orderId){

  const invoiceBox = document.getElementById("invoiceBox");
  invoiceBox.innerHTML = "<p>Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...</p>";

  // Ø¬Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ù„Ø¨
  const orderRes = await fetch(`${API}/api/orders/${orderId}`);
  const orderData = await orderRes.json();

  if(orderData.error){
    invoiceBox.innerHTML = "<p style='color:red;text-align:center;'>Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯</p>";
    return;
  }

  const o = orderData.order;

  // Ø¬Ù„Ø¨ Ø§Ù„Ø£ØµÙ†Ø§Ù ÙƒØ§Ù…Ù„Ø© (Ù…Ø¹ Ø§Ù„Ø£Ø³Ø¹Ø§Ø± + Ø§Ù„ØµÙˆØ± + Ø§Ù„Ø£ÙƒÙˆØ§Ø¯)
  const itemsRes = await fetch(`${API}/api/order_items_full/${orderId}`);
  const items = await itemsRes.json();

  let itemsHTML = "";
  let total = 0;

  items.forEach(i => {

    total += i.total;

    itemsHTML += `
      <tr>
        <td style="border:1px solid #ccc;padding:8px;">${i.name}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${i.qty}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${i.base_price.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${i.price_after_discount.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${i.price_with_vat.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center;">${i.total.toFixed(2)}</td>
      </tr>
    `;
  });

  const html = `
    <h3 style="color:#8a004a;">ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨</h3>

    <p><b>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨:</b> ${o.id}</p>
    <p><b>Ø§Ù„ØªØ§Ø±ÙŠØ®:</b> ${o.date}</p>
    <p><b>Ø§Ø³Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„:</b> ${o.customer_name}</p>
    <p><b>Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„:</b> ${o.customer_phone}</p>
    <p><b>Ø§Ù„Ø¹Ù†ÙˆØ§Ù†:</b> ${o.customer_address}</p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;">
      <thead>
        <tr style="background:#f9d9e6;color:#7a004b;">
          <th style="padding:8px;border:1px solid #ccc;">Ø§Ù„ØµÙ†Ù</th>
          <th style="padding:8px;border:1px solid #ccc;">Ø§Ù„ÙƒÙ…ÙŠØ©</th>
          <th style="padding:8px;border:1px solid #ccc;">Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ</th>
          <th style="padding:8px;border:1px solid #ccc;">Ø¨Ø¹Ø¯ Ø§Ù„Ø®ØµÙ…</th>
          <th style="padding:8px;border:1px solid #ccc;">Ø¨Ø¹Ø¯ Ø§Ù„Ø¶Ø±ÙŠØ¨Ø©</th>
          <th style="padding:8px;border:1px solid #ccc;">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
<h4 style="margin-top:15px;">
  Ø§Ù„Ø´Ø­Ù†: ${o.shipping.toFixed(2)} Ø±.Ø³
</h4>

<h4>
  Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ø´Ø­Ù† (15%): ${o.shipping_vat.toFixed(2)} Ø±.Ø³
</h4>

<h2 style="color:#8a004a;margin-top:15px;font-weight:900;text-align:right;">
  Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù…Ø¹ Ø§Ù„Ø´Ø­Ù†:
  ${o.total_with_shipping.toFixed(2)} Ø±.Ø³
</h2>

  `;

  invoiceBox.innerHTML = html;
}


function logoutUser() {
  // Ø­Ø°Ù Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† Ø§Ù„ØªØ®Ø²ÙŠÙ†
  localStorage.removeItem("user");
  window.user = null;

  alert("âœ” ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ Ø¨Ù†Ø¬Ø§Ø­");

  // ØªØ­Ø¯ÙŠØ« Ø±Ø§Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨ ÙÙŠ Ø§Ù„Ù‡ÙŠØ¯Ø±
  updateHeaderProfile();

  // Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„ØµÙØ­Ø© ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„
  go("login");
}

  // ====================== Ø¥Ø±Ø³Ø§Ù„ ÙƒÙˆØ¯ Ù†Ø³ÙŠØ§Ù† Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ ======================
async function sendResetCode() {
  const email = fpEmail.value.trim();

  const res = await fetch(API + "/api/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  if (!data.success) {
    fpMsg.innerText = "âŒ " + data.message;
    return;
  }

  alert("âœ” ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ÙƒÙˆØ¯ Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ");
  rpEmail.value = email;
  go("reset");
}


// ====================== Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ======================
async function resetPassword() {
  const email = rpEmail.value.trim();
  const code = rpCode.value.trim();
  const new_password = rpPass.value.trim();

  const res = await fetch(API + "/api/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password })
  });

  const data = await res.json();

  if (!data.success) {
    rpMsg.innerText = "âŒ " + data.message;
    return;
  }

  alert("âœ” ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­!");
  go("login");
}


// ====================== ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ ======================
async function verifyAccount(){
  const phone = document.getElementById("vPhone").value.trim();
  const code  = document.getElementById("vCode").value.trim();

  const res = await fetch(API + "/api/verify", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ phone, code })
  });

  const data = await res.json();

  if(!data.success){
    verifyMsg.innerText = "âŒ ÙƒÙˆØ¯ ØºÙŠØ± ØµØ­ÙŠØ­";
    return;
  }

  verifyMsg.innerHTML = "âœ” ØªÙ… Ø§Ù„ØªÙØ¹ÙŠÙ„ â€” Ø³ÙŠØªÙ… ØªØ­ÙˆÙŠÙ„Ùƒ Ø§Ù„Ø¢Ù†...";

  setTimeout(()=>{
    go("login");
  }, 1200);
}


//=================== ØªØ§ÙŠÙ…Ø± Ø±Ø³Ø§Ù„Ø© Ø§Ù„ØªÙØ¹ÙŠÙ„ ======================
let verifyTimer = null;
function startVerifyTimer(){
  let sec = 60;
  document.getElementById("resendBox").style.display = "none";
  document.getElementById("timerBox").style.display = "inline";

  document.getElementById("timer").innerText = sec;

  verifyTimer = setInterval(()=>{
    sec--;
    document.getElementById("timer").innerText = sec;

    if(sec <= 0){
      clearInterval(verifyTimer);
      document.getElementById("timerBox").style.display = "none";
      document.getElementById("resendBox").style.display = "inline";
    }
  },1000);
}
// =================== Ø§Ø¹Ø§Ø¯Ø© Ø§Ø±Ø³Ø§Ù„ Ø§Ù„ÙƒÙˆØ¯ =========================
async function resendVerifyCode(){
  const phone = document.getElementById("vPhone").value;

  const res = await fetch(API + "/api/resend-verify", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ phone })
  });

  const data = await res.json();

  if(data.success){
    verifyMsg.innerHTML = "âœ” ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ÙƒÙˆØ¯ Ø¬Ø¯ÙŠØ¯";
    startVerifyTimer();
  } else {
    verifyMsg.innerHTML = "âŒ Ø­Ø¯Ø« Ø®Ø·Ø£";
  }
}



// ===================== ØªØ­Ø¯ÙŠØ« Ø±Ø§Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨ ÙÙŠ Ø§Ù„Ù‡ÙŠØ¯Ø± =====================
function updateHeaderProfile() {
  const profileLink = document.getElementById("profileLink");
  const mobileProfileLink = document.getElementById("mobileProfileLink");
  
  if (profileLink) {
    if (window.user && window.user.name) {
      profileLink.innerText = window.user.name;
      profileLink.style.fontWeight = "700";
      profileLink.style.color = "#8a004a";
    } else {
      profileLink.innerText = "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„";
      profileLink.style.fontWeight = "500";
      profileLink.style.color = "#333";
    }
  }
  
  if (mobileProfileLink) {
    if (window.user && window.user.name) {
      mobileProfileLink.innerHTML = `ðŸ‘¤ ${window.user.name}`;
    } else {
      mobileProfileLink.innerHTML = "ðŸ‘¤ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„";
    }
  }
}

// ===================== Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ù†Ø³Ø¯Ù„Ø© Ù„Ù„Ø¬ÙˆØ§Ù„ =====================
function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) {
    menu.classList.toggle("active");
  }
}

// Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø¶ØºØ· Ø®Ø§Ø±Ø¬Ù‡Ø§
document.addEventListener("click", function(e) {
  const menu = document.getElementById("mobileMenu");
  const menuBtn = document.querySelector(".mobile-menu-btn");
  
  if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.classList.remove("active");
  }
});

// ===================== ØªØ­Ø¯ÙŠØ« Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ù…ÙØ¶Ù„Ø© =====================
function updateWishlistCount() {
  const countBadge = document.getElementById("wishlistCount");
  const mobileCountBadge = document.getElementById("mobileWishlistCount");
  
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

// ===================== ØªØ­Ù…ÙŠÙ„ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„ØµÙØ­Ø§Øª Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠØ© =====================
async function loadPageContent(pageType) {
  try {
    const res = await fetch(API + "/api/pages/" + pageType);
    const data = await res.json();
    
    if (data.error) {
      document.getElementById("pageContentTitle").innerText = "Ø®Ø·Ø£";
      document.getElementById("pageContentBody").innerHTML = "<p>Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­ØªÙˆÙ‰</p>";
      return;
    }

    document.getElementById("pageContentTitle").innerText = data.title || "Ø§Ù„ØµÙØ­Ø©";
    
    // Ø¥Ø°Ø§ ÙƒØ§Ù†Øª ØµÙØ­Ø© FAQØŒ Ø¹Ø±Ø¶ Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø¨Ø´ÙƒÙ„ Ù…Ù†Ø¸Ù…
    if (pageType === "faq") {
      try {
        const parsed = JSON.parse(data.content);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          let html = '<div style="margin-top:30px;">';
          parsed.questions.forEach((item, index) => {
            html += `
              <div style="margin-bottom:25px;padding:25px;background:#f8f9fa;border-radius:12px;border-right:4px solid #8a004a;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <h3 style="color:#8a004a;margin-bottom:15px;font-size:20px;font-weight:700;display:flex;align-items:center;gap:10px;">
                  <span style="background:#8a004a;color:#fff;width:35px;height:35px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;">${index + 1}</span>
                  ${escapeHtml(item.question)}
                </h3>
                <p style="color:#555;line-height:1.9;font-size:16px;margin:0;padding-right:45px;">${escapeHtml(item.answer)}</p>
              </div>
            `;
          });
          html += '</div>';
          document.getElementById("pageContentBody").innerHTML = html;
        } else {
          document.getElementById("pageContentBody").innerHTML = data.content || "<p>Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø­ØªÙˆÙ‰</p>";
        }
      } catch (e) {
        // Ø¥Ø°Ø§ Ù„Ù… ÙŠÙƒÙ† JSONØŒ Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ÙƒÙ…Ø§ Ù‡Ùˆ
        document.getElementById("pageContentBody").innerHTML = data.content || "<p>Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø­ØªÙˆÙ‰</p>";
      }
    } else {
      // Ù„Ù„ØµÙØ­Ø§Øª Ø§Ù„Ø£Ø®Ø±Ù‰ØŒ Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ HTML Ù…Ø¨Ø§Ø´Ø±Ø©
      document.getElementById("pageContentBody").innerHTML = data.content || "<p>Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø­ØªÙˆÙ‰</p>";
    }
    
    // Ø§Ù„ØªÙ…Ø±ÙŠØ± Ù„Ù„Ø£Ø¹Ù„Ù‰
    window.scrollTo(0, 0);
  } catch (error) {
    console.error("Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­ØªÙˆÙ‰:", error);
    document.getElementById("pageContentTitle").innerText = "Ø®Ø·Ø£";
    document.getElementById("pageContentBody").innerHTML = "<p>Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­ØªÙˆÙ‰</p>";
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===================== Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø´ÙƒÙˆÙ‰ =====================
async function submitComplaint(event) {
  event.preventDefault();
  
  const email = document.getElementById("complaintEmail").value.trim();
  const subject = document.getElementById("complaintSubject").value.trim();
  const message = document.getElementById("complaintMessage").value.trim();
  
  if (!email || !subject || !message) {
    alert("âš ï¸ ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„");
    return;
  }
  
  // ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ø²Ø± Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„...";
  
  try {
    const res = await fetch(API + "/api/complaints", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, subject, message })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.success) {
      alert("âœ… ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø´ÙƒÙˆØ§Ùƒ Ø¨Ù†Ø¬Ø§Ø­! Ø³Ù†ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ù‚Ø±ÙŠØ¨Ø§Ù‹.");
      document.getElementById("quickSupportForm").reset();
    } else {
      alert("âŒ Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„: " + (data.error || "Ø®Ø·Ø£ ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ"));
    }
  } catch (error) {
    console.error("Ø®Ø·Ø£:", error);
    alert("âŒ Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø³ÙŠØ±ÙØ±. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.");
  } finally {
    // Ø¥Ø¹Ø§Ø¯Ø© ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø²Ø±
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  }
}

window.onload = async () => {
  await loadProductsCache(true);   // â† Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ù‚Ø³Ø±ÙŠ Ù„Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ø­Ø¯Ø« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
  renderCart();
  updateCartIcon();
  refreshAllAddToCartButtons();
  updateHeaderProfile(); // ØªØ­Ø¯ÙŠØ« Ø±Ø§Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨
  updateWishlistCount(); // ØªØ­Ø¯ÙŠØ« Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ù…ÙØ¶Ù„Ø©
  go("home");
};

function printInvoice() {
    const invoiceHTML = document.getElementById("invoiceBox").innerHTML;

    const printWin = window.open("", "_blank", "width=900,height=1200");

    printWin.document.open();
    printWin.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø·Ù„Ø¨</title>

      <style>
        @page {
          size: A4;
          margin: 15mm;
        }

        body {
          font-family: 'Cairo', sans-serif;
          background: #fff;
          direction: rtl;
          text-align: right;
          padding: 0 15px;
        }

        .invoice-wrapper {
          width: 100%;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        .header h1 {
          color: #8a004a;
          margin-bottom: 5px;
          font-size: 26px;
          font-weight: 900;
        }

        .header .sub {
          font-size: 14px;
          color: #777;
        }

        .section-title {
          font-size: 20px;
          margin: 18px 0 8px;
          color: #8a004a;
          font-weight: 800;
          border-right: 5px solid #8a004a;
          padding-right: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        th {
          background: #f9d9e6;
          color: #7a004b;
          padding: 10px;
          border: 1px solid #ccc;
          font-size: 15px;
        }

        td {
          padding: 10px;
          border: 1px solid #ccc;
          font-size: 15px;
        }

        .totals {
          margin-top: 25px;
          font-size: 16px;
          line-height: 1.8;
        }

        .totals div {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }

        .grand-total {
          text-align: center;
          margin-top: 15px;
          font-size: 24px;
          color: #8a004a;
          font-weight: 900;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #888;
        }

      </style>
    </head>

    <body>

      <div class="invoice-wrapper">

        <!-- Header -->
        <div class="header">
          <h1>Ù…ØªØ¬Ø± Ø¬Ù…Ø§Ù„Ùƒ</h1>
          <div class="sub">ÙÙˆØ§ØªÙŠØ± â€¢ Ù…Ø´ØªØ±ÙŠØ§Øª â€¢ Ù…Ù†ØªØ¬Ø§Øª Ø£ØµÙ„ÙŠØ©</div>
        </div>

        ${invoiceHTML}

        <div class="footer">
          Ø´ÙƒØ±Ø§Ù‹ Ù„ØªØ³ÙˆÙ‚ÙƒÙ… â¤ï¸  
          <br>
          www.jamalak-store.com
        </div>

      </div>

    </body>
    </html>
    `);

    printWin.document.close();

    printWin.onload = () => {
        printWin.focus();
        printWin.print();
    };
}



