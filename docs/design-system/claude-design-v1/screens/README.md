# Hero card variant decision

**Decision (2026-04-24):** v3-1 "Aurora" — selected from `hero-card-v3.html` (the
first of three variants in that file).

The handoff offered seven hero card designs across three iteration files:

| File | Variants | Visual character |
|---|---|---|
| `hero-card-v1.html` | 1 | Animated SVG flow ribbon, blue gradient, four pulsing nodes (arrive·stay·depart·turn metaphor) |
| `hero-card-v2.html` | A, B, C | Split-layout iterations: A=violet gradient, B=deep dark navy, C=lighter violet |
| `hero-card-v3.html` | **1**, 2, 3 | Gradient-only iterations: **1=Aurora (light→primary→dark)**, 2=Deep Violet + holographic shimmer, 3=Prism (diagonal + orb glows) |

Implemented at `src/components/dumb/owner/OwnerWelcomeBanner.vue`. The handoff
specified `border-radius: 12px` on the card and `8px` on the icon containers;
both were brought down to `2px` to conform to the Claro Design v1 all-radius-2px
rule.

The other six designs are kept in this folder for reference. If a future
iteration wants to revisit, the two simplest alternatives are v3-2 (deep violet
shimmer) and v3-3 (prism with orb glows) — both gradient-only, no SVG.
