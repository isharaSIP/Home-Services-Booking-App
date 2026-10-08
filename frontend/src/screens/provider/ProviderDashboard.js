import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingService, BOOKING_TIMES, bookingDate, bookingTime, bookingWhen, bookingPreference, bookingPrice, money } from '../../services/bookingService';
import { BookingCharges } from '../customer/BookingsScreen';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/authService';
import ProfileScreen from '../customer/ProfileScreen';
import MessagesScreen from '../customer/MessagesScreen';
import { useAuth } from '../../context/AuthContext';
const LABELS = {
  pending: 'New request',
  time_proposed: 'Time suggested',
  awaiting_quote: 'Quote needed',
  confirmed: 'Confirmed',
  inspection_confirmed: 'Inspection booked',
  inspecting: 'Inspection complete',
  quote_pending: 'Awaiting approval',
  ongoing: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Declined'
};
const ACTIVITY = {
  request: 'Request received',
  confirm: 'Job accepted',
  propose_time: 'Alternative time suggested',
  accept_time: 'Customer accepted suggested time',
  decline_time: 'Customer kept requested time',
  reject: 'Request declined',
  quote: 'Quote sent',
  approve_quote: 'Quote approved',
  decline_quote: 'Quote declined',
  start: 'Work started',
  inspect: 'Inspection performed',
  complete: 'Work completed',
  reschedule: 'Appointment rescheduled',
  cancel: 'Booking cancelled',
  payment_report: 'Payment reported',
  payment_confirm: 'Payment received',
  payment_reject: 'Payment not received'
};
const CLOSED = ['completed', 'cancelled', 'rejected'];
const TABS = [['Home', 'view-dashboard-outline'], ['Available', 'briefcase-search-outline'], ['Availability', 'calendar-month-outline'], ['Messages', 'message-outline'], ['Profile', 'account-outline']];
const dayKey = value => new Date(new Date(value).getTime() + 19800000).toISOString().slice(0, 10);
const messageFor = error => error.response?.data?.message || 'Unable to connect. Check your connection and try again.';
const initials = name => (name || '').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
const Icon = ({
  name,
  color = COLORS.primary,
  size = 22
}) => <MaterialCommunityIcons accessible={false} name={name} color={color} size={size} />;
function Btn({
  title,
  onPress,
  secondary,
  danger,
  disabled,
  icon
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{
    disabled: !!disabled
  }} disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, danger && styles.danger, disabled && styles.disabled]}>{icon && <Icon name={icon} color={secondary ? COLORS.primary : '#FFF'} size={19} />}<Text style={[styles.buttonText, secondary && styles.link, danger && {
      color: '#A52737'
    }]}>{title}</Text></Pressable>;
}
function Badge({ status }) {
  const tone = ['completed'].includes(status) ? { background: '#E7F8F0', text: '#128560' } : ['cancelled', 'rejected'].includes(status) ? { background: '#FFF0F0', text: '#B34550' } : ['pending', 'time_proposed', 'quote_pending'].includes(status) ? { background: '#FFF7E5', text: '#976A16' } : { background: '#EEEAFE', text: COLORS.primary };
  return <View style={[styles.badge, { backgroundColor: tone.background }]}><Text style={[styles.badgeText, { color: tone.text }]}>{LABELS[status] || status}</Text></View>;
}
function Disclosure({ title, subtitle, icon = 'tune-variant', children }) {
  const [open, setOpen] = useState(false);
  return <View style={styles.card}><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.row}><View style={styles.sectionIcon}><Icon name={icon} size={20} /></View><View style={styles.flex}><Text style={styles.cardTitle}>{title}</Text>{!!subtitle && <Text style={styles.caption}>{subtitle}</Text>}</View><Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} /></Pressable>{open && <View style={styles.disclosureBody}>{children}</View>}</View>;
}
function Empty({
  icon,
  title,
  text,
  action,
  onPress
}) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><Icon name={icon} size={36} /></View><Text style={styles.sectionTitle}>{title}</Text><Text style={[styles.body, styles.center]}>{text}</Text>{action && <Btn secondary title={action} onPress={onPress} />}</View>;
}
function ErrorCard({
  text,
  retry
}) {
  return <View style={styles.error}><Icon name="wifi-off" color="#A52737" /><Text accessibilityRole="alert" style={styles.errorText}>{text}</Text><Btn secondary title="Try again" onPress={retry} /></View>;
}
function Info({
  label,
  children
}) {
  return <View style={styles.info}><Text style={styles.caption}>{label}</Text><Text style={styles.bodyDark}>{children}</Text></View>;
}
function JobCard({ job, onPress, compact, onDecline }) {
  if (compact) return <Pressable accessibilityRole="button" accessibilityLabel={'View job from ' + job.customerName} onPress={onPress} style={styles.jobCompact}><View style={styles.sectionIcon}><Icon name="briefcase-outline" size={20} /></View><View style={styles.flex}><Text style={styles.cardTitle}>{job.service}</Text><Text style={styles.caption}>{bookingPreference(job)}</Text><Text style={styles.caption}>Client: {job.customerName}</Text><Text style={styles.priceCaption}>{bookingPrice(job)}</Text></View><View style={styles.compactStatus}><Badge status={job.status} /><Icon name="chevron-right" size={18} /></View></Pressable>;
  return <View style={styles.card}><View style={styles.between}><View style={styles.flex}><Text style={styles.sectionTitle}>{job.service}</Text><Text style={styles.body}>Client: {job.customerName}</Text></View><Badge status={job.status} /></View><Text style={styles.requestPrice}>{bookingPrice(job)}</Text><View style={styles.requestMeta}><View style={styles.row}><Icon name="calendar-outline" size={17} /><Text style={[styles.body, styles.flex]}>{bookingPreference(job)}</Text></View><View style={styles.row}><Icon name="map-marker-outline" size={17} /><Text numberOfLines={2} style={[styles.body, styles.flex]}>{job.location}</Text></View></View><Text numberOfLines={2} style={styles.bodyDark}>{job.problem}</Text><View style={styles.actionRow}>{onDecline && <View style={styles.flex}><Btn secondary title="Decline" onPress={onDecline} /></View>}<View style={styles.flex}><Btn title="View Details" onPress={onPress} /></View></View>{job.payment?.status === 'awaiting_confirmation' && <Text style={styles.link}>Payment reported · confirm receipt</Text>}</View>;
}
export default function ProviderDashboard() {
  const {
      user,
      updateUserSession
    } = useAuth(),
    insets = useSafeAreaInsets();
  const [pausing, setPausing] = useState(false),
    [pauseError, setPauseError] = useState('');
  const pauseLock = useRef(false);
  async function toggleRequests() {
    if (pauseLock.current) return;
    pauseLock.current = true;
    setPausing(true);
    setPauseError('');
    try {
      const updated = await authService.updateProfile({
        acceptingRequests: user.providerDetails?.acceptingRequests === false
      });
      await updateUserSession(updated);
    } catch (e) {
      setPauseError(messageFor(e));
    } finally {
      pauseLock.current = false;
      setPausing(false);
    }
  }
  const [alertFilter, setAlertFilter] = useState('All alerts'), [detailAction, setDetailAction] = useState(null);
  const [tab, setTab] = useState('Home'),
    [filter, setFilter] = useState('Active'),
    [query, setQuery] = useState('');
  const [rows, setRows] = useState([]),
    [notifications, setNotifications] = useState([]),
    [slots, setSlots] = useState([]),
    [settings, setSettings] = useState(null);
  const [errors, setErrors] = useState({}),
    [loading, setLoading] = useState(true),
    [detailId, setDetailId] = useState(null);
  const request = useRef(null),
    revision = useRef(0);
  const userId = user?._id || user?.id;
  const load = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const version = revision.current;
    const tasks = [['jobs', () => bookingService.list(controller.signal), setRows], ['alerts', () => bookingService.notifications(controller.signal), setNotifications], ['slots', () => bookingService.availability(userId, controller.signal), result => {
      setSlots(result.slots);
      setSettings({
        durationMinutes: result.durationMinutes,
        bufferMinutes: result.bufferMinutes
      });
    }]];
    return Promise.allSettled(tasks.map(async ([key, read, set]) => {
      try {
        const result = await read();
        if (!controller.signal.aborted && version === revision.current) {
          set(result);
          setErrors(current => ({
            ...current,
            [key]: ''
          }));
        }
      } catch (error) {
        if (!controller.signal.aborted) setErrors(current => ({
          ...current,
          [key]: messageFor(error)
        }));
      }
    })).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
  }, [userId]);
  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(load, 30000);
    return () => {
      request.current?.abort();
      clearInterval(timer);
    };
  }, [load]));
  function updateJob(job) {
    revision.current++;
    setRows(current => current.map(row => row.id === job.id ? job : row));
  }
  function refresh() {
    setLoading(true);
    void load();
  }
  const detail = rows.find(job => job.id === detailId);
  const pending = rows.filter(job => job.status === 'pending').sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const active = rows.filter(job => job.status !== 'pending' && !CLOSED.includes(job.status)).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const today = active.filter(job => dayKey(job.startsAt) === dayKey(new Date()));
  const unread = notifications.filter(n => !n.readAt).length;
  const now = Date.now();
  const received = rows.filter(b => b.payment?.status === 'paid' && b.payment?.paidAt);
  const totalFor = (from, to) => received.filter(b => new Date(b.payment.paidAt).getTime() >= from && new Date(b.payment.paidAt).getTime() < to).reduce((sum, b) => sum + (b.invoice?.totalMinor || 0), 0);
  const weekly = totalFor(now - 7 * 86400000, now + 1), previous = totalFor(now - 14 * 86400000, now - 7 * 86400000);
  const change = previous > 0 ? Math.round((weekly - previous) / previous * 100) : null;
  const outstanding = rows.filter(b => b.invoice && b.payment?.status !== 'paid' && !['cancelled', 'rejected'].includes(b.status)).reduce((sum, b) => sum + b.invoice.totalMinor, 0);
  const online = user.providerDetails?.acceptingRequests !== false;
  const morning = today.filter(b => Number(new Date(new Date(b.startsAt).getTime() + 19800000).toISOString().slice(11, 13)) < 12).length;
  const statsReady = !loading && !errors.jobs;
  const openJobs = (value = 'Active') => { setFilter(value); setQuery(''); setTab('My Jobs'); };
  const search = jobs => jobs.filter(b => `${b.customerName} ${b.service} ${b.problem} ${b.location} ${b.reference}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = tab === 'Available' ? search(pending) : search(rows.filter(b => filter === 'Active' ? b.status !== 'pending' && !CLOSED.includes(b.status) : filter === 'Completed' ? b.status === 'completed' : ['cancelled', 'rejected'].includes(b.status)).sort((a, b) => filter === 'Active' ? new Date(a.startsAt) - new Date(b.startsAt) : new Date(b.startsAt) - new Date(a.startsAt)));
  const filteredNotifications = notifications.filter(n => alertFilter === 'All alerts' || (alertFilter === 'Payments' ? (n.kind || '').includes('payment') : !n.kind.includes('payment')));
  function openJob(id, action = null) { setDetailAction(action); setDetailId(id); }
  async function openNotification(n) {
    try {
      await bookingService.readNotification(n.bookingId, n.id);
      revision.current++;
      setNotifications(all => all.map(item => item.id === n.id ? {
        ...item,
        readAt: new Date().toISOString()
      } : item));
      setErrors(current => ({
        ...current,
        alerts: ''
      }));
      if (!rows.some(b => b.id === n.bookingId)) await load();
      openJob(n.bookingId);
    } catch (error) {
      setErrors(current => ({
        ...current,
        alerts: messageFor(error)
      }));
    }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, {
    paddingTop: tab === "Home" ? 0 : insets.top
  }]}><StatusBar barStyle={tab === "Home" ? "light-content" : "dark-content"} backgroundColor={tab === "Home" ? COLORS.primary : "#F9F8FD"} />
    {tab !== "Home" && <View style={styles.header}><View style={styles.flex}><Text style={styles.eyebrow}>FIXMATE · PROVIDER</Text><Text accessibilityRole="header" style={styles.title}>{tab === 'Home' ? 'Your work, organised' : tab === 'Available' ? 'Available Jobs' : tab === 'Alerts' ? 'Notifications' : tab === 'Availability' ? 'Manage availability' : tab === 'Profile' ? 'Profile & earnings' : tab === 'Messages' ? 'Messages' : 'My Jobs'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unread} unread`} onPress={() => setTab('Alerts')} style={styles.iconButton}><Icon name="bell-outline" />{unread > 0 && <View style={styles.unreadDot} />}</Pressable></View>}
    {tab === 'Messages' ? <MessagesScreen embedded /> : tab === 'Profile' ? <ProfileScreen embedded><ProviderEarnings rows={rows} error={errors.jobs || (loading ? 'Loading earnings…' : '')} /><View style={styles.card}><Text style={styles.sectionTitle}>Services & pricing</Text><Disclosure title="Edit pricing & bank details" subtitle="Published prices, scope and payment instructions" icon="cash-multiple"><PricingEditor /></Disclosure><Btn secondary title="Manage appointment duration & availability" onPress={() => setTab('Availability')} /><Btn secondary title="Customer messages" onPress={() => setTab('Messages')} /></View></ProfileScreen> : <ScrollView key={tab} keyboardShouldPersistTaps="handled" contentContainerStyle={tab === "Home" ? styles.dashboardContent : styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
      {loading && tab !== "Home" && <ActivityIndicator accessibilityLabel="Loading provider workspace" color={COLORS.primary} />}
      {tab === 'Home' && <>
        <View style={[styles.dashboardHero, { paddingTop: insets.top + 24 }]}>
          <View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel="Open provider profile" onPress={() => setTab('Profile')} style={styles.dashboardAvatar}><Text style={styles.dashboardInitials}>{initials(user.name)}</Text></Pressable><View style={styles.flex}><Text style={styles.dashboardGreeting}>Hello, {(user.name || 'there').trim().split(/\s+/)[0]}</Text><Text numberOfLines={2} style={styles.dashboardSubtitle}>{[user.providerDetails?.category, user.providerDetails?.serviceArea].filter(Boolean).join(' · ') || 'Complete your service profile'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={'Notifications, ' + unread + ' unread'} onPress={() => setTab('Alerts')} style={styles.dashboardBell}><Icon name="bell-outline" color="#FFF" size={27} />{unread > 0 && <View style={styles.heroDot} />}</Pressable></View>
          <View style={[styles.between, { marginTop: 28 }]}><View style={styles.flex}><Text style={styles.onlineTitle}>{online ? 'You are online' : 'You are offline'}</Text><Text style={styles.dashboardSubtitle}>{online ? 'Accepting new requests in your areas' : 'New requests paused · existing jobs stay scheduled'}</Text></View><Switch accessibilityLabel="Accept new booking requests" value={online} disabled={pausing} onValueChange={toggleRequests} trackColor={{ false: '#AEA0DF', true: '#BFB0FF' }} thumbColor="#FFF" />{pausing && <ActivityIndicator color="#FFF" />}</View>{!!pauseError && <Text accessibilityRole="alert" style={styles.white}>{pauseError}</Text>}
        </View>
        <View style={styles.dashboardBody}>
          <View style={styles.earningsSummary}><View style={styles.between}><View style={styles.flex}><Text style={styles.dashboardMuted}>Earnings this week</Text><Text style={styles.earningsAmount}>{statsReady ? money(weekly).replace('.00', '') : '—'}</Text></View><View style={styles.tileIcon}><Icon name="wallet-outline" size={25} /></View></View><Text style={[styles.earningsTrend, change !== null && change < 0 && { color: '#B24747' }]}>{!statsReady ? 'Waiting for booking data' : change === null ? 'Confirmed payments · last 7 days' : (change >= 0 ? '↗ +' : '↘ ') + change + '% vs previous 7 days'}</Text><View style={styles.earningsFooter}><View style={styles.flex}><Text style={styles.dashboardMuted}>Awaiting payment</Text><Text style={styles.tileSubtitle}>{statsReady ? money(outstanding) : '—'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="View earnings details" onPress={() => setTab('Profile')} style={styles.dashboardLink}><Text style={styles.link}>Earnings detail</Text><Icon name="arrow-right" size={19} /></Pressable></View></View>
          {loading && <ActivityIndicator accessibilityLabel="Loading provider workspace" color={COLORS.primary} />}{!!errors.jobs && <ErrorCard text={errors.jobs} retry={refresh} />}
          <View style={styles.dashboardGrid}>{[
            { label: "Today's bookings", value: statsReady ? today.length : '—', note: statsReady ? morning + ' in the morning' : 'Loading bookings', icon: 'clock-outline', onPress: () => openJobs() },
            { label: 'Pending requests', value: statsReady ? pending.length : '—', note: 'Awaiting your response', icon: 'bell-outline', color: '#D78A18', background: '#FFF4DC', onPress: () => { setQuery(''); setTab('Available'); } },
            { label: 'Completed jobs', value: statsReady ? rows.filter(b => b.status === 'completed').length : '—', note: 'All time', icon: 'briefcase-outline', onPress: () => openJobs('Completed') },
            { label: 'Average rating', value: user.providerDetails?.rating == null ? 'New' : Number(user.providerDetails.rating).toFixed(1), note: (user.providerDetails?.reviewCount || 0) + ' reviews', icon: 'star-outline', color: '#148565', background: '#DDF5EB', onPress: () => setTab('Profile') }
          ].map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.onPress} style={styles.dashboardTile}><View style={[styles.tileIcon, item.background && { backgroundColor: item.background }]}><Icon name={item.icon} color={item.color || COLORS.primary} size={25} /></View><Text style={styles.tileValue}>{item.value}</Text><Text style={styles.tileLabel}>{item.label}</Text><Text style={styles.tileSubtitle}>{item.note}</Text></Pressable>)}</View>
          <View style={styles.between}><Text style={styles.sectionTitle}>Today’s schedule</Text><Pressable accessibilityRole="button" accessibilityLabel="Open full calendar" onPress={() => setTab('Availability')} style={styles.dashboardLink}><Text style={styles.link}>Full calendar</Text><Icon name="chevron-right" size={19} /></Pressable></View>
          {!errors.jobs && today.map(job => <Pressable key={job.id} accessibilityRole="button" accessibilityLabel={'View job from ' + job.customerName} onPress={() => openJob(job.id)} style={styles.scheduleRow}><View style={styles.scheduleTime}><Text style={styles.scheduleHour}>{bookingTime(job.startsAt).split(' ')[0]}</Text><Text style={styles.tileSubtitle}>{bookingTime(job.startsAt).split(' ')[1]}</Text></View><View style={styles.flex}><Text numberOfLines={2} style={styles.tileLabel}>{job.service}</Text><Text numberOfLines={2} style={styles.scheduleCustomer}>{job.customerName} · {job.reference.slice(-8)}</Text></View><View style={[styles.scheduleBadge, job.status === 'ongoing' && { backgroundColor: '#E3EEFF' }]}><Text style={[styles.scheduleStatus, job.status === 'ongoing' && { color: '#3267B1' }]}>{job.status === 'confirmed' ? 'Upcoming' : LABELS[job.status] || job.status}</Text></View></Pressable>)}
          {!loading && !errors.jobs && !today.length && <Empty icon="calendar-check-outline" title="No appointments today" text="Your accepted appointments will appear here. Publish your available times for customers." action="Manage availability" onPress={() => setTab('Availability')} />}
          <Btn secondary title="View all my jobs" onPress={() => openJobs()} />
        </View>
      </>}
      {['Available', 'My Jobs'].includes(tab) && <>
        <View style={styles.segmented}>{[['Available', 'Requests'], ['My Jobs', 'My Jobs']].map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={'Show ' + label} accessibilityState={{ selected: tab === value }} onPress={() => { setTab(value); setQuery(''); }} style={[styles.segment, tab === value && styles.segmentSelected]}><Text style={[styles.cardTitle, tab === value && styles.link]}>{label}</Text></Pressable>)}</View>
        <Text style={styles.body}>{tab === 'Available' ? 'Requests from customers who selected you. Review the work and appointment before accepting.' : 'Keep customers informed as each job progresses.'}</Text>
        <View style={styles.search}><Icon name="magnify" /><TextInput accessibilityLabel="Search jobs" placeholder="Search customer, service or location" value={query} onChangeText={setQuery} style={styles.searchInput} /></View>
        {tab === 'My Jobs' && <View style={styles.filters}>{['Active', 'Completed', 'Closed'].map(t => <Pressable key={t} accessibilityRole="tab" accessibilityState={{
            selected: filter === t
          }} onPress={() => setFilter(t)} style={[styles.chip, filter === t && styles.selected]}><Text style={filter === t ? styles.white : styles.bodyDark}>{t}</Text></Pressable>)}</View>}
        {!!errors.jobs && <ErrorCard text={errors.jobs} retry={refresh} />}
        {!errors.jobs && visible.map(b => <JobCard key={b.id} job={b} compact={tab === 'My Jobs'} onPress={() => openJob(b.id)} onDecline={tab === 'Available' ? () => openJob(b.id, 'reject') : undefined} />)}
        {!loading && !errors.jobs && !visible.length && <Empty icon="briefcase-search-outline" title={query ? 'No matching jobs' : tab === 'Available' ? 'No available jobs right now' : 'No jobs in this section'} text={query ? 'Try another customer name, service or location.' : tab === 'Available' ? 'New requests will appear here when customers book your published appointments or send preferred-time requests.' : 'Accepted requests appear in Active. Finished jobs and invoices appear in Completed.'} action={query ? 'Clear search' : tab === 'Available' ? 'Manage availability' : 'Browse requests'} onPress={() => query ? setQuery('') : setTab(tab === 'Available' ? 'Availability' : 'Available')} />}
      </>}
      {tab === 'Availability' && <Availability settings={settings} slots={slots} loading={loading} error={errors.slots} reload={load} retry={refresh} />}
      {tab === 'Alerts' && <>
        <Text style={styles.body}>Stay up to date with booking changes, quotes and payments.</Text><View style={styles.filters}>{["All alerts", "Bookings", "Payments"].map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: alertFilter === value }} onPress={() => setAlertFilter(value)} style={[styles.chip, alertFilter === value && styles.selected]}><Text style={alertFilter === value ? styles.white : styles.bodyDark}>{value}</Text></Pressable>)}</View>
        {!!errors.alerts && <ErrorCard text={errors.alerts} retry={refresh} />}
        {!errors.alerts && filteredNotifications.map(n => <Pressable accessibilityRole="button" accessibilityLabel={`${n.readAt ? '' : 'Unread: '}${n.message}, ${n.customerName}`} key={n.id} onPress={() => openNotification(n)} style={[styles.card, !n.readAt && styles.unreadCard]}><View style={styles.row}><View style={styles.avatar}><Icon name={n.kind === 'payment' ? 'cash-check' : n.kind === 'cancel' ? 'calendar-remove-outline' : 'bell-outline'} /></View><View style={styles.flex}><Text style={styles.cardTitle}>{n.message}</Text><Text style={styles.body}>{n.customerName} · {n.service}</Text></View>{!n.readAt && <View style={styles.smallDot} />}</View><Text style={styles.caption}>{bookingWhen(n.createdAt)} · View job →</Text></Pressable>)}
        {!loading && !errors.alerts && !filteredNotifications.length && <Empty icon="bell-check-outline" title="You’re all caught up" text="New booking requests and customer updates will appear here." />}
      </>}
    </ScrollView>}
    <View style={[styles.nav, {
      paddingBottom: Math.max(insets.bottom, 8)
    }]}>{TABS.map(([name, icon]) => <Pressable key={name} accessibilityRole="tab" accessibilityLabel={name === "Home" ? "Dashboard" : name === "Available" ? "Requests" : name === "Availability" ? "Calendar" : name} accessibilityState={{
        selected: tab === name
      }} onPress={() => {
        setTab(name);
        setQuery('');
      }} style={styles.navItem}><Icon name={icon} size={23} color={tab === name ? COLORS.primary : '#9296A6'} /><Text style={[styles.navLabel, tab === name && { color: COLORS.primary, fontWeight: '700' }]}>{name === "Home" ? "Dashboard" : name === "Available" ? "Requests" : name === "Availability" ? "Calendar" : name}</Text>{name === "Available" && pending.length > 0 && <View style={styles.requestBadge}><Text style={styles.requestBadgeText}>{pending.length > 99 ? "99+" : pending.length}</Text></View>}</Pressable>)}</View>
    {detail && <JobDetails key={detail.id} initialConfirmation={detailAction} onMessages={() => { setDetailId(null); setTab('Messages'); }} booking={detail} onClose={() => setDetailId(null)} onUpdate={updateJob} onAccepted={() => {
      setDetailId(null);
      setTab('My Jobs');
      setFilter('Active');
      setQuery('');
    }} />}
  </KeyboardAvoidingView>;
}
function JobDetails({
  booking: b,
  initialConfirmation = null,
  onMessages,
  onClose,
  onUpdate,
  onAccepted
}) {
  const insets = useSafeAreaInsets(),
    [confirmation, setConfirmation] = useState(initialConfirmation),
    [accepted, setAccepted] = useState(false),
    [quote, setQuote] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [date, setDate] = useState(dayKey(b.startsAt)),
    [time, setTime] = useState(new Date(new Date(b.startsAt).getTime() + 19800000).toISOString().slice(11, 16));
  const selectedStart = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(new Date(date + 'T' + time + ':00+05:30').getTime()) && dayKey(new Date(date + 'T' + time + ':00+05:30')) === date ? new Date(date + 'T' + time + ':00+05:30').toISOString() : null;
  const action = b.status === 'confirmed' ? ['start', 'Start job'] : b.status === 'inspection_confirmed' ? ['inspect', 'Mark inspection performed'] : b.status === 'ongoing' ? ['complete', 'Complete job'] : null;
  async function update() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await bookingService.update(b.id, {
        action: confirmation,
        ...(['confirm', 'propose_time'].includes(confirmation) ? {
          startsAt: selectedStart
        } : {})
      });
      onUpdate(result);
      if (confirmation === 'confirm') setAccepted(true);
      setConfirmation(null);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const guidance = {
    awaiting_quote: 'You accepted this request. Send an itemised quote and wait for customer approval before starting work.',
    inspection_confirmed: 'This appointment covers the inspection only. Mark it performed after your visit, then quote separately for repairs.',
    inspecting: 'The inspection is recorded. Send the repair quote for customer approval.',
    quote_pending: 'The customer is reviewing your quote. Work must wait for their decision.',
    confirmed: 'The agreed scope and price are approved. Start the job when work begins.',
    ongoing: 'Work is in progress. Extra work or charges require a revised quote and customer approval.',
    completed: 'The job is complete. Confirm payment only after you receive it.',
    cancelled: 'The customer cancelled this request.',
    rejected: 'You declined this request.'
  };
  return <Modal visible animationType="slide" onRequestClose={() => {
    if (!busy) {
      if (confirmation) setConfirmation(null);else onClose();
    }
  }}><KeyboardAvoidingView style={[styles.screen, {
      paddingTop: insets.top
    }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to provider workspace" disabled={busy} style={styles.iconButton} onPress={onClose}><Icon name="arrow-left" /></Pressable><Text style={[styles.title, styles.flex]}>{accepted ? 'Job accepted' : confirmation === 'propose_time' ? 'Suggest another time?' : confirmation === 'confirm' ? 'Accept job?' : confirmation ? 'Confirm update' : b.status === 'pending' ? 'Job Details' : 'Job Status Details'}</Text></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, {
        paddingBottom: Math.max(insets.bottom, 24)
      }]}>
      {accepted ? <View style={styles.acceptPanel}><View style={styles.successIcon}><Icon name="check" color="#139A72" size={32} /></View><Text style={[styles.sectionTitle, styles.center]}>Job Successfully Accepted!</Text><Text style={[styles.body, styles.center]}>The appointment with {b.customerName} is now in My Jobs.</Text><View style={styles.notice}><Text style={styles.bodyDark}>{b.status === 'awaiting_quote' ? 'Send an itemised quote and wait for approval before starting work.' : b.status === 'inspection_confirmed' ? 'This confirms the inspection visit. Repairs need a separate approved quote.' : 'Review the agreed appointment and keep the customer updated.'}</Text></View><Info label="APPOINTMENT">{bookingPreference(b)}</Info><Btn title="View My Jobs" onPress={onAccepted} /><Btn secondary title="Dismiss" onPress={onClose} /></View> : <>
        <View style={styles.card}><View style={styles.between}><Badge status={b.status} /><Text style={styles.caption}>{b.reference.slice(-8)}</Text></View><Text style={styles.detailService}>{b.service}</Text><Text style={styles.requestPrice}>{bookingPrice(b)}</Text></View>
        <View style={styles.card}><View style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(b.customerName)}</Text></View><View style={styles.flex}><Text style={styles.kicker}>CLIENT</Text><Text style={styles.cardTitle}>{b.customerName}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Customer messages" onPress={onMessages} disabled={busy} style={styles.iconButton}><Icon name="message-outline" size={20} /></Pressable></View><Info label="DATE & TIME · SRI LANKA">{bookingPreference(b)}</Info><Info label="SERVICE LOCATION">{b.location}</Info></View>
        <View style={styles.card}><Text style={styles.kicker}>JOB DESCRIPTION & REQUEST</Text><Text style={styles.bodyDark}>{b.problem}</Text>{!!b.notes && <Info label="ACCESS NOTES">{b.notes}</Info>}</View>
        {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
        {confirmation ? <View style={styles.card}><Text style={styles.sectionTitle}>{confirmation === 'propose_time' ? 'Send time for customer approval' : confirmation === 'confirm' ? 'Confirm this appointment' : confirmation === 'reject' ? 'Decline this request?' : confirmation === 'complete' ? 'Is the agreed work finished?' : confirmation === 'inspect' ? 'Has the inspection been performed?' : 'Ready to begin work?'}</Text><Text style={styles.body}>{confirmation === 'propose_time' ? 'The customer must approve this time. It is not reserved until approval; availability will be checked again.' : confirmation === 'confirm' ? b.pricing?.type === 'inspection' ? 'You are accepting the inspection visit only. Repairs require an approved quote.' : b.quote?.status === 'accepted' ? 'You agree to attend at this time and carry out the approved scope and price.' : 'You are accepting the appointment. Send a quote next; do not start repairs until the customer approves.' : confirmation === 'reject' ? 'This releases the appointment. The customer will see that you declined.' : confirmation === 'complete' ? 'An invoice will be created using the approved quote. Payment remains unpaid until receipt is confirmed.' : confirmation === 'inspect' ? 'Record this only after your inspection. The disclosed inspection fee will apply if the customer declines repairs.' : 'The customer will see the job as in progress.'}</Text>{['confirm', 'propose_time'].includes(confirmation) && selectedStart && <Info label="Selected appointment">{bookingWhen(selectedStart)}</Info>}<Btn title={busy ? 'Saving…' : confirmation === 'confirm' ? 'Confirm acceptance' : 'Confirm update'} disabled={busy} onPress={update} /><Btn secondary title="Go back" disabled={busy} onPress={() => setConfirmation(null)} /></View> : <>
          {guidance[b.status] && <View style={styles.notice}><Text style={styles.bodyDark}>{guidance[b.status]}</Text></View>}
          {['pending', 'time_proposed'].includes(b.status) && <>
            <View style={styles.card}><Text style={styles.sectionTitle}>Agree an appointment</Text><Text style={styles.body}>{b.status === 'time_proposed' ? 'Awaiting the customer’s decision. You can send a new suggestion if needed.' : b.scheduleMode === 'flexible' ? 'Choose a start within the requested window to accept. Anything outside it needs customer approval.' : 'Accept the requested time, or suggest another for customer approval.'}</Text><Text style={styles.caption}>Date (YYYY-MM-DD) · Sri Lanka time</Text><TextInput accessibilityLabel="Job appointment date" value={date} maxLength={10} onChangeText={setDate} style={styles.input} /><View style={styles.filters}>{BOOKING_TIMES.map(t => <Pressable key={t} accessibilityRole="button" accessibilityLabel={'Job time ' + t} accessibilityState={{
                    selected: time === t
                  }} onPress={() => setTime(t)} style={[styles.chip, time === t && styles.selected]}><Text style={time === t ? styles.white : styles.bodyDark}>{t}</Text></Pressable>)}</View><Text style={styles.caption}>{b.durationMinutes || 60} minutes planned + {b.bufferMinutes ?? 30} minutes travel buffer. Conflict checks run when confirming.</Text></View>
            {b.status === 'pending' && <Btn title="Accept job at selected time" disabled={!selectedStart || new Date(selectedStart) <= new Date()} icon="check" onPress={() => setConfirmation('confirm')} />}
            <Btn secondary title="Suggest this time to customer" disabled={!selectedStart || new Date(selectedStart) <= new Date()} onPress={() => setConfirmation('propose_time')} /><Btn danger title="Decline request" onPress={() => setConfirmation('reject')} />
          </>}
          {action && <Btn title={action[1]} onPress={() => setConfirmation(action[0])} />}
          {['awaiting_quote', 'confirmed', 'inspecting', 'ongoing', 'quote_pending'].includes(b.status) && <Btn secondary title="Send / revise itemised quote" onPress={() => setQuote(!quote)} />}
          {quote && <QuoteEditor booking={b} onUpdate={result => {
              onUpdate(result);
              setQuote(false);
            }} onClose={() => setQuote(false)} />}
          <Disclosure title="Quote, invoice & payment" subtitle="Agreed charges and payment confirmation" icon="receipt-text-outline"><BookingCharges booking={b} provider onUpdate={onUpdate} /></Disclosure>
          <View style={styles.card}><Text style={styles.kicker}>WORKFLOW IN PROGRESS</Text><Text style={styles.sectionTitle}>Job activity</Text>{(b.history?.length ? b.history : [{
                status: b.status,
                at: b.updatedAt || b.createdAt
              }]).map((item, i) => <View key={i} style={styles.activity}><Icon name="check-circle-outline" size={18} /><View style={styles.flex}><Text style={styles.bodyDark}>{ACTIVITY[item.action] || LABELS[item.status] || item.status}</Text><Text style={styles.caption}>{item.at ? bookingWhen(item.at) : 'Recorded status'}</Text></View></View>)}</View>
        </>}
      </>}
    </ScrollView>
  </KeyboardAvoidingView></Modal>;
}
function Availability({
  settings,
  slots,
  error,
  loading,
  reload,
  retry
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [date, setDate] = useState(dayKey(new Date())),
    [time, setTime] = useState('08:00'),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [failure, setFailure] = useState(''),
    [remove, setRemove] = useState(null),
    [removeDay, setRemoveDay] = useState(false),
    [pricing, setPricing] = useState(false);
  const lock = useRef(false);
  const [clock, setClock] = useState(() => Date.now());
  useFocusEffect(useCallback(() => { setClock(Date.now()); const timer = setInterval(() => setClock(Date.now()), 30000); return () => clearInterval(timer); }, []));
  const todayKey = dayKey(clock), lastKey = dayKey(clock + 89 * 86400000);
  const [year, monthNumber] = todayKey.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, monthNumber - 1 + monthOffset, 1));
  const monthKey = monthStart.toISOString().slice(0, 7);
  const lastMonth = new Date(lastKey + 'T00:00:00Z');
  const maxMonthOffset = (lastMonth.getUTCFullYear() - year) * 12 + lastMonth.getUTCMonth() - (monthNumber - 1);
  const leading = (monthStart.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber + monthOffset, 0)).getUTCDate();
  const calendarCells = Array.from({ length: Math.ceil((leading + daysInMonth) / 7) * 7 }, (_, i) => i < leading || i >= leading + daysInMonth ? null : monthKey + '-' + String(i - leading + 1).padStart(2, '0'));
  const monthSlots = slots.filter(slot => slot.date.startsWith(monthKey));
  const startValue = new Date(date + 'T' + time + ':00+05:30');
  const validStart = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(startValue.getTime()) && dayKey(startValue) === date && startValue.getTime() > clock && startValue.getTime() < clock + 90 * 86400000;
  function chooseDay(value) { setDate(value); setRemoveDay(false); setRemove(null); setMessage(''); setFailure(''); }
  const published = slots.filter(slot => slot.date === date);
  async function save(removing = false) {
    if (lock.current) return;
    const start = removing ? new Date(remove) : new Date(`${date}T${time}:00+05:30`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(start.getTime()) || !removing && dayKey(start) !== date || start <= new Date()) {
      setFailure('Choose a valid future date and time.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setFailure('');
    setMessage('');
    try {
      if (removing) await bookingService.removeSlot(start.toISOString());else await bookingService.publishSlot(start.toISOString());
      setRemove(null);
      setMessage(removing ? 'Appointment removed.' : 'Appointment published. Customers can now request it.');
      await reload();
    } catch (e) {
      setFailure(messageFor(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <>
    <View style={styles.notice}><Text style={styles.bodyDark}>Publish the times you can attend. All appointments use Sri Lanka time. Booked appointments cannot be removed.</Text></View>
    {error ? <Empty icon="cloud-alert-outline" title="Availability couldn’t load" text={error} action="Try again" onPress={retry} /> : <>
      <View style={styles.card}><View style={styles.between}><Text style={styles.sectionTitle}>{bookingDate(monthKey + '-01T12:00:00+05:30', { day: undefined, month: 'long', year: 'numeric' })}</Text><View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={monthOffset === 0 || busy} style={[styles.calendarArrow, monthOffset === 0 && styles.disabled]} onPress={() => setMonthOffset(monthOffset - 1)}><Icon name="chevron-left" size={20} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={monthOffset >= maxMonthOffset || busy} style={[styles.calendarArrow, monthOffset >= maxMonthOffset && styles.disabled]} onPress={() => setMonthOffset(monthOffset + 1)}><Icon name="chevron-right" size={20} /></Pressable></View></View><View style={styles.calendarGrid}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => <View key={i} style={styles.calendarCell}><Text style={styles.caption}>{label}</Text></View>)}{calendarCells.map((key, i) => { const disabled = !key || key < todayKey || key > lastKey || busy; const open = slots.some(slot => slot.date === key && slot.available), reserved = slots.some(slot => slot.date === key && !slot.available); return <View key={key || 'empty-' + i} style={styles.calendarCell}>{key && <Pressable accessibilityRole="button" accessibilityLabel={bookingDate(key + 'T12:00:00+05:30', { weekday: 'long', month: 'long' }) + (open ? ', available appointments' : reserved ? ', reserved appointments' : ', no published appointments')} accessibilityState={{ selected: date === key, disabled }} disabled={disabled} onPress={() => chooseDay(key)} style={[styles.calendarDate, open && styles.calendarOpen, reserved && !open && styles.calendarReserved, date === key && styles.selected, disabled && styles.disabled]}><Text style={[styles.bodyDark, date === key && styles.white]}>{Number(key.slice(-2))}</Text>{(open || reserved) && <View style={[styles.calendarDot, { backgroundColor: date === key ? '#FFF' : open ? COLORS.primary : '#139A72' }]} />}</Pressable>}</View>; })}</View><View style={styles.legendRow}>{[['Available', COLORS.primary], ['Reserved', '#139A72'], ['No slots', '#CCD0DB']].map(([label, color]) => <View key={label} style={styles.row}><View style={[styles.calendarDot, { backgroundColor: color }]} /><Text style={styles.caption}>{label}</Text></View>)}</View></View>
      <View style={styles.card}><Text style={styles.kicker}>MONTHLY AVAILABILITY</Text><View style={styles.stats}><View style={styles.flex}><Text style={styles.caption}>PUBLISHED STARTS</Text><Text style={styles.statValue}>{monthSlots.length} slots</Text></View><View style={styles.flex}><Text style={styles.caption}>RESERVED STARTS</Text><Text style={[styles.statValue, { color: '#139A72' }]}>{monthSlots.filter(slot => !slot.available).length} reserved</Text></View></View></View>
      <View style={styles.card}><View style={styles.row}><View style={styles.sectionIcon}><Icon name="calendar-plus" size={21} /></View><View style={styles.flex}><Text style={styles.sectionTitle}>Configure appointment</Text><Text style={styles.caption}>Publish a start time customers can request</Text></View></View><Text style={styles.caption}>Date (YYYY-MM-DD), within the next 90 days</Text><TextInput accessibilityLabel="Appointment date YYYY-MM-DD" value={date} maxLength={10} onChangeText={value => {
          setDate(value);
          setRemoveDay(false);
          setFailure('');
          setMessage('');
          setRemove(null);
        }} style={styles.input} /><Text style={styles.caption}>Start time · Sri Lanka</Text><View style={styles.filters}>{BOOKING_TIMES.map(t => <Pressable accessibilityRole="button" accessibilityState={{
            selected: time === t
          }} key={t} onPress={() => {
            setTime(t);
            setFailure('');
            setMessage('');
          }} style={[styles.chip, time === t && styles.selected]}><Text style={time === t ? styles.white : styles.bodyDark}>{t}</Text></Pressable>)}</View>{!validStart && <View style={styles.validation}><Icon name="alert-circle-outline" color="#B34550" size={18} /><Text accessibilityRole="alert" style={[styles.errorText, styles.flex]}>Select a future appointment within the next 90 days.</Text></View>}<Btn title={busy ? 'Saving…' : 'Publish appointment'} disabled={busy || loading || !validStart} onPress={() => save()} /></View>
      {!!failure && <Text accessibilityRole="alert" style={styles.errorText}>{failure}</Text>}{!!message && <Text accessibilityRole="alert" style={styles.link}>{message}</Text>}
      <View style={styles.card}><Text style={styles.sectionTitle}>Clear open times for this day</Text><Text style={styles.body}>Removes the selected day’s unreserved appointments. Existing jobs and travel buffers remain protected.</Text><Btn secondary title="Remove this day's open appointments" disabled={busy || loading || !published.some(slot => slot.available)} onPress={() => setRemoveDay(true)} />{removeDay && <><Btn danger title="Confirm remove open times" disabled={busy} onPress={async () => {
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setFailure('');
            try {
              const result = await bookingService.removeDay(date);
              setMessage(result.message);
              setRemoveDay(false);
              await reload();
            } catch (e) {
              setFailure(messageFor(e));
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }} /><Btn secondary title="Keep these times" disabled={busy} onPress={() => setRemoveDay(false)} /></>}</View>
      <Text style={styles.sectionTitle}>Published times · {date}</Text>{!published.length && !loading && <Empty icon="calendar-blank-outline" title="No appointments published" text="Add a time above to let customers book this day." />}
      {published.map(slot => <View key={slot.startsAt} style={styles.card}><View style={styles.between}><View><Text style={styles.cardTitle}>{bookingTime(slot.startsAt)}</Text><Text style={styles.body}>{slot.available ? 'Available to customers' : 'Reserved by a booking'}</Text></View>{slot.available ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${bookingTime(slot.startsAt)}`} disabled={busy} style={styles.iconButton} onPress={() => setRemove(slot.startsAt)}><Icon name="trash-can-outline" color="#A52737" /></Pressable> : <Icon name="lock-outline" />}</View>{remove === slot.startsAt && <><Text style={styles.body}>Remove this appointment from customer availability?</Text><Btn danger title="Confirm removal" disabled={busy} onPress={() => save(true)} /><Btn secondary title="Keep appointment" disabled={busy} onPress={() => setRemove(null)} /></>}</View>)}
    </>}
    <Disclosure title="Appointment planning" subtitle="Service duration and travel buffer" icon="clock-outline"><ScheduleSettings settings={settings} reload={reload} /></Disclosure><View style={styles.card}><Text style={styles.sectionTitle}>Service pricing</Text><Text style={styles.body}>Set the price customers see before booking and your optional bank transfer details.</Text><Btn secondary title={pricing ? 'Hide pricing settings' : 'Edit pricing & bank details'} onPress={() => setPricing(!pricing)} />{pricing && <PricingEditor />}</View>
  </>;
}
const styles = StyleSheet.create({
  kicker: { color: '#7B8498', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  detailService: { color: '#20283D', fontSize: 21, lineHeight: 28, fontWeight: '700' },
  sectionIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center' },
  disclosureBody: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EDF6', gap: 14 },
  requestPrice: { color: COLORS.primary, fontSize: 17, fontWeight: '700', lineHeight: 25 },
  requestMeta: { gap: 8, borderTopWidth: 1, borderTopColor: '#F0EDF6', paddingTop: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  jobCompact: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ECECF4', borderRadius: 12, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  compactStatus: { maxWidth: 96, alignItems: 'flex-end', gap: 12 },
  priceCaption: { color: COLORS.primary, fontSize: 12, fontWeight: '600', marginTop: 8 },
  segmented: { flexDirection: 'row', padding: 4, backgroundColor: '#EEEAF7', borderRadius: 12, gap: 4 },
  segment: { flex: 1, minHeight: 44, padding: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  segmentSelected: { backgroundColor: '#FFF', boxShadow: '0px 1px 3px rgba(25,30,50,0.08)' },
  acceptPanel: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#E9E6F2', padding: 24, gap: 20, marginTop: 32, boxShadow: '0px 8px 30px rgba(40,35,70,0.10)' },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E5F6EE', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.2857%', minHeight: 43, alignItems: 'center', justifyContent: 'center' },
  calendarDate: { minWidth: 34, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 3 },
  calendarOpen: { backgroundColor: '#F1ECFF' },
  calendarReserved: { backgroundColor: '#E7F8F0' },
  calendarDot: { width: 5, height: 5, borderRadius: 3 },
  calendarArrow: { width: 40, height: 40, borderWidth: 1, borderColor: '#E5E3F0', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EDF6' },
  validation: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#F4DADA', borderRadius: 10 },
  formField: { gap: 4, marginTop: 14 },
  fieldLabel: { color: '#354059', fontSize: 12, fontWeight: '600' },

  dashboardContent: { paddingBottom: 28, width: '100%', maxWidth: 760, alignSelf: 'center' },
  dashboardHero: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 76 },
  dashboardAvatar: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  dashboardInitials: { color: COLORS.primary, fontSize: 21, fontWeight: '800' },
  dashboardGreeting: { color: '#FFF', fontSize: 23, fontWeight: '750' },
  dashboardSubtitle: { color: '#F0EAFF', fontSize: 12, lineHeight: 19, marginTop: 4 },
  dashboardBell: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  heroDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#FFF', borderRadius: 4 },
  onlineTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  dashboardBody: { paddingHorizontal: 20, gap: 18 },
  earningsSummary: { marginTop: -42, padding: 20, borderRadius: 25, backgroundColor: '#FFF', boxShadow: '0px 2px 4px rgba(20,20,30,0.12)' },
  dashboardMuted: { color: '#78838A', fontSize: 13, lineHeight: 20 },
  earningsAmount: { fontSize: 30, fontWeight: '800', color: '#292C2C', marginTop: 5 },
  earningsTrend: { color: '#148565', fontSize: 12, fontWeight: '700', marginTop: 14 },
  earningsFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#F3F3F5', paddingTop: 15, marginTop: 20 },
  dashboardLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  dashboardTile: { width: '47.5%', backgroundColor: '#FFF', borderRadius: 25, padding: 18, minHeight: 174, boxShadow: '0px 2px 4px rgba(20,20,30,0.12)' },
  tileIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#EFEAFB', alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 31, fontWeight: '800', color: '#292C2C', marginTop: 19, marginBottom: 6 },
  tileLabel: { fontSize: 14, fontWeight: '700', color: '#292C2C', lineHeight: 20 },
  tileSubtitle: { fontSize: 12, color: '#78838A', lineHeight: 19, marginTop: 3 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#FFF', borderRadius: 23, minHeight: 84, boxShadow: '0px 2px 4px rgba(20,20,30,0.12)' },
  scheduleTime: { width: 52, borderRightWidth: 1, borderRightColor: '#F0F0F2', paddingRight: 10 },
  scheduleHour: { fontSize: 16, fontWeight: '750', color: '#292C2C' },
  scheduleCustomer: { fontSize: 11, color: '#78838A', lineHeight: 17, marginTop: 6 },
  scheduleBadge: { backgroundColor: '#EEE8FC', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6, maxWidth: 85, alignSelf: 'flex-start' },
  scheduleStatus: { fontSize: 9, fontWeight: '700', color: COLORS.primary },
  requestBadge: { position: 'absolute', top: 0, right: '18%', minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  requestBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },

  screen: {
    flex: 1,
    backgroundColor: '#F9F8FD'
  },
  header: {
    padding: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center'
  },
  content: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexGrow: 1
  },
  flex: {
    flex: 1,
    minWidth: 0
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '700',
    marginBottom: 6
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  body: {
    color: '#716E7F',
    fontSize: 13,
    lineHeight: 20
  },
  bodyDark: {
    color: '#30303A',
    fontSize: 14,
    lineHeight: 21
  },
  caption: {
    color: '#797586',
    fontSize: 11,
    lineHeight: 17
  },
  center: {
    textAlign: 'center'
  },
  link: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  white: {
    color: '#FFF'
  },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECECF4',
    borderRadius: 14,
    padding: 18,
    gap: 12,
    boxShadow: '0px 3px 14px rgba(39,39,39,0.05)'
  },
  cardFoot: {
    borderTopWidth: 1,
    borderTopColor: '#F0EDF6',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 44,
    height: 44,
    backgroundColor: '#EEE8FF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  badge: {
    backgroundColor: '#EEE8FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  badgeText: {
    color: '#6853A1',
    fontSize: 10,
    fontWeight: '600'
  },
  neutralBadge: {
    backgroundColor: '#F0F1F5'
  },
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 22,
    gap: 12
  },
  heroEyebrow: {
    color: '#DBD2FF',
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '600'
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 25,
    fontWeight: '700'
  },
  heroBody: {
    color: '#EEE8FF',
    lineHeight: 21,
    fontSize: 14
  },
  stats: {
    flexDirection: 'row',
    gap: 8
  },
  stat: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '700'
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    padding: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1
  },
  secondary: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8DFFC'
  },
  danger: {
    backgroundColor: '#FDECEE'
  },
  disabled: {
    opacity: 0.45
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F0ECF8'
  },
  empty: {
    padding: 26,
    backgroundColor: '#FFF',
    borderRadius: 18,
    gap: 14,
    alignItems: 'center'
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F2EDFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  error: {
    padding: 18,
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#FDECEE'
  },
  errorText: {
    color: '#A52737',
    fontSize: 13,
    lineHeight: 20
  },
  notice: {
    backgroundColor: '#F0EBFC',
    padding: 16,
    borderRadius: 14
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAE5F3'
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 13,
    color: '#303030',
    minWidth: 0
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAE5F3',
    borderRadius: 20,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  nav: {
    borderTopWidth: 1,
    borderTopColor: '#EFEBF6',
    paddingTop: 8,
    flexDirection: 'row',
    backgroundColor: '#FFF'
  },
  navItem: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  navLabel: {
    fontSize: 10,
    color: '#9296A6'
  },
  unreadDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF786A',
    top: 7,
    right: 10
  },
  smallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: '#DCD0FF'
  },
  info: {
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EFF6'
  },
  activity: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EFF6'
  },
  dateRail: {
    gap: 8
  },
  day: {
    minWidth: 60,
    minHeight: 94,
    borderRadius: 16,
    padding: 10,
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAE5F3'
  },
  input: {
    borderWidth: 1,
    borderColor: '#EAE5F3',
    borderRadius: 10,
    padding: 14,
    minHeight: 48,
    backgroundColor: '#FFF',
    color: '#303030'
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12
  }
});
const fieldStyle = {
  borderWidth: 1,
  borderColor: '#DAD6E8',
  backgroundColor: '#FFF',
  borderRadius: 10,
  padding: 12,
  marginVertical: 6,
  color: '#272727'
};
function ScheduleSettings({
  settings,
  reload
}) {
  const [editing, setEditing] = useState(false),
    [duration, setDuration] = useState(''),
    [buffer, setBuffer] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    if (!/^\d+$/.test(duration) || !/^\d+$/.test(buffer) || +duration < 30 || +duration > 480 || +buffer > 120) {
      setMessage('Use 30–480 minutes for duration and 0–120 for travel.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await bookingService.saveScheduleSettings({
        durationMinutes: +duration,
        bufferMinutes: +buffer
      });
      await reload();
      setEditing(false);
      setMessage('Saved for new requests. Existing appointments keep their reserved duration.');
    } catch (e) {
      setMessage(messageFor(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <View style={styles.card}><Text style={styles.sectionTitle}>Appointment planning</Text><Text style={styles.body}>{settings?.durationMinutes ?? 60} minutes for service + {settings?.bufferMinutes ?? 30} minutes for travel. These planning estimates prevent overlapping bookings; they are not a promised completion time.</Text><Btn secondary title={editing ? 'Close planning settings' : 'Edit duration & travel buffer'} disabled={!settings || busy} onPress={() => {
      setEditing(!editing);
      setDuration(String(settings.durationMinutes));
      setBuffer(String(settings.bufferMinutes));
      setMessage('');
    }} />{editing && <><Text style={styles.caption}>Service duration (minutes)</Text><TextInput accessibilityLabel="Service duration minutes" keyboardType="number-pad" value={duration} onChangeText={setDuration} style={styles.input} /><Text style={styles.caption}>Travel buffer after appointment (minutes)</Text><TextInput accessibilityLabel="Travel buffer minutes" keyboardType="number-pad" value={buffer} onChangeText={setBuffer} style={styles.input} /><Btn title={busy ? 'Saving…' : 'Save planning settings'} disabled={busy} onPress={save} /></>}{!!message && <Text accessibilityRole="alert" style={styles.body}>{message}</Text>}</View>;
}
function Action({
  label,
  onPress,
  disabled
}) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={{
    padding: 14,
    borderRadius: 10,
    backgroundColor: disabled ? '#AAA' : COLORS.primary,
    marginVertical: 6
  }}><Text style={{
      color: '#FFF',
      textAlign: 'center'
    }}>{label}</Text></TouchableOpacity>;
}
function PricingEditor() {
  const [type, setType] = useState('fixed'),
    [amount, setAmount] = useState(''),
    [min, setMin] = useState(''),
    [max, setMax] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [inclusions, setInclusions] = useState(''),
    [exclusions, setExclusions] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState('');
  const pricingRequest = useRef(null);
  const loadPricing = useCallback(() => {
    pricingRequest.current?.abort();
    const controller = new AbortController();
    pricingRequest.current = controller;
    return bookingService.pricing(controller.signal).then(p => {
      if (controller.signal.aborted) return;
      if (p) {
        setBankDetails(p.bankDetails || '');
        setType(p.type);
        setAmount(String((p.amountMinor ?? p.inspectionFeeMinor ?? 0) / 100));
        setMin(String((p.minMinor || 0) / 100));
        setMax(String((p.maxMinor || 0) / 100));
        setInclusions(p.inclusions);
        setExclusions(p.exclusions);
      }
      setReady(true);
      setLoadError('');
    }).catch(e => {
      if (!controller.signal.aborted) setLoadError(messageFor(e));
    });
  }, []);
  useFocusEffect(useCallback(() => {
    void loadPricing();
    return () => pricingRequest.current?.abort();
  }, [loadPricing]));
  async function save() {
    if (lock.current) return;
    if (!inclusions.trim() || (type === 'estimate' ? !min.trim() || !max.trim() : !amount.trim())) {
      setMessage('Enter the price and included scope.');
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await bookingService.savePricing({
        bankDetails,
        type,
        amount: Number(amount),
        inspectionFee: Number(amount),
        min: Number(min),
        max: Number(max),
        inclusions,
        exclusions
      });
      setMessage('Pricing published. Existing bookings keep their agreed pricing.');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Could not save pricing.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!ready) return loadError ? <ErrorCard text={loadError} retry={loadPricing} /> : <ActivityIndicator accessibilityLabel="Loading pricing" color={COLORS.primary} />;
  return <View style={{
    marginBottom: 24
  }}><Text style={styles.infoCardTitle}>Service pricing</Text><Text>Publish pricing before customers book. Include every mandatory charge in the total.</Text><View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6
    }}>{['fixed', 'estimate', 'inspection'].map(t => <TouchableOpacity key={t} accessibilityRole="button" accessibilityState={{
        selected: type === t
      }} onPress={() => setType(t)} style={{
        padding: 12,
        backgroundColor: type === t ? '#E8DEFF' : '#FFF',
        borderRadius: 8
      }}><Text>{t === 'fixed' ? 'Fixed price' : t === 'estimate' ? 'Estimated range' : 'Inspection fee'}</Text></TouchableOpacity>)}</View>{type === 'estimate' ? <><View style={styles.formField}><Text style={styles.fieldLabel}>Minimum estimate (LKR)</Text><TextInput accessibilityLabel="Minimum estimate LKR" placeholder="Minimum estimate (LKR)" keyboardType="decimal-pad" value={min} onChangeText={setMin} style={fieldStyle} /></View><View style={styles.formField}><Text style={styles.fieldLabel}>Maximum estimate (LKR)</Text><TextInput accessibilityLabel="Maximum estimate LKR" placeholder="Maximum estimate (LKR)" keyboardType="decimal-pad" value={max} onChangeText={setMax} style={fieldStyle} /></View></> : <View style={styles.formField}><Text style={styles.fieldLabel}>Price / inspection fee (LKR)</Text><TextInput accessibilityLabel="Price LKR" placeholder={type === 'fixed' ? 'Fixed total (LKR)' : 'Inspection fee (LKR)'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={fieldStyle} /></View>}<View style={styles.formField}><Text style={styles.fieldLabel}>Included scope</Text><TextInput accessibilityLabel="Included scope" placeholder="What is included?" multiline maxLength={1000} value={inclusions} onChangeText={setInclusions} style={fieldStyle} /></View><View style={styles.formField}><Text style={styles.fieldLabel}>Excluded work (optional)</Text><TextInput accessibilityLabel="Excluded work" placeholder="What is excluded? (optional)" multiline maxLength={1000} value={exclusions} onChangeText={setExclusions} style={fieldStyle} /></View><View style={styles.formField}><Text style={styles.fieldLabel}>Bank transfer instructions (optional)</Text><TextInput accessibilityLabel="Bank transfer instructions" placeholder="Bank name, branch, account holder and account number (optional; shown only to booked customers)" multiline maxLength={1000} value={bankDetails} onChangeText={setBankDetails} style={fieldStyle} /></View><Action label={busy ? 'Saving…' : 'Publish pricing'} disabled={busy} onPress={save} />{!!message && <Text accessibilityRole="alert">{message}</Text>}</View>;
}
function QuoteEditor({
  booking,
  onUpdate,
  onClose
}) {
  const [scope, setScope] = useState(booking.quote?.scope || booking.problem),
    [items, setItems] = useState([{
      description: 'Labour',
      amount: ''
    }]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  async function send() {
    if (lock.current) return;
    if (items.some(item => !item.amount.trim())) {
      setError('Enter an amount for every item.');
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      onUpdate(await bookingService.update(booking.id, {
        action: 'quote',
        scope,
        items: items.map(item => ({
          ...item,
          amount: Number(item.amount)
        }))
      }));
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to send quote.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <View style={{
    padding: 12,
    backgroundColor: '#F3EEFF',
    borderRadius: 12
  }}><Text style={styles.infoCardTitle}>Itemised quote</Text><Text>Enter the complete replacement total, not just the extra charge. Include labour, materials and any taxes. Work pauses until the customer decides.</Text>{booking.inspectionPerformed && <Text>The agreed inspection fee of {money(booking.pricing?.inspectionFeeMinor)} is added automatically. Do not add it again.</Text>}<TextInput accessibilityLabel="Quote scope" value={scope} onChangeText={setScope} maxLength={2000} multiline style={fieldStyle} />{items.map((item, i) => <View key={i}><TextInput accessibilityLabel={'Charge description ' + (i + 1)} placeholder="Charge description" value={item.description} maxLength={200} onChangeText={description => setItems(rows => rows.map((row, n) => n === i ? {
        ...row,
        description
      } : row))} style={fieldStyle} /><TextInput accessibilityLabel={'Charge amount ' + (i + 1)} placeholder="Amount (LKR)" keyboardType="decimal-pad" value={item.amount} onChangeText={amount => setItems(rows => rows.map((row, n) => n === i ? {
        ...row,
        amount
      } : row))} style={fieldStyle} />{items.length > 1 && <Action label="Remove charge" onPress={() => setItems(rows => rows.filter((_, n) => n !== i))} />}</View>)}<Action label="Add charge" disabled={items.length >= 20 || busy} onPress={() => setItems([...items, {
      description: '',
      amount: ''
    }])} /><Action label={busy ? 'Sending…' : 'Send quote for approval'} disabled={busy} onPress={send} /><Action label="Close quote editor" disabled={busy} onPress={onClose} />{!!error && <Text accessibilityRole="alert">{error}</Text>}</View>;
}
function ProviderEarnings({
  rows,
  error
}) {
  const now = new Date(),
    todayKey = dayKey(now),
    month = todayKey.slice(0, 7),
    start = now.getTime() - 7 * 86400000;
  const paid = rows.filter(b => b.payment?.status === 'paid');
  const receivedAt = b => b.payment?.paidAt || b.updatedAt;
  const monthly = paid.filter(b => receivedAt(b) && dayKey(receivedAt(b)).startsWith(month));
  const weekly = paid.filter(b => receivedAt(b) && new Date(receivedAt(b)).getTime() >= start);
  const pending = rows.filter(b => b.invoice && b.payment?.status !== 'paid' && !['cancelled', 'rejected'].includes(b.status));
  const total = list => list.reduce((n, b) => n + (b.invoice?.totalMinor || 0), 0);
  const buckets = [0, 1, 2, 3, 4].map(i => total(monthly.filter(b => Math.floor((Number(dayKey(receivedAt(b)).slice(8)) - 1) / 7) === i)));
  return <View style={styles.card}><Text style={styles.sectionTitle}>Earnings & payments</Text>{error ? <Text style={styles.errorText}>{error}</Text> : <><Info label="Received this week · last 7 days">{money(total(weekly))}</Info><Info label="Received this month">{money(total(monthly))}</Info><Info label="Outstanding invoices · collected directly">{money(total(pending))}</Info><Text style={styles.caption}>Cash and bank transfers appear as received only after you confirm receipt. FixMate does not hold funds or issue payouts.</Text><View style={[styles.stats, {
        alignItems: 'flex-end',
        minHeight: 120
      }]}>{buckets.map((value, i) => <View key={i} style={{
          flex: 1,
          alignItems: 'center',
          gap: 6
        }}><Text style={styles.caption}>{money(value)}</Text><View style={{
            height: Math.max(8, 80 * value / Math.max(1, ...buckets)),
            width: '70%',
            backgroundColor: COLORS.primary,
            borderRadius: 8
          }} /><Text style={styles.caption}>W{i + 1}</Text></View>)}</View><Info label="Completed jobs">{rows.filter(b => b.status === 'completed').length}</Info><Text style={styles.sectionTitle}>Transaction history</Text>{!paid.length && <Text style={styles.body}>No confirmed payments yet.</Text>}{paid.map(b => <View key={b.id} style={styles.info}><Text style={styles.bodyDark}>{b.customerName} · {b.service}</Text><Text style={styles.link}>{money(b.invoice?.totalMinor)} · {b.payment?.method || 'Direct payment'}</Text><Text style={styles.caption}>{receivedAt(b) ? bookingWhen(receivedAt(b)) : 'Payment confirmed'}</Text></View>)}</>}</View>;
}
