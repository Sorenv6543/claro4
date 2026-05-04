// VARIANT B — Timeline-first.
// The property-timeline becomes the page. A 14-day grid; each row = a property.
// Booking-band primitive is the hero. Urgent items bubble up as a tiny top strip.

(function () {
  const C = window.CLARO;

  function renderDayHeaders (days) {
    let html = '<div class="tl-head-row"><div class="tl-head-spacer"></div><div class="tl-head-days">';
    for (let i = 0; i < days; i++) {
      const d = C.fromOffset(i);
      const isToday = i === 0;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      html += `
        <div class="tl-head-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">
          <div class="tl-head-dow">${d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
          <div class="tl-head-date">${d.getDate()}</div>
        </div>`;
    }
    html += '</div></div>';
    return html;
  }

  function renderPropertyRow (p, days) {
    const bookings = C.bookingsInRange(p.id, days + 1);
    // Build bands
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
             title="${b.guest_name} · ${C.fmtShortDate(new Date(b.checkin_date))}–${C.fmtShortDate(new Date(b.checkout_date))}">
          <span class="band-label">${b.guest_name} · ${b.guest_count}g</span>
        </div>`;
    }).join('');

    const status = C.propertyStatus(p.id);
    const statusChip = (() => {
      switch (status.state) {
        case 'urgent_turn': return `<span class="chip urgent">Urgent</span>`;
        case 'turn_today': return `<span class="chip turn">Turn today</span>`;
        case 'checkin_today': return `<span class="chip checkin">Check-in</span>`;
        case 'checkout_today': return `<span class="chip checkout">Check-out</span>`;
        case 'occupied': return `<span class="chip ok">Occupied</span>`;
        case 'vacant': return `<span class="chip idle">Vacant</span>`;
      }
    })();

    return `
      <div class="tl-row">
        <div class="tl-row-head">
          <div class="swatch-sm" style="background:${p.color}"></div>
          <div class="tl-row-info">
            <div class="tl-row-addr">${p.address.split(',')[0]}</div>
            <div class="tl-row-sub">${p.beds}bd · ${p.type}</div>
          </div>
          ${statusChip}
        </div>
        <div class="tl-row-grid" style="grid-template-columns: repeat(${days}, 1fr);">
          ${/* Day column shading */''}
          ${Array.from({ length: days }).map((_, i) => {
            const d = C.fromOffset(i);
            const isToday = i === 0;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return `<div class="tl-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}"></div>`;
          }).join('')}
          ${bands}
        </div>
      </div>`;
  }

  function renderUrgentStrip () {
    const urgent = C.urgentItems();
    if (urgent.length === 0) return '';
    return `
      <div class="tl-urgent-strip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span><b>Urgent turn today</b> · ${urgent[0].property.address.split(',')[0]} · new guests arrive ${C.fmtTime(urgent[0].booking.checkin_time)}</span>
        <button class="btn btn-tonal" style="margin-left:auto; padding: 4px 10px; font-size:12px;">View</button>
      </div>`;
  }

  window.renderVariantB = function (container, tweaks) {
    const days = Number(tweaks.days) || 14;
    const propLimit = tweaks.props;
    const properties = propLimit === 'all' ? C.PROPERTIES : C.PROPERTIES.slice(0, Number(propLimit));

    container.innerHTML = `
      <div class="variant-b">
        ${renderUrgentStrip()}
        <div class="card tl-card">
          <div class="tl-toolbar">
            <div class="section-title" style="margin:0;">Portfolio timeline</div>
            <div class="tl-legend">
              <span class="tl-legend-item"><span class="tl-legend-cap checkin"></span>Check-in</span>
              <span class="tl-legend-item"><span class="tl-legend-cap checkout"></span>Check-out</span>
              <span class="tl-legend-item"><span class="tl-legend-cap turn"></span>Turn</span>
            </div>
            <div class="tl-today-tag">Today · ${C.fmtFullDay(C.TODAY)}</div>
          </div>
          ${renderDayHeaders(days)}
          <div class="tl-body">
            ${properties.map((p) => renderPropertyRow(p, days)).join('')}
          </div>
        </div>

        <!-- Secondary: today at-a-glance -->
        <div class="tl-secondary">
          <div class="card tl-sec-card">
            <div class="section-title" style="margin-bottom: var(--claro-space-3);">Today's events</div>
            ${renderTodayList()}
          </div>
          <div class="card tl-sec-card">
            <div class="section-title" style="margin-bottom: var(--claro-space-3);">Recent activity</div>
            ${renderActivityList()}
          </div>
        </div>
      </div>
    `;
  };

  function renderTodayList () {
    const events = C.todaysEvents().sort((a, b) => a.time.localeCompare(b.time));
    if (events.length === 0) return `<div class="today-empty"><span class="chip idle">Quiet day</span></div>`;
    return `
      <div class="tl-today-list">
        ${events.map((e) => {
          const p = C.getProperty(e.booking.property_id);
          const label = e.kind === 'checkout' ? 'Check-out' : e.kind === 'checkin' ? 'Check-in' : 'Turn';
          return `
            <div class="tl-today-row">
              <div class="tl-today-time">${C.fmtTime(e.time)}</div>
              <div class="swatch-xs" style="background:${p.color}"></div>
              <div class="tl-today-addr">${p.address.split(',')[0]}</div>
              <span class="chip ${e.kind}" style="font-size:10px; padding:1px 7px;">${label}</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  function renderActivityList () {
    return `
      <div class="tl-activity-list">
        ${C.ACTIVITY.map((a) => {
          const hoursAgo = Math.abs(a.at);
          const time = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`;
          const p = C.getProperty(a.property_id);
          return `
            <div class="tl-activity-row">
              <div class="tl-activity-dot ${a.type}"></div>
              <div class="tl-activity-body">
                <div class="tl-activity-text">${a.text}</div>
                <div class="tl-activity-sub">${time} · ${p.address.split(',')[0]}</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }
})();
