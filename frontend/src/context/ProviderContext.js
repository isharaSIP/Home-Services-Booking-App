import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bookingService, bookingDate, bookingTime } from '../services/bookingService';
import { authService } from '../services/authService';
import { useAuth } from './AuthContext';

const ProviderContext = createContext(null);
export const ProviderDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [online, setOnlineValue] = useState(user?.providerDetails?.acceptingRequests !== false);
  const [bookings, setBookings] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const request = useRef(null), lock = useRef(false);
  const load = useCallback(async (quiet = false) => {
    if (lock.current) return;
    request.current?.abort(); const c = new AbortController(); request.current = c;
    if (!quiet) { setLoading(true); setError(''); }
    try { const rows = await bookingService.list(c.signal); if (!c.signal.aborted) setBookings(rows); }
    catch (e) { if (!c.signal.aborted) setError(e.response?.data?.message || 'Unable to load jobs. Check your connection and retry.'); }
    finally { if (!c.signal.aborted) setLoading(false); }
  }, []);
  // Initial network load shares the same loading/retry state as manual refresh.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); const timer = setInterval(() => load(true), 30000); return () => { clearInterval(timer); request.current?.abort(); }; }, [load]);
  const onUpdate = useCallback(updated => { request.current?.abort(); setLoading(false); setBookings(rows => rows.map(b => b.id === updated.id ? updated : b)); }, []);
  const update = useCallback(async (id, values) => {
    if (lock.current) return null; lock.current = true; setBusy(true); setError('');
    try { const updated = await bookingService.update(id, { ...values, bookingVersion: values.bookingVersion ?? bookings.find(b => b.id === id)?.version }); onUpdate(updated); return updated; }
    catch (e) { setError(e.response?.data?.message || 'Job was not updated. Your details are kept; retry after checking your connection.'); return null; }
    finally { lock.current = false; setBusy(false); }
  }, [onUpdate, bookings]);
  const setOnline = useCallback(async value => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await authService.updateProfile({ acceptingRequests: value }); setOnlineValue(value); }
    catch (e) { setError(e.response?.data?.message || 'Online status was not saved. Please retry.'); }
    finally { lock.current = false; setBusy(false); }
  }, []);
  const requests = useMemo(() => bookings.filter(b => ['pending', 'time_proposed'].includes(b.status)).map(b => ({ ...b, customer: b.customerName, description: b.problem, date: bookingDate(b.startsAt), time: bookingTime(b.startsAt), photos: 0 })), [bookings]);
  const value = { online, setOnline, bookings, requests, loading, error, busy, load, update, onUpdate, acceptRequest: id => update(id, { action: 'confirm' }), rejectRequest: id => update(id, { action: 'reject' }), pendingCount: requests.length, urgentCount: 0 };
  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
};
export const useProviderData = () => {
  const ctx = useContext(ProviderContext);
  if (!ctx) throw new Error('useProviderData must be used inside ProviderDataProvider');
  return ctx;
};
export default ProviderContext;
