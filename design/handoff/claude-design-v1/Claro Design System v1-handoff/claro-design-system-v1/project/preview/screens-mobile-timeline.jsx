// ─── Mobile Timeline component ─────────────────────────────
// Per-day feed with a top house-filter rail. Each card has a
// left color bar tagging which house the event belongs to.

const CLARO_PRIMARY = '#5A4FE3';

// Property palette from colors-property.html
const PROPS = [
  { id: 'all', street: 'All', sub: '5 properties', color: CLARO_PRIMARY },
  { id: 'p1', street: '412 Ocean Blvd',     sub: 'Palm Springs',    color: '#7367F0' },
  { id: 'p2', street: '88 Desert Rose',     sub: 'Palm Desert',     color: '#FF9F43' },
  { id: 'p3', street: '1550 Araby Dr',      sub: 'Cathedral City',  color: '#28C76F' },
  { id: 'p4', street: '320 Via Soleil',     sub: 'Rancho Mirage',   color: '#FDD835' },
  { id: 'p5', street: '70 Smoketree Ave',   sub: 'Palm Springs',    color: '#EA5455' },
];

const SEM = {
  out:   '#EA5455',
  in:    '#28C76F',
  turn:  '#FF9F43',
  info:  '#00CFE8',
  bg:    '#F5F5F7',
  card:  '#FFFFFF',
  fg1:   '#2E263D',
  fg2:   '#6B6579',
  fg3:   '#A8A2B5',
  divider: '#EEEEF1',
};

// ─── House chip rail ──────────────────────────────────────
function HouseRail({ selected, setSelected }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '8px 16px 14px',
      overflowX: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {PROPS.map(p => {
        const active = selected === p.id;
        return (
          <div key={p.id}
            onClick={() => setSelected(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px 8px 10px',
              borderRadius: 2,
              border: `1px solid ${active ? p.color : SEM.divider}`,
              background: active ? '#fff' : SEM.card,
              boxShadow: active ? `inset 0 0 0 1px ${p.color}` : 'none',
              flexShrink: 0, cursor: 'pointer',
            }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: p.color, flexShrink: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? SEM.fg1 : SEM.fg2,
                letterSpacing: '-0.01em', whiteSpace: 'nowrap',
              }}>{p.street}</span>
              <span style={{
                fontSize: 10, color: SEM.fg3, marginTop: 2,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{p.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Segmented range control ─────────────────────────────
function RangeSeg({ value, setValue }) {
  const opts = [{l:'3d',v:3},{l:'7d',v:7},{l:'14d',v:14}];
  return (
    <div style={{
      display: 'inline-flex', padding: 2, background: '#EEEDF1',
      borderRadius: 2, margin: '0 16px',
    }}>
      {opts.map(o => {
        const on = o.v === value;
        return (
          <div key={o.v} onClick={() => setValue(o.v)}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              color: on ? '#fff' : SEM.fg2,
              background: on ? CLARO_PRIMARY : 'transparent',
              borderRadius: 2, cursor: 'pointer',
              letterSpacing: '0.02em',
            }}>{o.l}</div>
        );
      })}
    </div>
  );
}

// ─── Event card (collapsed + expanded) ───────────────────
function EventCard({ ev, expanded, onToggle }) {
  const prop = PROPS.find(p => p.id === ev.propId);
  const typeColor = ev.type === 'out' ? SEM.out : ev.type === 'in' ? SEM.in : SEM.turn;
  const typeLabel = ev.type === 'out' ? 'Check-out' : ev.type === 'in' ? 'Check-in' : 'Same-day turn';

  // Left bar — solid color for checkin/out, split gradient for turn
  const leftBar = ev.type === 'turn'
    ? `linear-gradient(180deg, ${SEM.out} 0%, ${SEM.out} 50%, ${SEM.in} 50%, ${SEM.in} 100%)`
    : typeColor;

  return (
    <div onClick={onToggle} style={{
      display: 'flex', background: SEM.card, borderRadius: 2,
      border: `1px solid ${SEM.divider}`,
      marginBottom: 8, overflow: 'hidden', cursor: 'pointer',
    }}>
      {/* Left color bar — house tint behind event tint */}
      <div style={{ width: 4, background: leftBar, flexShrink: 0 }} />
      <div style={{ width: 3, background: prop.color, flexShrink: 0, opacity: 0.55 }} />

      <div style={{ flex: 1, padding: '12px 14px' }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: typeColor,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{typeLabel}</span>
          <span style={{ fontSize: 11, color: SEM.fg3 }}>·</span>
          <span style={{
            fontSize: 12, color: SEM.fg2, fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
          }}>{ev.time}</span>
          <div style={{ flex: 1 }} />
          {ev.urgent && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: SEM.out,
              background: 'rgba(234,84,85,0.12)', padding: '2px 6px',
              borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Urgent</span>
          )}
        </div>

        {/* Row 2 */}
        <div style={{
          fontSize: 14, fontWeight: 600, color: SEM.fg1,
          marginTop: 4, letterSpacing: '-0.01em',
        }}>{prop.street}</div>
        <div style={{ fontSize: 11, color: SEM.fg3, marginTop: 1 }}>
          {prop.sub} · {ev.guests} guests
        </div>

        {/* Row 3: status chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <StatusChip label={ev.status} tone={ev.status === 'Pending' ? 'warn' : ev.status === 'Confirmed' ? 'info' : 'ok'} />
          {ev.cleaner
            ? <StatusChip label={`✓ ${ev.cleaner}`} tone="ok" />
            : <StatusChip label="⚠ No cleaner" tone="warn" />}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div style={{
            marginTop: 12, paddingTop: 12,
            borderTop: `1px solid ${SEM.divider}`,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {ev.type === 'turn' && (
              <div style={{
                background: 'rgba(255,159,67,0.10)',
                border: `1px solid rgba(255,159,67,0.25)`,
                borderRadius: 2, padding: '10px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: SEM.turn, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cleaning window</div>
                  <div style={{ fontSize: 11, color: SEM.fg2, marginTop: 2 }}>{ev.cleanMins} min estimated</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: SEM.turn, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {ev.cleanFrom} → {ev.cleanTo}
                </div>
              </div>
            )}
            <MetaRow label="Guest" value={ev.guestName} />
            {ev.notes && <MetaRow label="Notes" value={ev.notes} wrap />}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <BtnPrimary>Open booking</BtnPrimary>
              <BtnGhost>Message cleaner</BtnGhost>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ label, tone }) {
  const colors = {
    ok:   { bg: 'rgba(40,199,111,0.14)', fg: '#17a85d' },
    warn: { bg: 'rgba(255,159,67,0.16)', fg: '#C66A14' },
    info: { bg: 'rgba(0,207,232,0.14)',  fg: '#0A92A8' },
  }[tone];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color: colors.fg,
      background: colors.bg, padding: '3px 8px', borderRadius: 2,
      letterSpacing: '0.02em',
    }}>{label}</span>
  );
}

function MetaRow({ label, value, wrap }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: wrap ? 'flex-start' : 'center' }}>
      <span style={{
        fontSize: 10, color: SEM.fg3, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        minWidth: 52, paddingTop: wrap ? 2 : 0,
      }}>{label}</span>
      <span style={{
        fontSize: 13, color: SEM.fg1, lineHeight: 1.4, flex: 1,
        fontWeight: wrap ? 400 : 500,
      }}>{value}</span>
    </div>
  );
}

function BtnPrimary({ children }) {
  return (
    <button style={{
      flex: 1, padding: '10px 14px', background: CLARO_PRIMARY, color: '#fff',
      border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 600,
      letterSpacing: '-0.01em', cursor: 'pointer',
    }}>{children}</button>
  );
}
function BtnGhost({ children }) {
  return (
    <button style={{
      flex: 1, padding: '10px 14px', background: 'transparent', color: SEM.fg1,
      border: `1px solid ${SEM.divider}`, borderRadius: 2, fontSize: 13, fontWeight: 500,
      letterSpacing: '-0.01em', cursor: 'pointer',
    }}>{children}</button>
  );
}

// ─── Day group ────────────────────────────────────────────
function DayGroup({ label, isToday, count, children }) {
  return (
    <div style={{ padding: '18px 16px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: isToday ? CLARO_PRIMARY : SEM.fg3,
          textTransform: 'uppercase', letterSpacing: '0.10em',
        }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: SEM.divider }} />
        <span style={{ fontSize: 11, color: SEM.fg3, fontVariantNumeric: 'tabular-nums' }}>
          {count} event{count === 1 ? '' : 's'}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Screen header (sticky-ish) ───────────────────────────
function ScreenHeader({ subtitle }) {
  return (
    <div style={{
      padding: '12px 16px 4px', background: SEM.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 700, color: SEM.fg1,
          letterSpacing: '-0.02em',
        }}>Timeline</h1>
        <span style={{ fontSize: 13, color: SEM.fg3, fontWeight: 500 }}>{subtitle}</span>
      </div>
    </div>
  );
}

// ─── Full screen ──────────────────────────────────────────
function TimelineScreen({ initialSelected = 'all', initialExpanded = null, initialRange = 7 }) {
  const [selected, setSelected] = React.useState(initialSelected);
  const [expanded, setExpanded] = React.useState(initialExpanded);
  const [range, setRange] = React.useState(initialRange);

  // Mock events — relative to "today"
  const EVENTS = [
    // Today
    { id: 'e1', propId: 'p1', day: 0, time: '10:00', type: 'out',  status: 'Confirmed', guests: 4, cleaner: null, guestName: 'The Abernathy family', notes: 'Late check-out requested (11am ok).' },
    { id: 'e2', propId: 'p2', day: 0, time: '10→14', type: 'turn', status: 'Confirmed', guests: 2, cleaner: 'Maria G.', urgent: true, cleanFrom: '10:00', cleanTo: '14:00', cleanMins: 90, guestName: 'Jessup party (arr.) · Rios party (dep.)', notes: 'Guest has pet — check for hair on furniture & run HEPA cycle.' },
    { id: 'e3', propId: 'p5', day: 0, time: '16:00', type: 'in',   status: 'Confirmed', guests: 1, cleaner: 'Maria G.', guestName: 'S. Marchetti' },
    // Tomorrow
    { id: 'e4', propId: 'p3', day: 1, time: '16:00', type: 'in',   status: 'Confirmed', guests: 6, cleaner: 'Dev T.', guestName: 'The Okonkwo reunion', notes: 'Group of 6, 2 kids. Crib requested.' },
    // +2d
    { id: 'e5', propId: 'p4', day: 2, time: '10:00', type: 'out',  status: 'Pending', guests: 2, cleaner: null, guestName: 'K. Nakamura' },
    // +3d
    { id: 'e6', propId: 'p1', day: 3, time: '15:00', type: 'in',   status: 'Pending', guests: 2, cleaner: null, guestName: 'L. Petrov' },
    // +4d
    { id: 'e7', propId: 'p4', day: 4, time: '15:00', type: 'in',   status: 'Pending', guests: 2, cleaner: null, guestName: 'The Okafor twins' },
    // +5d
    { id: 'e8', propId: 'p5', day: 5, time: '11:00', type: 'out',  status: 'Pending', guests: 1, cleaner: null, guestName: 'S. Marchetti' },
  ];

  const filtered = EVENTS
    .filter(e => selected === 'all' || e.propId === selected)
    .filter(e => e.day < range);

  // Group by day
  const days = {};
  filtered.forEach(e => {
    if (!days[e.day]) days[e.day] = [];
    days[e.day].push(e);
  });

  const dayLabel = (d) => {
    if (d === 0) return 'Today · Sat';
    if (d === 1) return 'Tomorrow · Sun';
    const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return `+${d}d · ${names[(d + 5) % 7]}`; // fake weekdays
  };

  const selectedProp = PROPS.find(p => p.id === selected);
  const subtitle = selected === 'all'
    ? `${filtered.length} events · next ${range}d`
    : `${selectedProp.street} · ${filtered.length} events`;

  return (
    <div style={{
      height: '100%', width: '100%', background: SEM.bg,
      display: 'flex', flexDirection: 'column', minHeight: 0,
      fontFamily: "-apple-system, 'Inter', system-ui, sans-serif",
      boxSizing: 'border-box',
    }}>
      {/* Top chrome — sits behind the iOS status bar, so pad it down */}
      <div style={{ paddingTop: 54, background: SEM.bg, flexShrink: 0 }}>
        <ScreenHeader subtitle={subtitle} />
        <HouseRail selected={selected} setSelected={setSelected} />
        <div style={{ paddingBottom: 12, display: 'flex', alignItems: 'center' }}>
          <RangeSeg value={range} setValue={setRange} />
          <div style={{ flex: 1 }} />
          <span style={{
            fontSize: 11, color: SEM.fg3, marginRight: 16,
            textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
          }}>Filter</span>
        </div>
      </div>

      {/* Scrollable feed — minHeight:0 is critical inside a flex col or children will overflow */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 44 }}>
        {Object.keys(days).length === 0 && (
          <div style={{
            padding: '80px 32px', textAlign: 'center', color: SEM.fg3,
          }}>
            <div style={{ fontSize: 48, opacity: 0.25, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: SEM.fg2, marginBottom: 4 }}>
              No activity this {range === 3 ? '3-day' : range === 7 ? 'week' : '2-week'} window
            </div>
            <div style={{ fontSize: 12 }}>
              {selectedProp && selectedProp.id !== 'all'
                ? `${selectedProp.street} is quiet.`
                : 'No check-ins, check-outs, or turns scheduled.'}
            </div>
          </div>
        )}
        {Object.keys(days).sort((a,b) => +a - +b).map(d => (
          <DayGroup key={d} label={dayLabel(+d)} isToday={+d === 0} count={days[d].length}>
            {days[d].map(ev => (
              <EventCard
                key={ev.id}
                ev={ev}
                expanded={expanded === ev.id}
                onToggle={() => setExpanded(expanded === ev.id ? null : ev.id)}
              />
            ))}
          </DayGroup>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { TimelineScreen });
