import React from 'react';

export function Logo({ className = '', showText = true, light = false }) {
  const primaryGreen = '#1B7339';
  const accentGreen = '#4CAF50';
  const charcoal = '#1A1A1A';
  const cream = '#F8F9FA';

  const textColor = light ? cream : charcoal;

  // Semicircular arc calculations for Essensa logo spikes (14 spikes)
  const R_inner = 28;
  const R_outer = 44;
  const cx = 52;
  const cy = 50;
  const startAngle = 135; // bottom-left (points down-left)
  const endAngle = 315;   // top-right (points up-right)
  const numSpikes = 14;
  
  const spikes = [];
  const angleStep = (endAngle - startAngle) / (numSpikes - 1);
  const dAngle = 6.8; // half of spacing to touch base points
  
  for (let i = 0; i < numSpikes; i++) {
    const angleDeg = startAngle + i * angleStep;
    const angleRad = (angleDeg * Math.PI) / 180;
    
    // Tip vertex
    const tx = cx + R_outer * Math.cos(angleRad);
    const ty = cy + R_outer * Math.sin(angleRad);
    
    // Base vertex 1
    const b1Rad = ((angleDeg - dAngle) * Math.PI) / 180;
    const b1x = cx + R_inner * Math.cos(b1Rad);
    const b1y = cy + R_inner * Math.sin(b1Rad);
    
    // Base vertex 2
    const b2Rad = ((angleDeg + dAngle) * Math.PI) / 180;
    const b2x = cx + R_inner * Math.cos(b2Rad);
    const b2y = cy + R_inner * Math.sin(b2Rad);
    
    spikes.push({ tx, ty, b1x, b1y, b2x, b2y });
  }

  // Generate SVG path for the circular inner ribbon line
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const startX = cx + R_inner * Math.cos(startRad);
  const startY = cy + R_inner * Math.sin(startRad);
  const endX = cx + R_inner * Math.cos(endRad);
  const endY = cy + R_inner * Math.sin(endRad);
  
  const innerRibbonPath = `M ${startX} ${startY} A ${R_inner} ${R_inner} 0 0 1 ${endX} ${endY}`;

  // ViewBox dynamic dimensions
  const viewBox = showText ? "0 0 280 100" : "0 0 100 100";
  // Responsive sizing classes
  const svgClass = showText ? "w-[130px] sm:w-[160px] h-[48px]" : "w-[36px] sm:w-[48px] h-[36px] sm:h-[48px]";

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        viewBox={viewBox}
        className={`${svgClass} shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Draw the 14 Crescent Spikes */}
        {spikes.map((s, idx) => (
          <polygon
            key={idx}
            points={`${s.b1x},${s.b1y} ${s.tx},${s.ty} ${s.b2x},${s.b2y}`}
            fill={light ? accentGreen : primaryGreen}
          />
        ))}

        {/* Draw the connecting inner ribbon circle */}
        <path
          d={innerRibbonPath}
          stroke={light ? accentGreen : primaryGreen}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Brand Text Inside SVG */}
        {showText && (
          <>
            <text
              x="96"
              y="54"
              fontFamily="Montserrat, Inter, sans-serif"
              fontWeight="900"
              fontSize="36"
              fill={textColor}
              letterSpacing="-0.5"
            >
              ESSENSA
            </text>
            <text
              x="96"
              y="80"
              fontFamily="Montserrat, Inter, sans-serif"
              fontWeight="500"
              fontSize="15"
              fill={light ? accentGreen : textColor}
              letterSpacing="6.5"
            >
              NATURALE
            </text>
          </>
        )}
      </svg>
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
