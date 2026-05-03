// ════════════════════════════════════════════════════════════════════════
// B.1a Cover + grid editorial · 3 sub-variants
// Reuses OV, PROPS, EVENTS, NOW_HOUR, NOW_MIN, NEEDSACTION, typeLabel,
// _enrich, PropPhoto from screens-property-overview-b1variants.jsx
// ════════════════════════════════════════════════════════════════════════

const AMBER_B1ED = '#E8A33D';
const INK_B1ED   = '#2E263D';
const SERIF_B1ED = "'Fraunces','Playfair Display','Georgia',serif";

// ════════════════════════════════════════════════════════════════════════
// B.1a-i — NEWSPAPER MASTHEAD
// Serif-heavy editorial. Cover is a wide hero with dateline + column rule.
// Below: compact "classifieds" rows in a 2-col block, all-text once you
// pass the cover. Most editorial of the three.
// ════════════════════════════════════════════════════════════════════════
function ScreenBv1a_i() {
  const enriched = _enrich();
  const featured = enriched[0];
  const rest = enriched.slice(1);

  return (
    <div style={{
      height:'100%', width:'100%', display:'flex', flexDirection:'column',
      background:'#F4EFE6', fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      <div style={{ height:54, flexShrink:0 }} />

      {/* Masthead */}
      <div style={{ padding:'10px 18px 6px', textAlign:'center', borderBottom:`3px double ${INK_B1ED}` }}>
        <div style={{ fontSize:9, fontWeight:700, color:OV.fg3, letterSpacing:'0.32em', textTransform:'uppercase' }}>
          Vol. XXVI · No. 117 · Sat Apr 26
        </div>
        <div style={{ fontFamily:SERIF_B1ED, fontSize:36, fontWeight:900, color:INK_B1ED,
                      letterSpacing:'-0.02em', lineHeight:1, margin:'2px 0 4px',
                      fontStyle:'italic' }}>
          The Daily
        </div>
        <div style={{ fontSize:10, fontWeight:600, color:OV.fg3, letterSpacing:'0.18em', textTransform:'uppercase' }}>
          {PROPS.length} properties · {NEEDSACTION.length} need action
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px 36px' }}>
        {/* Hero cover — wide, photo + serif headline */}
        {featured && (
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
                          paddingBottom:6, borderBottom:`1px solid ${INK_B1ED}33` }}>
              <div style={{ fontSize:9, fontWeight:700, color:AMBER_B1ED, letterSpacing:'0.2em', textTransform:'uppercase' }}>Front Page</div>
              <div style={{ fontSize:9, fontWeight:600, color:OV.fg3, letterSpacing:'0.16em', textTransform:'uppercase' }}>Lead story</div>
            </div>
            <PropPhoto p={featured} style={{ height:170, marginTop:8 }}>
              {featured.hasUrgent && (
                <div style={{ position:'absolute', top:10, right:10,
                              padding:'4px 9px', background:'#fff', color:AMBER_B1ED,
                              fontSize:9, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase',
                              border:`1px solid ${AMBER_B1ED}` }}>
                  Breaking
                </div>
              )}
            </PropPhoto>
            <div style={{ paddingTop:10 }}>
              <div style={{ fontSize:9, fontWeight:700, color:OV.fg3, letterSpacing:'0.18em', textTransform:'uppercase' }}>
                {featured.city} bureau · 9:47 AM
              </div>
              <div style={{ fontFamily:SERIF_B1ED, fontSize:24, fontWeight:800, color:INK_B1ED,
                            letterSpacing:'-0.02em', lineHeight:1.05, marginTop:4 }}>
                {featured.hasUrgent
                  ? `No cleaner yet at ${featured.street}.`
                  : `${featured.street} runs a turn today.`}
              </div>
              <div style={{ fontFamily:SERIF_B1ED, fontSize:13, fontStyle:'italic', color:OV.fg2,
                            lineHeight:1.4, marginTop:6 }}>
                {featured.today.length > 0 && (
                  <>
                    {featured.today[0].time} · {typeLabel(featured.today[0].type)} ·
                    {' '}{featured.today[0].guests} guests expected.
                  </>
                )}
              </div>
              {featured.hasUrgent && (
                <button style={{
                  marginTop:10, padding:'10px 16px', background:INK_B1ED, color:'#fff',
                  border:'none', borderRadius:0, fontSize:11, fontWeight:700, cursor:'pointer',
                  letterSpacing:'0.14em', textTransform:'uppercase',
                }}>Find a cleaner →</button>
              )}
            </div>
          </div>
        )}

        {/* Section break */}
        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 12px' }}>
          <div style={{ flex:1, height:1, background:INK_B1ED, opacity:0.4 }}/>
          <div style={{ fontFamily:SERIF_B1ED, fontStyle:'italic', fontSize:13, fontWeight:700, color:INK_B1ED }}>Inside</div>
          <div style={{ flex:1, height:1, background:INK_B1ED, opacity:0.4 }}/>
        </div>

        {/* Classifieds — 2-col compact rows, all-text */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 14px' }}>
          {rest.map(p => {
            const ev = p.today[0];
            return (
              <div key={p.id} style={{
                paddingBottom:10, borderBottom:`1px dotted ${INK_B1ED}55`,
              }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                  {p.hasUrgent && (
                    <div style={{ width:6, height:6, background:AMBER_B1ED, marginTop:1, flexShrink:0 }}/>
                  )}
                  <div style={{ fontFamily:SERIF_B1ED, fontSize:14, fontWeight:800, color:INK_B1ED,
                                letterSpacing:'-0.01em', lineHeight:1.15 }}>
                    {p.street}
                  </div>
                </div>
                <div style={{ fontSize:9, fontWeight:700, color:OV.fg3, letterSpacing:'0.14em',
                              textTransform:'uppercase', marginTop:2 }}>
                  {p.city}
                </div>
                <div style={{ fontFamily:SERIF_B1ED, fontStyle:'italic', fontSize:11, color:OV.fg2,
                              marginTop:6, lineHeight:1.35 }}>
                  {ev
                    ? `${ev.time} · ${typeLabel(ev.type).toLowerCase()}${ev.cleaner ? `, ${ev.cleaner}` : '. No cleaner.'}`
                    : 'Nothing scheduled.'}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign:'center', marginTop:24, fontSize:9, fontWeight:700, color:OV.fg3,
                      letterSpacing:'0.32em', textTransform:'uppercase' }}>
          — End of edition —
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// B.1a-ii — VERTICAL SPLIT COVER
// Cover keeps full width but splits horizontally: left = photo, right =
// today's events stack. Grid below is single-column horizontal cards
// (image + meta side-by-side), more text-forward, less photo-dominant.
// ════════════════════════════════════════════════════════════════════════
function ScreenBv1a_ii() {
  const enriched = _enrich();
  const featured = enriched[0];
  const rest = enriched.slice(1);

  return (
    <div style={{
      height:'100%', width:'100%', display:'flex', flexDirection:'column',
      background:'#FAFAFB', fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      <div style={{ height:54, flexShrink:0 }} />

      {/* Compact masthead */}
      <div style={{ padding:'12px 18px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:OV.fg3, letterSpacing:'0.16em', textTransform:'uppercase' }}>Sat · Apr 26 · 9:47</div>
            <div style={{ fontSize:24, fontWeight:800, color:INK_B1ED, letterSpacing:'-0.025em', marginTop:2 }}>Today</div>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center', padding:'5px 9px',
                        background:`${AMBER_B1ED}1a`, border:`1px solid ${AMBER_B1ED}66` }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:AMBER_B1ED }}/>
            <span style={{ fontSize:10, fontWeight:700, color:AMBER_B1ED, letterSpacing:'0.1em', textTransform:'uppercase' }}>
              {NEEDSACTION.length} action
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 14px 36px' }}>
        {/* Cover — split horizontally */}
        {featured && (
          <div style={{
            background:'#fff',
            border: featured.hasUrgent ? `2px solid ${AMBER_B1ED}` : `1px solid ${OV.divider}`,
            boxShadow: featured.hasUrgent ? `0 6px 20px ${AMBER_B1ED}28` : '0 2px 6px rgba(0,0,0,0.05)',
            display:'flex', height:184, marginBottom:16,
          }}>
            {/* Left: photo */}
            <div style={{ width:'48%', flexShrink:0, position:'relative' }}>
              <PropPhoto p={featured} style={{ position:'absolute', inset:0 }}>
                <div style={{ position:'absolute', inset:0,
                              background:'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)' }}/>
                <div style={{ position:'absolute', left:10, bottom:8, right:10, color:'#fff',
                              textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>
                  <div style={{ fontSize:9, fontWeight:700, opacity:0.9, letterSpacing:'0.12em', textTransform:'uppercase' }}>{featured.city}</div>
                  <div style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.01em', marginTop:1, lineHeight:1.1 }}>{featured.street}</div>
                </div>
              </PropPhoto>
            </div>

            {/* Right: events stack */}
            <div style={{ flex:1, padding:'14px 14px 12px', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {featured.hasUrgent && <div style={{ width:6, height:6, borderRadius:'50%', background:AMBER_B1ED }}/>}
                <div style={{ fontSize:9, fontWeight:800, color: featured.hasUrgent ? AMBER_B1ED : OV.fg3,
                              letterSpacing:'0.16em', textTransform:'uppercase' }}>
                  {featured.hasUrgent ? 'Action needed' : 'Active today'}
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:OV.fg3, letterSpacing:'0.04em',
                            textTransform:'uppercase', marginTop:8 }}>Today</div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                {featured.today.map(ev => (
                  <div key={ev.id} style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:INK_B1ED, fontVariantNumeric:'tabular-nums',
                                  letterSpacing:'-0.01em', minWidth:42 }}>{ev.time}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:INK_B1ED, letterSpacing:'-0.01em' }}>{typeLabel(ev.type)}</div>
                      <div style={{ fontSize:10, color: ev.cleaner ? OV.fg3 : AMBER_B1ED, marginTop:1,
                                    fontWeight: ev.cleaner ? 500 : 700,
                                    letterSpacing: ev.cleaner ? 'normal' : '0.06em',
                                    textTransform: ev.cleaner ? 'none' : 'uppercase' }}>
                        {ev.cleaner ? `${ev.cleaner} · ${ev.guests}g` : `No cleaner · ${ev.guests}g`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {featured.hasUrgent && (
                <button style={{
                  width:'100%', padding:'9px', background:AMBER_B1ED, color:'#fff',
                  border:'none', borderRadius:2, fontSize:10, fontWeight:800, cursor:'pointer',
                  letterSpacing:'0.1em', textTransform:'uppercase', marginTop:8,
                }}>Resolve</button>
              )}
            </div>
          </div>
        )}

        {/* Section label */}
        <div style={{ fontSize:10, fontWeight:800, color:OV.fg3, letterSpacing:'0.18em',
                      textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>
          The rest of today
        </div>

        {/* Single-col horizontal cards — image left, meta right */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rest.map(p => {
            const ev = p.today[0];
            return (
              <div key={p.id} style={{
                display:'flex', background:'#fff',
                border: p.hasUrgent ? `1.5px solid ${AMBER_B1ED}` : `1px solid ${OV.divider}`,
                height:80,
              }}>
                <PropPhoto p={p} style={{ width:96, flexShrink:0 }}/>
                <div style={{ flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:INK_B1ED, letterSpacing:'-0.01em',
                                  overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{p.street}</div>
                    <div style={{ fontSize:9, fontWeight:600, color:OV.fg3, letterSpacing:'0.1em',
                                  textTransform:'uppercase', marginTop:1 }}>{p.city}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {ev ? (
                      <>
                        <span style={{ fontSize:11, fontWeight:700, color:INK_B1ED, fontVariantNumeric:'tabular-nums' }}>{ev.time}</span>
                        <span style={{ fontSize:10, color:OV.fg2 }}>{typeLabel(ev.type)}</span>
                        {!ev.cleaner && (
                          <span style={{ marginLeft:'auto', fontSize:9, fontWeight:800, color:AMBER_B1ED, letterSpacing:'0.1em', textTransform:'uppercase' }}>No cleaner</span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize:10, color:OV.fg3, fontStyle:'italic' }}>Quiet today</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// B.1a-iii — STACKED HERO CAROUSEL
// Promotes EVERY urgent property to a hero card. They stack vertically,
// each its own "cover." Quiet/non-urgent properties shrink to a thin
// horizontal chip strip at the bottom — out of the way but visible.
// ════════════════════════════════════════════════════════════════════════
function ScreenBv1a_iii() {
  const enriched = _enrich();
  const heroes = enriched.filter(p => p.hasUrgent || p.activity);
  const quiet  = enriched.filter(p => !p.hasUrgent && !p.activity);

  return (
    <div style={{
      height:'100%', width:'100%', display:'flex', flexDirection:'column',
      background:'#F5F2EC', fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      <div style={{ height:54, flexShrink:0 }} />

      <div style={{ padding:'14px 18px 10px' }}>
        <div style={{ fontSize:10, fontWeight:700, color:OV.fg3, letterSpacing:'0.18em', textTransform:'uppercase' }}>Saturday · Apr 26</div>
        <div style={{ fontSize:28, fontWeight:800, color:INK_B1ED, letterSpacing:'-0.03em', marginTop:2 }}>
          {heroes.length} stories today
        </div>
        <div style={{ fontSize:12, color:OV.fg2, marginTop:4 }}>
          {NEEDSACTION.length > 0
            ? <><b style={{ color:AMBER_B1ED }}>{NEEDSACTION.length} need you</b> · {heroes.length - NEEDSACTION.length} active · {quiet.length} quiet</>
            : <>{heroes.length} active · {quiet.length} quiet</>}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'8px 14px 36px' }}>
        {/* Stacked heroes */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {heroes.map((p, i) => (
            <div key={p.id} style={{
              background:'#fff',
              border: p.hasUrgent ? `2px solid ${AMBER_B1ED}` : `1px solid ${OV.divider}`,
              boxShadow: p.hasUrgent ? `0 8px 24px ${AMBER_B1ED}28` : '0 4px 14px rgba(0,0,0,0.06)',
              overflow:'hidden',
            }}>
              <div style={{ position:'relative' }}>
                <PropPhoto p={p} style={{ height:148 }}>
                  <div style={{ position:'absolute', inset:0,
                                background:'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)' }}/>
                  {/* Story number ribbon */}
                  <div style={{
                    position:'absolute', top:0, left:0, padding:'5px 10px',
                    background:'#fff', color:INK_B1ED,
                    fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
                  }}>
                    Story {String(i + 1).padStart(2, '0')}
                  </div>
                  {p.hasUrgent && (
                    <div style={{ position:'absolute', top:10, right:10,
                                  padding:'4px 9px', background:AMBER_B1ED, color:'#fff',
                                  fontSize:9, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase' }}>
                      ! Action
                    </div>
                  )}
                  <div style={{ position:'absolute', left:14, bottom:12, right:14, color:'#fff', textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
                    <div style={{ fontSize:10, fontWeight:700, opacity:0.9, letterSpacing:'0.12em', textTransform:'uppercase' }}>{p.city}</div>
                    <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginTop:1 }}>{p.street}</div>
                  </div>
                </PropPhoto>
              </div>
              <div style={{ padding:'12px 14px 14px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {p.today.map(ev => (
                    <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:INK_B1ED, fontVariantNumeric:'tabular-nums', minWidth:42 }}>{ev.time}</span>
                      <span style={{ fontSize:12, color:OV.fg2, flex:1 }}>{typeLabel(ev.type)} · {ev.guests} guests</span>
                      {!ev.cleaner ? (
                        <span style={{ fontSize:9, fontWeight:800, color:AMBER_B1ED, letterSpacing:'0.1em', textTransform:'uppercase' }}>No cleaner</span>
                      ) : (
                        <span style={{ fontSize:10, color:OV.fg3 }}>{ev.cleaner}</span>
                      )}
                    </div>
                  ))}
                </div>
                {p.hasUrgent && (
                  <button style={{
                    width:'100%', marginTop:10, padding:'11px', background:AMBER_B1ED, color:'#fff',
                    border:'none', borderRadius:2, fontSize:11, fontWeight:800, cursor:'pointer',
                    letterSpacing:'0.1em', textTransform:'uppercase',
                  }}>Find a cleaner</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quiet strip — horizontal chips */}
        {quiet.length > 0 && (
          <div style={{ marginTop:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:OV.fg3, letterSpacing:'0.18em',
                          textTransform:'uppercase', marginBottom:8 }}>
              Quiet today · {quiet.length}
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
              {quiet.map(p => (
                <div key={p.id} style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:8,
                  padding:'8px 12px 8px 8px',
                  background:'#fff', border:`1px solid ${OV.divider}`,
                }}>
                  <PropPhoto p={p} style={{ width:32, height:32, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:INK_B1ED, letterSpacing:'-0.01em' }}>{p.street}</div>
                    <div style={{ fontSize:9, color:OV.fg3, letterSpacing:'0.06em', textTransform:'uppercase', marginTop:1 }}>{p.city}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// B.1a-iv — STACKED COVER + HORIZONTAL ROWS (REVISED)
// Full-width photo on top (160px). Events strip below: event type leads
// left, time right-aligned secondary. Mini-cards 88px, type-first.
// ════════════════════════════════════════════════════════════════════════
function ScreenBv1a_iv() {
  const enriched = _enrich();
  const featured = enriched[0];
  const rest = enriched.slice(1);

  return (
    <div style={{
      height:'100%', width:'100%', display:'flex', flexDirection:'column',
      background:'#FAFAFB', fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      <div style={{ height:54, flexShrink:0 }} />

      {/* Masthead */}
      <div style={{ padding:'12px 18px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:OV.fg3, letterSpacing:'0.16em', textTransform:'uppercase' }}>
              Sat · Apr 26 · 9:47
            </div>
            <div style={{ fontSize:24, fontWeight:800, color:INK_B1ED, letterSpacing:'-0.025em', marginTop:2 }}>
              Today
            </div>
          </div>
          {NEEDSACTION.length > 0 && (
            <div style={{ display:'flex', gap:6, alignItems:'center', padding:'5px 9px',
                          background:`${AMBER_B1ED}1a`, border:`1px solid ${AMBER_B1ED}66` }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:AMBER_B1ED }}/>
              <span style={{ fontSize:10, fontWeight:700, color:AMBER_B1ED, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {NEEDSACTION.length} action
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 14px 36px' }}>

        {/* ── Cover card ── */}
        {featured && (
          <div style={{
            background:'#fff',
            border: featured.hasUrgent ? `1.5px solid ${AMBER_B1ED}` : `1px solid ${OV.divider}`,
            boxShadow: featured.hasUrgent ? `0 6px 20px ${AMBER_B1ED}33` : '0 2px 6px rgba(0,0,0,0.05)',
            marginBottom:16,
            overflow:'hidden',
          }}>
            {/* Full-width photo */}
            <PropPhoto p={featured} style={{ height:160, width:'100%' }}>
              <div style={{ position:'absolute', inset:0,
                            background:'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.42) 100%)' }}/>
              {featured.hasUrgent && (
                <div style={{
                  position:'absolute', top:10, left:10,
                  padding:'3px 9px', background:AMBER_B1ED, color:'#fff',
                  fontSize:9, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase',
                }}>
                  Action needed
                </div>
              )}
              <div style={{ position:'absolute', left:12, bottom:10, right:12, color:'#fff' }}>
                <div style={{ fontSize:9, fontWeight:700, opacity:0.9, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                  {featured.city}
                </div>
                <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.01em', marginTop:1, lineHeight:1.1,
                              textShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>
                  {featured.street}
                </div>
              </div>
            </PropPhoto>

            {/* Events strip */}
            <div style={{ padding:'12px 14px 12px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:OV.fg3, letterSpacing:'0.12em',
                            textTransform:'uppercase', marginBottom:8 }}>Today</div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {featured.today.map((ev, i) => (
                  <React.Fragment key={ev.id}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'6px 0' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:800, color:INK_B1ED, letterSpacing:'-0.01em' }}>
                          {typeLabel(ev.type)}
                        </div>
                        {!ev.cleaner ? (
                          <div style={{ fontSize:9, fontWeight:700, color:AMBER_B1ED,
                                        letterSpacing:'0.07em', textTransform:'uppercase', marginTop:2 }}>
                            No cleaner · {ev.guests}g
                          </div>
                        ) : (
                          <div style={{ fontSize:9, fontWeight:500, color:OV.fg3, marginTop:2 }}>
                            {ev.cleaner}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:OV.fg3, fontVariantNumeric:'tabular-nums' }}>
                        {ev.time}
                      </span>
                    </div>
                    {i < featured.today.length - 1 && (
                      <div style={{ height:1, background:OV.divider }} />
                    )}
                  </React.Fragment>
                ))}
                {featured.today.length === 0 && (
                  <div style={{ fontSize:12, color:OV.fg3, padding:'4px 0' }}>
                    Nothing scheduled today
                  </div>
                )}
              </div>
              {featured.hasUrgent && (
                <button style={{
                  width:'100%', marginTop:10, padding:'9px',
                  background:AMBER_B1ED, color:'#fff',
                  border:'none', borderRadius:2,
                  fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase',
                  cursor:'pointer',
                }}>Resolve</button>
              )}
            </div>
          </div>
        )}

        {/* ── Section label ── */}
        <div style={{ fontSize:10, fontWeight:800, color:OV.fg3, letterSpacing:'0.18em',
                      textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>
          The rest of today
        </div>

        {/* ── Mini-cards ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rest.map(p => {
            const ev = p.today[0];
            return (
              <div key={p.id} style={{
                display:'flex', background:'#fff', height:88,
                border: p.hasUrgent ? `1.5px solid ${AMBER_B1ED}` : `1px solid ${OV.divider}`,
                overflow:'hidden',
              }}>
                <PropPhoto p={p} style={{ width:96, flexShrink:0 }}/>
                <div style={{ flex:1, padding:'11px 12px', display:'flex', flexDirection:'column',
                              justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:INK_B1ED, letterSpacing:'-0.01em',
                                  overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {p.street}
                    </div>
                    <div style={{ fontSize:9, fontWeight:600, color:OV.fg3, letterSpacing:'0.1em',
                                  textTransform:'uppercase', marginTop:1 }}>
                      {p.city}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {ev ? (
                      <>
                        <span style={{ fontSize:11, fontWeight:700, color:INK_B1ED, letterSpacing:'-0.01em' }}>
                          {typeLabel(ev.type)}
                        </span>
                        <span style={{ fontSize:11, fontWeight:600, color:OV.fg3, fontVariantNumeric:'tabular-nums' }}>
                          {ev.time}
                        </span>
                        {!ev.cleaner && (
                          <span style={{ marginLeft:'auto', fontSize:9, fontWeight:800, color:AMBER_B1ED,
                                         letterSpacing:'0.1em', textTransform:'uppercase' }}>
                            No cleaner
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize:10, color:OV.fg3 }}>Quiet today</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { ScreenBv1a_i, ScreenBv1a_ii, ScreenBv1a_iii, ScreenBv1a_iv });
