/* global React, Icon, Avatar, IconBtn */
// useState provided by shared.js
const ADMIN_NAV = [
  { id: 'dashboard',  label: 'Dashboard',    icon: 'view-dashboard-outline' },
  { id: 'calendar',   label: 'Calendar',     icon: 'calendar' },
  { id: 'bookings',   label: 'All Bookings', icon: 'calendar-multiple-check' },
  { id: 'properties', label: 'Properties',   icon: 'home-outline' },
  { id: 'reports',    label: 'Reports',      icon: 'chart-line' },
  { id: 'users',      label: 'Users',        icon: 'account-group-outline', expandable: true,
    children: [
      { id: 'cleaners',  label: 'Cleaners',        icon: 'broom' },
      { id: 'owners',    label: 'Property Owners', icon: 'account-tie-outline' },
      { id: 'admins',    label: 'Administrators',  icon: 'shield-account-outline' },
    ],
  },
];

const QUICK = [
  { id: 'new-booking',  label: 'New Booking',     icon: 'calendar-plus' },
  { id: 'add-property', label: 'Add Property',    icon: 'home-plus-outline' },
  { id: 'add-cleaner',  label: 'Add Cleaner',     icon: 'account-plus-outline' },
  { id: 'gen-report',   label: 'Generate Report', icon: 'file-chart-outline' },
  { id: 'sys-settings', label: 'System Settings', icon: 'cog-outline' },
];

const AdminAppBar = ({ onToggle, drawerOpen }) => (
  <div style={{ height: 64, background: '#fff', borderBottom: '1px solid #F0F0F3', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, position: 'sticky', top: 0, zIndex: 10 }}>
    <IconBtn icon={drawerOpen ? 'menu-open' : 'menu'} onClick={onToggle} />
    <div style={{ fontWeight: 600, fontSize: 22, color: '#7367F0', letterSpacing: '-0.01em' }}>Claro</div>
    <div style={{ flex: 1 }} />
    <IconBtn icon="weather-sunny" />
    <IconBtn icon="star-outline" />
    <IconBtn icon="bell-outline" />
    <Avatar initials="AM" />
  </div>
);

const NavItem = ({ item, active, onClick, depth = 0 }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: `9px ${12 + depth * 20}px`,
    borderRadius: 2, margin: '1px 8px',
    background: active ? '#F0EEFF' : 'transparent',
    color: active ? '#7367F0' : 'rgba(46,38,61,.72)',
    fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'background .2s ease, color .2s ease',
  }}>
    <Icon name={item.icon} size={18} />
    {item.label}
    {item.expandable && <Icon name="chevron-down" size={14} style={{ marginLeft: 'auto' }} />}
  </div>
);

const NavGroupTitle = ({ children }) => (
  <div style={{ fontSize: 10, color: 'rgba(46,38,61,.5)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '14px 20px 6px' }}>{children}</div>
);

const MiniStat = ({ num, label, tone = 'primary' }) => {
  const colors = { primary: '#7367F0', success: '#28C76F', warning: '#FF9F43', info: '#00CFE8' };
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid #EDECF2', borderRadius: 2, padding: '12px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: colors[tone], fontVariantNumeric: 'tabular-nums' }}>{num}</div>
      <div style={{ fontSize: 11, color: 'rgba(46,38,61,.6)' }}>{label}</div>
    </div>
  );
};

const AdminDrawer = ({ route, setRoute, open }) => (
  <div style={{ width: open ? 240 : 0, minWidth: open ? 240 : 0, background: '#fff', borderRight: '1px solid #F0F0F3', overflow: 'hidden', transition: 'width .25s ease, min-width .25s ease', display: 'flex', flexDirection: 'column' }}>
    <div style={{ width: 240, flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 0', overflow: 'auto' }}>
      <NavGroupTitle>Administration</NavGroupTitle>
      {ADMIN_NAV.map(item => (
        <React.Fragment key={item.id}>
          <NavItem item={item} active={route === item.id} onClick={() => setRoute(item.id)} />
          {item.children && route === item.id && item.children.map(c => (
            <NavItem key={c.id} item={c} depth={1} active={route === c.id} onClick={e => { e.stopPropagation(); setRoute(c.id); }} />
          ))}
        </React.Fragment>
      ))}
      <NavGroupTitle>Business Overview</NavGroupTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px' }}>
        <MiniStat num={27} label="Properties" tone="primary" />
        <MiniStat num={0}  label="Active"     tone="success" />
        <MiniStat num={0}  label="Urgent"     tone="warning" />
        <MiniStat num={3}  label="Cleaners"   tone="info" />
      </div>
      <NavGroupTitle>Quick Actions</NavGroupTitle>
      {QUICK.map(q => <NavItem key={q.id} item={q} onClick={() => {}} />)}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #F0F0F3' }}>
        <Avatar initials="AM" />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#2E263D' }}>ana maria vinson</div>
          <div style={{ fontSize: 11, color: 'rgba(46,38,61,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>sorenv653@gma…</div>
        </div>
        <Icon name="dots-vertical" size={16} color="rgba(46,38,61,.5)" style={{ marginLeft: 'auto' }} />
      </div>
    </div>
  </div>
);

const AdminShell = ({ route, setRoute, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F5F9' }}>
      <AdminAppBar onToggle={() => setOpen(!open)} drawerOpen={open} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AdminDrawer route={route} setRoute={setRoute} open={open} />
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

Object.assign(window, { AdminShell });
