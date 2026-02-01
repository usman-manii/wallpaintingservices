# 🎨 Design System Documentation

## Overview

This document describes the comprehensive design system implemented in the Wall Painting Services CMS. All design tokens are semantic and support both light and dark themes.

---

## 📐 Design Principles

### 1. **Accessibility First**
- WCAG 2.1 AA compliant color contrasts (minimum 4.5:1 for text)
- AAA compliance where possible (7:1 contrast)
- Focus indicators meet 3:1 contrast requirement
- Screen reader friendly markup
- Keyboard navigation support

### 2. **Consistency**
- Unified spacing system (based on 4px/0.25rem grid)
- Predictable component behavior
- Standardized animation timing
- Coherent visual language

### 3. **Performance**
- CSS custom properties for dynamic theming
- Minimal JavaScript for interactions
- Optimized animation performance (GPU-accelerated)
- Reduced motion support

### 4. **Flexibility**
- Theme customization through CSS variables
- Extensible component architecture
- Responsive breakpoint system

---

## 🎨 Color System

### Semantic Colors (HSL Format)

All colors use HSL (Hue, Saturation, Lightness) format for easier manipulation and theming.

#### Light Mode
```css
--background: 0 0% 100%              /* Pure white */
--foreground: 222.2 84% 4.9%         /* Near black */
--primary: 221.2 83.2% 53.3%         /* Blue */
--secondary: 210 40% 96.1%           /* Light gray */
--accent: 210 40% 96.1%              /* Light gray */
--muted: 210 40% 96.1%               /* Subtle gray */
--border: 214.3 31.8% 91.4%          /* Light border */
```

#### Dark Mode
```css
--background: 222.2 84% 4.9%         /* Dark blue-gray */
--foreground: 210 40% 98%            /* Near white */
--primary: 217.2 91.2% 59.8%         /* Lighter blue */
--secondary: 217.2 32.6% 17.5%       /* Dark gray */
--accent: 217.2 32.6% 17.5%          /* Dark gray */
--muted: 217.2 32.6% 17.5%           /* Muted dark */
--border: 217.2 32.6% 17.5%          /* Dark border */
```

### State Colors (Both Modes)

#### Light Mode
```css
--success: 142.1 70.6% 45.3%         /* Green (WCAG AA) */
--warning: 38 92% 50%                /* Orange/Yellow */
--error: 0 72.2% 50.6%               /* Red (WCAG AA) */
--info: 199 89% 48%                  /* Blue */
```

#### Dark Mode
```css
--success: 142.1 76.2% 36.3%         /* Darker green */
--warning: 38 92% 50%                /* Same orange */
--error: 0 62.8% 45.6%               /* Darker red */
--info: 199 89% 48%                  /* Same blue */
```

### Brand Colors

Fixed brand palette (not theme-dependent):

```css
brand-50:  #f0f9ff  /* Lightest blue */
brand-100: #e0f2fe
brand-200: #bae6fd
brand-300: #7dd3fc
brand-400: #38bdf8
brand-500: #0ea5e9  /* Base brand color */
brand-600: #0284c7  /* Primary brand */
brand-700: #0369a1
brand-800: #075985
brand-900: #0c4a6e  /* Darkest blue */
```

### Extended Palette

Full color scales for slate, blue, purple, yellow, green, red, and orange.
All colors are WCAG compliant when used appropriately.

**Example - Slate Scale:**
```css
slate-50:  #f8fafc  /* Lightest */
slate-100: #f1f5f9
slate-200: #e2e8f0
slate-300: #cbd5e1
slate-400: #94a3b8
slate-500: #64748b  /* Base */
slate-600: #475569  /* WCAG AAA on white */
slate-700: #334155
slate-800: #1e293b
slate-900: #0f172a  /* Darkest */
slate-950: #020617  /* Near black */
```

---

## 📏 Spacing System

Based on 4px base unit (0.25rem).

### Spacing Scale
```
0:   0px
1:   4px   (0.25rem)
2:   8px   (0.5rem)
3:   12px  (0.75rem)
4:   16px  (1rem)      ← Base unit
5:   20px  (1.25rem)
6:   24px  (1.5rem)
8:   32px  (2rem)
10:  40px  (2.5rem)
12:  48px  (3rem)
16:  64px  (4rem)
20:  80px  (5rem)
24:  96px  (6rem)
32:  128px (8rem)
128: 512px (32rem)
144: 576px (36rem)
```

### Usage Examples
```jsx
<div className="p-4">       {/* 16px padding all sides */}
<div className="px-6 py-3"> {/* 24px horizontal, 12px vertical */}
<div className="m-8">       {/* 32px margin all sides */}
<div className="gap-4">     {/* 16px gap in flex/grid */}
```

---

## 🔤 Typography

### Font Families

#### Sans-serif (Default)
```css
font-sans: ui-sans-serif, system-ui, -apple-system, 
           BlinkMacSystemFont, "Segoe UI", Roboto, 
           "Helvetica Neue", Arial, "Noto Sans", sans-serif
```

#### Monospace (Code)
```css
font-mono: ui-monospace, SFMono-Regular, "SF Mono", 
           Menlo, Consolas, "Liberation Mono", monospace
```

### Font Sizes
```
text-xs:   0.75rem  (12px)  - Captions, labels
text-sm:   0.875rem (14px)  - Small text
text-base: 1rem     (16px)  - Body text (default)
text-lg:   1.125rem (18px)  - Lead text
text-xl:   1.25rem  (20px)  - Subheadings
text-2xl:  1.5rem   (24px)  - Headings
text-3xl:  1.875rem (30px)  - Large headings
text-4xl:  2.25rem  (36px)  - Page titles
text-5xl:  3rem     (48px)  - Hero text
text-6xl:  3.75rem  (60px)  - Display text
```

### Font Weights
```
font-light:     300
font-normal:    400  (default)
font-medium:    500
font-semibold:  600
font-bold:      700
font-extrabold: 800
font-black:     900
```

### Line Heights
```
leading-none:     1
leading-tight:    1.25
leading-snug:     1.375
leading-normal:   1.5   (default)
leading-relaxed:  1.625
leading-loose:    2
```

---

## 📦 Elevation System

Shadow levels for depth perception:

```css
/* Elevation 1 - Subtle (Cards) */
--elevation-1: 0 1px 3px 0 rgb(0 0 0 / 0.1), 
               0 1px 2px -1px rgb(0 0 0 / 0.1)

/* Elevation 2 - Moderate (Dropdowns) */
--elevation-2: 0 4px 6px -1px rgb(0 0 0 / 0.1), 
               0 2px 4px -2px rgb(0 0 0 / 0.1)

/* Elevation 3 - High (Modals) */
--elevation-3: 0 10px 15px -3px rgb(0 0 0 / 0.1), 
               0 4px 6px -4px rgb(0 0 0 / 0.1)

/* Elevation 4 - Maximum (Overlays) */
--elevation-4: 0 20px 25px -5px rgb(0 0 0 / 0.1), 
               0 8px 10px -6px rgb(0 0 0 / 0.1)
```

### Usage
```jsx
<div className="shadow-elevation-1"> {/* Card */}
<div className="shadow-elevation-2"> {/* Dropdown */}
<div className="shadow-elevation-3"> {/* Modal */}
<div className="shadow-elevation-4"> {/* Overlay */}
```

**Dark Mode**: Shadows are more prominent (0.4-0.5 opacity vs 0.1).

---

## 🔘 Border Radius

```css
--radius-sm: 0.375rem  (6px)   - Small elements
--radius-md: 0.5rem    (8px)   - Default
--radius-lg: 0.75rem   (12px)  - Cards, panels
--radius-xl: 1rem      (16px)  - Large containers
```

### Usage
```jsx
<button className="rounded-md">  {/* 8px */}
<div className="rounded-lg">     {/* 12px */}
<img className="rounded-full">   {/* Circle */}
```

---

## 🎭 Animations

### Keyframe Animations

#### Fade In
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
**Usage**: `animate-fade-in` (duration: 200ms)

#### Slide In
```css
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```
**Usage**: `animate-slide-in` (duration: 300ms)

#### Slide Up
```css
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```
**Usage**: `animate-slide-up` (duration: 300ms)

#### Scale In
```css
@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```
**Usage**: `animate-scale-in` (duration: 200ms)

#### Spin
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```
**Usage**: `animate-spin` (duration: 1s, infinite)

#### Pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```
**Usage**: `animate-pulse` (duration: 2s, infinite)

### Transition Durations
```
duration-75:   75ms
duration-100:  100ms
duration-150:  150ms
duration-200:  200ms  (recommended default)
duration-300:  300ms
duration-500:  500ms
duration-700:  700ms
duration-1000: 1000ms
```

### Reduced Motion
Respects `prefers-reduced-motion` media query:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📱 Responsive Breakpoints

```
xs:   475px   - Extra small phones
sm:   640px   - Small phones
md:   768px   - Tablets
lg:   1024px  - Small laptops
xl:   1280px  - Large laptops
2xl:  1536px  - Desktops
3xl:  1920px  - Large desktops (custom)
```

### Usage
```jsx
<div className="text-sm md:text-base lg:text-lg">
  {/* Responsive text sizing */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

---

## 🎯 Focus Styles

Meets WCAG 2.1 AA requirements (3:1 contrast minimum).

```css
*:focus-visible {
  outline: 2px solid hsl(var(--focus-ring));
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Custom Focus Ring
```jsx
<button className="focus-ring">
  {/* Custom focus with box-shadow */}
</button>
```

---

## ♿ Accessibility Features

### Screen Reader Only
```jsx
<span className="sr-only">Hidden from view, visible to screen readers</span>
```

### Skip to Content
```jsx
<a href="#main-content" className="skip-to-content">
  Skip to content
</a>
```

### High Contrast Mode
Automatically adjusts borders in high contrast mode:
```css
@media (prefers-contrast: high) {
  * {
    border-color: currentColor !important;
  }
}
```

---

## 🖼️ Component Patterns

### Card Pattern
```jsx
<div className="bg-card text-card-foreground rounded-lg shadow-elevation-1 p-6">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content</p>
</div>
```

### Button Pattern
```jsx
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary">
  Primary Button
</button>
```

### Input Pattern
```jsx
<input className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
```

---

## 🎨 Theming

### Dark Mode Toggle
Implemented via CSS class `.dark` on `<html>` element.

```jsx
// ThemeContext.tsx
const toggleTheme = () => {
  document.documentElement.classList.toggle('dark')
}
```

### Custom Theme Colors
Override CSS variables in your stylesheet:
```css
:root {
  --primary: 200 100% 50%;  /* Custom primary color */
}
```

---

## 📚 Usage Examples

### Hero Section
```jsx
<section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
  <div className="container mx-auto px-4">
    <h1 className="text-5xl font-bold mb-4 animate-fade-in">
      Welcome to Our Platform
    </h1>
    <p className="text-xl opacity-90 animate-slide-up">
      Build amazing experiences
    </p>
  </div>
</section>
```

### Admin Dashboard Card
```jsx
<div className="bg-card rounded-lg shadow-elevation-2 p-6 hover:shadow-elevation-3 transition-shadow duration-200">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Statistics</h3>
    <span className="text-muted-foreground text-sm">Last 30 days</span>
  </div>
  <div className="space-y-2">
    <div className="flex justify-between">
      <span>Users</span>
      <span className="font-medium">1,234</span>
    </div>
  </div>
</div>
```

### Form with Validation
```jsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-1">Email</label>
    <input 
      type="email"
      className="w-full bg-background border border-input rounded-md px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
    />
  </div>
  <button className="bg-success text-success-foreground px-4 py-2 rounded-md hover:bg-success/90">
    Submit
  </button>
</div>
```

---

## 🛠️ Customization Guide

### Adding New Colors
1. Add CSS variable in `globals.css`:
```css
:root {
  --custom-color: 280 100% 50%;
}
```

2. Extend Tailwind config:
```js
// tailwind.config.ts
colors: {
  custom: "hsl(var(--custom-color))",
}
```

### Adding New Animations
1. Define keyframes in `globals.css`:
```css
@keyframes bounce-in {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
```

2. Extend Tailwind config:
```js
animation: {
  'bounce-in': 'bounce-in 0.5s ease-out',
}
```

---

## 📖 Best Practices

1. **Use Semantic Colors**: Always use semantic colors (`bg-primary`, `text-error`) instead of fixed colors (`bg-blue-500`)
2. **Maintain Contrast**: Ensure text meets WCAG AA (4.5:1) or AAA (7:1) contrast ratios
3. **Consistent Spacing**: Use the spacing scale (4px increments) for margins, padding, and gaps
4. **Responsive Design**: Design mobile-first, then scale up with responsive classes
5. **Animation Performance**: Use transform and opacity for animations (GPU-accelerated)
6. **Dark Mode**: Test all components in both light and dark themes
7. **Accessibility**: Include focus indicators, ARIA labels, and keyboard navigation

---

## 🔍 Testing

### Color Contrast
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Minimum AA: 4.5:1 for normal text, 3:1 for large text
- AAA: 7:1 for normal text, 4.5:1 for large text

### Accessibility
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation only (no mouse)
- High contrast mode
- Reduced motion preference

### Responsive
- Test on real devices when possible
- Use browser DevTools device emulation
- Test at breakpoint boundaries (639px, 767px, etc.)

---

## 📞 Support

For questions about the design system:
- Check component examples in `/components/ui/`
- Review Tailwind documentation: https://tailwindcss.com
- Consult WCAG guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

*Design System Version: 1.0*  
*Last Updated: February 2, 2026*  
*Maintained by: Wall Painting Services Team*
