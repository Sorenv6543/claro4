/* global React, Icon, Card, Button, Pill */
// useState provided by shared.js
const StatTile = ({ icon, color, num, label, menu = true }) => (
  <Card padding={16} style={{ flex: 1, minWidth: 160 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 2, background: `${color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={color} />
      </div>
      {menu && <Icon name="dots-vertical" size={16} color="rgba(46,38,61,.4)" />}
    </div>
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, color: 'rgba(46,38,61,.5)' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#2E263D', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{num}</div>
    </div>
  </Card>
);

const HeroCard = () => (
  <div style={{
    background: 'linear-gradient(135deg, #9E95F5 0%, #7367F0 60%, #5E52EE 100%)',
    borderRadius: 2, padding: 24, color: '#fff',
    boxShadow: '0 8px 24px rgba(115,103,240,.35)',
  }}>
    <div style={{ fontSize: 18, fontWeight: 600 }}>Welcome back, Soren Vinson</div>
    <div style={{ fontSize: 14, opacity: .9, marginTop: 4 }}>Here is what is happening with your properties today.</div>
    <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
      {[['home-outline', 'Properties', 14], ['calendar', 'Bookings', 6], ['swap-horizontal', 'Turns', 1]].map(([icon, label, num]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 2, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: .9 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{num}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Overview = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <HeroCard />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <StatTile icon="calendar-check-outline" color="#7367F0" num={6}  label="Total Bookings · All time" />
      <StatTile icon="calendar-clock"         color="#28C76F" num={4}  label="Active Bookings · Non-cancelled" />
      <StatTile icon="swap-horizontal"        color="#FF9F43" num={1}  label="Turn Bookings" />
      <StatTile icon="home-city-outline"      color="#00CFE8" num={14} label="Properties" />
    </div>
  </div>
);

const PROPERTIES = [
  { addr: '32540 Wishing Well Trl B', color: '#7367F0', status: 'Inactive' },
  { addr: '1600 Pennsylvania Ave NW', color: '#7367F0', status: 'Active' },
  { addr: 'Hall of Justice',          color: '#FF9F43', status: 'Active' },
  { addr: '1600 Pennsylvania Ave NW, B', color: '#EA5455', status: 'Active' },
  { addr: '666 gtgt, b',              color: '#9155FD', status: 'Inactive' },
  { addr: '32540 Wishing Well Trl B, B', color: '#FF9F43', status: 'Inactive' },
  { addr: '1194 Mulberry Dr, San Marcos, CA', color: '#FF9F43', status: 'Inactive' },
  { addr: '1600 Pennsylvania Ave NW',     color: '#28C76F', status: 'Inactive' },
];

const Properties = () => {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, lineHeight: 1.1 }}>My Properties</h1>
            <Pill tone="primary">14</Pill>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(46,38,61,.5)', marginTop: 4 }}>Manage your rental properties and settings</div>
        </div>
        <button style={{ width: 44, height: 44, borderRadius: 2, background: '#7367F0', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(115,103,240,.4)' }}>
          <Icon name="plus" size={22} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="home-outline" size={22} color="#7367F0" />
            <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>14</div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)' }}>Properties</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Icon name="calendar" size={22} color="#00CFE8" />
            <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>6</div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)' }}>Bookings</div>
          </div>
        </Card>
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="check-circle" size={22} color="#28C76F" />
            <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>8</div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)' }}>Active</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Icon name="swap-horizontal" size={22} color="#FF9F43" />
            <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>0</div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)' }}>Turns</div>
          </div>
        </Card>
      </div>
      <Card padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '14px 20px', fontSize: 13, color: 'rgba(46,38,61,.6)', borderBottom: '1px solid #F2F2F5' }}>
          <div>Property</div><div>Status</div>
        </div>
        {PROPERTIES.map((p, i) => (
          <div key={i} onClick={() => setSelected(i === selected ? null : i)} style={{
            display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 14, alignItems: 'center',
            padding: '14px 20px', borderBottom: '1px solid #F5F5F9', cursor: 'pointer',
            background: selected === i ? 'rgba(115,103,240,.04)' : 'transparent',
          }}>
            <div style={{ alignSelf: 'stretch', background: p.color, borderRadius: 1 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>{p.addr}</div>
            <Pill tone={p.status === 'Active' ? 'success' : 'error'}>{p.status}</Pill>
          </div>
        ))}
      </Card>
    </div>
  );
};

const BOOKINGS = [
  { prop: '32540 Wishing Well Trl B', dates: 'Wed, Apr 22 → Sat, May 16', type: 'Turn', status: 'Completed', priority: 'High' },
  { prop: '1600 Pennsylvania Ave NW', dates: 'Sat, Apr 11 → Fri, May 8', type: 'Standard', status: 'Pending' },
  { prop: '123 Main Street, B',       dates: 'Sun, Apr 5 → Wed, May 6',  type: 'Standard', status: 'Completed', priority: 'High' },
  { prop: '1600 Pennsylvania Ave NW, B', dates: 'Mon, Apr 27 → Thu, Apr 30', type: 'Standard', status: 'Pending' },
  { prop: '1600 Pennsylvania Ave NW', dates: 'Wed, Apr 15 → Sat, Apr 18', type: 'Standard', status: 'Pending' },
  { prop: '1194 Mulberry Dr, San Marcos, CA', dates: 'Tue, Apr 14 → Thu, Apr 16', type: 'Standard', status: 'In Progress' },
];

const Bookings = () => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600 }}>My Bookings</h1>
        <div style={{ fontSize: 14, color: 'rgba(46,38,61,.5)', marginTop: 4 }}>Guest stays and turn cleanings</div>
      </div>
      <Button variant="primary" icon="plus">New Booking</Button>
    </div>
    <Card padding={0}>
      <div style={{ padding: 16, borderBottom: '1px solid #F2F2F5', display: 'flex', gap: 8 }}>
        {['All', 'Pending', 'Scheduled', 'In Progress', 'Done'].map((f, i) => (
          <Pill key={f} tone="primary" outlined={i !== 0}>{f}</Pill>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', padding: '12px 20px', fontSize: 12, color: 'rgba(46,38,61,.6)', borderBottom: '1px solid #F2F2F5' }}>
        <div>Property</div><div>Dates</div><div>Type</div><div>Status</div><div>Priority</div>
      </div>
      {BOOKINGS.map((b, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F5F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#7367F0','#28C76F','#7367F0','#FF9F43','#28C76F','#9155FD'][i % 6] }} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>{b.prop}</div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(46,38,61,.72)' }}>{b.dates}</div>
          <Pill tone={b.type === 'Turn' ? 'warning' : 'primary'} outlined>{b.type}</Pill>
          <Pill tone={b.status === 'Completed' ? 'success' : b.status === 'In Progress' ? 'info' : 'warning'}>{b.status}</Pill>
          <div style={{ fontSize: 13, color: 'rgba(46,38,61,.4)' }}>{b.priority ? <Pill tone="warning">{b.priority}</Pill> : '—'}</div>
        </div>
      ))}
    </Card>
  </div>
);

const Calendar = () => {
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const cells = Array.from({length: 35}, (_, i) => i - 2);
  const events = {
    4: [{ text: '3455555 wishing, Cathedral City', color: '#9E95F5', span: 5 }],
    12: [{ text: '123 Main Street, B', color: '#9E95F5', span: 2 }, { text: '1600 Pennsylvania Ave NW', color: '#28C76F', span: 3 }],
    19: [{ text: '1600 Pennsylvania Ave NW', color: '#28C76F', span: 2 }, { text: '32540 Wishing Well Trl B', color: '#00CFE8', span: 4 }],
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600 }}>Calendar</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="outlined">Today</Button>
          <button style={{ width: 36, height: 36, background: '#7367F0', color: '#fff', border: 'none', borderRadius: 2, cursor: 'pointer' }}><Icon name="chevron-left" size={18} /></button>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#7367F0', minWidth: 140, textAlign: 'center' }}>April 2026</div>
          <button style={{ width: 36, height: 36, background: '#7367F0', color: '#fff', border: 'none', borderRadius: 2, cursor: 'pointer' }}><Icon name="chevron-right" size={18} /></button>
        </div>
      </div>
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgba(46,38,61,.72)' }}>
          {days.map(d => <div key={d} style={{ padding: '10px 8px', color: '#fff', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textAlign: 'center' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map(n => {
            const dayNum = n < 1 ? (31 + n) : n > 30 ? n - 30 : n;
            const muted = n < 1 || n > 30;
            const evs = events[n] || [];
            return (
              <div key={n} style={{ minHeight: 90, borderRight: '1px solid rgba(46,38,61,.08)', borderBottom: '1px solid rgba(46,38,61,.08)', padding: 4, background: n === 18 ? 'rgba(115,103,240,.06)' : '#fff' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: muted ? 'rgba(46,38,61,.28)' : 'rgba(46,38,61,.72)', padding: '2px 6px' }}>{dayNum}</div>
                {evs.map((e, i) => (
                  <div key={i} style={{ background: e.color, color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 2, marginTop: 2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.text}</div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

Object.assign(window, { Overview, Properties, Bookings, Calendar });
