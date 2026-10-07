import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingService, BOOKING_TIMES, bookingDate, bookingTime, bookingWhen, bookingPreference, bookingPrice, money } from '../../services/bookingService';
import { BookingCharges } from '../customer/BookingsScreen';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const LABELS = { pending: 'New request', time_proposed: 'Time suggested', awaiting_quote: 'Quote needed', confirmed: 'Confirmed', inspection_confirmed: 'Inspection booked', inspecting: 'Inspection complete', quote_pending: 'Awaiting approval', ongoing: 'In progress', completed: 'Completed', cancelled: 'Cancelled', rejected: 'Declined' };
const ACTIVITY = { request: 'Request received', confirm: 'Job accepted', propose_time: 'Alternative time suggested', accept_time: 'Customer accepted suggested time', decline_time: 'Customer kept requested time', reject: 'Request declined', quote: 'Quote sent', approve_quote: 'Quote approved', decline_quote: 'Quote declined', start: 'Work started', inspect: 'Inspection performed', complete: 'Work completed', reschedule: 'Appointment rescheduled', cancel: 'Booking cancelled', payment_report: 'Payment reported', payment_confirm: 'Payment received', payment_reject: 'Payment not received' };
const CLOSED = ['completed', 'cancelled', 'rejected'];
const TABS = [['Home', 'view-dashboard-outline'], ['Available', 'briefcase-search-outline'], ['My Jobs', 'clipboard-check-outline'], ['Availability', 'calendar-clock-outline'], ['Alerts', 'bell-outline']];
const dayKey = value => new Date(new Date(value).getTime() + 19800000).toISOString().slice(0, 10);
const messageFor = error => error.response?.data?.message || 'Unable to connect. Check your connection and try again.';
const initials = name => (name || '').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
const Icon = ({ name, color = COLORS.primary, size = 22 }) => <MaterialCommunityIcons accessible={false} name={name} color={color} size={size} />;
function Btn({ title, onPress, secondary, danger, disabled, icon }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, danger && styles.danger, disabled && styles.disabled]}>{icon && <Icon name={icon} color={secondary ? COLORS.primary : '#FFF'} size={19} />}<Text style={[styles.buttonText, secondary && styles.link, danger && { color: '#A52737' }]}>{title}</Text></Pressable>;
}
function Badge({ status }) { return <View style={[styles.badge, CLOSED.includes(status) && styles.neutralBadge]}><Text style={styles.badgeText}>{LABELS[status] || status}</Text></View>; }
function Empty({ icon, title, text, action, onPress }) { return <View style={styles.empty}><View style={styles.emptyIcon}><Icon name={icon} size={36} /></View><Text style={styles.sectionTitle}>{title}</Text><Text style={[styles.body, styles.center]}>{text}</Text>{action && <Btn secondary title={action} onPress={onPress} />}</View>; }
function ErrorCard({ text, retry }) { return <View style={styles.error}><Icon name="wifi-off" color="#A52737" /><Text accessibilityRole="alert" style={styles.errorText}>{text}</Text><Btn secondary title="Try again" onPress={retry} /></View>; }
function Info({ label, children }) { return <View style={styles.info}><Text style={styles.caption}>{label}</Text><Text style={styles.bodyDark}>{children}</Text></View>; }
function JobCard({ job, onPress }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`View job from ${job.customerName}`} onPress={onPress} style={styles.card}>
    <View style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(job.customerName)}</Text></View><View style={styles.flex}><Text style={styles.cardTitle}>{job.service}</Text><Text style={styles.body}>{job.customerName}</Text></View><Icon name="chevron-right" /></View>
    <View style={styles.between}><Badge status={job.status} /><Text style={styles.caption}>{job.reference.slice(-8)}</Text></View>
    <Text numberOfLines={2} style={styles.bodyDark}>{job.problem}</Text><View style={styles.row}><Icon name="calendar-outline" size={17} /><Text style={styles.body}>{bookingPreference(job)}</Text></View><View style={styles.row}><Icon name="map-marker-outline" size={17} /><Text numberOfLines={2} style={[styles.body, styles.flex]}>{job.location}</Text></View>
    <View style={styles.cardFoot}><Text style={[styles.cardTitle, styles.flex]}>{bookingPrice(job)}</Text><Text style={styles.link}>View details</Text></View>
    {job.payment?.status === 'awaiting_confirmation' && <Text style={styles.link}>Payment reported · confirm receipt</Text>}
  </Pressable>;
}

export default function ProviderDashboard() {
  const { user, logout } = useAuth(), insets = useSafeAreaInsets();
  const [tab, setTab] = useState('Home'), [filter, setFilter] = useState('Active'), [query, setQuery] = useState('');
  const [rows, setRows] = useState([]), [notifications, setNotifications] = useState([]), [slots, setSlots] = useState([]), [settings, setSettings] = useState(null);
  const [errors, setErrors] = useState({}), [loading, setLoading] = useState(true), [detailId, setDetailId] = useState(null), [signout, setSignout] = useState(false);
  const request = useRef(null), revision = useRef(0);
  const userId = user?._id || user?.id;
  const load = useCallback(() => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller; const version = revision.current;
    const tasks = [
      ['jobs', () => bookingService.list(controller.signal), setRows],
      ['alerts', () => bookingService.notifications(controller.signal), setNotifications],
      ['slots', () => bookingService.availability(userId, controller.signal), result => { setSlots(result.slots); setSettings({ durationMinutes: result.durationMinutes, bufferMinutes: result.bufferMinutes }); }],
    ];
    return Promise.allSettled(tasks.map(async ([key, read, set]) => {
      try { const result = await read(); if (!controller.signal.aborted && version === revision.current) { set(result); setErrors(current => ({ ...current, [key]: '' })); } }
      catch (error) { if (!controller.signal.aborted) setErrors(current => ({ ...current, [key]: messageFor(error) })); }
    })).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [userId]);
  useFocusEffect(useCallback(() => { void load(); const timer = setInterval(load, 30000); return () => { request.current?.abort(); clearInterval(timer); }; }, [load]));
  function updateJob(job) { revision.current++; setRows(current => current.map(row => row.id === job.id ? job : row)); }
  function refresh() { setLoading(true); void load(); }
  const detail = rows.find(job => job.id === detailId);
  const pending = rows.filter(job => job.status === 'pending').sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const active = rows.filter(job => job.status !== 'pending' && !CLOSED.includes(job.status)).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const today = active.filter(job => dayKey(job.startsAt) === dayKey(new Date()));
  const unread = notifications.filter(n => !n.readAt).length;
  const paid = rows.filter(b => b.payment?.status === 'paid').reduce((sum, b) => sum + (b.invoice?.totalMinor || 0), 0);
  const search = jobs => jobs.filter(b => `${b.customerName} ${b.service} ${b.problem} ${b.location} ${b.reference}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = tab === 'Available' ? search(pending) : search(rows.filter(b => filter === 'Active' ? b.status !== 'pending' && !CLOSED.includes(b.status) : filter === 'Completed' ? b.status === 'completed' : ['cancelled', 'rejected'].includes(b.status)).sort((a, b) => filter === 'Active' ? new Date(a.startsAt) - new Date(b.startsAt) : new Date(b.startsAt) - new Date(a.startsAt)));
  async function openNotification(n) {
    try { await bookingService.readNotification(n.bookingId, n.id); revision.current++; setNotifications(all => all.map(item => item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item)); setErrors(current => ({ ...current, alerts: '' })); if (!rows.some(b => b.id === n.bookingId)) await load(); setDetailId(n.bookingId); }
    catch (error) { setErrors(current => ({ ...current, alerts: messageFor(error) })); }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { paddingTop: insets.top }]}><StatusBar barStyle="dark-content" backgroundColor="#F9F8FD" />
    <View style={styles.header}><View style={styles.flex}><Text style={styles.eyebrow}>FIXMATE · PROVIDER</Text><Text accessibilityRole="header" style={styles.title}>{tab === 'Home' ? 'Your work, organised' : tab === 'Available' ? 'Available Jobs' : tab === 'Alerts' ? 'Notifications' : tab === 'Availability' ? 'Manage availability' : 'My Jobs'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unread} unread`} onPress={() => setTab('Alerts')} style={styles.iconButton}><Icon name="bell-outline" />{unread > 0 && <View style={styles.unreadDot} />}</Pressable></View>
    <ScrollView key={tab} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
      {loading && <ActivityIndicator accessibilityLabel="Loading provider workspace" color={COLORS.primary} />}
      {tab === 'Home' && <>
        <View style={styles.hero}><Text style={styles.heroEyebrow}>WELCOME BACK</Text><Text style={styles.heroTitle}>{user?.name}</Text><Text style={styles.heroBody}>{pending.length ? `${pending.length} request${pending.length === 1 ? '' : 's'} waiting for your response.` : 'Ready for your next service request.'}</Text><Btn title="Browse available jobs" secondary icon="arrow-right" onPress={() => setTab('Available')} /></View>
        {!!errors.jobs && <ErrorCard text={errors.jobs} retry={refresh} />}
        {!errors.jobs && <View style={styles.stats}>{[['New requests', pending.length], ['Active jobs', active.length], ['Received', money(paid)]].map(([label, value]) => <View key={label} style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.caption}>{label}</Text></View>)}</View>}
        <View style={styles.between}><Text style={styles.sectionTitle}>Today’s schedule</Text><Pressable accessibilityRole="button" onPress={() => setTab('My Jobs')}><Text style={styles.link}>All jobs →</Text></Pressable></View>
        {!errors.jobs && today.map(b => <JobCard key={b.id} job={b} onPress={() => setDetailId(b.id)} />)}
        {!loading && !errors.jobs && !today.length && <Empty icon="calendar-check-outline" title="A little room in your day" text="You have no assigned appointments today. Keep your availability up to date for new requests." action="Manage availability" onPress={() => setTab('Availability')} />}
        <View style={styles.card}><Text style={styles.sectionTitle}>Provider profile</Text><Info label="Service">{user?.providerDetails?.category || 'Not set'}</Info><Info label="Account">{user?.email}</Info><Btn secondary title="Pricing & bank details" onPress={() => setTab('Availability')} />{signout ? <><Text style={styles.body}>Sign out of FixMate?</Text><Btn danger title="Confirm sign out" onPress={logout} /><Btn secondary title="Stay signed in" onPress={() => setSignout(false)} /></> : <Btn secondary title="Sign out" onPress={() => setSignout(true)} />}</View>
      </>}
      {['Available', 'My Jobs'].includes(tab) && <>
        <Text style={styles.body}>{tab === 'Available' ? 'Requests from customers who selected you. Review the work and appointment before accepting.' : 'Keep customers informed as each job progresses.'}</Text>
        <View style={styles.search}><Icon name="magnify" /><TextInput accessibilityLabel="Search jobs" placeholder="Search customer, service or location" value={query} onChangeText={setQuery} style={styles.searchInput} /></View>
        {tab === 'My Jobs' && <View style={styles.filters}>{['Active', 'Completed', 'Closed'].map(t => <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: filter === t }} onPress={() => setFilter(t)} style={[styles.chip, filter === t && styles.selected]}><Text style={filter === t ? styles.white : styles.bodyDark}>{t}</Text></Pressable>)}</View>}
        {!!errors.jobs && <ErrorCard text={errors.jobs} retry={refresh} />}
        {!errors.jobs && visible.map(b => <JobCard key={b.id} job={b} onPress={() => setDetailId(b.id)} />)}
        {!loading && !errors.jobs && !visible.length && <Empty icon="briefcase-search-outline" title={query ? 'No matching jobs' : tab === 'Available' ? 'No available jobs right now' : 'No jobs in this section'} text={query ? 'Try another customer name, service or location.' : tab === 'Available' ? 'New requests will appear here when customers book your published appointments or send preferred-time requests.' : 'Accepted requests appear in Active. Finished jobs and invoices appear in Completed.'} action={query ? 'Clear search' : tab === 'Available' ? 'Manage availability' : 'Browse requests'} onPress={() => query ? setQuery('') : setTab(tab === 'Available' ? 'Availability' : 'Available')} />}
      </>}
      {tab === 'Availability' && <Availability settings={settings} slots={slots} loading={loading} error={errors.slots} reload={load} retry={refresh} />}
      {tab === 'Alerts' && <>
        <Text style={styles.body}>Booking changes, quote decisions and payment reports. Updates refresh while you use the app.</Text>
        {!!errors.alerts && <ErrorCard text={errors.alerts} retry={refresh} />}
        {!errors.alerts && notifications.map(n => <Pressable accessibilityRole="button" accessibilityLabel={`${n.readAt ? '' : 'Unread: '}${n.message}, ${n.customerName}`} key={n.id} onPress={() => openNotification(n)} style={[styles.card, !n.readAt && styles.unreadCard]}><View style={styles.row}><View style={styles.avatar}><Icon name={n.kind === 'payment' ? 'cash-check' : n.kind === 'cancel' ? 'calendar-remove-outline' : 'bell-outline'} /></View><View style={styles.flex}><Text style={styles.cardTitle}>{n.message}</Text><Text style={styles.body}>{n.customerName} · {n.service}</Text></View>{!n.readAt && <View style={styles.smallDot} />}</View><Text style={styles.caption}>{bookingWhen(n.createdAt)} · View job →</Text></Pressable>)}
        {!loading && !errors.alerts && !notifications.length && <Empty icon="bell-check-outline" title="You’re all caught up" text="New booking requests and customer updates will appear here." />}
      </>}
    </ScrollView>
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>{TABS.map(([name, icon]) => <Pressable key={name} accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{ selected: tab === name }} onPress={() => { setTab(name); setQuery(''); }} style={styles.navItem}><Icon name={icon} size={23} color={tab === name ? COLORS.primary : '#9296A6'} /><Text style={[styles.navLabel, tab === name && styles.link]}>{name}</Text>{name === 'Alerts' && unread > 0 && <View style={styles.unreadDot} />}</Pressable>)}</View>
    {detail && <JobDetails key={detail.id} booking={detail} onClose={() => setDetailId(null)} onUpdate={updateJob} onAccepted={() => { setDetailId(null); setTab('My Jobs'); setFilter('Active'); setQuery(''); }} />}
  </KeyboardAvoidingView>;
}

function JobDetails({ booking: b, onClose, onUpdate, onAccepted }) {
  const insets = useSafeAreaInsets(), [confirmation, setConfirmation] = useState(null), [accepted, setAccepted] = useState(false), [quote, setQuote] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false); const lock = useRef(false);
  const [date, setDate] = useState(dayKey(b.startsAt)), [time, setTime] = useState(new Date(new Date(b.startsAt).getTime() + 19800000).toISOString().slice(11, 16));
  const selectedStart = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(new Date(date + 'T' + time + ':00+05:30').getTime()) && dayKey(new Date(date + 'T' + time + ':00+05:30')) === date ? new Date(date + 'T' + time + ':00+05:30').toISOString() : null;
  const action = b.status === 'confirmed' ? ['start', 'Start job'] : b.status === 'inspection_confirmed' ? ['inspect', 'Mark inspection performed'] : b.status === 'ongoing' ? ['complete', 'Complete job'] : null;
  async function update() {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { const result = await bookingService.update(b.id, { action: confirmation, ...(['confirm', 'propose_time'].includes(confirmation) ? { startsAt: selectedStart } : {}) }); onUpdate(result); if (confirmation === 'confirm') setAccepted(true); setConfirmation(null); }
    catch (e) { setError(messageFor(e)); } finally { lock.current = false; setBusy(false); }
  }
  const guidance = { awaiting_quote: 'You accepted this request. Send an itemised quote and wait for customer approval before starting work.', inspection_confirmed: 'This appointment covers the inspection only. Mark it performed after your visit, then quote separately for repairs.', inspecting: 'The inspection is recorded. Send the repair quote for customer approval.', quote_pending: 'The customer is reviewing your quote. Work must wait for their decision.', confirmed: 'The agreed scope and price are approved. Start the job when work begins.', ongoing: 'Work is in progress. Extra work or charges require a revised quote and customer approval.', completed: 'The job is complete. Confirm payment only after you receive it.', cancelled: 'The customer cancelled this request.', rejected: 'You declined this request.' };
  return <Modal visible animationType="slide" onRequestClose={() => { if (!busy) { if (confirmation) setConfirmation(null); else onClose(); } }}><KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to provider workspace" disabled={busy} style={styles.iconButton} onPress={onClose}><Icon name="arrow-left" /></Pressable><Text style={[styles.title, styles.flex]}>{accepted ? 'Job accepted' : confirmation === 'propose_time' ? 'Suggest another time?' : confirmation === 'confirm' ? 'Accept job?' : confirmation ? 'Confirm update' : b.status === 'pending' ? 'Job Details' : 'Job Status Details'}</Text></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      {accepted ? <><Empty icon="check-circle-outline" title="You’re booked in" text={`Your appointment with ${b.customerName} is now in My Jobs. ${b.status === 'awaiting_quote' ? 'Send a quote before starting repairs.' : b.status === 'inspection_confirmed' ? 'This confirms an inspection, not repair work.' : 'The customer can track the confirmed booking.'}`} /><View style={styles.card}><Info label="Appointment">{bookingPreference(b)}</Info><Info label="Service location">{b.location}</Info></View><Btn title="View My Jobs" onPress={onAccepted} /></> : <>
        <View style={styles.card}><View style={styles.between}><Text style={[styles.sectionTitle, styles.flex]}>{b.service}</Text><Badge status={b.status} /></View><Info label="Customer">{b.customerName}</Info><Info label="Appointment · Sri Lanka time">{bookingPreference(b)}</Info><Info label="Service location">{b.location}</Info><Info label="Requested work">{b.problem}</Info>{!!b.notes && <Info label="Access notes">{b.notes}</Info>}<Info label="Pricing">{bookingPrice(b)}</Info><Text selectable style={styles.caption}>{b.reference}</Text></View>
        {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
        {confirmation ? <View style={styles.card}><Text style={styles.sectionTitle}>{confirmation === 'propose_time' ? 'Send time for customer approval' : confirmation === 'confirm' ? 'Confirm this appointment' : confirmation === 'reject' ? 'Decline this request?' : confirmation === 'complete' ? 'Is the agreed work finished?' : confirmation === 'inspect' ? 'Has the inspection been performed?' : 'Ready to begin work?'}</Text><Text style={styles.body}>{confirmation === 'propose_time' ? 'The customer must approve this time. It is not reserved until approval; availability will be checked again.' : confirmation === 'confirm' ? b.pricing?.type === 'inspection' ? 'You are accepting the inspection visit only. Repairs require an approved quote.' : b.quote?.status === 'accepted' ? 'You agree to attend at this time and carry out the approved scope and price.' : 'You are accepting the appointment. Send a quote next; do not start repairs until the customer approves.' : confirmation === 'reject' ? 'This releases the appointment. The customer will see that you declined.' : confirmation === 'complete' ? 'An invoice will be created using the approved quote. Payment remains unpaid until receipt is confirmed.' : confirmation === 'inspect' ? 'Record this only after your inspection. The disclosed inspection fee will apply if the customer declines repairs.' : 'The customer will see the job as in progress.'}</Text>{['confirm', 'propose_time'].includes(confirmation) && selectedStart && <Info label="Selected appointment">{bookingWhen(selectedStart)}</Info>}<Btn title={busy ? 'Saving…' : confirmation === 'confirm' ? 'Confirm acceptance' : 'Confirm update'} disabled={busy} onPress={update} /><Btn secondary title="Go back" disabled={busy} onPress={() => setConfirmation(null)} /></View> : <>
          {guidance[b.status] && <View style={styles.notice}><Text style={styles.bodyDark}>{guidance[b.status]}</Text></View>}
          {['pending', 'time_proposed'].includes(b.status) && <>
            <View style={styles.card}><Text style={styles.sectionTitle}>Agree an appointment</Text><Text style={styles.body}>{b.status === 'time_proposed' ? 'Awaiting the customer’s decision. You can send a new suggestion if needed.' : b.scheduleMode === 'flexible' ? 'Choose a start within the requested window to accept. Anything outside it needs customer approval.' : 'Accept the requested time, or suggest another for customer approval.'}</Text><Text style={styles.caption}>Date (YYYY-MM-DD) · Sri Lanka time</Text><TextInput accessibilityLabel="Job appointment date" value={date} maxLength={10} onChangeText={setDate} style={styles.input} /><View style={styles.filters}>{BOOKING_TIMES.map(t => <Pressable key={t} accessibilityRole="button" accessibilityLabel={'Job time ' + t} accessibilityState={{ selected: time === t }} onPress={() => setTime(t)} style={[styles.chip, time === t && styles.selected]}><Text style={time === t ? styles.white : styles.bodyDark}>{t}</Text></Pressable>)}</View><Text style={styles.caption}>{b.durationMinutes || 60} minutes planned + {b.bufferMinutes ?? 30} minutes travel buffer. Conflict checks run when confirming.</Text></View>
            {b.status === 'pending' && <Btn title="Accept job at selected time" disabled={!selectedStart || new Date(selectedStart) <= new Date()} icon="check" onPress={() => setConfirmation('confirm')} />}
            <Btn secondary title="Suggest this time to customer" disabled={!selectedStart || new Date(selectedStart) <= new Date()} onPress={() => setConfirmation('propose_time')} /><Btn danger title="Decline request" onPress={() => setConfirmation('reject')} />
          </>}
          {action && <Btn title={action[1]} onPress={() => setConfirmation(action[0])} />}
          {['awaiting_quote', 'confirmed', 'inspecting', 'ongoing', 'quote_pending'].includes(b.status) && <Btn secondary title="Send / revise itemised quote" onPress={() => setQuote(!quote)} />}
          {quote && <QuoteEditor booking={b} onUpdate={result => { onUpdate(result); setQuote(false); }} onClose={() => setQuote(false)} />}
          <BookingCharges booking={b} provider onUpdate={onUpdate} />
          <View style={styles.card}><Text style={styles.sectionTitle}>Job activity</Text>{(b.history?.length ? b.history : [{ status: b.status, at: b.updatedAt || b.createdAt }]).map((item, i) => <View key={i} style={styles.activity}><Icon name="check-circle-outline" size={18} /><View style={styles.flex}><Text style={styles.bodyDark}>{ACTIVITY[item.action] || LABELS[item.status] || item.status}</Text><Text style={styles.caption}>{item.at ? bookingWhen(item.at) : 'Recorded status'}</Text></View></View>)}</View>
        </>}
      </>}
    </ScrollView>
  </KeyboardAvoidingView></Modal>;
}

function Availability({ settings, slots, error, loading, reload, retry }) {
  const [date, setDate] = useState(dayKey(new Date())), [time, setTime] = useState('08:00'), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [failure, setFailure] = useState(''), [remove, setRemove] = useState(null), [pricing, setPricing] = useState(false); const lock = useRef(false);
  const days = Array.from({ length: 90 }, (_, i) => new Date(new Date(dayKey(new Date()) + 'T00:00:00+05:30').getTime() + i * 86400000));
  const published = slots.filter(slot => slot.date === date);
  async function save(removing = false) {
    if (lock.current) return;
    const start = removing ? new Date(remove) : new Date(`${date}T${time}:00+05:30`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(start.getTime()) || (!removing && dayKey(start) !== date) || start <= new Date()) { setFailure('Choose a valid future date and time.'); return; }
    lock.current = true; setBusy(true); setFailure(''); setMessage('');
    try { if (removing) await bookingService.removeSlot(start.toISOString()); else await bookingService.publishSlot(start.toISOString()); setRemove(null); setMessage(removing ? 'Appointment removed.' : 'Appointment published. Customers can now request it.'); await reload(); }
    catch (e) { setFailure(messageFor(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <>
    <View style={styles.notice}><Text style={styles.bodyDark}>Publish the times you can attend. All appointments use Sri Lanka time. Booked appointments cannot be removed.</Text></View>
    {error ? <Empty icon="cloud-alert-outline" title="Availability couldn’t load" text={error} action="Try again" onPress={retry} /> : <>
      <Text style={styles.sectionTitle}>Choose a day</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRail}>{days.map(d => <Pressable key={dayKey(d)} accessibilityRole="button" accessibilityLabel={bookingDate(d, { weekday: 'long', month: 'long' })} accessibilityState={{ selected: date === dayKey(d) }} onPress={() => { setDate(dayKey(d)); setRemove(null); setMessage(''); setFailure(''); }} style={[styles.day, date === dayKey(d) && styles.selected]}><Text style={date === dayKey(d) ? styles.white : styles.caption}>{bookingDate(d, { weekday: 'short', day: undefined, month: undefined })}</Text><Text style={[styles.sectionTitle, date === dayKey(d) && styles.white]}>{bookingDate(d, { month: undefined })}</Text><Text style={date === dayKey(d) ? styles.white : styles.caption}>{bookingDate(d, { day: undefined })}</Text></Pressable>)}</ScrollView>
      <View style={styles.card}><Text style={styles.sectionTitle}>Publish an appointment</Text><Text style={styles.caption}>Date (YYYY-MM-DD), within the next 90 days</Text><TextInput accessibilityLabel="Appointment date YYYY-MM-DD" value={date} maxLength={10} onChangeText={value => { setDate(value); setFailure(''); setMessage(''); setRemove(null); }} style={styles.input} /><Text style={styles.caption}>Start time · Sri Lanka</Text><View style={styles.filters}>{BOOKING_TIMES.map(t => <Pressable accessibilityRole="button" accessibilityState={{ selected: time === t }} key={t} onPress={() => { setTime(t); setFailure(''); setMessage(''); }} style={[styles.chip, time === t && styles.selected]}><Text style={time === t ? styles.white : styles.bodyDark}>{t}</Text></Pressable>)}</View><Btn title={busy ? 'Saving…' : 'Publish appointment'} disabled={busy || loading} onPress={() => save()} /></View>
      {!!failure && <Text accessibilityRole="alert" style={styles.errorText}>{failure}</Text>}{!!message && <Text accessibilityRole="alert" style={styles.link}>{message}</Text>}
      <Text style={styles.sectionTitle}>Published times · {date}</Text>{!published.length && !loading && <Empty icon="calendar-blank-outline" title="No appointments published" text="Add a time above to let customers book this day." />}
      {published.map(slot => <View key={slot.startsAt} style={styles.card}><View style={styles.between}><View><Text style={styles.cardTitle}>{bookingTime(slot.startsAt)}</Text><Text style={styles.body}>{slot.available ? 'Available to customers' : 'Reserved by a booking'}</Text></View>{slot.available ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${bookingTime(slot.startsAt)}`} disabled={busy} style={styles.iconButton} onPress={() => setRemove(slot.startsAt)}><Icon name="trash-can-outline" color="#A52737" /></Pressable> : <Icon name="lock-outline" />}</View>{remove === slot.startsAt && <><Text style={styles.body}>Remove this appointment from customer availability?</Text><Btn danger title="Confirm removal" disabled={busy} onPress={() => save(true)} /><Btn secondary title="Keep appointment" disabled={busy} onPress={() => setRemove(null)} /></>}</View>)}
    </>}
    <ScheduleSettings settings={settings} reload={reload} /><View style={styles.card}><Text style={styles.sectionTitle}>Service pricing</Text><Text style={styles.body}>Set the price customers see before booking and your optional bank transfer details.</Text><Btn secondary title={pricing ? 'Hide pricing settings' : 'Edit pricing & bank details'} onPress={() => setPricing(!pricing)} />{pricing && <PricingEditor />}</View>
  </>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F8FD' }, header: { padding: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  content: { padding: 20, paddingTop: 8, paddingBottom: 28, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center', flexGrow: 1 }, flex: { flex: 1, minWidth: 0 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 23, fontWeight: '700', color: COLORS.textPrimary, flexShrink: 1 }, eyebrow: { color: COLORS.primary, fontSize: 10, letterSpacing: 1.3, fontWeight: '700', marginBottom: 6 }, sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }, cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary }, body: { color: '#716E7F', fontSize: 13, lineHeight: 20 }, bodyDark: { color: '#30303A', fontSize: 14, lineHeight: 21 }, caption: { color: '#797586', fontSize: 11, lineHeight: 17 }, center: { textAlign: 'center' }, link: { color: COLORS.primary, fontSize: 13, fontWeight: '600' }, white: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, gap: 12, boxShadow: '0px 3px 14px rgba(39,39,39,0.05)' }, cardFoot: { borderTopWidth: 1, borderTopColor: '#F0EDF6', paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 44, height: 44, backgroundColor: '#EEE8FF', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: COLORS.primary, fontWeight: '700' }, badge: { backgroundColor: '#EEE8FF', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10 }, badgeText: { color: '#6853A1', fontSize: 10, fontWeight: '600' }, neutralBadge: { backgroundColor: '#F0F1F5' },
  hero: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 22, gap: 12 }, heroEyebrow: { color: '#DBD2FF', fontSize: 10, letterSpacing: 1.6, fontWeight: '600' }, heroTitle: { color: '#FFF', fontSize: 25, fontWeight: '700' }, heroBody: { color: '#EEE8FF', lineHeight: 21, fontSize: 14 }, stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 12, gap: 8 }, statValue: { color: COLORS.primary, fontSize: 17, fontWeight: '700' },
  button: { minHeight: 48, borderRadius: 12, padding: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, buttonText: { color: '#FFF', fontSize: 14, fontWeight: '600', textAlign: 'center', flexShrink: 1 }, secondary: { backgroundColor: '#F5F1FF', borderWidth: 1, borderColor: '#E8DFFC' }, danger: { backgroundColor: '#FDECEE' }, disabled: { opacity: 0.45 }, iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#F0ECF8' },
  empty: { padding: 26, backgroundColor: '#FFF', borderRadius: 18, gap: 14, alignItems: 'center' }, emptyIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#F2EDFF', alignItems: 'center', justifyContent: 'center' }, error: { padding: 18, gap: 12, borderRadius: 16, backgroundColor: '#FDECEE' }, errorText: { color: '#A52737', fontSize: 13, lineHeight: 20 }, notice: { backgroundColor: '#F0EBFC', padding: 16, borderRadius: 14 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EAE5F3' }, searchInput: { flex: 1, minHeight: 48, fontSize: 13, color: '#303030', minWidth: 0 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EAE5F3', borderRadius: 20, minHeight: 44, paddingHorizontal: 16, paddingVertical: 11 }, selected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  nav: { borderTopWidth: 1, borderTopColor: '#EFEBF6', paddingTop: 8, flexDirection: 'row', backgroundColor: '#FFF' }, navItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 5 }, navLabel: { fontSize: 10, color: '#9296A6' }, unreadDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF786A', top: 7, right: 10 }, smallDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary }, unreadCard: { borderWidth: 1, borderColor: '#DCD0FF' },
  info: { gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2EFF6' }, activity: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2EFF6' }, dateRail: { gap: 8 }, day: { minWidth: 60, minHeight: 94, borderRadius: 16, padding: 10, gap: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EAE5F3' }, input: { borderWidth: 1, borderColor: '#EAE5F3', borderRadius: 10, padding: 14, minHeight: 48, backgroundColor: '#FFF', color: '#303030' }, infoCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
});

const fieldStyle = { borderWidth: 1, borderColor: '#DAD6E8', backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginVertical: 6, color: '#272727' };
function ScheduleSettings({ settings, reload }) {
  const [editing, setEditing] = useState(false), [duration, setDuration] = useState(''), [buffer, setBuffer] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    if (!/^\d+$/.test(duration) || !/^\d+$/.test(buffer) || +duration < 30 || +duration > 480 || +buffer > 120) { setMessage('Use 30–480 minutes for duration and 0–120 for travel.'); return; }
    lock.current = true; setBusy(true); setMessage('');
    try { await bookingService.saveScheduleSettings({ durationMinutes: +duration, bufferMinutes: +buffer }); await reload(); setEditing(false); setMessage('Saved for new requests. Existing appointments keep their reserved duration.'); }
    catch (e) { setMessage(messageFor(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <View style={styles.card}><Text style={styles.sectionTitle}>Appointment planning</Text><Text style={styles.body}>{settings?.durationMinutes ?? 60} minutes for service + {settings?.bufferMinutes ?? 30} minutes for travel. These planning estimates prevent overlapping bookings; they are not a promised completion time.</Text><Btn secondary title={editing ? 'Close planning settings' : 'Edit duration & travel buffer'} disabled={!settings || busy} onPress={() => { setEditing(!editing); setDuration(String(settings.durationMinutes)); setBuffer(String(settings.bufferMinutes)); setMessage(''); }} />{editing && <><Text style={styles.caption}>Service duration (minutes)</Text><TextInput accessibilityLabel="Service duration minutes" keyboardType="number-pad" value={duration} onChangeText={setDuration} style={styles.input} /><Text style={styles.caption}>Travel buffer after appointment (minutes)</Text><TextInput accessibilityLabel="Travel buffer minutes" keyboardType="number-pad" value={buffer} onChangeText={setBuffer} style={styles.input} /><Btn title={busy ? 'Saving…' : 'Save planning settings'} disabled={busy} onPress={save} /></>}{!!message && <Text accessibilityRole="alert" style={styles.body}>{message}</Text>}</View>;
}
function Action({ label, onPress, disabled }) { return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ padding: 14, borderRadius: 10, backgroundColor: disabled ? '#AAA' : COLORS.primary, marginVertical: 6 }}><Text style={{ color: '#FFF', textAlign: 'center' }}>{label}</Text></TouchableOpacity>; }
function PricingEditor() {
  const [type, setType] = useState('fixed'), [amount, setAmount] = useState(''), [min, setMin] = useState(''), [max, setMax] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [inclusions, setInclusions] = useState(''), [exclusions, setExclusions] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [ready, setReady] = useState(false), [loadError, setLoadError] = useState('');
  const pricingRequest = useRef(null);
  const loadPricing = useCallback(() => {
    pricingRequest.current?.abort(); const controller = new AbortController(); pricingRequest.current = controller;
    return bookingService.pricing(controller.signal).then(p => {
      if (controller.signal.aborted) return;
      if (p) { setBankDetails(p.bankDetails || ''); setType(p.type); setAmount(String((p.amountMinor ?? p.inspectionFeeMinor ?? 0) / 100)); setMin(String((p.minMinor || 0) / 100)); setMax(String((p.maxMinor || 0) / 100)); setInclusions(p.inclusions); setExclusions(p.exclusions); }
      setReady(true); setLoadError('');
    }).catch(e => { if (!controller.signal.aborted) setLoadError(messageFor(e)); });
  }, []);
  useFocusEffect(useCallback(() => { void loadPricing(); return () => pricingRequest.current?.abort(); }, [loadPricing]));
  async function save() {
    if (lock.current) return;
    if (!inclusions.trim() || (type === 'estimate' ? !min.trim() || !max.trim() : !amount.trim())) { setMessage('Enter the price and included scope.'); return; }
    lock.current = true; setBusy(true);
    try { await bookingService.savePricing({ bankDetails, type, amount: Number(amount), inspectionFee: Number(amount), min: Number(min), max: Number(max), inclusions, exclusions }); setMessage('Pricing published. Existing bookings keep their agreed pricing.'); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not save pricing.'); } finally { lock.current = false; setBusy(false); }
  }
  if (!ready) return loadError ? <ErrorCard text={loadError} retry={loadPricing} /> : <ActivityIndicator accessibilityLabel="Loading pricing" color={COLORS.primary} />;
  return <View style={{ marginBottom: 24 }}><Text style={styles.infoCardTitle}>Service pricing</Text><Text>Publish pricing before customers book. Include every mandatory charge in the total.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['fixed', 'estimate', 'inspection'].map(t => <TouchableOpacity key={t} accessibilityRole="button" accessibilityState={{ selected: type === t }} onPress={() => setType(t)} style={{ padding: 12, backgroundColor: type === t ? '#E8DEFF' : '#FFF', borderRadius: 8 }}><Text>{t === 'fixed' ? 'Fixed price' : t === 'estimate' ? 'Estimated range' : 'Inspection fee'}</Text></TouchableOpacity>)}</View>{type === 'estimate' ? <><TextInput accessibilityLabel="Minimum estimate LKR" placeholder="Minimum estimate (LKR)" keyboardType="decimal-pad" value={min} onChangeText={setMin} style={fieldStyle} /><TextInput accessibilityLabel="Maximum estimate LKR" placeholder="Maximum estimate (LKR)" keyboardType="decimal-pad" value={max} onChangeText={setMax} style={fieldStyle} /></> : <TextInput accessibilityLabel="Price LKR" placeholder={type === 'fixed' ? 'Fixed total (LKR)' : 'Inspection fee (LKR)'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={fieldStyle} />}<TextInput accessibilityLabel="Included scope" placeholder="What is included?" multiline maxLength={1000} value={inclusions} onChangeText={setInclusions} style={fieldStyle} /><TextInput accessibilityLabel="Excluded work" placeholder="What is excluded? (optional)" multiline maxLength={1000} value={exclusions} onChangeText={setExclusions} style={fieldStyle} /><TextInput accessibilityLabel="Bank transfer instructions" placeholder="Bank name, branch, account holder and account number (optional; shown only to booked customers)" multiline maxLength={1000} value={bankDetails} onChangeText={setBankDetails} style={fieldStyle} /><Action label={busy ? 'Saving…' : 'Publish pricing'} disabled={busy} onPress={save} />{!!message && <Text accessibilityRole="alert">{message}</Text>}</View>;
}
function QuoteEditor({ booking, onUpdate, onClose }) {
  const [scope, setScope] = useState(booking.quote?.scope || booking.problem), [items, setItems] = useState([{ description: 'Labour', amount: '' }]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  async function send() {
    if (lock.current) return;
    if (items.some(item => !item.amount.trim())) { setError('Enter an amount for every item.'); return; }
    lock.current = true; setBusy(true);
    try { onUpdate(await bookingService.update(booking.id, { action: 'quote', scope, items: items.map(item => ({ ...item, amount: Number(item.amount) })) })); }
    catch (e) { setError(e.response?.data?.message || 'Unable to send quote.'); } finally { lock.current = false; setBusy(false); }
  }
  return <View style={{ padding: 12, backgroundColor: '#F3EEFF', borderRadius: 12 }}><Text style={styles.infoCardTitle}>Itemised quote</Text><Text>Enter the complete replacement total, not just the extra charge. Include labour, materials and any taxes. Work pauses until the customer decides.</Text>{booking.inspectionPerformed && <Text>The agreed inspection fee of {money(booking.pricing?.inspectionFeeMinor)} is added automatically. Do not add it again.</Text>}<TextInput accessibilityLabel="Quote scope" value={scope} onChangeText={setScope} maxLength={2000} multiline style={fieldStyle} />{items.map((item, i) => <View key={i}><TextInput accessibilityLabel={'Charge description ' + (i + 1)} placeholder="Charge description" value={item.description} maxLength={200} onChangeText={description => setItems(rows => rows.map((row, n) => n === i ? { ...row, description } : row))} style={fieldStyle} /><TextInput accessibilityLabel={'Charge amount ' + (i + 1)} placeholder="Amount (LKR)" keyboardType="decimal-pad" value={item.amount} onChangeText={amount => setItems(rows => rows.map((row, n) => n === i ? { ...row, amount } : row))} style={fieldStyle} />{items.length > 1 && <Action label="Remove charge" onPress={() => setItems(rows => rows.filter((_, n) => n !== i))} />}</View>)}<Action label="Add charge" disabled={items.length >= 20 || busy} onPress={() => setItems([...items, { description: '', amount: '' }])} /><Action label={busy ? 'Sending…' : 'Send quote for approval'} disabled={busy} onPress={send} /><Action label="Close quote editor" disabled={busy} onPress={onClose} />{!!error && <Text accessibilityRole="alert">{error}</Text>}</View>;
}
