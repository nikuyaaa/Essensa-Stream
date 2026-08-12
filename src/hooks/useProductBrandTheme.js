import { useEffect, useState } from 'react';

// Utility to convert rgb to hex
const rgbToHex = (r, g, b) => {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Utility to lighten/darken color
const adjustColor = (r, g, b, amount) => {
  return [
    Math.max(0, Math.min(255, r + amount)),
    Math.max(0, Math.min(255, g + amount)),
    Math.max(0, Math.min(255, b + amount))
  ];
};

export function useProductBrandTheme(imageUrl) {
  const [extractedColors, setExtractedColors] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      // Reset to default theme
      resetTheme();
      return;
    }

    // Skip videos for color extraction to avoid complicated frame grabbing
    if (imageUrl.match(/\.(mp4|webm|ogg)$/i) || imageUrl.startsWith('data:video/')) {
      resetTheme();
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Downsample to 64x64 for performance
        canvas.width = 64;
        canvas.height = 64;
        
        ctx.drawImage(img, 0, 0, 64, 64);
        const imageData = ctx.getImageData(0, 0, 64, 64).data;
        
        let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;
        
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          
          // Skip highly transparent, fully white, or fully black pixels
          if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
            continue;
          }
          
          rTotal += r;
          gTotal += g;
          bTotal += b;
          count++;
        }
        
        if (count > 0) {
          const avgR = Math.round(rTotal / count);
          const avgG = Math.round(gTotal / count);
          const avgB = Math.round(bTotal / count);
          
          // Derive palette
          const primaryHex = rgbToHex(avgR, avgG, avgB);
          
          const [secR, secG, secB] = adjustColor(avgR, avgG, avgB, -40); // Darken for secondary
          const secondaryHex = rgbToHex(secR, secG, secB);
          
          const [accR, accG, accB] = adjustColor(avgR, avgG, avgB, 50); // Lighten for accent
          const accentHex = rgbToHex(accR, accG, accB);
          
          const surfaceTint = `rgba(${avgR}, ${avgG}, ${avgB}, 0.15)`;
          
          const darkHex = rgbToHex(Math.max(0, Math.round(avgR * 0.15)), Math.max(0, Math.round(avgG * 0.15)), Math.max(0, Math.round(avgB * 0.15)));
          const midHex = rgbToHex(Math.max(0, Math.round(avgR * 0.25)), Math.max(0, Math.round(avgG * 0.25)), Math.max(0, Math.round(avgB * 0.25)));
          const lightHex = rgbToHex(Math.min(255, avgR + 150), Math.min(255, avgG + 150), Math.min(255, avgB + 150));
          
          applyTheme(primaryHex, secondaryHex, accentHex, surfaceTint, darkHex, midHex, lightHex);
          setExtractedColors({ primary: primaryHex, secondary: secondaryHex, accent: accentHex, tint: surfaceTint, dark: darkHex, mid: midHex, light: lightHex });
        } else {
          resetTheme();
        }
      } catch (err) {
        console.warn("Color extraction failed (likely CORS), falling back to default.", err);
        resetTheme();
      }
    };
    
    img.onerror = () => {
      resetTheme();
    };

    img.src = imageUrl;

    return () => {
      // We don't necessarily want to reset on unmount, we want the theme to persist 
      // as long as the product is active.
    };
  }, [imageUrl]);

  const applyTheme = (primary, secondary, accent, tint, dark, mid, light) => {
    const root = document.documentElement;
    root.style.setProperty('--product-primary', primary);
    root.style.setProperty('--product-secondary', secondary);
    root.style.setProperty('--product-accent', accent);
    root.style.setProperty('--product-surface-tint', tint);
    root.style.setProperty('--product-dark', dark);
    root.style.setProperty('--product-mid', mid);
    root.style.setProperty('--product-light', light);
  };

  const resetTheme = () => {
    applyTheme('#7B3FE4', '#4A2080', '#9D5CFF', 'rgba(123, 63, 228, 0.15)', '#120924', '#2A1054', '#E2D1FF');
    setExtractedColors(null);
  };

  return extractedColors;
}
