# Favicon Generation Guide

## Required Favicon Files

The following favicon files should be generated from `logo.svg`:

### 1. favicon.ico (Multi-resolution ICO)
- **Sizes:** 16×16, 32×32, 48×48
- **Format:** ICO (multi-resolution)
- **Purpose:** Legacy browser support, Windows taskbar

### 2. PNG Variants
- `favicon-16x16.png` - Small browser tabs
- `favicon-32x32.png` - Standard browser tabs
- `favicon-96x96.png` - High-DPI displays

### 3. Apple Touch Icon
- `apple-touch-icon.png` - 180×180
- **Purpose:** iOS home screen icon

### 4. Web App Manifest Icons (Optional)
- `icon-192x192.png` - Android home screen
- `icon-512x512.png` - Android splash screen

## Generation Methods

### Option 1: Online Tools
1. Visit https://realfavicongenerator.net/
2. Upload `logo.svg`
3. Configure settings:
   - Background: Transparent
   - Scaling: Fit to canvas
   - iOS: Use original image
4. Download and extract to `public/`

### Option 2: ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then run:

# Convert SVG to PNG variants
magick logo.svg -resize 16x16 favicon-16x16.png
magick logo.svg -resize 32x32 favicon-32x32.png
magick logo.svg -resize 96x96 favicon-96x96.png
magick logo.svg -resize 180x180 apple-touch-icon.png

# Create multi-resolution ICO
magick logo.svg -resize 16x16 -define icon:auto-resize=16,32,48 favicon.ico
```

### Option 3: Sharp (Node.js)
```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 32, 96, 180];

sizes.forEach(size => {
  const filename = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
  
  sharp('logo.svg')
    .resize(size, size)
    .png()
    .toFile(`public/${filename}`);
});
```

## HTML Meta Tags

Add to `app/layout.tsx`:

```tsx
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

## Current Status

- ✅ `favicon.svg` - Updated with transparent background
- ❌ `favicon.ico` - **NEEDS GENERATION**
- ❌ `favicon-16x16.png` - **NEEDS GENERATION**
- ❌ `favicon-32x32.png` - **NEEDS GENERATION**
- ❌ `favicon-96x96.png` - **NEEDS GENERATION**
- ❌ `apple-touch-icon.png` - **NEEDS GENERATION**

## Next Steps

1. Choose a generation method above
2. Generate all required favicon files
3. Place them in `apps/officer-portal/public/`
4. Update `app/layout.tsx` with meta tags
5. Test on multiple browsers and devices
