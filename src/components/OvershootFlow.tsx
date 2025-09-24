"use client";

import React from "react";

type Source = { label: string; color: string; value?: number | string };

type Props = {
  width?: number | string;
  height?: number;
  year?: number;
  biocapPerCap?: number;
  efPerCap?: number;
  efName?: string;
  bcSources?: Source[];
  efSources?: Source[];
};

const defaultBCSources: Source[] = [
  { label: "Built-up Land", color: "#34D399" },
  { label: "Cropland", color: "#F59E0B" },
  { label: "Fishing Grounds", color: "#22D3EE" },
  { label: "Forest Products", color: "#A3E635" },
  { label: "Grazing Land", color: "#4ADE80" },
];

const defaultEFSources: Source[] = [
  { label: "Built-up Land", color: "#34D399" },
  { label: "Carbon", color: "#60A5FA" },
  { label: "Cropland", color: "#F59E0B" },
  { label: "Fishing Grounds", color: "#22D3EE" },
  { label: "Forest Products", color: "#A3E635" },
  { label: "Grazing Land", color: "#4ADE80" },
];

function formatOvershootDate(year: number, biocapPerCap: number, efPerCap: number) {
  if (!year || !biocapPerCap || !efPerCap) return "—";
  const ratio = efPerCap > 0 ? biocapPerCap / efPerCap : 0;
  const dayOfYear = Math.max(1, Math.min(365, Math.floor(ratio * 365)));
  const d = new Date(year, 0, dayOfYear);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

const OvershootFlow: React.FC<Props> = ({
  width = "100%",
  height = 800,
  year = new Date().getFullYear(),
  biocapPerCap = 1.0,
  efPerCap = 1.6,
  efName = "Germany",
  bcSources = defaultBCSources,
  efSources = defaultEFSources,
}) => {
  const overshootDate = formatOvershootDate(year, biocapPerCap, efPerCap);
  const overshootDay = Math.round(biocapPerCap / efPerCap * 365);
  const W = 1200;
  const H = height;
  const leftColX = 220;
  const leftBCY = 140;
  const leftEFY = 450;
  const colGap = 180;
  const boxW = 320; 
  const smallBoxW = 180; 
  const boxH = 80;
  const radius = 20;

  const midBCX = leftColX + colGap;
  const midEFX = leftColX + colGap;


  const calcX = midBCX + smallBoxW + 80; 
  const dayX = calcX + 520;
  const calcCY = Math.round((leftBCY + leftEFY) / 2);
  const joinOffset = 6; 

  const curve = (x1: number, y1: number, x2: number, y2: number, bend = 60) =>
    `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;

  const srcGap = 45;
  const bcStartY = leftBCY - ((bcSources.length - 1) * srcGap) / 2;
  const efStartY = leftEFY - ((efSources.length - 1) * srcGap) / 2;

  return (
    <div style={{ width, height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Overshoot flow diagram"
      >
        <g transform={`translate(${W / 2}, ${H / 2})`}>
          <g transform={`translate(${-W / 2}, ${-H / 2})`}>

            <g>
              <text
                x={leftColX - 160}
                y={leftBCY + 60}
                transform={`rotate(-90, ${leftColX - 220}, ${leftBCY + 60})`}
                fontFamily="Inter, sans-serif"
                fontSize="20"
                fill="#45a067"
                textAnchor="middle"
              >
                Earth Biocapacity
              </text>
            </g>
             <g>
              <text
                x={leftColX - 470}
                y={leftBCY + 60}
                transform={`rotate(-90, ${leftColX - 220}, ${leftBCY + 60})`}
                fontFamily="Inter, sans-serif"
                fontSize="20"
                fill="#3e71b8"
                textAnchor="middle"
              >
                {efName} Ecological Footprint
              </text>
            </g>
            <g fontFamily="Inter, system-ui, sans-serif" fontSize="16" fill="#cbd5e1">

              {(() => {
                const px = midBCX - 46;
                const r = 10;

                const sum = bcSources.reduce((acc, s) => typeof s.value === 'number' ? acc + s.value : acc, 0);
                const tooltip = `Total Biocapacity${sum ? `: ${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''}`;
                return (
                  <g>
                    <circle cx={px} cy={leftBCY} r={r} fill="#0b1220" stroke="#64748b" strokeWidth={2} style={{ cursor: 'help' }}>
                      <title>{tooltip}</title>
                    </circle>
                    <line x1={px - 5} y1={leftBCY} x2={px + 5} y2={leftBCY} stroke="#93c5fd" strokeWidth={2} />
                    <line x1={px} y1={leftBCY - 5} x2={px} y2={leftBCY + 5} stroke="#93c5fd" strokeWidth={2} />
                    <path d={curve(px + r, leftBCY, midBCX, leftBCY, 20)} stroke="#475569" strokeWidth={2} fill="none" />
                  </g>
                );
              })()}

              {bcSources.map((s, i) => {
                const y = bcStartY + i * srcGap;
                const textX = leftColX - 180;
                const dotX = leftColX - 8;
                const destX = midBCX - 60;
                const tooltip = `${s.label}${s.value !== undefined ? `: ${typeof s.value === 'number' ? s.value.toLocaleString() : s.value}` : ''}`;
                return (
                  <g key={`bc-${i}`}>
                    <text x={textX} y={y + 5}>{s.label}</text>
                    <text x={dotX - 45} y={y + 5} fontSize="15" fill="#9299ac">
                      {s.value !== undefined && s.value !== null ? (typeof s.value === 'number' ? s.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : s.value) : '?'}
                    </text>
                    <circle cx={dotX} cy={y} r={6} fill="none" stroke={s.color} strokeWidth={3} >
                      <title>{tooltip}</title>
                    </circle>
                    <path d={curve(leftColX, y, destX, leftBCY)} stroke="#a3aebd" strokeWidth={3} fill="none" opacity={0.5} >
                      <title>{tooltip}</title>
                    </path>
                  </g>
                );
              })}


              {(() => {
                const px = midEFX - 46;
                const r = 10;

                const sum = efSources.reduce((acc, s) => typeof s.value === 'number' ? acc + s.value : acc, 0);
                const tooltip = `Total Ecological Footprint${sum ? `: ${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''}`;
                return (
                  <g>
                    <circle cx={px} cy={leftEFY} r={r} fill="#0b1220" stroke="#64748b" strokeWidth={2} style={{ cursor: 'help' }}>
                      <title>{tooltip}</title>
                    </circle>
                    <line x1={px - 5} y1={leftEFY} x2={px + 5} y2={leftEFY} stroke="#93c5fd" strokeWidth={2} />
                    <line x1={px} y1={leftEFY - 5} x2={px} y2={leftEFY + 5} stroke="#93c5fd" strokeWidth={2} />
                    <path d={curve(px + r, leftEFY, midEFX, leftEFY, 20)} stroke="#475569" strokeWidth={2} fill="none" />
                  </g>
                );
              })()}

              {efSources.map((s, i) => {
                const y = efStartY + i * srcGap;
                const textX = leftColX - 180;
                const dotX = leftColX - 8;
                const destX = midEFX - 60;
                const tooltip = `${s.label}${s.value !== undefined ? `: ${typeof s.value === 'number' ? s.value.toLocaleString() : s.value}` : ''}`;
                return (
                  <g key={`ef-${i}`}>
                    <text x={textX} y={y + 5}>{s.label}</text>
                    <text x={dotX - 45} y={y + 5} fontSize="15" fill="#9299ac">
                      {s.value !== undefined && s.value !== null ? (typeof s.value === 'number' ? s.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : s.value) : '?'}
                    </text>
                    <circle cx={dotX} cy={y} r={6} fill="none" stroke={s.color} strokeWidth={3} style={{ cursor: 'help' }}>
                      <title>{tooltip}</title>
                    </circle>
                    <path d={curve(leftColX, y, destX, leftEFY)} stroke="#a3aebd" strokeWidth={2} fill="none" opacity={0.5} style={{ cursor: 'help' }}>
                      <title>{tooltip}</title>
                    </path>
                  </g>
                );
              })}
            </g>

            <g>
              <rect x={midBCX} y={leftBCY - 32} rx={radius} ry={radius} width={smallBoxW} height={64} fill="none" stroke="#475569" strokeWidth={2} />
              <text x={midBCX + 90} y={leftBCY - 6} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="18" fill="#e5e7eb">{biocapPerCap.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
              <text x={midBCX + 90} y={leftBCY + 18} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fill="#94a3b8">Biocapacity</text>
            </g>
            <g>
              <rect x={midEFX} y={leftEFY - 32} rx={radius} ry={radius} width={smallBoxW} height={64} fill="none" stroke="#475569" strokeWidth={2} />
              <text x={midEFX + 90} y={leftEFY - 6} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="18" fill="#e5e7eb">{efPerCap.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
              <text x={midEFX + 90} y={leftEFY + 18} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fill="#94a3b8">Ecological Footprint</text>
            </g>


            <path d={curve(midBCX + smallBoxW, leftBCY, calcX, calcCY - joinOffset)} stroke="#a3aebd" strokeWidth={2} fill="none" strokeLinecap="butt" />
            <path d={curve(midEFX + smallBoxW, leftEFY, calcX, calcCY + joinOffset)} stroke="#a3aebd" strokeWidth={2} fill="none" strokeLinecap="butt" />


            <g>

              <rect
                x={calcX}
                y={calcCY - boxH / 2 - 10}
                rx={radius}
                ry={radius}
                width={200}
                height={boxH + 20}
                fill="none"
                stroke="#334155"
                strokeWidth={2}
              />

              <text
                x={calcX + 80}
                y={calcCY - 12}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="16"
                fill="#e5e7eb"
              >
                Biocapacity
              </text>

              <line
                x1={calcX + 10}
                y1={calcCY - 4}
                x2={calcX + boxW - 180}
                y2={calcCY - 4}
                stroke="#64748b"
                strokeWidth={1.5}
              />

              <text
                x={calcX + 80}
                y={calcCY + 12}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="16"
                fill="#e5e7eb"
              >
                Ecological Footprint
              </text>

              <text
                x={calcX + boxW - 125}
                y={calcCY - 3}
                textAnchor="end"
                fontFamily="Inter, sans-serif"
                fontSize="16"
                fill="#60a5fa"
              >
                × 365
              </text>
            </g>
            {(() => {
              const y = calcCY;

              const circleEdgeX = dayX - 30 - 60; 
              const tipX = circleEdgeX;
              const baseX = tipX - 14; 
              return (
                <g>

                  <line
                    x1={calcX + boxW - 120}
                    y1={y}
                    x2={baseX - 190}
                    y2={y}
                    stroke="#a3aebd"
                    strokeWidth={3}
                  />
                </g>
              );
            })()}
            <g>

              <rect
                x={calcX + 230}
                y={calcCY - boxH / 2 - 10}
                rx={radius}
                ry={radius}
                width={100}
                height={boxH + 20}
                fill="none"
                stroke="#334155"
                strokeWidth={2}
              />

              <text
                x={calcX + 260}
                y={calcCY - 12}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="16"
                fill="#e5e7eb"
              >
                {biocapPerCap.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </text>

              <line
                x1={calcX + 280}
                y1={calcCY - 4}
                x2={calcX + boxW - 80}
                y2={calcCY - 4}
                stroke="#64748b"
                strokeWidth={1.5}
              />

              <text
                x={calcX + 260}
                y={calcCY + 12}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="16"
                fill="#e5e7eb"
              >
                {efPerCap.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </text>

              <text
                x={calcX + boxW + 5}
                y={calcCY + 0}
                textAnchor="end"
                fontFamily="Inter, sans-serif"
                fontSize="16"
                fill="#e5e7eb"
              >
                × 365
              </text>
            </g>


            {(() => {
              const y = calcCY;

              const circleEdgeX = dayX - 30 - 60; 
              const tipX = circleEdgeX;
              const baseX = tipX - 14; 
              return (
                <g>

                  <line
                    x1={calcX + boxW + 10}
                    y1={y}
                    x2={baseX}
                    y2={y}
                    stroke="#a3aebd"
                    strokeWidth={3}
                  />

                  <polygon
                    points={tipX + "," + y + " " + baseX + "," + (y - 8) + " " + baseX + "," + (y + 8)}
                    fill="#a3aebd"
                  />
                </g>
              );
            })()}



            <g>

              <text x={dayX - 30} y={calcCY - 20} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="18" fill="#9fb3ce">Day of Year </text>
              <text x={dayX - 30} y={calcCY + 10} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="24" fill="#e5e7eb">{overshootDay}</text>

            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default OvershootFlow;
