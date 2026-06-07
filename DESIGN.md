---
name: Claro
description: Multi-tenant property cleaning scheduler with a modern Bento/Glassmorphism aesthetic
colors:
  studio-violet: "#7367F0"
  studio-violet-light: "#9E95F5"
  studio-violet-deep: "#5E52EE"
  studio-violet-whisper: "rgba(115, 103, 240, 0.1)"
  background-dark: "#0F172A"
  surface-dark: "rgba(30, 41, 59, 0.7)"
  border-subtle: "rgba(255, 255, 255, 0.1)"
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  clearing-green: "#22C55E"
  warm-amber: "#F59E0B"
  alert-coral: "#EF4444"
typography:
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
  tight-tracking: "-0.02em"
rounded:
  card: "24px"
  pill: "9999px"
---

# Design System: Claro (Bento Edition)

## 1. Overview

**Creative North Star: "The Modern Bento"**

Claro is evolving from a rigid control room to a fluid, modular "Bento Box" aesthetic. This style prioritizes modularity, depth, and a premium "Apple-like" feel. Every feature is housed in a distinct, highly rounded container. The interface uses glassmorphism (backdrop blurs) and subtle lighting (1px borders) to create a sense of physical layering.

This system replaces the previous 2px-radius "Control Room" aesthetic. We now embrace the modern SaaS minimalism seen in high-end design previews.

**Key Characteristics:**
- **Bento Grid:** Layouts are composed of modular blocks with consistent gaps and large corner radii.
- **Glassmorphism:** Surfaces use semi-transparent backgrounds with `backdrop-filter: blur(12px)`.
- **Large Radius:** Containers use a 24px radius (`rounded="xl"`); interactive elements remain pill-shaped.
- **Subtle Borders:** 1px borders defined in `border-subtle` catch the eye and define space without heavy shadows.
- **Dark Mode First:** The primary experience is a deep slate/indigo palette.

## 2. Colors: The Glass Palette

### Primary & Background
- **Studio Violet** (#7367F0): Used for primary actions and key accents.
- **Background Dark** (#0F172A): The base layer for the entire application.
- **Surface Dark** (rgba(30, 41, 59, 0.7)): The background for all Bento blocks. Always paired with a backdrop blur.

### Borders & Dividers
- **Border Subtle** (rgba(255, 255, 255, 0.1)): The standard container border.

### Text
- **Text Primary** (#F8FAFC): High contrast for headings and primary content.
- **Text Secondary** (#94A3B8): Muted contrast for metadata and supporting text.

## 3. Typography

**Font:** Inter
**Hierarchy:**
- **Headings:** Bold, tight tracking (-0.02em).
- **Body:** Regular (400), 15px, standard tracking.

## 4. Components

### Bento Cards
- **Radius:** 24px.
- **Background:** `surface-dark` + `backdrop-filter: blur(12px)`.
- **Border:** 1px solid `border-subtle`.
- **Shadow:** Long, soft shadow (`0 20px 25px -5px rgba(0, 0, 0, 0.1)`).

### Interactive Elements
- **Buttons:** Pill-shaped, vibrant `studio-violet`.
- **Hover:** Subtle scale-up (1.02x) and increased glow.

## 5. Do's and Don'ts

### Do:
- **Do** use `rounded="xl"` (24px) for all card-like containers.
- **Do** use `backdrop-filter: blur(12px)` on all surfaces.
- **Do** use tight tracking on headings.
- **Do** create asymmetrical "Bento" grids where some blocks are larger than others.

### Don't:
- **Don't** use sharp (2px) corners anymore.
- **Don't** use heavy, opaque backgrounds for cards.
- **Don't** use standard "Stripe-like" flat layouts without depth.
