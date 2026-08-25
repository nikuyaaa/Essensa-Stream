import React from 'react';

export function Logo({ className = '', showText = true, light = false, logoUrl = '' }) {
  // Use the provided image as the new global default logo
  const defaultLogo = "/essensa-logo.png";
  const finalUrl = logoUrl || defaultLogo;
  
  const isVideo = finalUrl.match(/\.(mp4|webm|ogg)$/i) || finalUrl.startsWith('data:video/');
  
  // Maintain responsive sizing matching the old SVG dimensions
  const sizeClass = showText 
    ? "h-[48px] sm:h-[64px] max-w-[200px] sm:max-w-[280px]" 
    : "w-[48px] sm:w-[64px] h-[48px] sm:h-[64px]";

  // The 'light' prop can be used to conditionally invert or adjust brightness if needed,
  // but since it's a fixed image, we'll just render it as is, with a slight brightness bump for dark mode if light=true.
  const filterClass = light ? "brightness-0 invert" : ""; // If it's a black text logo, this makes it white when light=true is requested

  return (
    <div className={`flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      {isVideo ? (
        <video 
          src={finalUrl} 
          autoPlay loop muted playsInline 
          className={`${sizeClass} object-contain`} 
        />
      ) : (
        <img 
          src={finalUrl} 
          alt="Essensa Naturale" 
          className={`${sizeClass} object-contain ${filterClass}`} 
        />
      )}
    </div>
  );
}

export function LogoSunburst({ className = '' }) {
  const primaryGreen = '#1B7339';
  const accentGold = '#D4AF37';
  
  return (
    <div className={`relative ${className}`}>
      {/* Decorative rotating backglow crown */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-sunburst opacity-25"
      >
        <defs>
          <radialGradient id="sunburstGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentGold} stopOpacity="0.7" />
            <stop offset="50%" stopColor={primaryGreen} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="50" fill="url(#sunburstGrad)" />
        {/* Rays */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="60"
            y1="60"
            x2={60 + 50 * Math.cos((i * 30 * Math.PI) / 180)}
            y2={60 + 50 * Math.sin((i * 30 * Math.PI) / 180)}
            stroke={accentGold}
            strokeWidth="1.5"
            strokeDasharray="4 8"
            opacity="0.6"
          />
        ))}
      </svg>
    </div>
  );
}

export default Logo;
