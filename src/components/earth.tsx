"use client";

import React from "react";

function EarthSectorImage({ size = 110, fraction = 1, src = "/globe_png.png" }: { size?: number; fraction?: number; src?: string }) {
  const id = React.useId();
  const pct = Math.max(0, Math.min(1, fraction));
  const buildSectorPath = (s: number, p: number) => {
    if (p <= 0) return "M 0 0 Z";
    const cx = s / 2;
    const cy = s / 2;
    const r = s / 2 - 1;
    if (p >= 0.999) return null;
    const start = -Math.PI / 2;
    const end = start - p * Math.PI * 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = p > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2} Z`;
  };
  const sectorPath = buildSectorPath(size, pct);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" role="img">
      <defs>
        <clipPath id={`${id}-clip`}>
          {pct >= 0.999 ? <circle cx={size / 2} cy={size / 2} r={size / 2} /> : sectorPath ? <path d={sectorPath} /> : <rect x={0} y={0} width={0} height={0} />}
        </clipPath>
      </defs>
  <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="#19202b" />
      <image href={src} x={0} y={0} width={size} height={size} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-clip)`} />
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke="#0b2137" strokeWidth={1.5} />
    </svg>
  );
}

function EarthRow({ value, size = 90, maxIcons = 3 }: { value: number; size?: number; maxIcons?: number }) {
  const safe = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
  const full = Math.floor(safe);
  const frac = Math.max(0, Math.min(1, safe - full));
  const fullToRender = maxIcons ? Math.min(full, maxIcons) : full;
  const willRenderPartial = frac > 0 && (!maxIcons || fullToRender < maxIcons);
  let count = fullToRender + (willRenderPartial ? 1 : 0);
  if (count === 0) count = 1;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = React.useState<number>(0);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new (window as any).ResizeObserver((entries: any) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width ?? el.clientWidth;
        setRowWidth(w);
      }
    });
    ro.observe(el);
    setRowWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const minIcon = 34; 
  const baseGap = 8; 
  const gapPx = Math.max(4, Math.min(10, Math.round(baseGap)));
  const available = Math.max(0, rowWidth - gapPx * (count - 1));
 
  const computed = Math.floor((available / (count || 1)) || size);
  const iconSize = Math.min(size, Math.max(minIcon, computed));
  const rowHeight = iconSize; 

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < fullToRender; i++) nodes.push(<EarthSectorImage key={`full-${i}`} size={iconSize} fraction={1} />);
  if (willRenderPartial) nodes.push(<EarthSectorImage key="partial" size={iconSize} fraction={frac} />);
  if (nodes.length === 0) nodes.push(<EarthSectorImage key="single" size={iconSize} fraction={Math.max(0, Math.min(1, safe))} />);

  return (
    <div ref={containerRef} className="flex flex-nowrap items-center justify-center overflow-hidden w-full" style={{ gap: `${gapPx}px`, height: `${rowHeight}px` }}>
      {nodes}
    </div>
  );
}

const formatEarths = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2);
};

export type EarthCardProps = { country?: string; earthsRequired?: number | null | undefined; maxIcons?: number };

export const EarthRequirementCard: React.FC<EarthCardProps> = ({ country = "Germany", earthsRequired = 1, maxIcons = 3 }) => {
  const safeValue = typeof earthsRequired === "number" && !isNaN(earthsRequired) ? earthsRequired : 1;
  const earthIcons = 12;
  const showBigEarth = safeValue > 5;
  return (
    
      <div className="w-full flex flex-col items-center h-full justify-center">
        <p className="text-center text-sm sm:text-base text-slate-300 pt-2 pb-2 leading-tight font-bold">
          Earths needed if everyone lived like  <span className="font-semibold text-blue-400">{country}</span>
        </p>
        <div className="flex justify-center mx-auto w-full max-w-[390px] items-center" style={{ minHeight: '72px' }}>
          {showBigEarth ? (
            <div className="flex flex-row items-center justify-center w-full">
              <span className="mr-4 text-blue-400 text-4xl font-extrabold">{safeValue.toFixed(2)}</span>
              <EarthSectorImage size={56} fraction={1} />
            </div>
          ) : (
            <EarthRow value={safeValue} maxIcons={earthIcons} size={64} />
          )}
        </div>
      </div>

  );
};

export default EarthRequirementCard;
