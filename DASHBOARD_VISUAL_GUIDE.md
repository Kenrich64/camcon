# Camcon Premium Dashboard - Visual Architecture 🎨

## Component Dependency Tree

```
┌─────────────────────────────────────────────────────────┐
│  RootLayout (layout.tsx)                                │
│  - Space Grotesk + IBM Plex Mono fonts                 │
│  - Metadata: "Camcon - Event Analytics Dashboard"      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  AppLayout (components/AppLayout.jsx)                   │
│  - Auth protection + router logic                       │
│  - Toast provider setup (react-hot-toast)               │
│  - Layout composition                                   │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
    ┌──────────▼─────────┐  ┌────▼──────────────────┐
    │ Sidebar ────────┐  │  │ Main Content Area     │
    │  - Nav Items    │  │  │  ┌─────────────────┐  │
    │  - Active State │  │  │  │ Header          │  │
    │  - Role Badge   │  │  │  │  - Page Title   │  │
    │  - Logout       │  │  │  │  - Role Badge   │  │
    │  - Mobile Toggle│  │  │  └─────────────────┘  │
    └────────────────┘  │  │  ┌─────────────────┐  │
                        │  │  │ Page Content    │  │
                        │  │  │ (Scrollable)    │  │
                        │  │  │                 │  │
                        │  │  │ Uses Components:│  │
                        │  │  │ - GlassCard     │  │
                        │  │  │ - StatCard      │  │
                        │  │  │ - EmptyState    │  │
                        │  │  │ - LoadingSkeleton  │
                        │  │  └─────────────────┘  │
                        │  └────────────────────────┘
                        │
            ┌───────────▼───────────┐
            │ Page-Specific Imports  │
            │ - Recharts            │
            │ - lucide-react icons  │
            │ - API calls           │
            └───────────────────────┘
```

---

## Color & Styling System

### Color Palette Grid

```
┌────────────┬──────────────┬──────────────┬──────────────┐
│ Primary    │ Secondary    │ Accents      │ Backgrounds  │
├────────────┼──────────────┼──────────────┼──────────────┤
│ Cyan-400   │ Blue-400     │ Amber-400    │ Slate-950    │
│ #22d3ee    │ #60a5fa      │ #fbbf24      │ #020617      │
│            │              │              │              │
│ Success ✓  │ Warning ⚠    │ Error ✗      │ Card BG      │
│ Green-400  │ Amber-500    │ Rose-400     │ Slate-800    │
│ #4ade80    │ #f59e0b      │ #f43f5e      │ #1e293b      │
└────────────┴──────────────┴──────────────┴──────────────┘

Opacity Variants:
├─ /100 - Full opacity (Text labels)
├─ /70  - Slight transparency (Icons)
├─ /50  - Medium transparency (Backgrounds)
├─ /30  - Light transparency (Borders, hover)
├─ /20  - Very light (Subtle backgrounds)
└─ /10  - Minimal (Fine borders)
```

### Component Styling Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  PAGE                                               │
│  bg: gradient (radial + linear)                     │
│  └─ min-h-screen, overflow handling                │
├─────────────────────────────────────────────────────┤
│ │  CONTAINER (max-w-7xl)                           │
│ │  p: 4-8 (responsive)                             │
│ │  ├──────────────────────────────────────────┐   │
│ │  │ GLASS CARD                                │   │
│ │  │ bg: slate-800/50 backdrop-blur-sm         │   │
│ │  │ border: white/10                          │   │
│ │  │ rounded: 2xl (rounded-2xl)                │   │
│ │  │ shadow: lg hover:xl                       │   │
│ │  │ ├──────────────────────────────────────┐  │   │
│ │  │ │ STAT CARD (inside)                  │  │   │
│ │  │ │ bg: gradient from cyan/25 to /5     │  │   │
│ │  │ │ p: 6                                 │  │   │
│ │  │ │ ├─ Label: text-sm text-slate-400    │  │   │
│ │  │ │ ├─ Value: text-3xl font-bold white  │  │   │
│ │  │ │ └─ Icon: text-4xl emoji             │  │   │
│ │  │ └──────────────────────────────────────┘  │   │
│ │  └──────────────────────────────────────────┘   │
│ └──────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
```

---

## Responsive Behavior Map

### Desktop (1024px+)

```
┌─────────────────────────────────────────────┐
│ Logo  │ Dashboard (Active)                   │
│       │ Events    Predictions   Upload       │
│ Btn   │─────────────────────────────────────│
│ 📊    │ Page Title                    👤    │
│ 📅    │ Subtitle                            │
│ 🔮    │─────────────────────────────────────│
│ 📤    │ 3-Column Grid                       │
│       │ ┌────────┐ ┌────────┐ ┌────────┐   │
│ Role  │ │ Stat 1 │ │ Stat 2 │ │ Stat 3 │   │
│ Logout│ └────────┘ └────────┘ └────────┘   │
└──────┴──────────────────────────────────────┘

Content area: Full width minus sidebar
Features: All visible, hover effects active
```

### Tablet (768px - 1024px)

```
┌──────────────────────────────┐
│ Logo │ Dashboard Predictions │
│ Btn  │ Events Upload 👤      │
│ 📊   │──────────────────────│
│ 📅   │ Page Title           │
│ 🔮   │ Subtitle             │
│ 📤   │──────────────────────│
│       │ 2-Column Grid       │
│ Role  │ ┌────────┐ ┌────────┐
│ Logout│ │ Stat 1 │ │ Stat 2 │
└──┬────┴─┘────────┘ └────────┘
   │      ┌────────┐
   │      │ Stat 3 │
   │      └────────┘
   
Sidebar: Compact or partial visible
Grid: 2 columns → single column
```

### Mobile (<768px)

```
┌─────────────────────────┐
│ ☰  Page Title  👤       │  (Header always visible)
├─────────────────────────┤
│                         │
│  Content Area           │
│  (Full width)           │
│                         │
│  1-Column Grid:         │
│  ┌───────────────────┐  │
│  │ Stat 1            │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Stat 2            │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Stat 3            │  │
│  └───────────────────┘  │
│                         │
│          [+]            │  (Sidebar toggle, bottom-right)
├─────────────────────────┤

Sidebar: Hidden by default, overlay when open
Toggle: Fixed button bottom-right
Backdro: Dim when sidebar open
```

---

## State & Data Flow

```
┌──────────────────────────────────────────────────────┐
│ User Actions                                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Login Form Submit                                   │
│  ├─ POST /auth/login                                │
│  ├─ localStorage.setItem("token", response.token)   │
│  ├─ localStorage.setItem("role", response.role)     │
│  └─ router.push("/dashboard")                       │
│                                                      │
│  Create Event (Admin)                                │
│  ├─ Validate role === "admin"                        │
│  ├─ POST /events { title, date, ... }               │
│  ├─ toast.success("Event created")                  │
│  └─ loadEvents() [refresh]                          │
│                                                      │
│  Delete Event (Admin)                                │
│  ├─ Confirm with window.confirm()                   │
│  ├─ DELETE /events/:id                               │
│  ├─ toast.success("Event deleted")                  │
│  └─ loadEvents() [refresh]                          │
│                                                      │
│  Upload File (Admin)                                 │
│  ├─ Form submission with file                       │
│  ├─ POST /upload?target=events formData             │
│  ├─ toast.success("Upload successful")              │
│  └─ Reset form state                                │
│                                                      │
│  Refresh Predictions                                │
│  ├─ GET /predictions                                │
│  ├─ GET /analytics/overview                         │
│  ├─ Calculate derived values                        │
│  └─ Re-render chart                                 │
│                                                      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Component State Updates                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Loading State:                                      │
│  loading=true  → Show CardSkeleton                  │
│  loading=false → Show actual content                │
│                                                      │
│  Error State:                                        │
│  error=""      → Hide error alert                   │
│  error="msg"   → Show alert + toast                 │
│                                                      │
│  Success State:                                      │
│  success=""    → Hide success message               │
│  success="msg" → Show message + refetch data        │
│                                                      │
│  Role State:                                         │
│  role="admin"  → Show admin-only features           │
│  role="user"   → Hide admin features                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Loading & Error States

### Loading Pattern

```
Initial Page Load:
┌────────────────────────────┐
│ ▌░░░░░░░░░░░░░░░░░░░░░░░░  │  CardSkeleton 1
│ ▌░░░░░░░░░░░░░░░░░░░░░░░░  │  CardSkeleton 2
│ ▌░░░░░░░░░░░░░░░░░░░░░░░░  │  CardSkeleton 3
│                            │
│ ▌░░░░░░░░░░░░░░░░░░░░░░░░  │  Large CardSkeleton
│ ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────────────────┘
(Animated pulse effect)
```

### Error State

```
┌────────────────────────────────────┐
│ ⚠ Error loading predictions         │
│ Failed to fetch from API            │
└────────────────────────────────────┘

Below: No data shown, or last cached data
```

### Success State

```
┌────────────────────────────────────┐
│ ✓ Data loaded successfully          │
└────────────────────────────────────┘

Toast (bottom-right):
           ┌────────────────────┐
           │ ✓ Event created!   │
           └────────────────────┘
```

---

## Component Import Map

### Pages

```jsx
// dashboard/page.js
import { CardSkeleton, GlassCard, StatCard, EmptyState } from "@/components/ui"
import { BarChart, Bar, ... } from "recharts"
import toast from "react-hot-toast"

// events/page.js
import { GlassCard, EmptyState, CardSkeleton } from "@/components/ui"
import { Plus, Trash2, Calendar, MapPin, Users } from "lucide-react"
import toast from "react-hot-toast"

// predictions/page.js
import { GlassCard, CardSkeleton, StatCard } from "@/components/ui"
import { RefreshCw } from "lucide-react"
import { BarChart, Bar, ... } from "recharts"
import toast from "react-hot-toast"

// upload/page.js
import { GlassCard } from "@/components/ui"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

// login/page.js
import { Loader } from "lucide-react"
// (No other custom components, pure HTML form)
```

### Layout

```jsx
// layout.tsx
import AppLayout from "@/components/AppLayout"
import "./globals.css"

// AppLayout internally uses:
import Sidebar from "./Sidebar"
import Header from "./Header"
import { Toaster } from "react-hot-toast"
```

---

## CSS Utility Reference

### Quick Lookup

| Need | Utility | Purpose |
|------|---------|---------|
| Primary Button | `btn-primary` | Main CTA |
| Secondary Button | `btn-secondary` | Alternate action |
| Danger Button | `btn-danger` | Destructive action |
| Form Input | `input-field` | All inputs |
| Glass Effect | `glass` | Card backgrounds |
| Light Glass | `glass-sm` | Lighter variant |
| Smooth Entrance | `animate-slide-in` | Page transitions |
| Transition | `transition-all duration-300` | Smooth changes |
| Active State | `bg-cyan-500/30` + `ring-1` | Highlight |

### Custom Properties (in globals.css)

```css
:root {
  color-scheme: dark;  /* Browser defaults to dark */
}

html {
  background: #020617;  /* Deep dark */
  scrollbar: custom styled
}

body {
  background: gradient (radial + linear)
  font-family: Space Grotesk (sans) + IBM Plex Mono (mono)
}

/* Scrollbar styling for webkit browsers */
::-webkit-scrollbar { ... }
::-webkit-scrollbar-track { ... }
::-webkit-scrollbar-thumb { ... }
```

---

## Icon Library (lucide-react)

### Icons Used

| Page | Icons | Usage |
|------|-------|-------|
| Sidebar | `Menu`, `X`, `Calendar`, `LayoutDashboard`, `TrendingUp`, `Upload`, `LogOut` | Navigation |
| Header | None (emoji used instead) | - |
| Events | `Plus`, `Trash2`, `Calendar`, `MapPin`, `Users` | Actions & metadata |
| Predictions | `RefreshCw` | Refresh button |
| Upload | `Upload`, `CheckCircle`, `AlertCircle` | File & feedback |
| Login | `Loader` | Loading state |

### Import Pattern

```jsx
import { IconName } from "lucide-react"

<IconName size={18} className="text-cyan-400" />
```

---

## Animation Reference

### Built-in Animations

```css
animate-pulse     /* Used in skeletons */
animate-spin      /* Used for loading spinners */
animate-slide-in  /* Custom entrance animation */
```

### Transition Patterns

```css
transition-all        /* All properties change */
transition-colors     /* Only color changes */
transition-transform  /* Only transform changes */

duration-200  /* Fast (200ms) */
duration-300  /* Normal (300ms) */
```

---

## Window Size Breakpoints

```
xs:  0px     (default)
sm:  640px
md:  768px   ← Used for sidebar visibility
lg:  1024px  ← Used for layout changes
xl:  1280px
2xl: 1536px
```

---

## Deployment Checklist

Before deploying, verify:

```
☐ Build passes: npm run build
☐ No TypeScript errors: npx tsc --noEmit
☐ Lint passes: npm run lint
☐ All icons render: Check lucide-react imports
☐ Toast notifications work: Test a page action
☐ Mobile responsive: Check on 375px viewport
☐ Sidebar toggle works: Click on mobile
☐ Auth flow complete: Login → Dashboard
☐ Role-based UI correct: Test as admin/user
☐ Empty states display: Delete all data
└─ All components export properly
```

---

**Version**: 1.0.0  
**Architecture**: SPA with sidebar layout  
**Status**: ✅ Production-ready

Happy coding! 🚀
