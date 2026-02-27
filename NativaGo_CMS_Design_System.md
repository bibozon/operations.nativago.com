# NativaGo CMS Design System

A complete, modern SaaS admin dashboard design system for tourism operations.

---

## Color Tokens

- **Primary 600:** #059669
- **Primary 500:** #10B981
- **Primary 100:** #D1FAE5
- **Secondary 600:** #0284C7
- **Secondary 500:** #0EA5E9
- **Secondary 100:** #E0F2FE
- **Accent:** #34D399
- **Sidebar:** #0F172A
- **Sidebar text:** #E2E8F0
- **Background:** #F8FAFC
- **Card:** #FFFFFF
- **Border:** #E2E8F0
- **Text primary:** #0F172A
- **Text secondary:** #475569
- **Text muted:** #94A3B8
- **Success:** #22C55E
- **Warning:** #F59E0B
- **Error:** #EF4444

---

## Typography

- **Font:** Inter, geometric sans-serif
- **Sizes:**
  - H1: 28 semibold
  - H2: 22 semibold
  - H3: 18 semibold
  - Body: 14 regular
  - Small: 12
  - Buttons: 14 medium

---

## Spacing

- **Base unit:** 4px
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 40
- **Card padding:** 20–24
- **Section gap:** 24
- **Table cell:** 12–16

---

## Border Radius

- **Inputs:** 8
- **Cards:** 12
- **Buttons:** 8
- **Modals:** 16

---

## Shadows

- **Card:** 0 1px 2px rgba(0,0,0,0.04)
- **Hover:** 0 4px 12px rgba(0,0,0,0.08)
- **Dropdown:** 0 8px 24px rgba(0,0,0,0.12)

---

## Components

### Buttons
- **Primary:** Green
- **Secondary:** Outline
- **Ghost:** Text
- **Danger:** Red
- **States:** Default, hover, disabled

### Inputs
- Text, select, textarea, number
- Border, rounded 8
- Focus green
- Label top

### Table
- Header: gray 50
- Row hover
- Border bottom
- Compact admin density

### Card
- White, shadow, rounded 12
- Header + body

### Sidebar
- Dark background
- Active item highlight
- Icon + label
- Collapsed mode

### Badges
- Success, warning, error, info
- Rounded pill

### Modal
- Centered
- Backdrop blur
- Rounded 16
- Header + actions

### QR Scanner Panel
- Dark camera view
- Status badge overlay
- Booking card bottom

### Form Layout
- Two-column desktop
- Single mobile
- Section titles

### Dashboard Cards
- Icon, metric, label, trend

### Icon Style
- Line icons (Feather/Lucide)
- Consistent stroke

---

## Mood
- Professional tourism SaaS
- Operational clarity
- Reliable admin
- Travel platform

---

## Output
- Design tokens
- Component library
- CMS visual consistency
- Ready for Tailwind / Next.js

---

## Example Tailwind Config (for tokens)
```js
module.exports = {
  theme: {
    colors: {
      primary: {
        600: '#059669',
        500: '#10B981',
        100: '#D1FAE5',
      },
      secondary: {
        600: '#0284C7',
        500: '#0EA5E9',
        100: '#E0F2FE',
      },
      accent: '#34D399',
      sidebar: '#0F172A',
      sidebarText: '#E2E8F0',
      background: '#F8FAFC',
      card: '#FFFFFF',
      border: '#E2E8F0',
      text: {
        primary: '#0F172A',
        secondary: '#475569',
        muted: '#94A3B8',
      },
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    borderRadius: {
      input: '8px',
      card: '12px',
      button: '8px',
      modal: '16px',
    },
    boxShadow: {
      card: '0 1px 2px rgba(0,0,0,0.04)',
      hover: '0 4px 12px rgba(0,0,0,0.08)',
      dropdown: '0 8px 24px rgba(0,0,0,0.12)',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    spacing: {
      4: '4px',
      8: '8px',
      12: '12px',
      16: '16px',
      20: '20px',
      24: '24px',
      32: '32px',
      40: '40px',
    },
    fontSize: {
      h1: ['28px', { fontWeight: '600' }],
      h2: ['22px', { fontWeight: '600' }],
      h3: ['18px', { fontWeight: '600' }],
      body: ['14px', { fontWeight: '400' }],
      small: ['12px', { fontWeight: '400' }],
      button: ['14px', { fontWeight: '500' }],
    },
  },
};
```

---

## Component Library (Ready for Next.js)
- Button, Input, Table, Card, Sidebar, Badge, Modal, QR Scanner Panel, Form Layout, Dashboard Card, Icon

---

This system ensures visual consistency and operational clarity for NativaGo CMS, ready for implementation in Tailwind/Next.js.