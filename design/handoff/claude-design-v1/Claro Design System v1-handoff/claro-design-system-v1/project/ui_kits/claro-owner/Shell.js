/* global React, Icon, Avatar, IconBtn */
// useState provided by shared.js
const NAV = [
  { id: 'overview',   label: 'Overview',          icon: 'view-dashboard-outline' },
  { id: 'calendar',   label: 'Calendar',          icon: 'calendar' },
  { id: 'checkins',   label: 'Check-ins & Turns', icon: 'clipboard-check-outline', badge: 'SOON' },
  { id: 'bookings',   label: 'Bookings',          icon: 'format-list-bulleted' },
  { id: 'properties', label: 'Properties',        icon: 'home-outline' },
  { id: 'reports',    label: 'Reports',           icon: 'chart-line' },
];
const ACCT = [
  { id: 'vue',      label: 'Vue Practice', icon: 'alpha-v-box-outline' },
  { id: 'settings', label: 'Settings',     icon: 'cog-outline' },
];

const AppBar = ({ onToggleDrawer, drawerOpen }) => (
  <div style={{
    height: 64, background: '#fff', borderBottom: '1px solid #F0F0F3',
    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14,
    position: 'sticky', top: 0, zIndex: 10,
  }}>
    <div style={{ fontWeight: 600, fontSize: 22, color: '#7367F0', letterSpacing: '-0.01em' }}>Claro</div>
    <IconBtn icon={drawerOpen ? 'menu-open' : 'menu'} active={drawerOpen} onClick={onToggleDrawer} />
    <div style={{ flex: 1 }} />
    <IconBtn icon="weather-sunny" />
    <IconBtn icon="star-outline" />
    <IconBtn icon="bell-outline" />
    <Avatar />
  </div>
);

const NavItem = ({ item, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
    borderRadius: 2, margin: '1px 8px',
    background: active ? '#F0EEFF' : 'transparent',
    color: active ? '#7367F0' : 'rgba(46,38,61,.72)',
    fontWeight: 500, fontSize: 13, cursor: 'pointer',
    transition: 'background .2s ease, color .2s ease',
  }}>
    <Icon name={item.icon} size={18} />
    {item.label}
    {item.badge && (
      <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: '.06em', padding: '2px 8px', borderRadius: 9999, background: 'rgba(40,199,111,.16)', color: '#1fa85d', fontWeight: 600 }}>{item.badge}</span>
    )}
  </div>
);

const Drawer = ({ route, setRoute, open }) => (
  <div style={{
    width: open ? 260 : 0, minWidth: open ? 260 : 0, background: '#fff',
    borderRight: '1px solid #F0F0F3', overflow: 'hidden',
    transition: 'width .25s ease, min-width .25s ease',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ width: 260, flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
      <div style={{ fontSize: 10, color: 'rgba(46,38,61,.5)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '6px 20px' }}>Navigation</div>
      {NAV.map(item => <NavItem key={item.id} item={item} active={route === item.id} onClick={() => setRoute(item.id)} />)}
      <div style={{ fontSize: 10, color: 'rgba(46,38,61,.5)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '16px 20px 6px', marginTop: 6, borderTop: '1px solid #F0F0F3' }}>Account</div>
      {ACCT.map(item => <NavItem key={item.id} item={item} active={route === item.id} onClick={() => setRoute(item.id)} />)}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #F0F0F3' }}>
        <Avatar />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#2E263D' }}>Soren Vinson</div>
          <div style={{ fontSize: 11, color: 'rgba(46,38,61,.5)' }}>sorenv654@gmail.com</div>
        </div>
      </div>
    </div>
  </div>
);

const Shell = ({ route, setRoute, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F5F9' }}>
      <AppBar drawerOpen={open} onToggleDrawer={() => setOpen(!open)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Drawer route={route} setRoute={setRoute} open={open} />
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

Object.assign(window, { Shell });
