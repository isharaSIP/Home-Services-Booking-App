import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { bookingService, bookingDate, bookingTime, bookingWhen, bookingPrice, money } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { COLORS } from '../../constants/theme';

const ASSETS = {
  accent: require('../../../assets/images/booking/availability-imgBackgroundAccent.svg'),
  avatar: require('../../../assets/images/booking/availability-imgProviderProfileImage.svg'),
  dot: require('../../../assets/images/booking/availability-imgEllipse.svg'),
  selectedDot: require('../../../assets/images/booking/availability-imgEllipse1.svg'),
  selected: require('../../../assets/images/booking/availability-imgEllipse2.svg'),
  arrow: require('../../../assets/images/booking/availability-imgCtaArrow.svg'),
  success: require('../../../assets/images/booking/sent-imgEllipse.svg'),
};
const errorMessage = e => e.response?.data?.message || 'Unable to connect. Please try again.';
const initials = name => (name || '').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
const localDay = value => new Date(new Date(value).getTime() + 19800000).toISOString().slice(0, 10);
function Button({ title, onPress, disabled, secondary, danger, arrow }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, danger && s.danger, disabled && s.disabled]}><Text style={[s.buttonText, secondary && s.link, danger && s.dangerText]}>{title}</Text>{arrow && <Image source={ASSETS.arrow} style={{ width: 20, height: 20, position: 'absolute', right: 20 }} />}</Pressable>;
}
function Status({ status }) {
  return <View style={[s.status, ['confirmed', 'completed'].includes(status) && s.statusGreen, ['cancelled', 'rejected'].includes(status) && s.danger]}><Text style={[s.statusText, ['confirmed', 'completed'].includes(status) && { color: '#1D9A6C' }, ['cancelled', 'rejected'].includes(status) && s.dangerText]}>{status.replaceAll('_', ' ').toUpperCase()}</Text></View>;
}
function Detail({ label, value, edit }) {
  return <View style={s.detail}><View style={s.flex}><Text style={s.caption}>{label}</Text><Text style={s.value}>{value}</Text></View>{edit && <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label}`} onPress={edit} style={s.edit}><Text style={s.link}>Edit</Text></Pressable>}</View>;
}

// The existing booking screen owns the flow; no new navigator or route tree.
export function BookingFlowModal({ provider, onClose, onTrack, rescheduling }) {
  const insets = useSafeAreaInsets();
  const [pricing, setPricing] = useState(rescheduling?.pricing || provider.pricing), [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState(1), [slots, setSlots] = useState([]), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [selected, setSelected] = useState(''), [day, setDay] = useState(localDay(new Date()));
  const [week, setWeek] = useState(0), [busy, setBusy] = useState(false), [sent, setSent] = useState(null);
  const [problem, setProblem] = useState(rescheduling?.problem || ''), [location, setLocation] = useState(rescheduling?.location || ''), [notes, setNotes] = useState(rescheduling?.notes || '');
  const request = useRef(null), lock = useRef(false), submission = useRef(null), scroll = useRef(null);
  const load = useCallback(() => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    return bookingService.availability(provider.id, controller.signal).then(result => {
      if (!controller.signal.aborted) { setError(''); if (!rescheduling) { setPricing(result.pricing); setAccepted(false); } setSlots(result.slots); setSelected(current => result.slots.some(slot => slot.startsAt === current && slot.available) ? current : ''); }
    }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [provider.id, rescheduling]);
  useEffect(() => { void load(); return () => request.current?.abort(); }, [load]);
  function go(next) { setError(''); setStep(next); scroll.current?.scrollTo({ y: 0, animated: false }); }
  const today = localDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => { const d = new Date(`${today}T00:00:00+05:30`); d.setUTCDate(d.getUTCDate() + week * 7 + index); return { date: localDay(d), stamp: d.toISOString() }; });
  const currentSlots = slots.filter(slot => slot.date === day);
  const available = slots.some(slot => slot.available);
  const back = () => { if (busy) return; if (step === 1 || step === 4) onClose(); else go(step - 1); };
  function review() { if (!problem.trim() || !location.trim()) { setError('Please enter a problem description and service location.'); return; } go(3); }
  async function submit() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      let result;
      if (rescheduling) result = await bookingService.update(rescheduling.id, { action: 'reschedule', startsAt: selected, problem: problem.trim(), location: location.trim(), notes: notes.trim() });
      else {
        const payload = { pricingVersion: pricing?.version, acceptPricing: accepted, providerId: provider.id, startsAt: selected, problem: problem.trim(), location: location.trim(), notes: notes.trim() };
        const fingerprint = JSON.stringify(payload);
        if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}` };
        result = await bookingService.create({ ...payload, requestId: submission.current.id });
      }
      setSent(result); go(4);
    } catch (e) { if (e.response?.status === 409) { setSelected(''); setStep(1); await load(); } setError(errorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  const titles = ['', 'Choose date & time', 'Booking details', 'Review booking', 'Request sent'];
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={back}><KeyboardAvoidingView style={[s.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    {step === 1 && <Image source={ASSETS.accent} style={s.accent} />}
    <View style={s.flowHeader}><View style={s.headingRow}>{step !== 4 && <Pressable disabled={busy} onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={s.back}><Text style={s.backText}>‹</Text></Pressable>}<Text accessibilityRole="header" style={s.title}>{titles[step]}</Text></View><Text style={s.subtitle}>{step === 1 ? 'See availability and select one appointment' : step === 2 ? provider.category : step === 3 ? 'Check your details before sending' : `Booking ID: ${sent?.reference || ''}`}</Text>{step < 4 && <><View style={s.progress}><View style={[s.progressActive, { width: `${step / 3 * 100}%` }]} /></View><Text style={s.caption}>Step {step} of 3{rescheduling ? ' · Reschedule' : ''}</Text></>}</View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.flowContent, { paddingBottom: Math.max(20, insets.bottom) }]}>
      {!!error && <View style={s.errorBox}><Text accessibilityRole="alert" style={s.dangerText}>{error}</Text>{step === 1 && <Button secondary title="Try again" onPress={load} />}</View>}
      {step === 1 && <>
        <View style={[s.card, s.providerCard]}><View style={s.avatar}><Image source={ASSETS.avatar} style={{ width: 64, height: 64 }} /><Text style={s.avatarLetters}>{initials(provider.name)}</Text></View><View style={s.flex}><Text style={s.providerName}>{provider.name}</Text><Text style={s.subtitle}>{provider.category}</Text><View style={s.row}><Text style={s.value}>{provider.rating == null ? 'New professional' : `★ ${provider.rating.toFixed(1)}`}</Text><Text style={s.availability}>{available ? '● Slots published' : 'No published slots'}</Text></View></View></View>
        {!loading && !pricing && !rescheduling && <Text accessibilityRole="alert" style={s.subtitle}>This provider has not published pricing yet. Please choose another provider or return after pricing is available.</Text>}<View style={s.sectionHeading}><Text style={s.sectionTitle}>Select a date</Text><Text style={s.caption}>{bookingDate(days[0].stamp, { day: undefined, month: 'long', year: 'numeric' })}</Text></View>
        <View style={s.weekControls}><Pressable accessibilityRole="button" accessibilityLabel="Previous week" disabled={week === 0} onPress={() => { setWeek(week - 1); setDay(localDay(new Date(new Date(today + 'T00:00:00+05:30').getTime() + (week - 1) * 7 * 86400000))); setSelected(''); }}><Text style={[s.link, week === 0 && s.muted]}>‹ Previous</Text></Pressable><Text style={s.caption}>Sri Lanka time</Text><Pressable accessibilityRole="button" accessibilityLabel="Next week" disabled={week >= 12} onPress={() => { setWeek(week + 1); setDay(localDay(new Date(new Date(today + 'T00:00:00+05:30').getTime() + (week + 1) * 7 * 86400000))); setSelected(''); }}><Text style={[s.link, week >= 12 && s.muted]}>Next ›</Text></Pressable></View>
        <View style={s.dates}>{days.map(d => { const hasSlots = slots.some(slot => slot.date === d.date && slot.available); const active = d.date === day; return <Pressable key={d.date} accessibilityRole="button" accessibilityLabel={bookingDate(d.stamp, { weekday: 'long', month: 'long' })} accessibilityState={{ selected: active }} onPress={() => { setDay(d.date); setSelected(''); }} style={[s.date, !hasSlots && s.noSlots, active && s.active]}><Text style={[s.dayName, active && s.white]}>{bookingDate(d.stamp, { day: undefined, month: undefined, weekday: 'short' }).toUpperCase()}</Text><Text style={[s.dayNumber, active && s.white]}>{bookingDate(d.stamp, { month: undefined })}</Text>{hasSlots && <Image source={active ? ASSETS.selectedDot : ASSETS.dot} style={{ width: 6, height: 6 }} />}</Pressable>; })}</View>
        <View style={s.sectionHeading}><Text style={s.sectionTitle}>Available times</Text><Text style={s.link}>{bookingDate(`${day}T00:00:00+05:30`, { weekday: 'short' })}</Text></View>
        {loading ? <ActivityIndicator color={COLORS.primary} style={s.loader} /> : currentSlots.length === 0 ? <View style={s.card}><Text style={s.subtitle}>No appointments published for this date. Choose another date or provider.</Text><Button secondary title="Refresh availability" onPress={load} /></View> : <View style={s.timeGrid}>{currentSlots.map(slot => <Pressable key={slot.startsAt} disabled={!slot.available} accessibilityRole="button" accessibilityLabel={bookingTime(slot.startsAt)} accessibilityState={{ disabled: !slot.available, selected: selected === slot.startsAt }} onPress={() => setSelected(slot.startsAt)} style={[s.time, !slot.available && s.noSlots, selected === slot.startsAt && s.active]}><Text style={[s.value, !slot.available && s.muted, selected === slot.startsAt && s.white]}>{bookingTime(slot.startsAt)}</Text>{!slot.available && <Text style={s.caption}>Booked</Text>}{selected === slot.startsAt && <View><Image source={ASSETS.selected} style={{ width: 22, height: 22 }} /><Text style={s.check}>✓</Text></View>}</Pressable>)}</View>}
        <View style={s.legend}><Text style={[s.caption, { color: '#1C996B' }]}>● Available</Text><Text style={s.link}>● Selected</Text><Text style={s.caption}>● Booked</Text></View>
        <View style={s.selection}><View style={s.flex}><Text style={s.caption}>Your selection</Text><Text style={s.value}>{selected ? bookingWhen(selected) : 'Choose a date and time'}</Text></View>{!!selected && <Pressable accessibilityRole="button" onPress={() => setSelected('')}><Text style={s.link}>Change</Text></Pressable>}</View>
        <Button title="Confirm Date & Time" arrow disabled={!selected || loading || busy || (!pricing && !rescheduling)} onPress={() => go(2)} />
      </>}
      {step === 2 && <>
        <View style={s.card}><Text style={s.value}>{bookingWhen(selected)}</Text><Text style={s.subtitle}>{provider.name}</Text></View>
        {rescheduling && <Text style={s.subtitle}>Rescheduling keeps the agreed work and address. To change either, cancel and create a new request.</Text>}<Text style={s.label}>Problem description *</Text><TextInput accessibilityLabel="Problem description" placeholder="Describe the work you need help with" editable={!rescheduling} value={problem} onChangeText={value => { setProblem(value); setError(''); }} maxLength={2000} multiline style={[s.input, s.problem]} />
        <Text style={s.label}>Service location *</Text><TextInput accessibilityLabel="Service location" placeholder="House number, street and city" editable={!rescheduling} value={location} onChangeText={value => { setLocation(value); setError(''); }} maxLength={500} style={s.input} />
        <Text style={s.label}>Access notes</Text><TextInput accessibilityLabel="Access notes" placeholder="Directions, parking or arrival instructions (optional)" value={notes} onChangeText={value => { setNotes(value); setError(''); }} maxLength={1000} multiline style={[s.input, s.notes]} />
        <View style={[s.card, s.spaced]}><Text style={s.caption}>Pricing</Text><Text style={s.price}>{bookingPrice({ pricing })}</Text></View><View style={s.grow} /><Button title="Review booking" onPress={review} />
      </>}
      {step === 3 && <>
        <View style={s.card}><Detail label="Provider" value={provider.name} edit={onClose} /><Detail label="Service" value={provider.category} /><Detail label="Date & time" value={bookingWhen(selected)} edit={() => go(1)} /><Detail label="Location" value={location} edit={() => go(2)} /><Detail label="Pricing" value={bookingPrice({ pricing })} /></View>
        <View style={[s.card, s.spaced]}><Detail label="Problem description" value={problem} edit={() => go(2)} />{!!notes && <Detail label="Access notes" value={notes} edit={() => go(2)} />}</View>
        <View style={[s.card, s.spaced]}><Text style={s.value}>{pricing?.inclusions || 'This provider must publish pricing before booking.'}</Text>{!!pricing?.exclusions && <Text style={s.subtitle}>Not included: {pricing.exclusions}</Text>}<Text style={s.subtitle}>{pricing?.type === 'inspection' ? 'This request covers the inspection only. The disclosed inspection fee remains payable if you decline repairs. Repairs require your approval of a separate quote.' : pricing?.type === 'estimate' ? 'This is an estimate. Review and approve an itemised quote before work begins.' : 'The fixed total covers the scope above. Any extra work requires your approval of a revised quote.'}</Text><Text style={s.subtitle}>Pay after completion by cash or bank transfer. No deposit is required.</Text>{!rescheduling && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} onPress={() => setAccepted(!accepted)} style={s.selection}><Text style={s.link}>{accepted ? '☑' : '☐'} I agree to this pricing and scope.</Text></Pressable>}</View><View style={s.grow} /><Button disabled={busy || (!rescheduling && (!accepted || !pricing))} title={busy ? 'Sending…' : rescheduling ? 'Send reschedule request' : 'Send booking request'} onPress={submit} />
      </>}
      {step === 4 && sent && <>
        <View style={s.successHero}><View><Image source={ASSETS.success} style={{ width: 88, height: 88 }} /><Text style={s.successCheck}>✓</Text></View><Text style={s.successTitle}>Request sent successfully</Text><Text style={[s.subtitle, s.center]}>{provider.name} will review your request. Track the latest status in My Bookings.</Text></View>
        <View style={s.card}><View style={s.between}><Text style={s.caption}>Current status</Text><Status status={sent.status} /></View><Text style={[s.value, s.spaced]}>Awaiting provider confirmation</Text><Text style={s.subtitle}>Response time depends on the provider.</Text></View>
        <View style={[s.card, s.spaced]}><Text style={s.value}>{bookingWhen(sent.startsAt)}</Text><Text style={s.subtitle}>{sent.location} • {bookingPrice(sent)}</Text></View><View style={s.grow} /><Button title="Track in My Bookings" onPress={onTrack} /><Button secondary title="Find another provider" onPress={onClose} />
      </>}
    </ScrollView>
  </KeyboardAvoidingView></Modal>;
}

export default function BookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]), [tab, setTab] = useState('Upcoming'), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [detail, setDetail] = useState(null), [cancel, setCancel] = useState(false), [busy, setBusy] = useState(false), [reschedule, setReschedule] = useState(null);
  const request = useRef(null);
  const load = useCallback(async () => { request.current?.abort(); const controller = new AbortController(); request.current = controller; setError(''); try { const data = await bookingService.list(controller.signal); if (!controller.signal.aborted) { setBookings(data); setDetail(current => current ? data.find(b => b.id === current.id) || current : null); } } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e)); } finally { if (!controller.signal.aborted) setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); const timer = setInterval(load, 30000); return () => { clearInterval(timer); request.current?.abort(); }; }, [load]));
  const filtered = bookings.filter(b => tab === 'Upcoming' ? ['pending', 'confirmed', 'inspection_confirmed', 'quote_pending'].includes(b.status) : tab === 'Ongoing' ? ['ongoing', 'inspecting'].includes(b.status) : ['completed', 'cancelled', 'rejected'].includes(b.status)).sort((a, b) => tab === 'Upcoming' ? new Date(a.startsAt) - new Date(b.startsAt) : new Date(b.startsAt) - new Date(a.startsAt));
  async function cancelBooking() { if (busy) return; setBusy(true); try { const updated = await bookingService.update(detail.id, { action: 'cancel' }); setBookings(rows => rows.map(b => b.id === updated.id ? updated : b)); setDetail(updated); setCancel(false); setError(''); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  return <View style={[s.screen, { paddingTop: insets.top }]}><View style={s.listHeader}><Text accessibilityRole="header" style={s.title}>My Bookings</Text><Text style={s.subtitle}>Track and manage service requests</Text><View style={s.tabs}>{['Upcoming', 'Ongoing', 'Completed'].map(t => <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={[s.tab, tab === t && s.active]}><Text style={[s.tabText, tab === t && s.white]}>{t}</Text></Pressable>)}</View></View>
    <ScrollView contentContainerStyle={s.listContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); void load(); }} />}>
      {!!error && <View style={s.errorBox}><Text accessibilityRole="alert" style={s.dangerText}>{error}</Text><Button title="Try again" secondary onPress={load} /></View>}
      {loading && <ActivityIndicator color={COLORS.primary} />}
      {!loading && !error && !filtered.length && <View style={s.card}><Text style={s.sectionTitle}>No {tab.toLowerCase()} bookings</Text><Text style={s.subtitle}>Your service requests will appear here.</Text><Button title="Explore providers" secondary onPress={() => navigation.navigate('Explore')} /></View>}
      {filtered.map(b => <View key={b.id} style={s.card}><View style={s.between}>{b.status !== 'pending' && <View style={s.listAvatar}><Text style={s.listInitials}>{initials(b.providerName)}</Text></View>}<Text style={[s.providerName, s.flex]}>{b.providerName}</Text><Status status={b.status} /></View><Text style={s.link}>{b.service}</Text><View style={s.bookingInfo}><Text style={s.value}>{bookingWhen(b.startsAt)}</Text><Text style={s.caption}>{bookingPrice(b)} • {b.reference}</Text></View>{b.status === 'pending' && <Text style={s.subtitle}>Awaiting provider confirmation</Text>}{b.invoice && <Text style={s.subtitle}>Payment: {(b.payment?.status || 'unpaid').replaceAll('_', ' ')}</Text>}<View style={s.actions}><Button secondary title={b.status === 'quote_pending' ? 'Review quote' : b.invoice ? 'Invoice & payment' : 'Details'} onPress={() => { setDetail(b); setCancel(false); }} />{['pending', 'confirmed', 'inspection_confirmed'].includes(b.status) && !b.inspectionPerformed && <><Button secondary title="Reschedule" disabled={new Date(b.startsAt) <= new Date()} onPress={() => setReschedule(b)} /><Button danger title="Cancel" onPress={() => { setDetail(b); setCancel(true); }} /></>}</View></View>)}
    </ScrollView>
    {!!detail && <Modal visible animationType="slide" onRequestClose={() => { if (!busy) setDetail(null); }}><View style={[s.screen, { paddingTop: insets.top }]}><ScrollView contentContainerStyle={s.flowContent}><Text style={s.title}>{cancel ? 'Cancel booking?' : 'Booking details'}</Text>{!!error && <Text accessibilityRole="alert" style={s.dangerText}>{error}</Text>}<View style={s.card}><Status status={detail.status} /><Detail label="Booking ID" value={detail.reference} /><Detail label="Provider" value={detail.providerName} /><Detail label="Service" value={detail.service} /><Detail label="Appointment" value={bookingWhen(detail.startsAt)} /><Detail label="Location" value={detail.location} /><Detail label="Problem" value={detail.problem} />{!!detail.notes && <Detail label="Access notes" value={detail.notes} />}<Detail label="Pricing" value={bookingPrice(detail)} /></View>{!cancel && <BookingCharges booking={detail} onUpdate={updated => { setDetail(updated); setBookings(rows => rows.map(b => b.id === updated.id ? updated : b)); }} />}{cancel && <><Text style={s.subtitle}>This releases the appointment for other customers.</Text><Button danger title={busy ? 'Cancelling…' : 'Confirm cancellation'} disabled={busy} onPress={cancelBooking} /></>}<Button secondary title={cancel ? 'Keep booking' : 'Back to My Bookings'} disabled={busy} onPress={() => { setDetail(null); setCancel(false); }} /></ScrollView></View></Modal>}
    {!!reschedule && <BookingFlowModal key={reschedule.id} provider={{ id: reschedule.providerId, name: reschedule.providerName, category: reschedule.service, price: reschedule.price, priceUnit: reschedule.priceUnit, pricing: reschedule.pricing }} rescheduling={reschedule} onClose={() => { setReschedule(null); void load(); }} onTrack={() => { setReschedule(null); setTab('Upcoming'); void load(); }} />}
  </View>;
}

// Quote approval and payment remain in the existing booking details view.
export function BookingCharges({ booking: b, onUpdate, provider = false }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [reference, setReference] = useState('');
  const lock = useRef(false);
  async function run(action, payment = false, method) {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { onUpdate(await (payment ? paymentService.update(b.id, { action, method, reference, reportedAt: b.payment?.reportedAt }) : bookingService.update(b.id, { action, quoteVersion: b.quote?.version }))); }
    catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <View style={[s.card, s.spaced]}>
    <Text style={s.sectionTitle}>Pricing & payment</Text><Text style={s.value}>{bookingPrice(b)}</Text>
    {!!b.pricing?.inclusions && <Text style={s.subtitle}>Included: {b.pricing.inclusions}</Text>}{!!b.pricing?.exclusions && <Text style={s.subtitle}>Excluded: {b.pricing.exclusions}</Text>}
    {b.quote && <><Text style={[s.value, s.spaced]}>Quote {b.quote.version} · {b.quote.status}</Text><Text style={s.subtitle}>{b.quote.scope}</Text>{b.quote.items.map((item, i) => <Detail key={i} label={item.description} value={money(item.amountMinor)} />)}<Detail label="Quote total (all charges)" value={money(b.quote.totalMinor)} /></>}
    {!provider && b.status === 'quote_pending' && <><Text style={s.subtitle}>Work is paused until you decide. Declining a revision keeps any previously agreed work and total. After an inspection, its agreed fee is still payable.</Text><Button title="Approve quote & work" disabled={busy} onPress={() => run('approve_quote')} /><Button secondary title="Decline quote" disabled={busy} onPress={() => run('decline_quote')} /></>}
    {b.invoice && <><Text style={[s.value, s.spaced]}>Invoice {b.invoice.number}</Text>{b.invoice.items.map((item, i) => <Detail key={i} label={item.description} value={money(item.amountMinor)} />)}<Detail label="Invoice total" value={money(b.invoice.totalMinor)} /><Detail label="Balance due" value={money(b.payment?.status === 'paid' ? 0 : b.invoice.totalMinor)} /><Text style={s.value}>Payment: {(b.payment?.status || 'unpaid').replaceAll('_', ' ')}</Text>
      {!provider && b.payment?.status === 'unpaid' && <><Text style={s.subtitle}>Pay the provider after completion. Bank transfers are made using your banking app. These buttons report a payment you already made; they do not transfer money.</Text><Button title="I paid the full amount in cash" disabled={busy} onPress={() => run('report', true, 'cash')} />{!!b.invoice.bankDetails && <Text style={s.value}>Bank transfer details: {b.invoice.bankDetails}</Text>}{!b.invoice.bankDetails && <Text style={s.subtitle}>Bank transfer is not available for this invoice. Please use cash.</Text>}<TextInput editable={!!b.invoice.bankDetails} accessibilityLabel="Bank transfer reference" placeholder="Bank transfer reference" value={reference} onChangeText={setReference} maxLength={200} style={s.input} /><Button secondary title="I transferred the full amount" disabled={busy || !reference.trim() || !b.invoice.bankDetails} onPress={() => run('report', true, 'bank_transfer')} /></>}
      {b.payment?.status === 'awaiting_confirmation' && <><Text style={s.subtitle}>Awaiting provider receipt confirmation · {b.payment.method?.replaceAll('_', ' ')} {b.payment.reference}</Text>{provider && <><Text style={s.subtitle}>Check your cash or bank account before confirming the full invoice amount.</Text><Button title="Confirm full payment received" disabled={busy} onPress={() => run('confirm', true)} /><Button secondary title="Payment not received" disabled={busy} onPress={() => run('reject', true)} /></>}</>}
      {b.payment?.status === 'paid' && <><Text style={s.value}>Receipt {b.payment.receipt}</Text><Text style={s.subtitle}>{money(b.invoice.totalMinor)} received · {b.payment.method?.replaceAll('_', ' ')} · {bookingDate(b.payment.paidAt)}</Text></>}
    </>}{!!error && <Text accessibilityRole="alert" style={s.dangerText}>{error}</Text>}
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6F9' },
  accent: { position: 'absolute', width: 160, height: 160, right: -66, top: -65 },
  flowHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, width: '100%', maxWidth: 600, alignSelf: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 30, minHeight: 44, justifyContent: 'center' }, backText: { fontSize: 30, color: '#272727' },
  title: { fontSize: 22, fontWeight: '700', color: '#272727', flexShrink: 1 },
  subtitle: { fontSize: 13, lineHeight: 20, color: '#6E6E76', marginTop: 5 },
  progress: { height: 5, borderRadius: 4, backgroundColor: '#ECECF1', marginTop: 14, marginBottom: 8, overflow: 'hidden' },
  progressActive: { height: 5, backgroundColor: COLORS.primary },
  flowContent: { flexGrow: 1, paddingHorizontal: 20, gap: 10, paddingTop: 4, width: '100%', maxWidth: 600, alignSelf: 'center' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, boxShadow: '0px 5px 12px rgba(38,38,38,0.06)' },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 108, borderWidth: 1, borderColor: '#E3E0F2' },
  avatar: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }, avatarLetters: { position: 'absolute', color: COLORS.primary, fontSize: 18, fontWeight: '700' },
  providerName: { fontSize: 17, color: '#272727', fontWeight: '700' },
  flex: { flex: 1, minWidth: 0 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  availability: { color: '#1C996B', backgroundColor: '#E8F7F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, fontSize: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 }, sectionTitle: { fontSize: 18, fontWeight: '700', color: '#272727' },
  caption: { fontSize: 11, color: '#6E6E76', lineHeight: 17 }, link: { color: COLORS.primary, fontSize: 12, lineHeight: 18 },
  weekControls: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  dates: { flexDirection: 'row', gap: 5 }, date: { flex: 1, minHeight: 68, borderRadius: 14, borderWidth: 1, borderColor: '#E3E0F2', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6 },
  dayName: { fontSize: 10, color: '#6E6E76' }, dayNumber: { fontSize: 17, color: '#272727', fontWeight: '700' },
  active: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, noSlots: { backgroundColor: '#E8E8F0' }, white: { color: '#FFF' }, muted: { color: '#94949E' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, time: { width: '48.5%', minHeight: 46, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E3E0F2', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  check: { position: 'absolute', width: 22, textAlign: 'center', color: '#FFF', fontSize: 14, fontWeight: '700' },
  value: { fontSize: 14, color: '#272727', lineHeight: 21, fontWeight: '600' }, legend: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  selection: { backgroundColor: '#F2EEFE', borderRadius: 16, borderWidth: 1, borderColor: '#D6CCFA', padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  button: { backgroundColor: COLORS.primary, minHeight: 52, paddingHorizontal: 12, paddingVertical: 14, borderRadius: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 6 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '600', textAlign: 'center' }, secondary: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ECECF1' }, disabled: { opacity: 0.45 }, danger: { backgroundColor: '#FDECED' }, dangerText: { color: '#D8434E' },
  label: { fontSize: 13, fontWeight: '600', color: '#272727', marginTop: 14 }, input: { minHeight: 56, padding: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ECECF1', borderRadius: 12, fontSize: 13, color: '#303030' }, problem: { minHeight: 104, textAlignVertical: 'top' }, notes: { minHeight: 72, textAlignVertical: 'top' },
  spaced: { marginTop: 10 }, price: { fontSize: 16, fontWeight: '700', color: '#272727', marginTop: 8 }, grow: { flexGrow: 1, minHeight: 10 }, detail: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ECECF1', flexDirection: 'row', gap: 10, alignItems: 'center' }, edit: { padding: 10 },
  successHero: { alignItems: 'center', paddingTop: 28, paddingBottom: 28, gap: 20 }, successCheck: { position: 'absolute', width: 88, lineHeight: 88, textAlign: 'center', color: COLORS.primary, fontSize: 40 }, successTitle: { fontSize: 22, fontWeight: '700', color: '#272727', textAlign: 'center', marginTop: 6 }, center: { textAlign: 'center' },
  status: { backgroundColor: '#FDF4E1', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 }, statusText: { fontSize: 10, color: '#C98A04' }, statusGreen: { backgroundColor: '#E7F6F0' },
  listHeader: { padding: 20, paddingBottom: 10 }, tabs: { flexDirection: 'row', gap: 8, marginTop: 20 }, tab: { flex: 1, minHeight: 38, borderRadius: 20, borderWidth: 1, borderColor: '#ECECF1', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }, tabText: { fontSize: 12, color: '#303030', fontWeight: '600' },
  listAvatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#F1EDFE', alignItems: 'center', justifyContent: 'center' }, listInitials: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  listContent: { padding: 20, gap: 20, width: '100%', maxWidth: 600, alignSelf: 'center' }, bookingInfo: { backgroundColor: '#F6F6F9', padding: 14, borderRadius: 12, marginTop: 18, gap: 5 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, errorBox: { backgroundColor: '#FDECED', padding: 14, borderRadius: 12, gap: 8 }, loader: { padding: 30 },
});
