# Design System Quick Reference

## What Changed

### ❌ Before (Custom Styling)
- Custom colors: `emerald-500`, `amber-500`, `violet-500`
- Custom opacity: `/5`, `/10`, `/20`, `white/[0.02]`
- Custom font sizes: `text-[9px]`, `text-[10px]`, `text-[11px]`
- Decorative elements: Icons (✓, ✗, !), spinning borders, glows
- Complex gradients: `bg-gradient-to-r from-primary to-emerald-500`
- Uppercase tracking: `uppercase tracking-widest`

### ✅ After (Design System)
- Standard colors: `bg-card`, `bg-muted`, `border`, `text-muted-foreground`
- Standard Badge variants: `default`, `destructive`, `secondary`
- Standard font sizes: `text-xs`, `text-sm`, `text-2xl`, `text-4xl`
- Functional elements only: Progress circle, simple bars
- Simple backgrounds: `bg-card`, `bg-muted`
- Normal case: Better readability

## Color Mapping

| Before | After | Usage |
|--------|-------|-------|
| `bg-emerald-500/5` | `bg-card` | Card backgrounds |
| `bg-white/5` | `bg-muted` | Muted backgrounds |
| `border-emerald-500/10` | `border` | Standard borders |
| `text-emerald-600` | Badge `variant="default"` | Pass state |
| `text-destructive` | Badge `variant="destructive"` | Fail state |
| `text-amber-600` | Badge `variant="secondary"` | Review state |
| `bg-gradient-to-r from-primary to-emerald-500` | `bg-primary` | Progress bars |

## Typography Mapping

| Before | After | Size |
|--------|-------|------|
| `text-[9px]` | `text-xs` | 12px |
| `text-[10px]` | `text-xs` | 12px |
| `text-[11px]` | `text-sm` | 14px |
| `text-5xl font-light` | `text-4xl font-semibold` | 36px |

## Component Changes

### Evaluation Summary

**Before:**
- Decorative spinning border animation
- Two gradient progress bars with glows
- Custom colored stats grid
- Uppercase tracking-widest labels

**After:**
- Clean SVG progress circle
- Single simple progress bar
- Standard card-based stats grid
- Normal case labels

### Evaluation Cards

**Before:**
- Icon symbols (✓, ✗, !)
- Custom colored borders per verdict
- Mini progress bars for confidence
- Nested colored backgrounds

**After:**
- Standard Badge variants
- Consistent border styling
- Simple percentage display
- Clean card layout

## Design System Tokens

### Standard Colors
```tsx
bg-card              // Card backgrounds
bg-muted             // Muted backgrounds  
bg-accent            // Hover states
border               // Standard borders
text-foreground      // Primary text
text-muted-foreground // Secondary text
bg-primary           // Primary emphasis
bg-destructive       // Error states
```

### Standard Spacing
```tsx
p-3, p-4            // Padding
gap-2, gap-3        // Gaps
space-y-2, space-y-3 // Vertical spacing
```

### Standard Typography
```tsx
text-xs             // 12px - Small text
text-sm             // 14px - Body text
text-2xl            // 24px - Stats
text-4xl            // 36px - Hero numbers
font-medium         // 500 weight
font-semibold       // 600 weight
```

## Badge Variants

```tsx
// PASS
<Badge variant="default">PASS</Badge>

// FAIL
<Badge variant="destructive">FAIL</Badge>

// NEEDS_REVIEW
<Badge variant="secondary">NEEDS REVIEW</Badge>
```

## Before/After Code

### Stats Grid

**Before:**
```tsx
<div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
  <div className="text-2xl font-bold text-emerald-600">{passCount}</div>
  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">Pass</div>
</div>
```

**After:**
```tsx
<div className="flex flex-col items-center p-3 rounded-lg border bg-card">
  <div className="text-2xl font-semibold">{passCount}</div>
  <div className="text-xs text-muted-foreground mt-1">Pass</div>
</div>
```

### Progress Bar

**Before:**
```tsx
<div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
  <div 
    className="h-full bg-gradient-to-r from-primary to-emerald-500 shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
    style={{ width: `${passRate}%` }}
  />
</div>
```

**After:**
```tsx
<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
  <div 
    className="h-full bg-primary transition-all duration-500" 
    style={{ width: `${passRate}%` }}
  />
</div>
```

### Evaluation Card

**Before:**
```tsx
<div className="p-5 border border-emerald-500/20 rounded-xl bg-white/[0.01] hover:bg-white/[0.03]">
  <div className="flex items-center gap-2">
    <div className="size-6 rounded-full bg-emerald-500/5">✓</div>
    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
      PASS
    </Badge>
  </div>
</div>
```

**After:**
```tsx
<div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
  <Badge variant="default" className="text-xs font-medium">
    PASS
  </Badge>
</div>
```

## Key Principles

1. **Use standard tokens** - No custom colors or sizes
2. **Semantic variants** - Use Badge variants, not custom styling
3. **Functional only** - Remove decorative elements
4. **Clear hierarchy** - Size, weight, spacing
5. **Scannable** - Normal case, clear labels
6. **Accessible** - Standard contrast ratios

## Result

- ✅ Cleaner, more professional appearance
- ✅ Consistent with design system
- ✅ Better accessibility
- ✅ Easier to maintain
- ✅ Better performance
- ✅ Theme-aware (light/dark mode)

All changes follow the **design-system-scaffold** power guidelines! 🎉
