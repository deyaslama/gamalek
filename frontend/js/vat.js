/**
 * VAT Calculator Module (Zatka Tax)
 * يحسب ضريبة القيمة المضافة (VAT) باستخدام Zatka API
 */

const VATCalculator = {
  /**
   * نسبة الضريبة الافتراضية (15%)
   */
  DEFAULT_VAT_RATE: 0.15,

  /**
   * يحسب الضريبة من Zatka API
   * @param {Object} params - معاملات الحساب
   * @param {number} params.amount - المبلغ قبل الضريبة
   * @param {string} params.item_type - نوع المنتج (اختياري)
   * @param {number} params.vat_rate - نسبة الضريبة المخصصة (اختياري)
   * @returns {Promise<Object>} { vat_amount: number, total_with_vat: number, vat_rate: number }
   */
  async calculateVAT(params = {}) {
    try {
      // TODO: استبدل هذا الـ URL بـ API الخاص بـ Zatka
      const API_URL = window.API || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/vat/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: params.amount || 0,
          item_type: params.item_type || "standard",
          vat_rate: params.vat_rate || this.DEFAULT_VAT_RATE
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // التأكد من وجود القيم المطلوبة
      if (data.success && data.vat_amount !== undefined) {
        return {
          vat_amount: parseFloat(data.vat_amount) || 0,
          total_with_vat: parseFloat(data.total_with_vat) || params.amount || 0,
          vat_rate: parseFloat(data.vat_rate) || this.DEFAULT_VAT_RATE
        };
      } else {
        // في حالة الفشل، استخدام الحساب الافتراضي
        return this.calculateDefaultVAT(params.amount || 0, params.vat_rate);
      }
    } catch (error) {
      console.error("خطأ في حساب الضريبة:", error);
      // في حالة الخطأ، استخدام الحساب الافتراضي
      return this.calculateDefaultVAT(params.amount || 0, params.vat_rate);
    }
  },

  /**
   * يحسب الضريبة باستخدام النسبة الافتراضية (15%)
   * @param {number} amount - المبلغ قبل الضريبة
   * @param {number} vatRate - نسبة الضريبة (اختياري، الافتراضي 0.15)
   * @returns {Object} { vat_amount: number, total_with_vat: number, vat_rate: number }
   */
  calculateDefaultVAT(amount = 0, vatRate = null) {
    const rate = vatRate !== null ? vatRate : this.DEFAULT_VAT_RATE;
    const vat_amount = parseFloat(amount) * rate;
    const total_with_vat = parseFloat(amount) + vat_amount;
    
    return {
      vat_amount: parseFloat(vat_amount.toFixed(2)),
      total_with_vat: parseFloat(total_with_vat.toFixed(2)),
      vat_rate: rate
    };
  },

  /**
   * يحسب المبلغ مع الضريبة (ضرب في 1.15)
   * @param {number} amount - المبلغ قبل الضريبة
   * @param {number} vatRate - نسبة الضريبة (اختياري، الافتراضي 0.15)
   * @returns {number} المبلغ مع الضريبة
   */
  addVAT(amount = 0, vatRate = null) {
    const rate = vatRate !== null ? vatRate : this.DEFAULT_VAT_RATE;
    return parseFloat(amount) * (1 + rate);
  },

  /**
   * يحسب الضريبة من مبلغ شامل الضريبة
   * @param {number} amountWithVAT - المبلغ شامل الضريبة
   * @param {number} vatRate - نسبة الضريبة (اختياري، الافتراضي 0.15)
   * @returns {Object} { base_amount: number, vat_amount: number, vat_rate: number }
   */
  extractVAT(amountWithVAT = 0, vatRate = null) {
    const rate = vatRate !== null ? vatRate : this.DEFAULT_VAT_RATE;
    const base_amount = parseFloat(amountWithVAT) / (1 + rate);
    const vat_amount = parseFloat(amountWithVAT) - base_amount;
    
    return {
      base_amount: parseFloat(base_amount.toFixed(2)),
      vat_amount: parseFloat(vat_amount.toFixed(2)),
      vat_rate: rate
    };
  },

  /**
   * يحسب ضريبة الشحن
   * @param {number} shippingAmount - قيمة الشحن قبل الضريبة
   * @param {number} vatRate - نسبة الضريبة (اختياري، الافتراضي 0.15)
   * @returns {Object} { shipping: number, shipping_vat: number, total_shipping: number }
   */
  calculateShippingVAT(shippingAmount = 0, vatRate = null) {
    const rate = vatRate !== null ? vatRate : this.DEFAULT_VAT_RATE;
    const shipping_vat = parseFloat(shippingAmount) * rate;
    const total_shipping = parseFloat(shippingAmount) + shipping_vat;
    
    return {
      shipping: parseFloat(shippingAmount),
      shipping_vat: parseFloat(shipping_vat.toFixed(2)),
      total_shipping: parseFloat(total_shipping.toFixed(2))
    };
  }
};

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VATCalculator;
}


