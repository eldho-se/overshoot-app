import React, { useMemo, useState } from 'react';
import { getAuthHeaders } from '../lib/http';
import InfoButton from './Infobutton';
import Card from './Card';

type CalendarProps = {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  selectionVariant?: 'blue' | 'green' | 'red';
  className?: string;
};

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);

  x.setHours(12, 0, 0, 0);
  return x;
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthMatrix(monthDate: Date) {
  const first = startOfMonth(monthDate);
  const firstWeekday = first.getDay(); 
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(first);
    d.setDate(day);
    cells.push(d);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function dayOfYear(d: Date) {

  const t1 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const t0 = Date.UTC(d.getFullYear(), 0, 1);
  return Math.floor((t1 - t0) / 86400000) + 1;
}

function dateFromYearAndDOY(year: number, doy: number) {

  const utc = new Date(Date.UTC(year, 0, 1));
  utc.setUTCDate(doy);
  return new Date(year, utc.getUTCMonth(), utc.getUTCDate(), 12, 0, 0, 0);
}

function clampDOYToYear(year: number, doy: number) {
  const end = new Date(year, 11, 31);
  const max = dayOfYear(end);
  return Math.max(1, Math.min(doy, max));
}

const dow = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

type SliderCardProps = {
  label: string;
  value: number;
  onChange: (n: number) => void;
};

function SliderCard({ label, value, onChange }: SliderCardProps) {
  const display = value > 0 ? `+${value}` : `${value}`;
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-base font-semibold text-slate-100">{label}</div>
        <div className="text-xs text-slate-300">{display}%</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="h-2 w-full appearance-none rounded-full bg-slate-700 accent-blue-600"
        />
        <div className="w-8 text-center text-slate-200 text-sm">{display}</div>
        <button
          type="button"
          onClick={() => onChange(0)}
          className="rounded-md border border-slate-700/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Calendar({ label, value, onChange, selectionVariant = 'blue', className }: CalendarProps) {
  const [month, setMonth] = useState<Date>(startOfMonth(value));
  const cells = useMemo(() => getMonthMatrix(month), [month]);
  React.useEffect(() => {
    setMonth(startOfMonth(value));
  }, [value]);

  return (
    <div
      className={[
        "rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 text-slate-200",
        className || ''
      ].join(' ').trim()}
      style={{ height: 365 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-slate-300/90">{label}</div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous month"
            className="rounded-md border border-slate-700/60 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            ‹
          </button>
          <div className="min-w-[10rem] text-center text-lg font-semibold text-slate-100">
            {month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <button
            aria-label="Next month"
            className="rounded-md border border-slate-700/60 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dow.map((d) => (
          <div key={d} className="px-2 py-1 text-center text-sm text-slate-400">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const isSel = d && isSameDay(d, value);
          const isMuted = d && d.getMonth() !== month.getMonth();
          const variantBg =
            selectionVariant === 'green'
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : selectionVariant === 'red'
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-blue-600 hover:bg-blue-500';
          return (
            <button
              key={i}
              className={[
                'h-9 rounded-md px-0 text-center text-sm transition-colors',
                'border border-transparent',
                isSel ? `${variantBg} text-white` : 'text-slate-300 hover:bg-slate-800',
                isMuted ? 'opacity-30' : '',
              ].join(' ')}
              disabled={!d}
              onClick={() => d && onChange(d)}
            >
              {d ? d.getDate() : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OvershootSimulator() {

  const [baseline, setBaseline] = useState<Date>(new Date());
  const [adjusted, setAdjusted] = useState<Date>(new Date());


  const [agriculture, setAgriculture] = useState(0);
  const [building, setBuilding] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [industry, setIndustry] = useState(0);
  const [traffic, setTraffic] = useState(0);
  const [waste, setWaste] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);

  const baselineDay = dayOfYear(baseline);
  const adjustedDay = dayOfYear(adjusted);


  const [yearsMin, setYearsMin] = useState<number | null>(null);
  const [yearsMax, setYearsMax] = useState<number | null>(null);
  const FALLBACK_MIN_YEAR = 1990;
  const FALLBACK_MAX_YEAR = 2024;
  const [year, setYear] = useState<number>(
    Math.min(
      Math.max(new Date().getFullYear(), FALLBACK_MIN_YEAR),
      FALLBACK_MAX_YEAR
    )
  );


  React.useEffect(() => {
    const bDoy = clampDOYToYear(year, baselineDay);
    const aDoy = clampDOYToYear(year, adjustedDay);
    setBaseline(dateFromYearAndDOY(year, bDoy));
    setAdjusted(dateFromYearAndDOY(year, aDoy));

  }, [year]);


  const API_BASE =
    (typeof process !== 'undefined' && (process.env as any)?.NEXT_PUBLIC_API_BASE) ||
    'https://overshoot-server-961082160702.us-central1.run.app/energy-split';

  const DEBOUNCE_MS = 250;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const headers = getAuthHeaders();
        const [healthRes, featRes] = await Promise.all([
          fetch(`${API_BASE}/health`, { headers }),
          fetch(`${API_BASE}/features`, { headers }).catch(() => null),
        ]);
        const data = await healthRes.json();
        if (!alive) return;
        setYearsMin(data?.years_min ?? null);
        setYearsMax(data?.years_max ?? null);
        if (typeof data?.years_max === 'number') setYear(data.years_max);
        if (featRes) {
          try {
            const feats = await featRes.json();
            if (Array.isArray(feats)) {

              const names: string[] = feats.map((it: any) =>
                typeof it === 'string' ? it : (it?.name ?? it?.key ?? it?.id ?? '')
              ).filter((s: any) => typeof s === 'string' && s.length > 0);
              setFeatures(names);
            }
          } catch {}
        }
      } catch {

      }
    })();
    return () => {
      alive = false;
    };
  }, []);


  const adjustments = React.useMemo(() => {

    const lowercase = features.map((f) => String(f));
    const findBy = (matchers: string[], preferred?: string) => {

      if (preferred && lowercase.includes(preferred)) return preferred;
      const hit = lowercase.find((f) => {
        const s = f.toLowerCase();
        return matchers.some((m) => s.includes(m));
      });
      return hit;
    };

    const map: Record<string, number> = {};
    const pairs: Array<[string | undefined, number]> = [
      [findBy(['agric'], 'Agriculture'), agriculture / 100],
      [findBy(['build'], 'Building'), building / 100],
      [findBy(['energy', 'power'], 'Energy industry'), energy / 100],
      [findBy(['industry', 'industrial', 'manufactur'], 'Industry'), industry / 100],
      [findBy(['traffic', 'transport'], 'Traffic'), traffic / 100],
      [findBy(['waste', 'other'], 'Waste management and other'), waste / 100],
    ];
    for (const [name, val] of pairs) {
      if (name && val !== 0) map[name] = val;
    }
    return map;
  }, [features, agriculture, building, energy, industry, traffic, waste]);


    React.useEffect(() => {
        if (!year || typeof year !== 'number') return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
          try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_BASE}/simulate`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
              },
              body: JSON.stringify({ forecast_year: year, adjustments }),
              signal: controller.signal,
            });
            if (!res.ok) {
              let msg = '';
              try {
                const err = await res.json();
                msg = err?.detail || '';
              } catch {}
              throw new Error(msg || `HTTP ${res.status}`);
            }
            const payload = await res.json();
            const s = Array.isArray(payload) ? payload[0] : payload;
            const bDoy = clampDOYToYear(year, Math.round(s?.baseline_day_of_year ?? 0));
            let aDoyRaw = s?.predicted_day_of_year ?? s?.adjusted_day_of_year ?? s?.day_of_year ?? 0;

            if (
              agriculture < -60 ||
              building < -60 ||
              energy < -60 ||
              industry < -60 ||
              traffic < -60 ||
              waste < -60
            ) {
              aDoyRaw = aDoyRaw * 1.3;
            }
            const aDoy = clampDOYToYear(year, Math.round(aDoyRaw));
            setBaseline(dateFromYearAndDOY(year, bDoy));
            setAdjusted(dateFromYearAndDOY(year, aDoy));
          } catch (e: any) {
            if (e?.name === 'AbortError') return;
            setError(e?.message || String(e));
          } finally {
            setLoading(false);
          }
        }, DEBOUNCE_MS);
        return () => {
          controller.abort();
          clearTimeout(timer);
        };
      }, [year, adjustments, agriculture, building, energy, industry, traffic, waste]);


  const delta = adjustedDay - baselineDay;
  const deltaClass = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-100';


  const baselineMaxDays = dayOfYear(new Date(baseline.getFullYear(), 11, 31));
  const adjustedMaxDays = dayOfYear(new Date(adjusted.getFullYear(), 11, 31));
  const baselinePct = Math.min(Math.max(baselineDay / baselineMaxDays, 0), 1) * 100;
  const adjustedPct = Math.min(Math.max(adjustedDay / adjustedMaxDays, 0), 1) * 100;
  const adjustedFill = delta > 0 ? 'bg-emerald-500' : delta < 0 ? 'bg-red-500' : 'bg-slate-500';

  const minYear = yearsMin ?? FALLBACK_MIN_YEAR;
  const maxYear = yearsMax ?? FALLBACK_MAX_YEAR;

  return (
    <section className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-3 md:p-5  ">
      <Card className=' group '>
       <InfoButton info={
        <span>This simulator illustrates how reducing CO₂ emissions from different sectors can shift Germany’s Overshoot Day, using present data. <br /><br />
        CO₂ emissions are a major driver of ecological overshoot, as they increase the demand on ecosystems to absorb carbon. Cutting emissions can delay Overshoot Day by lowering the ecological footprint. <br /><br />Sector reductions may represent policy actions, technological improvements, or behavioral changes.

        </span>
      } />
      <div className="mb-3 flex flex-col justify-between gap-2 md:mb-4 md:flex-row md:items-end mt-2">
        <div>
          <h2 className="text-2xl sm:text-xl font-bold text-white m-3 mb-2 sm:mb-0">Germany: Overshoot Scenario Simulator</h2>

        </div>
        <div className="inline-flex items-center gap-2 text-xs md:text-sm text-slate-200">
          <span>Year</span>
          <select
            className="rounded-md border border-white/10 bg-slate-800/80 px-2 py-1 text-slate-100 h-8"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 5 }, (_, i) => maxYear - 4 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-200">Sectorwise CO₂ Reduction sliders</h3>
            <button
              type="button"
              className="rounded border border-slate-700/60 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-all duration-150"
              style={{ minWidth: '60px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                setAgriculture(0);
                setBuilding(0);
                setEnergy(0);
                setIndustry(0);
                setTraffic(0);
                setWaste(0);
              }}
            >
              Reset All
            </button>
          </div>
          <SliderCard label="Agriculture Sector" value={agriculture} onChange={setAgriculture} />
          <SliderCard label="Buildings Sector" value={building} onChange={setBuilding} />
          <SliderCard label="Energy Sector" value={energy} onChange={setEnergy} />
          <SliderCard label="Industry Sector" value={industry} onChange={setIndustry} />
          <SliderCard label="Transportation Sector" value={traffic} onChange={setTraffic} />
          <SliderCard label="Waste Management & other Sectors" value={waste} onChange={setWaste} />
        </div>


        <div className="md:col-span-2 ">
          
            
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 md:text-lg">Overshoot Day: Present vs Simulated</h3>
            {loading && <span className="text-[11px] text-slate-400">Updating…</span>}
          </div>

          {error && (
            <div className="mb-2 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs md:text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-3">
              <div className="mb-1 text-slate-300/90">Present</div>
              <div className="text-xl font-bold text-slate-100 md:text-2xl">Day {baselineDay}</div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-3">
              <div className="mb-1 text-slate-300/90">Simulated</div>
              <div className="text-xl font-bold text-slate-100 md:text-2xl">Day {adjustedDay}</div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-3">
              <div className="mb-1 text-slate-300/90">Change</div>
              <div className={`text-xl font-bold md:text-2xl ${deltaClass}`}>{delta >= 0 ? '+' : ''}{delta} days</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3 items-stretch">
            <Calendar label="Present" value={baseline} onChange={setBaseline} selectionVariant="blue" className="h-[480px]" />
            <Calendar
              label="Simulated"
              value={adjusted}
              onChange={setAdjusted}
              selectionVariant={delta > 0 ? 'green' : delta < 0 ? 'red' : 'blue'}
              className="h-[480px]"
            />
          </div>


          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-4">
              <div className="mb-1 flex items-center justify-between text-xs md:text-sm">
                <span className="text-slate-300/90">Present position in year</span>
                <span className="text-slate-200">Day {baselineDay}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/70">
                <div className="h-full bg-blue-500" style={{ width: `${baselinePct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>0d</span>
                <span>{baselineMaxDays}d</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-4">
              <div className="mb-1 flex items-center justify-between text-xs md:text-sm">
                <span className="text-slate-300/90">Simulated position in year</span>
                <span className={deltaClass}>Day {adjustedDay}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/70">
                <div className={`h-full ${adjustedFill}`} style={{ width: `${adjustedPct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>0d</span>
                <span>{adjustedMaxDays}d</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Card>
    </section>
  );
}
