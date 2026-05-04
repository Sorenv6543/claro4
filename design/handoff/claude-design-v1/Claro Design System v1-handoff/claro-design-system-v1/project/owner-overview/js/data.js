// Mock data & utilities — a single operator with 3 properties
// Shape loosely tracks your types/ folder (property, booking).

(function () {
  const MS_DAY = 86400000;
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  const toKey = (d) => d.toISOString().slice(0, 10);
  const fromOffset = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d; };
  const fmtTime = (hhmm) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const dh = h % 12 || 12;
    return m ? `${dh}:${m.toString().padStart(2, '0')}${ampm}` : `${dh}${ampm}`;
  };
  const fmtDay = (d) => d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  const fmtFullDay = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const fmtShortDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const PROPERTIES = [
    {
      id: 'p1',
      color: '#7367F0',
      initial: 'S',
      address: '418 Sunset Blvd, Unit 2',
      city: 'Palm Springs',
      type: 'Apartment',
      beds: 2, baths: 1,
    },
    {
      id: 'p2',
      color: '#28C76F',
      initial: 'O',
      address: '721 Oak Ave',
      city: 'Palm Desert',
      type: 'House',
      beds: 3, baths: 2,
    },
    {
      id: 'p3',
      color: '#FF9F43',
      initial: 'P',
      address: '303 Pine St, Unit 8',
      city: 'Cathedral City',
      type: 'Condo',
      beds: 1, baths: 1,
    },
  ];

  // booking_type: 'standard' | 'turn'
  // priority:     'urgent' | 'high' | 'normal' | 'low'
  // status:       'pending' | 'scheduled' | 'in_progress' | 'completed'
  const BOOKINGS = [
    // p1: ACTIVE stay, checks out TODAY 11am. New guests arrive TODAY 3pm. Urgent same-day turn.
    { id: 'b1', property_id: 'p1', checkin_date: toKey(fromOffset(-3)), checkout_date: toKey(TODAY),
      checkin_time: '15:00', checkout_time: '11:00', booking_type: 'standard', priority: 'normal',
      status: 'in_progress', guest_count: 2, guest_name: 'Martinez' },
    { id: 'b2', property_id: 'p1', checkin_date: toKey(TODAY), checkout_date: toKey(fromOffset(5)),
      checkin_time: '15:00', checkout_time: '11:00', booking_type: 'turn', priority: 'urgent',
      status: 'scheduled', guest_count: 4, guest_name: 'Chen' },
    { id: 'b3', property_id: 'p1', checkin_date: toKey(fromOffset(10)), checkout_date: toKey(fromOffset(14)),
      checkin_time: '15:00', checkout_time: '11:00', booking_type: 'standard', priority: 'normal',
      status: 'pending', guest_count: 2, guest_name: 'Patel' },

    // p2: ACTIVE stay through weekend, scheduled turn tomorrow
    { id: 'b4', property_id: 'p2', checkin_date: toKey(fromOffset(-2)), checkout_date: toKey(fromOffset(1)),
      checkin_time: '16:00', checkout_time: '10:00', booking_type: 'standard', priority: 'normal',
      status: 'in_progress', guest_count: 6, guest_name: 'Williams' },
    { id: 'b5', property_id: 'p2', checkin_date: toKey(fromOffset(1)), checkout_date: toKey(fromOffset(6)),
      checkin_time: '16:00', checkout_time: '10:00', booking_type: 'turn', priority: 'high',
      status: 'scheduled', guest_count: 4, guest_name: 'Okonkwo' },
    { id: 'b6', property_id: 'p2', checkin_date: toKey(fromOffset(9)), checkout_date: toKey(fromOffset(12)),
      checkin_time: '16:00', checkout_time: '10:00', booking_type: 'standard', priority: 'normal',
      status: 'pending', guest_count: 2, guest_name: 'Ferrante' },

    // p3: vacant today. Next guest in 4 days.
    { id: 'b7', property_id: 'p3', checkin_date: toKey(fromOffset(4)), checkout_date: toKey(fromOffset(7)),
      checkin_time: '15:00', checkout_time: '11:00', booking_type: 'standard', priority: 'normal',
      status: 'pending', guest_count: 1, guest_name: 'Roth' },
    { id: 'b8', property_id: 'p3', checkin_date: toKey(fromOffset(11)), checkout_date: toKey(fromOffset(15)),
      checkin_time: '15:00', checkout_time: '11:00', booking_type: 'standard', priority: 'normal',
      status: 'pending', guest_count: 2, guest_name: 'Davies' },
  ];

  // Yesterday summary
  const YESTERDAY_COMPLETED = [
    { property_id: 'p1', action: 'Check-in', guests: 2, on_time: true },
    { property_id: 'p2', action: 'Turn', guests: 6, on_time: true },
  ];

  // Recent owner activity (feed)
  const ACTIVITY = [
    { type: 'created',   text: 'Added new booking: Chen · Apr 18–23',     property_id: 'p1', at: -2 /* hours */ },
    { type: 'modified',  text: 'Moved check-in time to 4pm · Williams',   property_id: 'p2', at: -26 },
    { type: 'created',   text: 'Added new booking: Patel · Apr 28–May 2', property_id: 'p1', at: -48 },
  ];

  // ─── Derived helpers ─────────────────────────────────────────────
  function todaysEvents () {
    const k = toKey(TODAY);
    const out = [];
    for (const b of BOOKINGS) {
      if (b.checkout_date === k && b.booking_type !== 'turn') {
        out.push({ kind: 'checkout', booking: b, time: b.checkout_time });
      }
      if (b.checkin_date === k && b.booking_type !== 'turn') {
        out.push({ kind: 'checkin', booking: b, time: b.checkin_time });
      }
      if (b.checkin_date === k && b.booking_type === 'turn') {
        out.push({ kind: 'turn', booking: b, time: b.checkin_time });
      }
    }
    return out;
  }

  function urgentItems () {
    // "on fire right now": same-day turn, unassigned, very close countdown
    const k = toKey(TODAY);
    return BOOKINGS
      .filter((b) => b.checkin_date === k && b.booking_type === 'turn' && b.priority === 'urgent')
      .map((b) => ({ booking: b, property: PROPERTIES.find((p) => p.id === b.property_id) }));
  }

  function propertyStatus (propId) {
    // returns { state: 'occupied'|'vacant'|'urgent_turn'|'turn_today'|'checkin_today'|'checkout_today', nextEvent }
    const k = toKey(TODAY);
    const props = BOOKINGS.filter((b) => b.property_id === propId);
    const active = props.find((b) => b.checkin_date <= k && b.checkout_date > k && b.booking_type !== 'turn');
    const turnToday = props.find((b) => b.checkin_date === k && b.booking_type === 'turn');
    const checkoutToday = props.find((b) => b.checkout_date === k && b.booking_type !== 'turn');
    const checkinToday = props.find((b) => b.checkin_date === k && b.booking_type !== 'turn');

    if (turnToday) {
      return {
        state: turnToday.priority === 'urgent' ? 'urgent_turn' : 'turn_today',
        booking: turnToday,
      };
    }
    if (checkoutToday && checkinToday && checkoutToday.id !== checkinToday.id) {
      return { state: 'turn_today', booking: checkinToday };
    }
    if (checkoutToday) return { state: 'checkout_today', booking: checkoutToday };
    if (checkinToday) return { state: 'checkin_today', booking: checkinToday };
    if (active) return { state: 'occupied', booking: active };
    return { state: 'vacant', booking: props.find((b) => new Date(b.checkin_date) > TODAY) };
  }

  function bookingsInRange (propId, days) {
    const end = fromOffset(days);
    return BOOKINGS.filter((b) => {
      if (b.property_id !== propId) return false;
      const co = new Date(b.checkout_date);
      const ci = new Date(b.checkin_date);
      return co >= TODAY && ci <= end;
    }).sort((a, b) => a.checkin_date.localeCompare(b.checkin_date));
  }

  // Occupancy this week (simple rolling 7-day %)
  function weekOccupancy (propId) {
    let occupied = 0;
    for (let i = 0; i < 7; i++) {
      const d = fromOffset(i);
      const dk = toKey(d);
      const hit = BOOKINGS.some((b) => b.property_id === propId && b.checkin_date <= dk && b.checkout_date > dk && b.booking_type !== 'turn');
      if (hit) occupied++;
    }
    return Math.round((occupied / 7) * 100);
  }

  window.CLARO = {
    TODAY, toKey, fromOffset, MS_DAY,
    fmtTime, fmtDay, fmtFullDay, fmtShortDate,
    PROPERTIES, BOOKINGS, YESTERDAY_COMPLETED, ACTIVITY,
    todaysEvents, urgentItems, propertyStatus, bookingsInRange, weekOccupancy,
    getProperty: (id) => PROPERTIES.find((p) => p.id === id),
  };
})();
