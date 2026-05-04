/* global React */
const { useState } = React;

const Icon = ({ name, size = 20, color = 'currentColor', style = {} }) => (
  <i className={`mdi mdi-${name}`} style={{ fontSize: size, color, lineHeight: 1, ...style }} />
);

const Avatar = ({ initials = 'SV', color = '#7367F0', size = 34, dot = true }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 600, position: 'relative', flexShrink: 0,
  }}>
    {initials}
    {dot && <span style={{ position: 'absolute', right: 0, bottom: 0, width: 8, height: 8, borderRadius: '50%', background: '#28C76F', border: '2px solid #fff' }} />}
  </div>
);

const Pill = ({ tone = 'neutral', outlined = false, children, style = {} }) => {
  const tones = {
    success: { bg: 'rgba(40,199,111,.16)', fg: '#1fa85d', br: '#28C76F' },
    warning: { bg: 'rgba(255,159,67,.16)', fg: '#cc7a2e', br: '#FF9F43' },
    error:   { bg: 'rgba(234,84,85,.16)',  fg: '#c44647', br: '#EA5455' },
    info:    { bg: 'rgba(0,207,232,.16)',  fg: '#00a7ba', br: '#00CFE8' },
    primary: { bg: 'rgba(115,103,240,.16)', fg: '#5E52EE', br: '#7367F0' },
    neutral: { bg: 'rgba(46,38,61,.08)',   fg: '#2E263D', br: '#E8E8E8' },
  };
  const t = tones[tone] || tones.neutral;
  return <span style={{
    display: 'inline-flex', padding: '3px 10px', borderRadius: 9999,
    fontSize: 11, fontWeight: 500, lineHeight: 1.4,
    background: outlined ? 'transparent' : t.bg,
    border: outlined ? `1px solid ${t.br}` : 'none',
    color: t.fg, ...style,
  }}>{children}</span>;
};

const Button = ({ variant = 'primary', icon, children, onClick, style = {} }) => {
  const variants = {
    primary:   { bg: '#7367F0', fg: '#fff', shadow: '0 2px 6px rgba(115,103,240,.35)', border: 'none' },
    secondary: { bg: 'rgba(0,207,232,.14)', fg: '#00a7ba', shadow: 'none', border: 'none' },
    outlined:  { bg: '#fff', fg: '#2E263D', shadow: 'none', border: '1px solid #E8E8E8' },
    danger:    { bg: 'rgba(234,84,85,.12)', fg: '#c44647', shadow: 'none', border: 'none' },
    ghost:     { bg: 'transparent', fg: '#7367F0', shadow: 'none', border: 'none' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
      borderRadius: 9999, fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
      background: v.bg, color: v.fg, border: v.border, boxShadow: v.shadow,
      cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease', ...style,
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
};

const IconBtn = ({ icon, onClick, active, size = 36 }) => (
  <button onClick={onClick} style={{
    width: size, height: size, borderRadius: 2,
    background: active ? 'rgba(115,103,240,.12)' : 'transparent',
    border: 'none', color: active ? '#7367F0' : 'rgba(46,38,61,.72)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  }}>
    <Icon name={icon} size={20} />
  </button>
);

const Card = ({ children, padding = 18, style = {} }) => (
  <div style={{
    background: '#fff', borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,.05)',
    padding, ...style,
  }}>{children}</div>
);

Object.assign(window, { Icon, Avatar, Pill, Button, IconBtn, Card });
