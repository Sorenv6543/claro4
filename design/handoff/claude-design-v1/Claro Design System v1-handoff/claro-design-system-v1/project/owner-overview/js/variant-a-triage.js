// VARIANT A — Triage-first.
// "Is anything on fire?" leads. Today events strip; at-a-glance property health chips.
// Secondary: yesterday summary, upcoming bookings list, recent activity.

(function () {
  const C = window.CLARO;

  function renderUrgentBanner () {
    const urgent = C.urgentItems();
    if (urgent.length === 0) {
      return `
        <div class="triage-banner triage-banner--ok">
          <div class="triage-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="triage-banner-body">
            <div class="triage-banner-title">You're all set</div>
            <div class="triage-banner-sub">Nothing urgent across your ${C.PROPERTIES.length} properties right now.</div>
          </div>
        </div>`;
    }
    const u = urgent[0];
    return `
      <div class="triage-banner triage-banner--urgent">
        <div class="triage-banner-icon urgent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="triage-banner-body">
          <div class="triage-banner-title">Urgent turn · ${u.property.address.split(',')[0]}</div>
          <div class="triage-banner-sub">Guests out ${C.fmtTime('11:00')} · new guests in ${C.fmtTime(u.booking.checkin_time)} · same-day turn</div>
        </div>
        <button class="btn btn-tonal">View details</button>
      </div>`;
  }

  function renderTodayStrip () {
    const events = C.todaysEvents().sort((a, b) => a.time.localeCompare(b.time));
    if (events.length === 0) {
      return `<div class="today-empty"><span class="chip idle">Quiet day — no events</span></div>`;
    }
    return `
      <div class="today-strip">
        ${events.map((e) => {
          const p = C.getProperty(e.booking.property_id);
          const kindLabel = e.kind === 'checkout' ? 'Check-out' : e.kind === 'checkin' ? 'Check-in' : 'Turn';
          return `
            <div class="event-pill">
              <div class="event-pill-time">${C.fmtTime(e.time)}</div>
              <div class="event-pill-body">
                <div class="event-pill-prop">
                  <div class="swatch-xs" style="background:${p.color}"></div>
                  <span>${p.address.split(',')[0]}</span>
                </div>
                <span class="chip ${e.kind}">
                  <span class="chip-dot" style="background:currentColor"></span>
                  ${kindLabel}${e.booking.guest_count ? ` · ${e.booking.guest_count}g` : ''}
                </span>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  function renderPropertyHealthRow (p) {
    const s = C.propertyStatus(p.id);
    const next = C.bookingsInRange(p.id, 14)[0];
    const occ = C.weekOccupancy(p.id);

    let stateChip = '';
    switch (s.state) {
      case 'urgent_turn': stateChip = `<span class="chip urgent"><span class="status-dot urgent"></span>Urgent turn today</span>`; break;
      case 'turn_today': stateChip = `<span class="chip turn"><span class="status-dot turn"></span>Turn today</span>`; break;
      case 'checkout_today': stateChip = `<span class="chip checkout">Check-out today</span>`; break;
      case 'checkin_today': stateChip = `<span class="chip checkin">Check-in today</span>`; break;
      case 'occupied': stateChip = `<span class="chip ok">Occupied · ${s.booking.guest_name}</span>`; break;
      case 'vacant': stateChip = `<span class="chip idle">Vacant</span>`; break;
    }

    const nextLabel = next
      ? `${C.fmtShortDate(new Date(next.checkin_date))} → ${C.fmtShortDate(new Date(next.checkout_date))} · ${next.guest_name}`
      : 'No upcoming';

    return `
      <div class="health-row">
        <div class="swatch" style="background:${p.color}22; color:${p.color};">${p.initial}</div>
        <div class="health-info">
          <div class="health-addr">${p.address}</div>
          <div class="health-sub">${p.city} · ${p.beds}bd ${p.baths}ba · ${p.type}</div>
        </div>
        <div class="health-state">${stateChip}</div>
        <div class="health-next">
          <div class="health-next-label">Next</div>
          <div class="health-next-val">${nextLabel}</div>
        </div>
        <div class="health-occ">
          <div class="health-occ-label">Week occ.</div>
          <div class="health-occ-val">${occ}%</div>
          <div class="health-occ-bar"><div class="health-occ-fill" style="width:${occ}%; background:${occ >= 70 ? 'var(--claro-success)' : occ >= 40 ? 'var(--claro-primary)' : 'var(--claro-warning)'}"></div></div>
        </div>
      </div>`;
  }

  function renderYesterday () {
    const done = C.YESTERDAY_COMPLETED;
    const ok = done.filter((d) => d.on_time).length;
    return `
      <div class="card yday-card">
        <div class="yday-head">
          <div>
            <div class="yday-title">Yesterday</div>
            <div class="yday-sub">${ok} of ${done.length} on time</div>
          </div>
          <span class="chip ok">All smooth</span>
        </div>
        <div class="yday-list">
          ${done.map((d) => {
            const p = C.getProperty(d.property_id);
            return `
              <div class="yday-item">
                <div class="swatch-xs" style="background:${p.color}"></div>
                <span class="yday-item-text"><b>${d.action}</b> · ${p.address.split(',')[0]} · ${d.guests} guests</span>
                <span class="chip ok" style="font-size:10px; padding:1px 7px;">On time</span>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function renderUpcoming () {
    // Flatten all bookings across properties, sort, take next 5
    const all = C.PROPERTIES.flatMap((p) => C.bookingsInRange(p.id, 14).map((b) => ({ b, p })));
    all.sort((a, b) => a.b.checkin_date.localeCompare(b.b.checkin_date));
    const rows = all.slice(0, 6).map(({ b, p }) => `
      <div class="up-row">
        <div class="up-date">
          <div class="up-date-m">${new Date(b.checkin_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
          <div class="up-date-d">${new Date(b.checkin_date).getDate()}</div>
        </div>
        <div class="up-info">
          <div class="up-prop"><div class="swatch-xs" style="background:${p.color}"></div>${p.address.split(',')[0]}</div>
          <div class="up-range">${C.fmtShortDate(new Date(b.checkin_date))} – ${C.fmtShortDate(new Date(b.checkout_date))} · ${b.guest_name} · ${b.guest_count}g</div>
        </div>
        <div class="up-badges">
          ${b.booking_type === 'turn' ? `<span class="chip turn" style="font-size:10px; padding:1px 7px;">Turn</span>` : `<span class="chip" style="font-size:10px; padding:1px 7px; background:var(--claro-primary-tint); color:var(--claro-primary); border:1px solid var(--claro-primary-tint-2);">Standard</span>`}
        </div>
      </div>`).join('');
    return `
      <div class="card up-card">
        <div class="up-head">
          <div class="section-title" style="color:var(--claro-text-muted); margin:0;">Upcoming 14 days</div>
          <a href="#" class="section-action">View calendar →</a>
        </div>
        <div class="up-list">${rows || '<div class="today-empty"><span class="chip idle">No upcoming bookings</span></div>'}</div>
      </div>`;
  }

  window.renderVariantA = function (container, tweaks) {
    const showStrip = tweaks.strip;
    const showCleaner = tweaks.cleaner;
    const propLimit = tweaks.props;

    const properties = propLimit === 'all' ? C.PROPERTIES : C.PROPERTIES.slice(0, Number(propLimit));

    container.innerHTML = `
      <div class="variant-a">
        <!-- URGENT / OK BANNER -->
        ${renderUrgentBanner()}

        <!-- TODAY EVENTS STRIP -->
        ${showStrip ? `
          <div>
            <div class="section-head">
              <div class="section-title">Today · ${C.fmtFullDay(C.TODAY)}</div>
              <div class="section-count">${C.todaysEvents().length} events</div>
            </div>
            ${renderTodayStrip()}
          </div>` : ''}

        <!-- PROPERTY HEALTH ROWS -->
        <div>
          <div class="section-head">
            <div class="section-title">Your properties</div>
            <div class="section-count">${properties.length}</div>
            <a href="#" class="section-action">Manage →</a>
          </div>
          <div class="card health-list">
            ${properties.map(renderPropertyHealthRow).join('')}
          </div>
        </div>

        <!-- SPLIT: yesterday + upcoming -->
        <div class="a-split">
          ${renderYesterday()}
          ${renderUpcoming()}
        </div>
      </div>
    `;
  };
})();
