# Materio Design System Import + Dashboard Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Materio-based design system in the pen file with atomic components, dashboard widgets, and two page compositions (Owner Dashboard + Property Timeline).

**Architecture:** All work happens in `design/materio-vuetify.lib.pen` using Pencil MCP `batch_design` operations. Atomic components are created as reusable nodes, widgets compose atomics via `ref` instances, and page layouts compose widgets into full grid arrangements. All use existing pen file variables (`$--primary`, `$--foreground`, `$--card`, `$--radius-sm`, etc.).

**Tech Stack:** Pencil MCP (batch_design, batch_get, get_screenshot, find_empty_space_on_canvas), Git

**Pen file:** `C:\Users\Soren\claro4\design\materio-vuetify.lib.pen`

---

## Key Pen Variables Reference

These variables are already defined in the pen file. Use `$--{name}` syntax in all operations.

| Variable | Usage |
|----------|-------|
| `$--primary` | Primary purple (#7367F0) |
| `$--primary-light` | Light primary |
| `$--foreground` | Main text color |
| `$--muted-foreground` | Secondary text |
| `$--card` | Card background (white) |
| `$--background` | Page background |
| `$--surface-variant` | Light grey surface |
| `$--radius-sm` | Small border radius |
| `$--radius-md` | Medium border radius |
| `$--font-weight-semibold` | 600 weight |
| `$--color-success` | Green |
| `$--color-warning` | Orange |
| `$--color-error` | Red |
| `$--color-info` | Cyan/blue |

Color hex values (for tonal backgrounds where variable opacity is needed):
- Primary: `#7367F0`, tonal bg: `#7367F020`
- Success: `#28C76F`, tonal bg: `#28C76F20`
- Warning: `#FF9F43`, tonal bg: `#FF9F4320`
- Error: `#EA5455`, tonal bg: `#EA545520`
- Info: `#00CFE8`, tonal bg: `#00CFE820`
- Secondary/grey: `#A8AAAE`, tonal bg: `#A8AAAE20`

---

## Phase 1a: Core Atomic Components

### Task 1: Button Variants

**Pencil operations target:** `design/materio-vuetify.lib.pen`

Creates 4 reusable button components showing Materio button variants.

- [ ] **Step 1: Find empty space on canvas**

Call `find_empty_space_on_canvas` with width=600, height=200, padding=60, direction="bottom".

- [ ] **Step 2: Create button container frame with placeholder**

```
container=I(document,{type:"frame",layout:"horizontal",name:"matButtons",gap:16,padding:24,placeholder:true,x:X,y:Y,width:600,height:"fit_content(200)"})
```

- [ ] **Step 3: Create Flat button (reusable)**

```
flatBtn=I(container,{type:"frame",layout:"horizontal",name:"matBtnFlat",reusable:true,alignItems:"center",justifyContent:"center",cornerRadius:"$--radius-sm",fill:"$--primary",padding:[10,24],gap:8})
flatTxt=I(flatBtn,{type:"text",name:"matBtnFlatTxt",content:"Button",fill:"#FFFFFF",fontFamily:"Inter",fontSize:14,fontWeight:"500"})
```

- [ ] **Step 4: Create Outlined button (reusable)**

```
outBtn=I(container,{type:"frame",layout:"horizontal",name:"matBtnOutlined",reusable:true,alignItems:"center",justifyContent:"center",cornerRadius:"$--radius-sm",stroke:{align:"inside",fill:"$--primary",thickness:1},padding:[10,24],gap:8})
outTxt=I(outBtn,{type:"text",name:"matBtnOutTxt",content:"Button",fill:"$--primary",fontFamily:"Inter",fontSize:14,fontWeight:"500"})
```

- [ ] **Step 5: Create Tonal button (reusable)**

```
tonBtn=I(container,{type:"frame",layout:"horizontal",name:"matBtnTonal",reusable:true,alignItems:"center",justifyContent:"center",cornerRadius:"$--radius-sm",fill:"#7367F020",padding:[10,24],gap:8})
tonTxt=I(tonBtn,{type:"text",name:"matBtnTonTxt",content:"Button",fill:"$--primary",fontFamily:"Inter",fontSize:14,fontWeight:"500"})
```

- [ ] **Step 6: Create Icon button (reusable)**

```
icnBtn=I(container,{type:"frame",layout:"horizontal",name:"matBtnIcon",reusable:true,alignItems:"center",justifyContent:"center",cornerRadius:18,fill:"#7367F020",width:36,height:36})
icnI=I(icnBtn,{type:"icon_font",name:"matBtnIconI",iconFontFamily:"Material Symbols Rounded",iconFontName:"add",width:20,height:20,fill:"$--primary"})
```

- [ ] **Step 7: Remove placeholder, take screenshot to verify**

```
U(container_id,{placeholder:false})
```

Call `get_screenshot` on the container node.

- [ ] **Step 8: Commit**

```bash
git add design/materio-vuetify.lib.pen
git commit -m "wrapper: add matButton atomic variants (flat/outlined/tonal/icon)"
```

---

### Task 2: Card Variants

Creates 3 reusable card components.

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=700, height=300. Horizontal layout, gap=24.

- [ ] **Step 2: Create Elevated card (reusable)**

```
elevCard=I(container,{type:"frame",layout:"vertical",name:"matCardElevated",reusable:true,cornerRadius:"$--radius-sm",fill:"$--card",effect:{type:"shadow",shadowType:"outer",offset:{x:0,y:2},blur:10,color:"#0000000D"},padding:20,gap:8,width:200,height:"fit_content"})
elevTitle=I(elevCard,{type:"text",content:"Card Title",fill:"$--foreground",fontFamily:"Inter",fontSize:16,fontWeight:"$--font-weight-semibold"})
elevBody=I(elevCard,{type:"text",content:"Card body text goes here with some sample content.",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:13,textGrowth:"fixed-width",width:"fill_container"})
```

- [ ] **Step 3: Create Tonal card (reusable)**

```
tonCard=I(container,{type:"frame",layout:"vertical",name:"matCardTonal",reusable:true,cornerRadius:"$--radius-sm",fill:"#7367F010",padding:20,gap:8,width:200,height:"fit_content"})
tonTitle=I(tonCard,{type:"text",content:"Card Title",fill:"$--foreground",fontFamily:"Inter",fontSize:16,fontWeight:"$--font-weight-semibold"})
tonBody=I(tonCard,{type:"text",content:"Tonal card for secondary content and info.",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:13,textGrowth:"fixed-width",width:"fill_container"})
```

- [ ] **Step 4: Create Outlined card (reusable)**

```
outCard=I(container,{type:"frame",layout:"vertical",name:"matCardOutlined",reusable:true,cornerRadius:"$--radius-sm",fill:"$--card",stroke:{align:"inside",fill:"#E8E8E8",thickness:1},padding:20,gap:8,width:200,height:"fit_content"})
outTitle=I(outCard,{type:"text",content:"Card Title",fill:"$--foreground",fontFamily:"Inter",fontSize:16,fontWeight:"$--font-weight-semibold"})
outBody=I(outCard,{type:"text",content:"Outlined card for form sections and containers.",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:13,textGrowth:"fixed-width",width:"fill_container"})
```

- [ ] **Step 5: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matCard atomic variants (elevated/tonal/outlined)"
```

---

### Task 3: Avatar Variants

Creates a row of colored avatars in two sizes plus a tonal variant.

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=500, height=150. Vertical layout, gap=16.

- [ ] **Step 2: Create 40px avatar row (5 colors)**

```
row40=I(container,{type:"frame",layout:"horizontal",name:"matAvatarRow40",gap:12})
```

For each color (primary/success/warning/error/info), create:
```
av=I(row40,{type:"frame",name:"matAvPrimary",reusable:true,width:40,height:40,cornerRadius:20,fill:"$--primary",alignItems:"center",justifyContent:"center"})
avT=I(av,{type:"text",content:"JD",fill:"#FFFFFF",fontFamily:"Inter",fontSize:14,fontWeight:"600"})
```

Repeat with `fill:"$--color-success"` / initials "AB", `fill:"$--color-warning"` / "CD", `fill:"$--color-error"` / "EF", `fill:"$--color-info"` / "GH".

- [ ] **Step 3: Create 32px avatar row**

Same pattern, width/height=32, cornerRadius=16, fontSize=11.

- [ ] **Step 4: Create tonal avatar variant**

```
avTonal=I(container,{type:"frame",name:"matAvTonal",reusable:true,width:40,height:40,cornerRadius:20,fill:"#7367F020",alignItems:"center",justifyContent:"center"})
avTonalT=I(avTonal,{type:"text",content:"JD",fill:"$--primary",fontFamily:"Inter",fontSize:14,fontWeight:"600"})
```

- [ ] **Step 5: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matAvatar atomic variants (colors/sizes/tonal)"
```

---

### Task 4: Chip (Status Set) + Badge

Creates booking status chips and an avatar badge.

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=600, height=120. Vertical layout, gap=12.

- [ ] **Step 2: Create status chip row**

```
chipRow=I(container,{type:"frame",layout:"horizontal",name:"matChipRow",gap:8,alignItems:"center"})
```

For each status create a reusable chip:
```
// Pending (warning tonal)
cPend=I(chipRow,{type:"frame",name:"matChipPending",reusable:true,cornerRadius:20,fill:"#FF9F4320",padding:[4,12],alignItems:"center",justifyContent:"center"})
cPendT=I(cPend,{type:"text",content:"Pending",fill:"#FF9F43",fontFamily:"Inter",fontSize:11,fontWeight:"600"})

// Scheduled (info tonal)
cSched=I(chipRow,{type:"frame",name:"matChipScheduled",reusable:true,cornerRadius:20,fill:"#00CFE820",padding:[4,12],alignItems:"center",justifyContent:"center"})
cSchedT=I(cSched,{type:"text",content:"Scheduled",fill:"#00CFE8",fontFamily:"Inter",fontSize:11,fontWeight:"600"})

// In Progress (primary tonal)
cProg=I(chipRow,{type:"frame",name:"matChipInProgress",reusable:true,cornerRadius:20,fill:"#7367F020",padding:[4,12],alignItems:"center",justifyContent:"center"})
cProgT=I(cProg,{type:"text",content:"In Progress",fill:"$--primary",fontFamily:"Inter",fontSize:11,fontWeight:"600"})

// Completed (success tonal)
cDone=I(chipRow,{type:"frame",name:"matChipCompleted",reusable:true,cornerRadius:20,fill:"#28C76F20",padding:[4,12],alignItems:"center",justifyContent:"center"})
cDoneT=I(cDone,{type:"text",content:"Completed",fill:"#28C76F",fontFamily:"Inter",fontSize:11,fontWeight:"600"})

// Cancelled (grey, strikethrough)
cCanc=I(chipRow,{type:"frame",name:"matChipCancelled",reusable:true,cornerRadius:20,fill:"#A8AAAE20",padding:[4,12],alignItems:"center",justifyContent:"center"})
cCancT=I(cCanc,{type:"text",content:"Cancelled",fill:"#A8AAAE",fontFamily:"Inter",fontSize:11,fontWeight:"600",strikethrough:true})
```

- [ ] **Step 3: Create property badge chip (color dot + text)**

```
propChip=I(container,{type:"frame",name:"matChipProperty",reusable:true,layout:"horizontal",cornerRadius:20,fill:"#7367F010",padding:[4,12],gap:6,alignItems:"center"})
propDot=I(propChip,{type:"ellipse",width:8,height:8,fill:"$--primary"})
propTxt=I(propChip,{type:"text",content:"412 Ocean Blvd",fill:"$--foreground",fontFamily:"Inter",fontSize:11,fontWeight:"500"})
```

- [ ] **Step 4: Create avatar badge (avatar + red count circle)**

```
badgeWrap=I(container,{type:"frame",name:"matBadge",reusable:true,layout:"none",width:44,height:44})
badgeAv=I(badgeWrap,{type:"frame",width:40,height:40,cornerRadius:20,fill:"$--primary",alignItems:"center",justifyContent:"center",x:0,y:4})
badgeAvT=I(badgeAv,{type:"text",content:"JD",fill:"#FFFFFF",fontFamily:"Inter",fontSize:14,fontWeight:"600"})
badgeCirc=I(badgeWrap,{type:"ellipse",width:18,height:18,fill:"#EA5455",x:26,y:0,stroke:{fill:"#FFFFFF",thickness:2,align:"outside"}})
badgeNum=I(badgeWrap,{type:"text",content:"3",fill:"#FFFFFF",fontFamily:"Inter",fontSize:10,fontWeight:"700",x:31,y:2})
```

- [ ] **Step 5: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matChip status set + matBadge avatar badge"
```

---

### Task 5: Tabs (Underline Style)

The pill-style tabs already exist (`ww45l`, `DdLLg`, `pWK2O`). Create an underline-style variant.

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=500, height=80.

- [ ] **Step 2: Create underline tab bar**

```
tabBar=I(container,{type:"frame",layout:"horizontal",name:"matTabsUnderline",reusable:true,width:400,height:48,stroke:{align:"inside",fill:"#E8E8E8",thickness:{bottom:1}}})

tab1=I(tabBar,{type:"frame",name:"matTabActive",alignItems:"center",justifyContent:"center",height:"fill_container",width:"fill_container",stroke:{align:"inside",fill:"$--primary",thickness:{bottom:2}}})
tab1T=I(tab1,{type:"text",content:"Tab One",fill:"$--primary",fontFamily:"Inter",fontSize:13,fontWeight:"500",letterSpacing:0.5})

tab2=I(tabBar,{type:"frame",name:"matTabInactive",alignItems:"center",justifyContent:"center",height:"fill_container",width:"fill_container"})
tab2T=I(tab2,{type:"text",content:"Tab Two",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:13,fontWeight:"500",letterSpacing:0.5})

tab3=I(tabBar,{type:"frame",alignItems:"center",justifyContent:"center",height:"fill_container",width:"fill_container"})
tab3T=I(tab3,{type:"text",content:"Tab Three",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:13,fontWeight:"500",letterSpacing:0.5})
```

- [ ] **Step 3: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matTabsUnderline atomic component"
```

---

### Task 6: Progress (Linear + Circular)

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=400, height=120. Horizontal layout, gap=40, alignItems=center.

- [ ] **Step 2: Create linear progress bar (reusable)**

```
linProg=I(container,{type:"frame",name:"matProgressLinear",reusable:true,layout:"none",width:200,height:6,cornerRadius:3,fill:"#E8E8E8"})
linFill=I(linProg,{type:"rectangle",name:"matProgressLinearFill",width:130,height:6,cornerRadius:3,fill:"$--primary",x:0,y:0})
```

- [ ] **Step 3: Create circular progress ring (reusable)**

Uses an ellipse for the track and a partial ellipse for the fill, plus centered text.

```
circWrap=I(container,{type:"frame",name:"matProgressCircular",reusable:true,layout:"none",width:48,height:48})
circTrack=I(circWrap,{type:"ellipse",width:48,height:48,stroke:{fill:"#E8E8E8",thickness:4,align:"inside"},fill:"#00000000"})
circFill=I(circWrap,{type:"ellipse",width:48,height:48,stroke:{fill:"$--primary",thickness:4,align:"inside"},fill:"#00000000",startAngle:90,sweepAngle:-234})
circTxt=I(circWrap,{type:"text",content:"65%",fill:"$--foreground",fontFamily:"Inter",fontSize:11,fontWeight:"600",x:11,y:16})
```

- [ ] **Step 4: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matProgress linear + circular atomics"
```

---

### Task 7: Switch

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=200, height=60. Horizontal layout, gap=24.

- [ ] **Step 2: Create switch OFF state (reusable)**

```
swOff=I(container,{type:"frame",name:"matSwitchOff",reusable:true,layout:"none",width:36,height:20,cornerRadius:10,fill:"#A8AAAE"})
swOffThumb=I(swOff,{type:"ellipse",width:16,height:16,fill:"#FFFFFF",x:2,y:2})
```

- [ ] **Step 3: Create switch ON state (reusable)**

```
swOn=I(container,{type:"frame",name:"matSwitchOn",reusable:true,layout:"none",width:36,height:20,cornerRadius:10,fill:"$--primary"})
swOnThumb=I(swOn,{type:"ellipse",width:16,height:16,fill:"#FFFFFF",x:18,y:2})
```

- [ ] **Step 4: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matSwitch on/off atomic variants"
```

---

## Phase 1b: Dashboard Widgets

### Task 8: Stat Card with Icon

Creates a reusable stat card and 4 color instances.

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=900, height=150. Horizontal layout, gap=16.

- [ ] **Step 2: Create stat card base component (reusable)**

```
statCard=I(container,{type:"frame",name:"dashStatCard",reusable:true,layout:"horizontal",cornerRadius:"$--radius-sm",fill:"$--card",effect:{type:"shadow",shadowType:"outer",offset:{x:0,y:2},blur:10,color:"#0000000D"},padding:20,gap:16,alignItems:"center",width:200,height:"fit_content"})

statAv=I(statCard,{type:"frame",name:"dashStatAvatar",width:40,height:40,cornerRadius:8,fill:"#7367F020",alignItems:"center",justifyContent:"center"})
statIcon=I(statAv,{type:"icon_font",iconFontFamily:"Material Symbols Rounded",iconFontName:"home",width:22,height:22,fill:"$--primary"})

statInfo=I(statCard,{type:"frame",name:"dashStatInfo",layout:"vertical",gap:2})
statVal=I(statInfo,{type:"text",name:"dashStatValue",content:"12",fill:"$--foreground",fontFamily:"Inter",fontSize:24,fontWeight:"700"})
statLabel=I(statInfo,{type:"text",name:"dashStatLabel",content:"Active Properties",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:13})
```

- [ ] **Step 3: Create 3 more instances with different colors**

Instance for Success (Upcoming Turns):
```
stat2=I(container,{type:"ref",ref:"dashStatCard_id",width:200})
U(stat2+"/dashStatAvatar",{fill:"#28C76F20"})
U(stat2+"/dashStatIcon_id",{fill:"#28C76F",iconFontName:"refresh"})
U(stat2+"/dashStatValue_id",{content:"5"})
U(stat2+"/dashStatLabel_id",{content:"Upcoming Turns"})
```

Repeat pattern for Warning (Check-ins) and Error (Unassigned).

- [ ] **Step 4: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add dashStatCard widget with 4 color variants"
```

---

### Task 9: Welcome Banner

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=800, height=200.

- [ ] **Step 2: Create welcome banner (reusable)**

```
banner=I(container,{type:"frame",name:"dashWelcomeBanner",reusable:true,layout:"horizontal",cornerRadius:"$--radius-sm",fill:{type:"gradient",gradientType:"linear",rotation:90,colors:[{color:"#7367F015",position:0},{color:"#7367F005",position:1}]},padding:24,gap:24,alignItems:"center",width:"fill_container",height:"fit_content"})

bannerLeft=I(banner,{type:"frame",layout:"vertical",gap:8,width:"fill_container"})
bannerGreet=I(bannerLeft,{type:"text",content:"Welcome back, Soren! 🎉",fill:"$--foreground",fontFamily:"Inter",fontSize:20,fontWeight:"$--font-weight-semibold"})
bannerSub=I(bannerLeft,{type:"text",content:"Here's what's happening with your properties today",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:14,textGrowth:"fixed-width",width:"fill_container"})

bannerPills=I(bannerLeft,{type:"frame",layout:"horizontal",gap:8})
pill1=I(bannerPills,{type:"frame",cornerRadius:20,fill:"#FF9F4320",padding:[4,12]})
pill1T=I(pill1,{type:"text",content:"3 Turns Today",fill:"#FF9F43",fontFamily:"Inter",fontSize:12,fontWeight:"600"})
pill2=I(bannerPills,{type:"frame",cornerRadius:20,fill:"#EA545520",padding:[4,12]})
pill2T=I(pill2,{type:"text",content:"2 Check-outs",fill:"#EA5455",fontFamily:"Inter",fontSize:12,fontWeight:"600"})
pill3=I(bannerPills,{type:"frame",cornerRadius:20,fill:"#28C76F20",padding:[4,12]})
pill3T=I(pill3,{type:"text",content:"85% Occupancy",fill:"#28C76F",fontFamily:"Inter",fontSize:12,fontWeight:"600"})
```

- [ ] **Step 3: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add dashWelcomeBanner widget"
```

---

### Task 10: Progress List Card

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=400, height=350.

- [ ] **Step 2: Create progress list card (reusable)**

Card frame with title, then 3-4 list items. Each item: icon avatar (32px) + label + progress bar + percentage.

```
progCard=I(container,{type:"frame",name:"dashProgressList",reusable:true,layout:"vertical",cornerRadius:"$--radius-sm",fill:"$--card",effect:{type:"shadow",shadowType:"outer",offset:{x:0,y:2},blur:10,color:"#0000000D"},width:380,height:"fit_content"})

progTitle=I(progCard,{type:"text",content:"Cleaning Completion",fill:"$--foreground",fontFamily:"Inter",fontSize:16,fontWeight:"$--font-weight-semibold",padding:[20,20,12,20]})
```

Then for each list item (3 items):
```
item=I(progCard,{type:"frame",layout:"horizontal",padding:[8,20],gap:12,alignItems:"center",width:"fill_container"})
itemAv=I(item,{type:"frame",width:32,height:32,cornerRadius:8,fill:"#7367F020",alignItems:"center",justifyContent:"center"})
itemIcon=I(itemAv,{type:"icon_font",iconFontFamily:"Material Symbols Rounded",iconFontName:"home",width:18,height:18,fill:"$--primary"})
itemInfo=I(item,{type:"frame",layout:"vertical",gap:4,width:"fill_container"})
itemName=I(itemInfo,{type:"text",content:"412 Ocean Blvd",fill:"$--foreground",fontFamily:"Inter",fontSize:13,fontWeight:"500"})
itemBar=I(itemInfo,{type:"frame",layout:"none",width:"fill_container",height:6,cornerRadius:3,fill:"#E8E8E8"})
itemFill=I(itemBar,{type:"rectangle",width:250,height:6,cornerRadius:3,fill:"$--primary",x:0,y:0})
itemPct=I(item,{type:"text",content:"85%",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:12,fontWeight:"600"})
```

Repeat with different properties, colors, and percentages.

- [ ] **Step 3: Add dividers between items**

Insert 1px rectangles between list items.

- [ ] **Step 4: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add dashProgressList widget"
```

---

### Task 11: Activity Timeline Card

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=400, height=400.

- [ ] **Step 2: Create activity timeline card (reusable)**

Card with title + 4 timeline items. Each item has a colored dot, vertical line connector, timestamp, and description.

```
tlCard=I(container,{type:"frame",name:"dashActivityTimeline",reusable:true,layout:"vertical",cornerRadius:"$--radius-sm",fill:"$--card",effect:{type:"shadow",shadowType:"outer",offset:{x:0,y:2},blur:10,color:"#0000000D"},width:380,height:"fit_content",padding:[20,20,16,20],gap:0})

tlTitle=I(tlCard,{type:"text",content:"Recent Activity",fill:"$--foreground",fontFamily:"Inter",fontSize:16,fontWeight:"$--font-weight-semibold"})
```

For each timeline item:
```
tlItem=I(tlCard,{type:"frame",layout:"horizontal",gap:12,padding:[12,0],width:"fill_container"})
tlDotCol=I(tlItem,{type:"frame",layout:"vertical",alignItems:"center",width:12,height:"fill_container"})
tlDot=I(tlDotCol,{type:"ellipse",width:10,height:10,fill:"#EA5455"})
tlLine=I(tlDotCol,{type:"rectangle",width:2,height:"fill_container",fill:"#E8E8E8"})
tlContent=I(tlItem,{type:"frame",layout:"vertical",gap:2,width:"fill_container"})
tlDesc=I(tlContent,{type:"text",content:"Check-out at 412 Ocean Blvd",fill:"$--foreground",fontFamily:"Inter",fontSize:13,fontWeight:"500",textGrowth:"fixed-width",width:"fill_container"})
tlTime=I(tlContent,{type:"text",content:"Today, 10:00 AM",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:11})
```

Repeat with different colors/events: green check-in, orange turn completed, primary cleaner assigned.

- [ ] **Step 3: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add dashActivityTimeline widget"
```

---

### Task 12: Data Table Card

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=800, height=350.

- [ ] **Step 2: Create data table card (reusable)**

Card with title + search field in header, then table with header row + 4 data rows.

```
tblCard=I(container,{type:"frame",name:"dashDataTable",reusable:true,layout:"vertical",cornerRadius:"$--radius-sm",fill:"$--card",effect:{type:"shadow",shadowType:"outer",offset:{x:0,y:2},blur:10,color:"#0000000D"},width:760,height:"fit_content"})
```

Header with title + search:
```
tblHeader=I(tblCard,{type:"frame",layout:"horizontal",padding:[16,20],alignItems:"center",justifyContent:"space_between",width:"fill_container"})
tblTitle=I(tblHeader,{type:"text",content:"Upcoming Events",fill:"$--foreground",fontFamily:"Inter",fontSize:16,fontWeight:"$--font-weight-semibold"})
tblSearch=I(tblHeader,{type:"frame",cornerRadius:"$--radius-sm",stroke:{align:"inside",fill:"#E8E8E8",thickness:1},padding:[6,12],width:180})
tblSearchTxt=I(tblSearch,{type:"text",content:"Search...",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:12})
```

Table header row:
```
tblHdrRow=I(tblCard,{type:"frame",layout:"horizontal",padding:[8,20],width:"fill_container",fill:"$--surface-variant"})
```

4 column headers (Property, Event, Date, Status) as text nodes with `fill_container` width.

Then 4 data rows, each as a horizontal frame with: property name (with color dot), event type text, date text, status chip ref.

- [ ] **Step 3: Add 1px dividers between rows**

- [ ] **Step 4: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add dashDataTable widget"
```

---

## Phase 1c: Owner Dashboard Page Composition

### Task 13: Owner Dashboard Full Page Layout

Composes all Phase 1b widgets into a complete page grid.

- [ ] **Step 1: Find large empty space on canvas**

Width=1200, height=1000, padding=80.

- [ ] **Step 2: Create page frame with placeholder**

```
dash=I(document,{type:"frame",name:"ownerDashboard",layout:"vertical",fill:"$--background",padding:[24,32],gap:24,width:1100,height:"fit_content",placeholder:true})
```

- [ ] **Step 3: Row 1 — Welcome banner (8 cols) + Period stat (4 cols)**

```
row1=I(dash,{type:"frame",layout:"horizontal",gap:24,width:"fill_container",height:"fit_content"})
```

Insert welcome banner ref (8/12 width ≈ 730px) + circular progress card (4/12 width ≈ 340px).

- [ ] **Step 4: Row 2 — Four stat cards (3 cols each)**

```
row2=I(dash,{type:"frame",layout:"horizontal",gap:24,width:"fill_container"})
```

Insert 4 stat card refs, each `width:"fill_container"`.

- [ ] **Step 5: Row 3 — Timeline card (6 cols) + Progress list (6 cols)**

```
row3=I(dash,{type:"frame",layout:"horizontal",gap:24,width:"fill_container",height:"fit_content"})
```

Insert activity timeline ref + progress list ref, each `width:"fill_container"`.

- [ ] **Step 6: Row 4 — Data table (12 cols)**

Insert data table ref with `width:"fill_container"`.

- [ ] **Step 7: Remove placeholder, take full screenshot**

- [ ] **Step 8: Commit**

```bash
git commit -m "restyle: compose ownerDashboard page layout from widget refs"
```

---

## Phase 2a: Timeline-Specific Atomics

### Task 14: Event Card (Checkout / Checkin / Turn variants)

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=800, height=200. Horizontal layout, gap=16.

- [ ] **Step 2: Create checkout event card (reusable)**

```
coCard=I(container,{type:"frame",name:"matEventCardCheckout",reusable:true,layout:"vertical",cornerRadius:"$--radius-sm",fill:"$--card",stroke:{align:"inside",fill:"#E8E8E8",thickness:1},width:240,height:"fit_content",clip:true})

coBar=I(coCard,{type:"rectangle",width:"fill_container",height:3,fill:"#EA5455"})
coBody=I(coCard,{type:"frame",layout:"vertical",padding:12,gap:8,width:"fill_container"})

coHeader=I(coBody,{type:"frame",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container"})
coLabel=I(coHeader,{type:"text",content:"CHECK-OUT",fill:"#EA5455",fontFamily:"Inter",fontSize:11,fontWeight:"700",letterSpacing:0.5})
coTime=I(coHeader,{type:"text",content:"10:00",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:12})

coMeta=I(coBody,{type:"frame",layout:"horizontal",gap:6,alignItems:"center",width:"fill_container"})
```

Add status chip ref, priority dot (6px ellipse), guest count text, assigned indicator.

- [ ] **Step 3: Create checkin event card (reusable)**

Same structure, green top bar (`#28C76F`), "CHECK-IN" label, `15:00` time.

- [ ] **Step 4: Create turn event card (reusable)**

Same structure, orange top bar (`#FF9F43`), "TURN · OUT" label.

- [ ] **Step 5: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matEventCard checkout/checkin/turn variants"
```

---

### Task 15: Property Selector Chip

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=280, height=250. Vertical layout, gap=8.

- [ ] **Step 2: Create selected property chip (reusable)**

```
selChip=I(container,{type:"frame",name:"matPropChipSelected",reusable:true,layout:"horizontal",cornerRadius:"$--radius-sm",fill:"$--surface-variant",stroke:{align:"inside",fill:"#E8E8E8",thickness:1},padding:12,gap:12,alignItems:"center",width:"fill_container"})

selDot=I(selChip,{type:"ellipse",name:"propDot",width:10,height:10,fill:"#4f98a3"})
selInfo=I(selChip,{type:"frame",layout:"vertical",gap:2,width:"fill_container"})
selStreet=I(selInfo,{type:"text",name:"propStreet",content:"412 Ocean Blvd",fill:"$--foreground",fontFamily:"Inter",fontSize:13,fontWeight:"500"})
selMeta=I(selInfo,{type:"text",name:"propMeta",content:"Palm Springs · 3bd/2ba",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:11})

selBadge=I(selChip,{type:"frame",cornerRadius:20,fill:"#FF9F4320",padding:[2,6]})
selBadgeT=I(selBadge,{type:"text",content:"TURN",fill:"#FF9F43",fontFamily:"Inter",fontSize:10,fontWeight:"600"})

selCheck=I(selChip,{type:"icon_font",iconFontFamily:"Material Symbols Rounded",iconFontName:"check",width:14,height:14,fill:"$--primary"})
```

- [ ] **Step 3: Create unselected property chip (reusable)**

Same structure but no background fill, no border, checkmark has `opacity:0`.

- [ ] **Step 4: Add 2 more instance variants with different colors/addresses**

- [ ] **Step 5: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matPropChip selected/unselected variants"
```

---

### Task 16: Cleaning Window Card + Timeline Spine Elements

- [ ] **Step 1: Find empty space, create container with placeholder**

Width=500, height=200. Vertical layout, gap=16.

- [ ] **Step 2: Create cleaning window card (reusable)**

```
cleanCard=I(container,{type:"frame",name:"matCleaningWindow",reusable:true,layout:"horizontal",cornerRadius:"$--radius-sm",fill:"#FF9F4320",padding:[12,16],alignItems:"center",justifyContent:"space_between",width:"fill_container"})

cleanLeft=I(cleanCard,{type:"frame",layout:"horizontal",gap:8,alignItems:"center"})
cleanIcon=I(cleanLeft,{type:"icon_font",iconFontFamily:"Material Symbols Rounded",iconFontName:"mop",width:16,height:16,fill:"#FF9F43"})
cleanLabel=I(cleanLeft,{type:"text",content:"Cleaning Window",fill:"#FF9F43",fontFamily:"Inter",fontSize:12,fontWeight:"600"})

cleanTime=I(cleanCard,{type:"text",content:"10:00 → 14:00",fill:"#FF9F43",fontFamily:"Inter",fontSize:12,fontWeight:"600"})
```

- [ ] **Step 3: Create timeline spine elements**

Date label pill (normal + today variant):
```
datePill=I(container,{type:"frame",name:"matDatePill",reusable:true,cornerRadius:20,fill:"$--surface-variant",stroke:{align:"inside",fill:"#E8E8E8",thickness:1},padding:[3,10]})
datePillT=I(datePill,{type:"text",content:"Tue, Apr 15",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:11,fontWeight:"600"})

todayPill=I(container,{type:"frame",name:"matDatePillToday",reusable:true,cornerRadius:20,fill:"#7367F020",stroke:{align:"inside",fill:"$--primary",thickness:1},padding:[3,10]})
todayPillT=I(todayPill,{type:"text",content:"Today",fill:"$--primary",fontFamily:"Inter",fontSize:11,fontWeight:"600"})
```

Spine dot samples (3 colors):
```
dotRow=I(container,{type:"frame",layout:"horizontal",gap:12,alignItems:"center"})
dotRed=I(dotRow,{type:"ellipse",name:"matSpineDotRed",width:12,height:12,fill:"#EA5455",stroke:{fill:"#FFFFFF",thickness:2,align:"outside"}})
dotGreen=I(dotRow,{type:"ellipse",name:"matSpineDotGreen",width:12,height:12,fill:"#28C76F",stroke:{fill:"#FFFFFF",thickness:2,align:"outside"}})
dotOrange=I(dotRow,{type:"ellipse",name:"matSpineDotOrange",width:12,height:12,fill:"#FF9F43",stroke:{fill:"#FFFFFF",thickness:2,align:"outside"}})
```

- [ ] **Step 4: Remove placeholder, screenshot, commit**

```bash
git commit -m "wrapper: add matCleaningWindow + timeline spine elements"
```

---

## Phase 2b: Property Timeline Page Composition

### Task 17: Property Timeline — Sidebar

- [ ] **Step 1: Find large empty space on canvas**

Width=1440, height=900, padding=80.

- [ ] **Step 2: Create page frame with placeholder**

```
tlPage=I(document,{type:"frame",name:"propertyTimeline",layout:"horizontal",fill:"$--background",width:1440,height:900,placeholder:true})
```

- [ ] **Step 3: Build sidebar (280px)**

```
sidebar=I(tlPage,{type:"frame",name:"tlSidebar",layout:"vertical",fill:"$--card",stroke:{align:"inside",fill:"#E8E8E8",thickness:{right:1}},width:280,height:"fill_container"})

sideHeader=I(sidebar,{type:"frame",layout:"vertical",padding:[16,16,12,16],gap:8,width:"fill_container",stroke:{align:"inside",fill:"#E8E8E8",thickness:{bottom:1}}})
sideLabel=I(sideHeader,{type:"text",content:"PROPERTIES",fill:"$--muted-foreground",fontFamily:"Inter",fontSize:11,fontWeight:"600",letterSpacing:0.6})
sideBtns=I(sideHeader,{type:"frame",layout:"horizontal",gap:8})
```

Add All/None buttons (small outlined buttons), then a list of 5 property selector chip refs.

- [ ] **Step 4: Commit sidebar progress**

```bash
git commit -m "restyle: compose propertyTimeline sidebar with property chips"
```

---

### Task 18: Property Timeline — Toolbar + Timeline Feed

- [ ] **Step 1: Create main area frame**

```
mainArea=I(tlPage,{type:"frame",name:"tlMain",layout:"vertical",width:"fill_container",height:"fill_container"})
```

- [ ] **Step 2: Build toolbar**

Horizontal frame with: "Window" label + range pill group (3d/7d/2w/4w), merge toggle (switch + label), legend dots (right-aligned).

- [ ] **Step 3: Build one property timeline block**

Property header: color square + name + meta + stat pills.

Two date groups with:
- Date pill centered
- Event rows: checkout card (left) + spine dot (center) + checkin card (right)
- Turn row with cleaning window below

- [ ] **Step 4: Add empty state variant**

Centered frame with icon + "No properties selected" title + description.

- [ ] **Step 5: Remove page placeholder, take full screenshot**

- [ ] **Step 6: Commit**

```bash
git commit -m "restyle: compose propertyTimeline main area with toolbar + feed"
```

---

### Task 19: Property Timeline — Detail Panel

- [ ] **Step 1: Create detail panel overlay**

400px wide frame positioned on right edge of the page, overlapping the main content.

```
detailPanel=I(tlPage,{type:"frame",name:"tlDetailPanel",layout:"vertical",fill:"$--card",stroke:{align:"inside",fill:"#E8E8E8",thickness:{left:1}},effect:{type:"shadow",shadowType:"outer",offset:{x:-4,y:0},blur:20,color:"#00000015"},width:400,height:"fill_container",layoutPosition:"absolute",x:1040,y:0})
```

- [ ] **Step 2: Build detail header**

Type badge + priority dot, property name, city, close button.

- [ ] **Step 3: Build detail body sections**

Booking Window (checkout/checkin dates), Cleaning Window (time range card), Property Info (grid of fields), Notes section.

- [ ] **Step 4: Take final screenshot of complete page**

- [ ] **Step 5: Commit**

```bash
git commit -m "restyle: add propertyTimeline detail panel"
```

---

## Final Verification

### Task 20: Screenshot Audit + Final Commit

- [ ] **Step 1: Take screenshots of all new components**

Screenshot each reusable atomic: buttons, cards, avatars, chips, badge, tabs, progress, switch.

- [ ] **Step 2: Take screenshots of all widgets**

Screenshot: stat card, welcome banner, progress list, activity timeline, data table.

- [ ] **Step 3: Take screenshots of both page compositions**

Screenshot: ownerDashboard, propertyTimeline.

- [ ] **Step 4: Visual review**

Check for: alignment issues, missing text fills, incorrect variable usage, overlapping elements, cut-off content.

- [ ] **Step 5: Fix any issues found in Step 4**

- [ ] **Step 6: Final commit**

```bash
git add design/materio-vuetify.lib.pen
git commit -m "restyle: complete Materio design system import — atomics + dashboard + timeline"
```
