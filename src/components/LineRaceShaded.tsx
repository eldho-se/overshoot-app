'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import InfoButton from './Infobutton';
import Highcharts from 'highcharts';
import dynamic from 'next/dynamic';

const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });

type XY = [number, number];
type ColumnHints = { year?: string; world?: string; countryFootprint?: string; worldFootprint?: string };


if (typeof window !== 'undefined') {
  (window as any).Highcharts = Highcharts; 
  try {
    Highcharts.setOptions({ accessibility: { enabled: false } as any });
  } catch { /* noop on SSR */ }
}


let hcModulesInited = false;


type CacheEntry = { world?: XY[]; country?: XY[]; worldFoot?: XY[]; error?: string; promise?: Promise<void> };
const csvCache = new Map<string, CacheEntry>();

const toNum = (v: any): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  const s = String(v).replace(/^\uFEFF/, '').trim().replace(/\u00A0/g, '').replace(/\s+/g, '').replace(/,/g, '.').replace(/[^0-9.\-+Ee]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

function parseCSVSmart(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = clean.split('\n');
  if (!rows.length) return [];
  const header = rows[0];

  const delim: ',' | ';' | '\t' = ((): any => {
    const c = { ',': (header.match(/,/g) || []).length, ';': (header.match(/;/g) || []).length, '\t': (header.match(/\t/g) || []).length };
    return (Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]) || ',';
  })();

  const split = (line: string): string[] => {
    const out: string[] = [];
    let cell = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i], next = line[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') { cell += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cell += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delim) { out.push(cell); cell = ''; }
        else cell += ch;
      }
    }
    out.push(cell);
    return out;
  };

  const out: string[][] = [];
  for (const line of rows) out.push(split(line));
  return out;
}

export default function LineRaceShaded({
  worldEf,
  worldBio,
  countryEf,
  countryName = 'Germany',
  startYear = 1961,
  endYear = 2024,
  autoPlay = true,
}: {
  worldEf?: XY[];
  worldBio?: XY[];
  countryEf?: XY[];
  countryName?: string;
  startYear?: number;
  endYear?: number;
  autoPlay?: boolean;
}) {

  const [hcReady, setHcReady] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!hcModulesInited) {
          const [exportingMod, accessibilityMod] = await Promise.all([
            import('highcharts/modules/exporting'),
            import('highcharts/modules/accessibility'),
          ]);

          const getInit = (mod: any) => {
            if (typeof mod === 'function') return mod;
            if (typeof mod?.default === 'function') return mod.default;
            for (const v of Object.values(mod)) {
              if (typeof v === 'function') return v;
            }
            return null;
          };

          const exportingInit = getInit(exportingMod);
          const accessibilityInit = getInit(accessibilityMod);

          if (typeof exportingInit === 'function') exportingInit(Highcharts);
          if (typeof accessibilityInit === 'function') accessibilityInit(Highcharts);

          hcModulesInited = true;
        }
        if (alive) setHcReady(true);
      } catch (e) {
        console.error('Highcharts module init failed:', e);
      }
    })();
    return () => { alive = false; };
  }, []);

  const colors = {
    bg: '#0B1020', panel: '#0F152B', grid: '#1B2550',
    text: '#D6DBF2', sub: '#9AA6D1', world: '#37D29A', country: '#4EA1FF',
  };
  const gradientFill = (hex: string, opacity = 0.28): Highcharts.GradientColorObject => ({
    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
    stops: [
      [0, Highcharts.color(hex)!.setOpacity(opacity).get('rgba') as any],
      [1, Highcharts.color(hex)!.setOpacity(0).get('rgba') as any],
    ],
  });

  const years = useMemo(() => Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i), [startYear, endYear]);


  const densify = useMemo(() => {
    return (arr: XY[] | null): XY[] => {
      const pts = (arr ?? [])
        .map(([x, y]) => [toNum(x), toNum(y)] as XY)
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
        .sort((a, b) => a[0] - b[0]);

      if (!pts.length) return [];
      const xs = pts.map(p => p[0]); const ys = pts.map(p => p[1]);
      const out: XY[] = [];
      for (const yr of years) {
        const i = xs.indexOf(yr);
        if (i !== -1) { out.push([yr, ys[i]]); continue; }
        let li = -1, ri = -1;
        for (let k = 0; k < xs.length; k++) { if (xs[k] < yr) li = k; else { ri = k; break; } }
        if (li !== -1 && ri !== -1) {
          const t = (yr - xs[li]) / (xs[ri] - xs[li]); out.push([yr, ys[li] + t * (ys[ri] - ys[li])]);
        } else if (li !== -1) out.push([yr, ys[li]]);
        else if (ri !== -1) out.push([yr, ys[ri]]);
        else out.push([yr, NaN]);
      }
      return out;
    };
  }, [years]);


  const demoWorldBio = useMemo<XY[]>(
    () => years.map((y, i) => [y, 3.1 - (1.4 * i) / (years.length - 1)]),
    [years]
  );
  const demoWorldEf = useMemo<XY[]>(
    () => years.map((y, i) => [y, 2.2 + (0.8 * i) / (years.length - 1)]),
    [years]
  );
  const demoCountryEf = useMemo<XY[]>(() => {
    const mid = years.indexOf(2005);
    return years.map((y, i) => {
      const a = 2.4, peak = 4.2, tail = 3.8;
      const v = i <= mid ? a + (peak - a) * (i / Math.max(1, mid))
                         : peak + (tail - peak) * ((i - mid) / Math.max(1, years.length - 1 - mid));
      return [y, v] as XY;
    });
  }, [years]);

  const worldBioFullXY   = useMemo<XY[]>(() => densify(worldBio ?? demoWorldBio),   [worldBio,   densify, demoWorldBio]);
  const worldEfFullXY    = useMemo<XY[]>(() => densify(worldEf ?? demoWorldEf),     [worldEf,    densify, demoWorldEf]);
  const countryEfFullXY  = useMemo<XY[]>(() => densify(countryEf ?? demoCountryEf), [countryEf,  densify, demoCountryEf]);

  const worldBioY = useMemo<number[]>(() => {
    const m = new Map(worldBioFullXY.map(([x, y]) => [x, y])); return years.map(y => (Number.isFinite(m.get(y) as number) ? (m.get(y) as number) : null as any));
  }, [worldBioFullXY, years]);
  const worldEfY = useMemo<number[]>(() => {
    const m = new Map(worldEfFullXY.map(([x, y]) => [x, y])); return years.map(y => (Number.isFinite(m.get(y) as number) ? (m.get(y) as number) : null as any));
  }, [worldEfFullXY, years]);
  const countryEfY = useMemo<number[]>(() => {
    const m = new Map(countryEfFullXY.map(([x, y]) => [x, y])); return years.map(y => (Number.isFinite(m.get(y) as number) ? (m.get(y) as number) : null as any));
  }, [countryEfFullXY, years]);

  const clipY = (arr: number[], idx: number) => arr.map((v, i) => (i <= idx ? v : null));

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [yearIndex, setYearIndex] = useState(0);
  const chartRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      setYearIndex(i => {
        if (i + 1 >= years.length) {
          setIsPlaying(false); 
          return years.length - 1;
        }
        return i + 1;
      });
    }, 120); 
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, years.length]);

  useEffect(() => {
    const chart: Highcharts.Chart | undefined = chartRef.current?.chart;
    if (!chart || !hcReady) return;
    const idx = Math.max(0, yearIndex);

  chart.series[0].setData(clipY(worldBioY, idx), false, { duration: 250 });
  chart.series[1].setData(clipY(worldEfY, idx), false, { duration: 250 });
  chart.series[2].setData(clipY(countryEfY, idx), false, { duration: 250 });

    const xAxis = chart.xAxis[0];
    xAxis.removePlotLine('race-cursor');
    xAxis.addPlotLine({
      id: 'race-cursor', value: idx, color: '#38bdf8', width: 2, dashStyle: 'ShortDash', zIndex: 10,
      label: { text: String(years[idx]), style: { color: '#38bdf8' }, y: -6 },
    });

    chart.redraw();
  }, [yearIndex, worldBioY, worldEfY, countryEfY, years, hcReady]);

  const options = useMemo<Highcharts.Options>(() => ({
    chart: { backgroundColor: colors.panel, spacing: [16, 16, 16, 16], style: { fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system' }, animation: true, height: 420 },
    title: { text: `Biocapacity vs Ecological Footprint`, align: 'left', style: { color: colors.text, fontWeight: '600' } },
    credits: { enabled: false },
  exporting: { enabled: false } as any,
    navigation: { buttonOptions: { enabled: true } } as any,
    accessibility: { enabled: false } as any,
    

  xAxis: { categories: years.map(String), labels: { style: { color: colors.sub }, step: 5 }, tickmarkPlacement: 'on', lineColor: colors.grid, gridLineColor: colors.grid },
  yAxis: { title: { text: 'gha per person', style: { color: colors.sub } }, min: 0, max: 8, gridLineColor: colors.grid, labels: { style: { color: colors.sub } } },
    legend: { itemStyle: { color: colors.text }, itemHoverStyle: { color: '#fff' }, backgroundColor: 'transparent' },
    tooltip: { shared: true, backgroundColor: colors.bg, borderColor: colors.grid, style: { color: colors.text }, valueSuffix: ' gha/person' },
    plotOptions: { series: { animation: { duration: 500 }, marker: { enabled: false }, lineWidth: 2.5, states: { hover: { lineWidth: 3 } }, turboThreshold: 0 }, areaspline: { fillOpacity: 0.35 } },
    series: [
      { type: 'areaspline', name: 'World Biocapacity', data: clipY(worldBioY, yearIndex), color: colors.world,   fillColor: gradientFill(colors.world, 0.30), zIndex: 1 },
      { type: 'areaspline', name: 'World Ecological Footprint', data: clipY(worldEfY, yearIndex), color: '#FF9800', fillColor: gradientFill('#FF9800', 0.22), zIndex: 2 },
      { type: 'areaspline', name: `${countryName} Ecological Footprint`, data: clipY(countryEfY, yearIndex), color: colors.country, fillColor: gradientFill(colors.country, 0.22), zIndex: 3 },
    ],
  }), [worldBioY, worldEfY, countryEfY, years, countryName, endYear, yearIndex]);



  return (
    <div style={{ background: colors.bg }} className="rounded-2xl p-4 border border-[#121a38]">

      <div className="flex items-center justify-between mb-3 relative group">

        <div className="absolute right-0 top-0 z-10">
          <InfoButton
            info={<span>
              A timeline area race chart is used to illustrate the evolution of biocapacity and Ecological Footprint per person. <br /><br />The animated visual highlights the moments when the Ecological Footprint intersects and surpasses biocapacity, marking the onset of ecological overshoot.
               <br /><br />Data Source: <a href="https://data.footprintnetwork.org/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Global Footprint Network</a>
            </span>}
          />
        </div>

        <div className="flex-1 flex justify-end items-center gap-3 pr-12">
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            className="rounded-xl bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (!isPlaying && yearIndex >= years.length - 1) {
                setYearIndex(0); 
              }
              setIsPlaying(p => !p);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700 flex items-center gap-2"
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle">
                <rect x="4" y="4" width="3" height="10" rx="1" fill="currentColor"/>
                <rect x="11" y="4" width="3" height="10" rx="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle">
                <polygon points="5,4 14,9 5,14" fill="currentColor" />
              </svg>
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

  <div className="rounded-2xl p-2" style={{ background: colors.panel, width: '100%', position: 'relative' }}>
        {!hcReady ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="text-slate-400">Initializing chart…</div>
        ) : (
          <HighchartsReact highcharts={Highcharts} options={{ ...options, chart: { ...options.chart, height: '40%' } }} ref={chartRef} />
        )}
      </div>



    </div>
  );
}
