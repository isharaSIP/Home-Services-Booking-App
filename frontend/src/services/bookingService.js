import api from './api';

export const bookingService = {
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
export const bookingPrice = p => p.price == null ? 'Price on request' : `LKR ${p.price.toLocaleString('en-US')} per ${p.priceUnit}`;
