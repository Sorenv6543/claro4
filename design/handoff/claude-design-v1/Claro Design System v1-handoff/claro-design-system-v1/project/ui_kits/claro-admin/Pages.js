/* global React, Icon, Card, Button, Pill, Avatar */
// useState provided by shared.js
const AlertCard = ({ children }) => (
  <div style={{
    background: '#FFF2EE', border: '1px solid #FFD4C4', borderLeft: '4px solid #EA5455',
    borderRadius: 2, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
  }}>
    <Icon name="alert-circle-outline" size={22} color="#EA5455" />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#B03A3A' }}>Attention required</div>
      <div style={{ fontSize: 13, color: 'rgba(46,38,61,.72)', marginTop: 2 }}>{children}</div>
    </div>
    <Button variant="outlined" tone="error">Review</Button>
  </div>
);

const BigStat = ({ icon, color, num, label, sub }) => (
  <Card padding={18} style={{ flex: 1, minWidth: 170 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)' }}>{label}</div>
      <div style={{ width: 34, height: 34, borderRadius: 2, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 600, marginTop: 12, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{num}</div>
    {sub && <div style={{ fontSize: 12, color: 'rgba(46,38,61,.5)', marginTop: 4 }}>{sub}</div>}
  </Card>
);

const Dashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#2E263D' }}>Business Dashboard</h1>
      <div style={{ fontSize: 13, color: 'rgba(46,38,61,.5)', marginTop: 4 }}>System-wide overview · All properties, owners and cleaners</div>
    </div>
    <AlertCard>2 unassigned turn cleanings need a cleaner for today. Assign now to avoid a delayed check-in.</AlertCard>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      <BigStat icon="home-city-outline" color="#7367F0" num={27} label="Properties"     sub="across 11 owners" />
      <BigStat icon="calendar-check"    color="#28C76F" num={18} label="Active bookings" sub="this week" />
      <BigStat icon="swap-horizontal"   color="#FF9F43" num={4}  label="Turn cleanings"  sub="2 urgent" />
      <BigStat icon="broom"             color="#00CFE8" num={3}  label="Active cleaners" sub="of 12 total" />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <Card padding={0}>
        <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F2F2F5' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Recent bookings</div>
          <Button variant="text">View all</Button>
        </div>
        {[
          { prop: '1600 Pennsylvania Ave NW', owner: 'Soren V.',   dates: 'Apr 11 → May 8',  status: 'Scheduled' },
          { prop: '32540 Wishing Well Trl B', owner: 'Soren V.',   dates: 'Apr 22 → May 16', status: 'Pending'   },
          { prop: 'Hall of Justice',          owner: 'Bruce W.',   dates: 'Apr 14 → Apr 16', status: 'In Progress' },
          { prop: '1194 Mulberry Dr',         owner: 'Ana M.',     dates: 'Apr 27 → Apr 30', status: 'Pending'   },
        ].map((b, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr auto', padding: '12px 20px', borderBottom: '1px solid #F5F5F9', fontSize: 13, alignItems: 'center', gap: 12 }}>
            <div style={{ fontWeight: 500 }}>{b.prop}</div>
            <div style={{ color: 'rgba(46,38,61,.6)' }}>{b.owner}</div>
            <div style={{ color: 'rgba(46,38,61,.72)' }}>{b.dates}</div>
            <Pill tone={b.status === 'In Progress' ? 'info' : b.status === 'Scheduled' ? 'success' : 'warning'}>{b.status}</Pill>
          </div>
        ))}
      </Card>
      <Card padding={0}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F2F2F5', fontSize: 14, fontWeight: 600 }}>Cleaner availability</div>
        {[
          { name: 'Maria Delgado', status: 'Available', load: 2 },
          { name: 'Darnell Pike',  status: 'On site',   load: 1 },
          { name: 'Anika Brown',   status: 'Available', load: 3 },
          { name: 'Jenny Ko',      status: 'Off today', load: 0 },
        ].map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #F5F5F9' }}>
            <Avatar initials={c.name.split(' ').map(s => s[0]).join('')} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(46,38,61,.5)' }}>{c.load} assigned today</div>
            </div>
            <Pill tone={c.status === 'Available' ? 'success' : c.status === 'On site' ? 'info' : 'default'}>{c.status}</Pill>
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const AllProperties = () => {
  const rows = [
    { addr: '32540 Wishing Well Trl B', owner: 'Soren Vinson',   city: 'Cathedral City, CA', status: 'Active',   color: '#7367F0' },
    { addr: '1600 Pennsylvania Ave NW', owner: 'Soren Vinson',   city: 'Washington, DC',     status: 'Active',   color: '#7367F0' },
    { addr: 'Hall of Justice',          owner: 'Bruce Wayne',    city: 'Gotham, NJ',         status: 'Active',   color: '#FF9F43' },
    { addr: '1600 Pennsylvania Ave NW, B', owner: 'Ana Maria',   city: 'Washington, DC',     status: 'Active',   color: '#EA5455' },
    { addr: '666 gtgt, b',              owner: 'Test Account',   city: 'Los Angeles, CA',    status: 'Inactive', color: '#9155FD' },
    { addr: '1194 Mulberry Dr',         owner: 'Ana Maria',      city: 'San Marcos, CA',     status: 'Active',   color: '#FF9F43' },
    { addr: '1600 Pennsylvania Ave NW', owner: 'Soren Vinson',   city: 'Washington, DC',     status: 'Inactive', color: '#28C76F' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>All Properties</h1>
          <div style={{ fontSize: 13, color: 'rgba(46,38,61,.5)', marginTop: 4 }}>Every property across every owner</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outlined" icon="export">Export</Button>
          <Button variant="primary" icon="plus">Add Property</Button>
        </div>
      </div>
      <Card padding={0}>
        <div style={{ padding: 14, borderBottom: '1px solid #F2F2F5', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #EDECF2', borderRadius: 2, background: '#FBFBFC' }}>
            <Icon name="magnify" size={16} color="rgba(46,38,61,.5)" />
            <input placeholder="Search address or owner…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1, fontFamily: 'inherit' }} />
          </div>
          <Pill tone="primary">All</Pill>
          <Pill tone="primary" outlined>Active</Pill>
          <Pill tone="primary" outlined>Inactive</Pill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto auto', padding: '12px 20px', fontSize: 12, color: 'rgba(46,38,61,.6)', borderBottom: '1px solid #F2F2F5' }}>
          <div>Property</div><div>Owner</div><div>Location</div><div>Status</div><div></div>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto auto', gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F5F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 28, background: r.color, borderRadius: 1 }} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.addr}</div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.72)' }}>{r.owner}</div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)' }}>{r.city}</div>
            <Pill tone={r.status === 'Active' ? 'success' : 'error'}>{r.status}</Pill>
            <Icon name="dots-vertical" size={16} color="rgba(46,38,61,.4)" />
          </div>
        ))}
      </Card>
    </div>
  );
};

const Cleaners = () => {
  const rows = [
    { name: 'Maria Delgado',  email: 'maria.d@claro.co',  phone: '+1 (555) 221-0098', status: 'Active',   jobs: 42, color: '#7367F0' },
    { name: 'Darnell Pike',   email: 'darnell@claro.co',  phone: '+1 (555) 118-2244', status: 'Active',   jobs: 28, color: '#28C76F' },
    { name: 'Anika Brown',    email: 'anika.b@claro.co',  phone: '+1 (555) 442-7711', status: 'Active',   jobs: 64, color: '#FF9F43' },
    { name: 'Jenny Ko',       email: 'jenny.k@claro.co',  phone: '+1 (555) 890-3120', status: 'Inactive', jobs: 12, color: '#00CFE8' },
    { name: 'Luis Fernandez', email: 'luis.f@claro.co',   phone: '+1 (555) 776-5501', status: 'Active',   jobs: 37, color: '#9155FD' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Cleaners</h1>
          <div style={{ fontSize: 13, color: 'rgba(46,38,61,.5)', marginTop: 4 }}>Assign, schedule and track cleaner availability</div>
        </div>
        <Button variant="primary" icon="account-plus-outline">Add Cleaner</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <BigStat icon="broom" color="#7367F0" num={12} label="Total cleaners" />
        <BigStat icon="check-circle" color="#28C76F" num={9} label="Active" />
        <BigStat icon="clock-outline" color="#FF9F43" num={183} label="Jobs this month" />
        <BigStat icon="star-outline" color="#00CFE8" num="4.8" label="Avg. rating" />
      </div>
      <Card padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 1.2fr auto auto auto', padding: '12px 20px', fontSize: 12, color: 'rgba(46,38,61,.6)', borderBottom: '1px solid #F2F2F5' }}>
          <div>Cleaner</div><div>Contact</div><div>Phone</div><div>Jobs</div><div>Status</div><div></div>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 1.2fr auto auto auto', gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F5F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={r.name.split(' ').map(s => s[0]).join('')} bg={r.color} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.72)' }}>{r.email}</div>
            <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)' }}>{r.phone}</div>
            <div style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{r.jobs}</div>
            <Pill tone={r.status === 'Active' ? 'success' : 'default'}>{r.status}</Pill>
            <Icon name="dots-vertical" size={16} color="rgba(46,38,61,.4)" />
          </div>
        ))}
      </Card>
    </div>
  );
};

const Users = () => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Users</h1>
        <div style={{ fontSize: 13, color: 'rgba(46,38,61,.5)', marginTop: 4 }}>All property owners, administrators and cleaners</div>
      </div>
      <Button variant="primary" icon="plus">Invite User</Button>
    </div>
    <Card padding={0}>
      <div style={{ padding: 14, borderBottom: '1px solid #F2F2F5', display: 'flex', gap: 8 }}>
        {['All', 'Owners', 'Cleaners', 'Administrators'].map((f, i) => (
          <Pill key={f} tone="primary" outlined={i !== 0}>{f}</Pill>
        ))}
      </div>
      {[
        { name: 'Soren Vinson',    role: 'Owner',    email: 'soren@example.com',  props: 14, color: '#7367F0' },
        { name: 'Ana Maria Vinson',role: 'Admin',    email: 'ana@claro.co',       props: '—', color: '#EA5455' },
        { name: 'Bruce Wayne',     role: 'Owner',    email: 'bwayne@wayne.co',    props: 3,  color: '#FF9F43' },
        { name: 'Maria Delgado',   role: 'Cleaner',  email: 'maria.d@claro.co',   props: '—', color: '#28C76F' },
        { name: 'Test Account',    role: 'Owner',    email: 'test@example.com',   props: 1,  color: '#9155FD' },
      ].map((u, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr auto 1.6fr auto auto', gap: 14, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F5F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar initials={u.name.split(' ').map(s => s[0]).join('').slice(0,2)} bg={u.color} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
          </div>
          <Pill tone={u.role === 'Admin' ? 'error' : u.role === 'Owner' ? 'primary' : 'info'} outlined>{u.role}</Pill>
          <div style={{ fontSize: 13, color: 'rgba(46,38,61,.72)' }}>{u.email}</div>
          <div style={{ fontSize: 13, color: 'rgba(46,38,61,.6)', fontVariantNumeric: 'tabular-nums' }}>{u.props} properties</div>
          <Icon name="dots-vertical" size={16} color="rgba(46,38,61,.4)" />
        </div>
      ))}
    </Card>
  </div>
);

Object.assign(window, { Dashboard, AllProperties, Cleaners, Users });
