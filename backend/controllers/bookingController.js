const TIMES = ['08:00', '10:30', '12:00', '14:00', '16:30', '18:00'];
const APPROVED = { role: 'provider', isVerified: true, isApprovedByAdmin: true, 'providerDetails.approvalStatus': 'approved' };
const idOK = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const textOK = (value, max, required = true) => typeof value === 'string' && value.trim().length <= max && (!required || value.trim().length > 0);
const dayKey = date => new Date(new Date(date).getTime() + 19800000).toISOString().slice(0, 10);
function validSlot(value, now = Date.now()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/.test(value)) return false;
  const date = new Date(value), stamp = date.getTime();
  return Number.isFinite(stamp) && date.toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z') && stamp > now && stamp < now + 90 * 86400000 && TIMES.includes(new Date(stamp + 19800000).toISOString().slice(11, 16));
}
function dto(b) {
  return { id: String(b._id), reference: `FM-${new Date(b.createdAt).getUTCFullYear()}-${String(b._id).toUpperCase()}`, providerId: String(b.provider), providerName: b.providerName, customerName: b.customerName, service: b.service, startsAt: b.startsAt, problem: b.problem, location: b.location, notes: b.notes, price: b.price, priceUnit: b.priceUnit, status: b.status, createdAt: b.createdAt };
}
function createBookingController(Booking, User) {
  const approvedProvider = id => User.findOne({ _id: id, ...APPROVED }).select('name providerDetails.category providerDetails.price providerDetails.priceUnit providerDetails.bookingSlots').lean();
  const ownProvider = req => req.user.role === 'provider' && req.user.isVerified && req.user.isApprovedByAdmin && req.user.providerDetails?.approvalStatus === 'approved';
  const handle = fn => async (req, res) => { try { await fn(req, res); } catch (error) { if (error.code === 11000) return res.status(409).json({ message: 'That appointment is no longer available. Please choose another time.' }); return res.status(503).json({ message: 'Booking service is temporarily unavailable. Please try again.' }); } };
  return {
    availability: handle(async (req, res) => {
      if (!idOK(req.params.providerId)) return res.status(400).json({ message: 'Invalid provider.' });
      const p = await approvedProvider(req.params.providerId);
      if (!p) return res.status(404).json({ message: 'This provider is no longer available.' });
      const now = Date.now();
      const slots = (p.providerDetails?.bookingSlots || []).filter(s => new Date(s).getTime() > now && new Date(s).getTime() < now + 90 * 86400000);
      const reservations = await Booking.find({ provider: p._id, slotKey: { $exists: true }, startsAt: { $in: slots } }).select('startsAt').lean();
      const busy = new Set(reservations.map(b => new Date(b.startsAt).toISOString()));
      res.json({ timezone: 'Asia/Colombo', slots: slots.map(s => ({ startsAt: new Date(s).toISOString(), date: dayKey(s), available: !busy.has(new Date(s).toISOString()) })).sort((a, b) => a.startsAt.localeCompare(b.startsAt)) });
    }),
    create: handle(async (req, res) => {
      const { providerId, startsAt, problem, location, notes = '', requestId } = req.body || {};
      if (!idOK(providerId) || !textOK(requestId, 100) || !textOK(problem, 2000) || !textOK(location, 500) || !textOK(notes, 1000, false)) return res.status(400).json({ message: 'Enter a valid provider, problem description and service location.' });
      const existing = await Booking.findOne({ customer: req.user._id, requestId });
      if (existing) return res.json({ booking: dto(existing) });
      if (!validSlot(startsAt)) return res.status(400).json({ message: 'Choose a future appointment within the next 90 days.' });
      const p = await approvedProvider(providerId);
      if (!p) return res.status(404).json({ message: 'This provider is no longer available.' });
      if (!(p.providerDetails.bookingSlots || []).some(s => new Date(s).getTime() === new Date(startsAt).getTime())) return res.status(409).json({ message: 'The provider has not published this appointment.' });
      let booking;
      try { booking = await Booking.create({ customer: req.user._id, customerName: req.user.name, provider: p._id, providerName: p.name, service: p.providerDetails.category || 'Service', startsAt, problem: problem.trim(), location: location.trim(), notes: notes.trim(), price: p.providerDetails.price ?? null, priceUnit: p.providerDetails.priceUnit || 'visit', requestId, slotKey: `${p._id}:${new Date(startsAt).toISOString()}` }); }
      catch (error) { if (error.code === 11000) { const replay = await Booking.findOne({ customer: req.user._id, requestId }); if (replay) return res.json({ booking: dto(replay) }); } throw error; }
      res.status(201).json({ booking: dto(booking) });
    }),
    list: handle(async (req, res) => {
      const query = req.user.role === 'provider' ? { provider: req.user._id } : { customer: req.user._id };
      const bookings = await Booking.find(query).sort({ startsAt: -1 }).lean();
      res.json({ bookings: bookings.map(dto) });
    }),
    update: handle(async (req, res) => {
      if (!idOK(req.params.id)) return res.status(400).json({ message: 'Invalid booking.' });
      const isProvider = req.user.role === 'provider';
      if (isProvider && !ownProvider(req)) return res.status(403).json({ message: 'Provider approval is required.' });
      const owner = isProvider ? { provider: req.user._id } : { customer: req.user._id };
      const booking = await Booking.findOne({ _id: req.params.id, ...owner });
      if (!booking) return res.status(404).json({ message: 'Booking not found.' });
      const { action, startsAt } = req.body || {};
      let nextStatus, update;
      if (!isProvider && action === 'reschedule' && ['pending', 'confirmed'].includes(booking.status) && new Date(booking.startsAt) > new Date()) {
        if (!validSlot(startsAt)) return res.status(400).json({ message: 'Choose a valid future appointment.' });
        const p = await approvedProvider(booking.provider);
        if (!p || !(p.providerDetails.bookingSlots || []).some(s => new Date(s).getTime() === new Date(startsAt).getTime())) return res.status(409).json({ message: 'That appointment is not published.' });
        const { problem = booking.problem, location = booking.location, notes = booking.notes } = req.body || {};
        if (!textOK(problem, 2000) || !textOK(location, 500) || !textOK(notes, 1000, false)) return res.status(400).json({ message: 'Enter a valid problem description and service location.' });
        nextStatus = 'pending'; update = { $set: { startsAt, status: nextStatus, problem: problem.trim(), location: location.trim(), notes: notes.trim(), slotKey: `${booking.provider}:${new Date(startsAt).toISOString()}` } };
      } else {
        const transitions = isProvider ? { pending: { confirm: 'confirmed', reject: 'rejected' }, confirmed: { start: 'ongoing' }, ongoing: { complete: 'completed' } } : { pending: { cancel: 'cancelled' }, confirmed: { cancel: 'cancelled' } };
        nextStatus = transitions[booking.status]?.[action];
        if (!nextStatus) return res.status(409).json({ message: 'This action is not available for the current booking status.' });
        update = { $set: { status: nextStatus } };
        if (['cancelled', 'rejected'].includes(nextStatus)) update.$unset = { slotKey: 1 };
      }
      update.$inc = { __v: 1 };
      const updated = await Booking.findOneAndUpdate({ _id: booking._id, ...owner, status: booking.status, __v: booking.__v }, update, { returnDocument: 'after', runValidators: true });
      if (!updated) return res.status(409).json({ message: 'This booking changed. Refresh and try again.' });
      res.json({ booking: dto(updated) });
    }),
    publishSlot: handle(async (req, res) => {
      if (!ownProvider(req)) return res.status(403).json({ message: 'Provider approval is required.' });
      const { startsAt } = req.body || {};
      if (!validSlot(startsAt)) return res.status(400).json({ message: 'Choose a future date and one of the supported appointment times within 90 days.' });
      await User.updateOne({ _id: req.user._id, ...APPROVED }, { $addToSet: { 'providerDetails.bookingSlots': new Date(startsAt) } });
      res.json({ message: 'Appointment published.', startsAt });
    }),
  };
}
module.exports = { createBookingController, validSlot, TIMES, dto };
