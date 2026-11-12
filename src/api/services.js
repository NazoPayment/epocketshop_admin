// One function per backend endpoint used by the Flutter app (lib/Services/*.dart).
import {wa, shop, fetchBlobUrl, WA_API} from './client.js';

/** The app stores South African numbers as +27XXXXXXXXX; users type 0XXXXXXXXX. */
export function toE164(localNumber) {
  const digits = String(localNumber || '').replace(/[^\d]/g, '');
  if (digits.startsWith('27')) return `+${digits}`;
  return `+27${digits.replace(/^0/, '')}`;
}

export const authApi = {
  login: (phone, password) =>
    wa('/login', {body: {phone_number: toE164(phone), password}}),
  register: (data) => wa('/register', {body: data}),
  confirmOtp: (otp) => wa(`/vendor_confirmation/${encodeURIComponent(otp)}`, {method: 'GET'}),
  resendOtp: (phone) => wa('/vendor/resend', {body: {phone_number: toE164(phone)}}),
  resetPassword: (data) => wa('/vendor/password', {body: data}),
};

export const businessApi = {
  get: (businessId) => wa('/get_business_details', {body: {business_id: businessId}}),
  update: (data) => wa('/update_business_details', {body: data}),
  updateBank: (data) => wa('/edit_bank_details', {body: data, auth: true}),
  qrCodeUrl: () => fetchBlobUrl(WA_API, '/qr_code', {auth: true}),
  verificationStatus: () => wa('/verification_status', {method: 'GET', auth: true}),
  submitMerchantVerification: ({idDocument, selfie}) =>
    wa('/submit_verification_request', {
      auth: true,
      body: {id_document_url: idDocument, selfie_url: selfie, code_of_conduct_accepted: true},
    }),
  submitBusinessVerification: ({cipcDocument}) =>
    wa('/submit_business_verification', {auth: true, body: {cipc_document_url: cipcDocument}}),
  createSubscription: (businessId, planName) =>
    shop('/create_subscription', {
      body: {business_id: businessId, subscription_plan_name: planName},
    }),
  manageSubscriptionLink: (businessId) =>
    shop(`/get_manage_subscription_link/${encodeURIComponent(businessId)}`, {method: 'GET'}),
};

export const productApi = {
  list: (businessName) =>
    wa('/get_product', {body: {business_name: businessName, show_paused: true}}),
  remove: (productId) => wa('/delete_product', {body: {product_id: productId}}),
  create: (payload) => wa('/upload_product', {body: payload}),
  update: (payload) => wa('/update_vendor_product', {body: payload}),
};

export const invoiceApi = {
  list: (businessId, period) =>
    wa('/get_all_period_invoices', {
      body: {period: String(period).toLowerCase(), business_id: businessId},
    }),
  details: (invoiceDocumentName) =>
    wa(`/get_invoice_metadata/${encodeURIComponent(invoiceDocumentName)}`),
  pdfUrl: (invoiceDocumentName) =>
    `${WA_API}/get_invoice/${encodeURIComponent(invoiceDocumentName)}.pdf`,
  updateStatus: (invoiceDocumentName, status) =>
    wa('/update_invoice_status', {
      body: {
        // The service expects the stored PDF file name.
        invoice_document_name: `${invoiceDocumentName}.pdf`,
        invoice_status: status,
        psp_ref: 'by user',
      },
    }),
};

export const customerApi = {
  list: (businessId) => wa('/get_business_customers', {body: {business_id: businessId}}),
  adjustRewards: (businessId, customerPhone, {productId, categoryName, adjustment}) =>
    wa('/adjust_customer_rewards', {
      body: {
        business_id: businessId,
        customer_phone_number: customerPhone,
        ...(productId != null ? {product_id: productId} : {}),
        ...(categoryName ? {category_name: categoryName} : {}),
        adjustment,
      },
    }),
  loyaltyRules: (businessId) =>
    wa(`/get_category_loyalty_rules/${encodeURIComponent(businessId)}`, {method: 'GET'}),
  saveLoyaltyRule: (businessId, categoryName, stampsRequired, rewardDescription) =>
    wa('/configure_category_loyalty', {
      body: {
        business_id: businessId,
        category_name: categoryName,
        stamps_required: stampsRequired,
        reward_description: rewardDescription,
      },
    }),
  deleteLoyaltyRule: (businessId, categoryName) =>
    wa('/delete_category_loyalty_rule', {
      body: {business_id: businessId, category_name: categoryName},
    }),
  redeemRewardCard: (businessId, customerPhone, categoryName) =>
    wa('/redeem_reward_card', {
      body: {business_id: businessId, phone_number: customerPhone, category_name: categoryName},
    }),
  generateRewardCard: (customerNumber, businessId) =>
    wa('/generate_customer_reward_card', {
      body: {customer_number: customerNumber, business_id: businessId},
    }),
  sendSms: (businessId, phoneNumbers, message) =>
    wa('/send_customer_sms', {
      body: {business_id: businessId, phone_numbers: phoneNumbers, message},
    }),
};
