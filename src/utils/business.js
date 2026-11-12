/**
 * Full /update_business_details payload, matching what the mobile app sends
 * (BussinessDetails.dart). Pass only the fields you are changing in `overrides`.
 */
export function buildBusinessPayload(business, overrides = {}) {
  return {
    vendor_id: business.vendorId,
    business_id: business.businessId,
    business_name: business.businessName,
    order_phrase: business.orderPhrase,
    description: business.description,
    currency: business.currency || 'ZAR',
    address: business.address,
    coordinates: business.coordinates,
    invoice_format: business.invoiceFormat,
    track_inventory: business.trackInventory,
    facebook: business.social.facebook,
    instagram: business.social.instagram,
    twitter: business.social.twitter,
    ...overrides,
  };
}

export const PAYMENT_METHODS = [
  {value: 'both', label: 'Cash and online', description: 'Customers choose how to pay.'},
  {value: 'online', label: 'Online only', description: 'Customers pay by card or online transfer at checkout.'},
  {value: 'cash', label: 'Cash only', description: 'Customers pay on delivery or collection.'},
];

export const DELIVERY_LABELS = {
  standard_delivery: 'Standard delivery',
  collection: 'Collection',
  pickup: 'Pickup',
  courier: 'Courier',
};

export function deliveryLabel(type) {
  return DELIVERY_LABELS[type] || String(type || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
