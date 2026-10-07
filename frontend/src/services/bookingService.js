import api from './api';

export const bookingService = {
  pricing: async signal => (await api.get('/bookings/pricing', { signal })).data.pricing,
  savePricing: async data => (await api.patch('/bookings/pricing', data)).data.pricing,
  availability: async (providerId, signal) => (await api.get(`/bookings/availability/${providerId}`, { signal })).data,
  create: async data => (await api.post('/bookings', data)).data.booking,
  list: async signal => (await api.get('/bookings', { signal })).data.bookings,
  update: async (id, data) => (await api.patch(`/bookings/${id}`, data)).data.booking,
  publishSlot: async startsAt => (await api.post('/bookings/slots', { startsAt })).data,
};

export const BOOKING_TIMES = ['08:00', '10:30', '12:00', '14:00', '16:30', '18:00'];
export const bookingDate = (value, options = {}) => new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', ...options });
export const bookingTime = value => new Date(value).toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' });
export const bookingWhen = value => `${bookingDate(value, { weekday: 'short' })} • ${bookingTime(value)}`;
export const money = cents => 'LKR ' + ((cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const bookingPrice = p => {
  if (p.invoice) return money(p.invoice.totalMinor) + ' final total';
  if (p.quote?.status === 'accepted') return money(p.quote.totalMinor) + ' agreed total';
  const price = p.pricing;
  if (price?.type === 'fixed') return money(price.amountMinor) + ' fixed';
  if (price?.type === 'estimate') return money(price.minMinor) + ' – ' + money(price.maxMinor) + ' estimate';
  if (price?.type === 'inspection') return money(price.inspectionFeeMinor) + ' inspection fee';
  return 'Pricing not published';
};
