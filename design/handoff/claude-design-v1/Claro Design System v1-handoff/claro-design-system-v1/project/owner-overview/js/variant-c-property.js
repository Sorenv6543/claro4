// VARIANT C — Property-first.
// Each property = a full-width row with inline 14-day band axis inside it.
// The "spreadsheet mental model" variant: one row per property.

(function () {
  const C = window.CLARO;

  function renderPropertyCard (p, days, showCleaner) {
    const bookings = C.bookingsInRange(p.id, days + 1);
    const status = C.propertyStatus(p.id);
    const occ = C.weekOccupancy(p.id);

    const statusChip = (() => {
      switch (status.state) {
        case 'urgent_turn': return `<span class="chip urgent"><span class="status-dot urgent"></span>Urgent turn today</span>`;
        case 'turn_today': return `<span class="chip turn"><span class="status-dot turn"></span>Turn today</span>`;
        case 'checkin_today': return `<span class="chip checkin">Check-in today</span>`;
        case 'checkout_today': return `<span class="chip checkout">Check-out today</span>`;
        case 'occupied': return `<span class="chip ok">Occupied · ${status.booking.guest_name}</span>`;
        case 'vacant': return `<span class="chip idle">Vacant</span>`;
      }
    })();

    const bands = bookings.map((b) => {
      const start = Math.max(0, Math.round((new Date(b.checkin_date) - C.TODAY) / C.MS_DAY));
      const end = Math.min(days, Math.round((new Date(b.checkout_date) - C.TODAY) / C.MS_DAY));
      if (end <= 0 || start >= days) return '';
      const span = Math.max(1, end - start);
      const urgent = b.priority === 'urgent';
      const turn = b.booking_type === 'turn';
      return `
        <div class="band ${urgent ? 'urgent' : ''} ${turn ? 'turn' : ''}"
             style="grid-column: ${start + 1} / span ${span};"
             title="${b.guest_name}">
          <span class="band-label">${b.guest_name} · ${b.guest_count}g${turn ? ' · turn' : ''}</span>
        </div>`;
    }).join('');

    const next = bookings.find((b) => b.checkin_date >= C.toKey(C.TODAY));

    return `
      <div class="card pc-card">
        <div class="pc-head">
          <div class="swatch" style="background:${p.color}22; color:${p.color};">${p.initial}</div>
          <div class="pc-head-info">
            <div class="pc-addr">${p.address}</div>
            <div class="pc-sub">${p.city} · ${p.beds}bd ${p.baths}ba · ${p.type}</div>
          </div>
          ${statusChip}
          <div class="pc-occ">
            <div class="pc-occ-label">Week</div>
            <div class="pc-occ-val">${occ}%</div>
          </div>
          <button class="btn btn-tonal pc-cta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New booking
          </button>
        </div>

        <div class="pc-timeline">
          <div class="pc-dayrow" style="grid-template-columns: repeat(${days}, 1fr);">
            ${Array.from({ length: days }).map((_, i) => {
              const d = C.fromOffset(i);
              const isToday = i === 0;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return `
                <div class="pc-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">
                  <div class="pc-day-dow">${d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                  <div class="pc-day-num">${d.getDate()}</div>
                </div>`;
            }).join('')}
          </div>
          <div class="pc-bandrow" style="grid-template-columns: repeat(${days}, 1fr);">
            ${Array.from({ length: days }).map((_, i) => {
              const d = C.fromOffset(i);
              const isToday = i === 0;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return `<div class="pc-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}"></div>`;
            }).join('')}
            ${bands}
          </div>
        </div>

        <div class="pc-foot">
          <div class="pc-foot-stat">
            <span class="pc-foot-label">Next booking</span>
            <span class="pc-foot-val">${next ? `${next.guest_name} · ${C.fmtShortDate(new Date(next.checkin_date))}` : 'None scheduled'}</span>
          </div>
          <div class="pc-foot-stat">
            <span class="pc-foot-label">Bookings in ${days}d</span>
            <span class="pc-foot-val">${bookings.length}</span>
          </div>
        </div>
      </div>`;
  }

  window.renderVariantC = function (container, tweaks) {
    const days = Number(tweaks.days) || 14;
    const propLimit = tweaks.props;
    const showCleaner = tweaks.cleaner;
    const properties = propLimit === 'all' ? C.PROPERTIES : C.PROPERTIES.slice(0, Number(propLimit));

    container.innerHTML = `
      <div class="variant-c">
        <!-- Summary strip (light, unlike variant A's banner) -->
        <div class="c-summary">
          <div class="c-summary-stat">
            <div class="c-summary-num">${C.PROPERTIES.length}</div>
            <div class="c-summary-label">Properties</div>
          </div>
          <div class="c-summary-divider"></div>
          <div class="c-summary-stat">
            <div class="c-summary-num">${C.todaysEvents().length}</div>
            <div class="c-summary-label">Events today</div>
          </div>
          <div class="c-summary-divider"></div>
          <div class="c-summary-stat">
            <div class="c-summary-num">${C.urgentItems().length}</div>
            <div class="c-summary-label" style="color: ${C.urgentItems().length ? 'var(--claro-error)' : 'inherit'}">Urgent</div>
          </div>
          <div class="c-summary-spacer"></div>
          <div class="c-summary-date">${C.fmtFullDay(C.TODAY)}</div>
        </div>

        <!-- Property cards -->
        <div class="pc-grid">
          ${properties.map((p) => renderPropertyCard(p, days, showCleaner)).join('')}
        </div>
      </div>
    `;
  };
})();
