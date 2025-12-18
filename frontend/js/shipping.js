/**
 * Shipping Calculator Module
 * يحسب تكلفة التوصيل من API الخاص بشركات التوصيل
 */

const ShippingAPI = {
  /**
   * يحسب تكلفة التوصيل بناءً على العنوان والبيانات المطلوبة
   * @param {Object} params - معاملات التوصيل
   * @param {string} params.address - العنوان
   * @param {string} params.city - المدينة (اختياري)
   * @param {string} params.region - المنطقة (اختياري)
   * @param {number} params.total_weight - الوزن الإجمالي بالكيلوغرام (اختياري)
   * @param {number} params.total_value - القيمة الإجمالية للطلب (اختياري)
   * @returns {Promise<Object>} { shipping: number, shipping_vat: number, total_shipping: number }
   */
  async calculateShipping(params = {}) {
    try {
      // TODO: استبدل هذا الـ URL بـ API الخاص بشركة التوصيل
      const API_URL = window.API || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/shipping/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: params.address || "",
          city: params.city || "",
          region: params.region || "",
          total_weight: params.total_weight || 0,
          total_value: params.total_value || 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // التأكد من وجود القيم المطلوبة
      if (data.success && data.shipping !== undefined) {
        return {
          shipping: parseFloat(data.shipping) || 0,
          shipping_vat: parseFloat(data.shipping_vat) || 0,
          total_shipping: (parseFloat(data.shipping) || 0) + (parseFloat(data.shipping_vat) || 0)
        };
      } else {
        // في حالة الفشل، إرجاع القيمة الافتراضية
        return this.getDefaultShipping();
      }
    } catch (error) {
      console.error("خطأ في حساب التوصيل:", error);
      // في حالة الخطأ، إرجاع القيمة الافتراضية
      return this.getDefaultShipping();
    }
  },

  /**
   * يحصل على قيمة التوصيل الافتراضية (15 ر.س)
   * @returns {Object} { shipping: number, shipping_vat: number, total_shipping: number }
   */
  getDefaultShipping() {
    const shipping = 15;
    const shipping_vat = shipping * 0.15;
    return {
      shipping: shipping,
      shipping_vat: shipping_vat,
      total_shipping: shipping + shipping_vat
    };
  },

  /**
   * يحسب تكلفة التوصيل بدون API (استخدام القيمة الافتراضية)
   * مفيد للاستخدام السريع بدون طلبات API
   * @returns {Object} { shipping: number, shipping_vat: number, total_shipping: number }
   */
  getSimpleShipping() {
    return this.getDefaultShipping();
  }
};

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShippingAPI;
}


