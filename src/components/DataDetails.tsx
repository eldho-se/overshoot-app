"use client";

import React, { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { fetchJson, getApiBase } from "../lib/http";

export type DataDetailsMetric = {
  label: string;
  value: string | number | React.ReactNode;
  delta?: number | string;
  hint?: string;
};
export type DataDetailsRow = { label: string; value: string | number | React.ReactNode };
export type DataDetailsAction = { label: string; href?: string; onClick?: () => void };

export interface DataDetailsProps<T = unknown> {
  title: string;
  subtitle?: string;
  primary?: DataDetailsMetric[];
  details?: DataDetailsRow[];
  tags?: string[];
  lastUpdated?: string | Date;
  raw?: T;
  actions?: DataDetailsAction[];


  co2CsvUrl?: string;
  energyCsvUrl?: string;


  onClose?: () => void;
  className?: string;
}


function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function formatDate(d?: string | Date) {
  if (!d) return undefined;
  const dd = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dd.getTime())) return undefined;
  return dd.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
const Chip: React.FC<
  { children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>
> = ({ children, className, ...rest }) => (
  <span
    className={classNames(
      "inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-800/60 px-3 py-1 text-xs text-slate-200",
      className
    )}
    {...rest}
  >
    {children}
  </span>
);
export const Button: React.FC<
  {
    variant?: "solid" | "ghost";
    as?: "button" | "a";
    href?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement> &
    React.AnchorHTMLAttributes<HTMLAnchorElement>
> = ({ variant = "solid", as = "button", href, className, children, ...rest }) => {
  const base =
    "rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/50";
  const styles =
    variant === "solid"
      ? "bg-blue-600 text-white hover:bg-blue-500"
      : "text-slate-300 hover:bg-slate-800/80";
  if (as === "a") {
    return (
      <a href={href} className={classNames(base, styles, className)} {...(rest as any)}>
        {children}
      </a>
    );
  }
  return (
    <button className={classNames(base, styles, className)} {...(rest as any)}>
      {children}
    </button>
  );
};
const StatTile: React.FC<{ metric: DataDetailsMetric }> = ({ metric }) => {
  const { label, value, delta, hint } = metric;
  const isNeg = useMemo(
    () =>
      typeof delta === "number"
        ? delta < 0
        : typeof delta === "string"
        ? /^-/.test(delta)
        : false,
    [delta]
  );
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between">
        <div className="text-sm text-slate-400" title={hint}>
          {label}
        </div>
        {delta != null && (
          <span
            className={classNames(
              "rounded-md px-2 py-0.5 text-xs",
              isNeg ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"
            )}
          >
            {typeof delta === "number" && delta > 0 ? `+${delta}` : String(delta)}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
};
const KeyValueRows: React.FC<{ rows?: DataDetailsRow[] }> = ({ rows }) => {
  if (!rows?.length) return null;
  return (
    <dl className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 bg-slate-900/40">
          <dt className="col-span-4 px-4 py-3 text-sm text-slate-400">{r.label}</dt>
          <dd className="col-span-8 px-4 py-3 text-sm text-slate-100">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
};
const RawJsonBlock: React.FC<{ data: unknown }> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const json = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
    } catch {}
  };
  if (data == null) return null;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-medium text-slate-300">Raw data</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide" : "Show"}
          </Button>
          <Button variant="ghost" onClick={copy}>
            Copy JSON
          </Button>
        </div>
      </div>
      {open && (
        <pre className="max-h-80 overflow-auto px-4 pb-4 text-xs leading-relaxed text-slate-200">
          {json}
        </pre>
      )}
    </div>
  );
};


function parseCSV(text: string): Array<Record<string, string>> {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"') {
      if (inQuotes && n === '"') {
        field += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && n === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const header = rows[0].map((h) => (h ?? "").replace(/^\uFEFF/, "").trim());
  return rows
    .slice(1)
    .filter((r) => r.length && r.some((x) => x !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
      return obj;
    });
}


const normalizeSector = (s?: string) => {
  if (!s) return "";
  const t = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/\bindustr|manufact/.test(t)) return "Industry";
  if (/\b(build|residential|house|buildings)\b/.test(t)) return "Building";
  if (/\b(transport|traffic|mobility|road|rail)\b/.test(t)) return "Transportation";
  if (/\b(agri|farming|livestock)\b/.test(t)) return "Agriculture";
  return s.trim();
};

async function parseCsvToSeries(url: string) {

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
  }

  const text = await res.text();
  const rows = parseCSV(text);
  if (!rows.length) {
    throw new Error(`No rows parsed from ${url}`);
  }


  const headers = Object.keys(rows[0]).map((h) => (h ?? "").trim());
  const findCol = (cands: string[]) =>
    headers.find((h) => cands.some((c) => h.toLowerCase() === c.toLowerCase()));


  const yearCol = findCol(["year", "Year"]);
  const sectorCol = findCol(["sector", "Sector", "Category", "Main category"]);
  const valueCol =
    findCol(["PJ", "Value (PJ)", "value", "energy", "Energy"]) ??
    findCol(["CO2_kt", "co2", "CO₂"]);

  const toNum = (v: any) => {
    const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  if (yearCol && sectorCol && valueCol) {
    const byYear: Record<number, any> = {};
    for (const r of rows) {
      const y = parseInt(String(r[yearCol]).replace(/[^\d]/g, ""), 10);
      const s = normalizeSector(String(r[sectorCol]));
      const v = toNum(r[valueCol]);
      if (!Number.isFinite(y) || !s) continue;
      byYear[y] ??= { year: y };
      byYear[y][s] = (byYear[y][s] ?? 0) + v;
    }
    const out = Object.values(byYear) as any[];
    out.sort((a, b) => a.year - b.year);
    return out;
  }


  const has = (re: RegExp) => headers.find((h) => re.test(h.toLowerCase()));
  const secCols = {
    Industry: has(/industr|manufact/),
    Building: has(/build|residential|house|buildings/),
    Transportation: has(/transport|traffic|mobility|road|rail/),
    Agriculture: has(/agri|farming|livestock/),
  };
  if (findCol(["year", "Year"]) && Object.values(secCols).some(Boolean)) {
    const yCol = findCol(["year", "Year"])!;
    const out = rows
      .map((r) => {
        const y = parseInt(String(r[yCol]).replace(/[^\d]/g, ""), 10);
        if (!Number.isFinite(y)) return null;
        return {
          year: y,
          Industry: secCols.Industry ? toNum(r[secCols.Industry]) : undefined,
          Building: secCols.Building ? toNum(r[secCols.Building]) : undefined,
          Transportation: secCols.Transportation ? toNum(r[secCols.Transportation]) : undefined,
          Agriculture: secCols.Agriculture ? toNum(r[secCols.Agriculture]) : undefined,
        };
      })
      .filter(Boolean) as any[];
    out.sort((a, b) => a.year - b.year);
    return out;
  }

  throw new Error(
    `Unrecognized columns in ${url}. Need tidy (Year, Sector, PJ/CO2_kt) or wide (Year + sector columns).`
  );
}


const ChartBlock: React.FC<{
    title: string;
    yLabel: string;
    data: any[] | null | undefined;
    hoveredYear?: number | null;
    setHoveredYear?: (year: number | null) => void;
    chartRef: React.RefObject<any>;
    syncLegendVisibility?: (seriesName: string, shouldShow: boolean) => void;
    syncLegendHover?: (seriesName: string, hover: boolean, sourceRef: React.RefObject<any>) => void;
  }> = ({ title, yLabel, data, hoveredYear, setHoveredYear, chartRef, syncLegendVisibility, syncLegendHover }) => {
  if (!data?.length) return null;
  const seriesKeys = ["Industry", "Building", "Transportation", "Agriculture"] as const;
  const colors: Record<string, string> = {
    Industry: "#d97706",
    Building: "#60a5fa",
    Transportation: "#10b981",
    Agriculture: "#eab308",
  };
  const series = seriesKeys.map((k) => ({
    type: "line" as const,
    name: k,
    data: data.map((d) => [Number(d.year), d[k] != null ? Number(d[k]) : null]) as Array<
      [number, number | null]
    >,
    color: colors[k],
  }));
  const options: Highcharts.Options = {
    chart: {
      backgroundColor: "transparent",
      height: 420,
      events: {
        load: function (this: Highcharts.Chart) {
          try {
            const chart = this as any;
            chart.series.forEach((s: any) => {
              const el: HTMLElement | undefined = s?.legendItem?.group?.element;
              if (!el) return;
              const over = () => syncLegendHover && syncLegendHover(s.name, true, chartRef);
              const out = () => syncLegendHover && syncLegendHover(s.name, false, chartRef);
              el.addEventListener('mouseenter', over);
              el.addEventListener('mouseleave', out);

              (s as any).__legendHoverListeners = { over, out, el };
            });
          } catch {}
        },
        redraw: function (this: Highcharts.Chart) {
          try {
            const chart = this as any;

            chart.series.forEach((s: any) => {
              const meta = (s as any).__legendHoverListeners;
              if (meta?.el) {
                meta.el.removeEventListener('mouseenter', meta.over);
                meta.el.removeEventListener('mouseleave', meta.out);
              }
            });

            chart.series.forEach((s: any) => {
              const el: HTMLElement | undefined = s?.legendItem?.group?.element;
              if (!el) return;
              const over = () => syncLegendHover && syncLegendHover(s.name, true, chartRef);
              const out = () => syncLegendHover && syncLegendHover(s.name, false, chartRef);
              el.addEventListener('mouseenter', over);
              el.addEventListener('mouseleave', out);
              (s as any).__legendHoverListeners = { over, out, el };
            });
          } catch {}
        }
      }
    },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      title: { text: "Year" },
      tickInterval: 5,
      gridLineWidth: 0,
      labels: { style: { color: "#94a3b8" } },
    },
    yAxis: {
      title: { text: yLabel, style: { color: "#94a3b8" } },
      gridLineColor: "rgba(148,163,184,0.2)",
      labels: { style: { color: "#94a3b8" } },
      min: 0,
      max: Math.max(
        ...series
          .map(s => s.data.map((d: any) => d[1]))
          .flat()
          .filter((v: number | null | undefined) => typeof v === 'number' && isFinite(v))
      ),
    },
    legend: { itemStyle: { color: "#cbd5e1" } },
    tooltip: {
      backgroundColor: "rgba(0,0,0,0.75)",
      shared: true,
        formatter: function () {

          if (hoveredYear != null) {
            const points = this.points?.filter((p: any) => p.x === hoveredYear);
            if (points && points.length) {
              const year = hoveredYear;
              let html = `<div style='font-weight:bold;font-size:1.1em;margin-bottom:6px;'>Year: ${year}</div><br/>`;
              html += points.map((p: any) => `<span style='color:${p.color}'>●</span> ${p.series.name}: <b>${p.y}</b><br/>`).join("");
              return `<div style='color:#fff;'>${html}</div>`;
            }
          }

          return false;
      },
    },
    plotOptions: {
      series: {
        marker: { enabled: false },
        lineWidth: 3,
        states: {
          inactive: { opacity: 0.2 },
          hover: { enabled: true, lineWidthPlus: 2, halo: { size: 0 } as any },
        },
        point: {
          events: {
            mouseOver: function () {
              if (setHoveredYear) setHoveredYear(this.x);
            },
            mouseOut: function () {
              if (setHoveredYear) setHoveredYear(null);
            },
          },
        },
        events: {

          mouseOver: function () {
            if (typeof syncLegendHover === 'function') {
              syncLegendHover(this.name as any, true, chartRef);
            }
          },
          mouseOut: function () {
            if (typeof syncLegendHover === 'function') {
              syncLegendHover(this.name as any, false, chartRef);
            }
          },
          legendItemClick: function (e: any) {

            if (typeof syncLegendVisibility === 'function') {
              const name = this.name;
              setTimeout(() => {

                syncLegendVisibility(name, this.visible);
              }, 0);
            }
            return true;
          },
        },
      },
    },
    series: series as Highcharts.SeriesOptionsType[],
  };

    React.useEffect(() => {
      if (!chartRef?.current?.chart || !syncLegendHover) return;
      const chart: any = chartRef.current.chart;
      const cleanups: Array<() => void> = [];
      try {
        chart.series.forEach((s: any) => {
          const grp: HTMLElement | undefined = s?.legendItem?.group?.element;
          if (!grp) return;
          const over = () => syncLegendHover(s.name, true, chartRef);
          const out = () => syncLegendHover(s.name, false, chartRef);
          grp.addEventListener('mouseenter', over);
          grp.addEventListener('mouseleave', out);
          cleanups.push(() => {
            grp.removeEventListener('mouseenter', over);
            grp.removeEventListener('mouseleave', out);
          });
        });
      } catch {}
      return () => { cleanups.forEach(fn => fn()); };
    }, [chartRef, data, syncLegendHover]);

    React.useEffect(() => {
      if (!chartRef?.current?.chart) return;
      const chart: any = chartRef.current.chart;
      const container: HTMLElement = chart.container;
      if (!container) return;

      const onMouseMove = (e: MouseEvent) => {
        const event = chart.pointer.normalize(e);
        let closestPoint: any = null;
        let minDist = Infinity;
        chart.series.forEach((series: any) => {
          series.points.forEach((point: any) => {
            const dist = Math.abs(point.plotX - event.chartX);
            if (dist < minDist) {
              minDist = dist;
              closestPoint = point;
            }
          });
        });
        if (closestPoint) {
          setHoveredYear?.(closestPoint.x);
        }
      };

      const onMouseLeave = () => {
        setHoveredYear?.(null);
      };
      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);
      return () => {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseleave', onMouseLeave);
      };
    }, [chartRef, setHoveredYear]);
  return (
    <figure className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="px-2 pt-2">
        <h4 className="text-base font-semibold text-white">{title}</h4>
      </div>
      <div className="w-full">
          <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />
      </div>
    </figure>
  );
};


const DataDetails: React.FC<DataDetailsProps> = ({
  title,
  subtitle,
  primary,
  details,
  tags,
  lastUpdated,
  raw,
  co2CsvUrl,
  energyCsvUrl, 
  onClose,
  className,
}) => {

  const syncLegendVisibility = (seriesName: string, shouldShow: boolean) => {
    [co2ChartRef, energyChartRef].forEach(ref => {
      const chart = ref.current?.chart;
      if (!chart) return;
      const series = chart.series.find((s: any) => s.name === seriesName);
      if (series) {

        series.setVisible(shouldShow, false);
        chart.redraw();
      }
    });
  };

  const syncLegendHover = (seriesName: string, hover: boolean, sourceRef: React.RefObject<any>) => {
    [co2ChartRef, energyChartRef].forEach(ref => {
      if (ref === sourceRef) return; 
      const chart = ref.current?.chart;
      if (!chart) return;
      chart.series.forEach((s: any) => {
        if (s.name === seriesName) {
          s.setState(hover ? 'hover' : 'normal');
        } else {
          s.setState(hover ? 'inactive' : 'normal');
        }
      });
      chart.redraw();
    });
  };
 
  const co2ChartRef = React.useRef<any>(null);
  const energyChartRef = React.useRef<any>(null);
  const updated = formatDate(lastUpdated);
  const [co2Series, setCo2Series] = useState<any[] | null>(null);
  const [energySeries, setEnergySeries] = useState<any[] | null>(null);
  const [co2Err, setCo2Err] = useState<string | null>(null);
  const [energyErr, setEnergyErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Shared hovered year for tooltip sync
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Synchronize tooltips when hoveredYear changes
  React.useEffect(() => {
    if (typeof hoveredYear === 'number') {
      if (co2ChartRef.current?.chart) {
        const chart = co2ChartRef.current.chart;
        const points = chart.series.flatMap((s: any) => s.points.filter((p: any) => p.x === hoveredYear));
        if (points.length) chart.tooltip.refresh(points);
      }
      if (energyChartRef.current?.chart) {
        const chart = energyChartRef.current.chart;
        const points = chart.series.flatMap((s: any) => s.points.filter((p: any) => p.x === hoveredYear));
        if (points.length) chart.tooltip.refresh(points);
      }
    } else {
      co2ChartRef.current?.chart?.tooltip?.hide();
      energyChartRef.current?.chart?.tooltip?.hide();
    }
  }, [hoveredYear]);



  function groupSeries(flat: Array<{ year: number; name: string; y: number }>, sectorMap?: Record<string, string>) {
    const grouped: Record<number, any> = {};
    flat.forEach(({ year, name, y }) => {
      if (!grouped[year]) grouped[year] = { year };

      let sector = name;
      if (sectorMap && sectorMap[sector]) sector = sectorMap[sector];
      else if (/industr|manufact/i.test(sector)) sector = "Industry";
      else if (/build|residential|house|buildings/i.test(sector)) sector = "Building";
      else if (/transport|traffic|mobility|road|rail/i.test(sector)) sector = "Transportation";
      else if (/agri|farming|livestock/i.test(sector)) sector = "Agriculture";
      grouped[year][sector] = y;
    });
    return Object.values(grouped).sort((a, b) => a.year - b.year);
  }

  useEffect(() => {
    setLoading(true);
    const apiBase = getApiBase();
    fetchJson(`${apiBase}/pie_data/all`)
      .then((data) => {
        const co2SectorMap = { Traffic: "Transportation" } as Record<string, string>;
        setEnergySeries(groupSeries(data?.energy?.energySeries ?? []));
        setCo2Series(groupSeries(data?.co2?.co2Series ?? [], co2SectorMap));
      })
      .catch((e) => {
        setEnergyErr(String(e?.message ?? e));
        setCo2Err(String(e?.message ?? e));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="m-1 flex flex-col gap-2 w-full disable-scrollbars fixed-height">

      

          
          <KeyValueRows rows={details} />


          <div className="flex flex-row gap-2 w-full overflow-x-auto">

            {loading && (
              <div className="h-[120px] grid place-items-center rounded-xl border border-slate-800 bg-slate-900/40 text-sm text-slate-400">
                Loading data…
              </div>
            )}
            <div className="w-1/2 min-w-[340px]">
              <ChartBlock
                title="CO₂ Emissions"
                yLabel="CO₂ (kt)"
                data={co2Series}
                hoveredYear={hoveredYear}
                setHoveredYear={setHoveredYear}
                chartRef={co2ChartRef}
                syncLegendVisibility={syncLegendVisibility}
                syncLegendHover={syncLegendHover}
              />
            </div>


            {loading && (
              <div className="h-[120px] grid place-items-center rounded-xl border border-slate-800 bg-slate-900/40 text-sm text-slate-400">
                Loading data…
              </div>
            )}
            <div className="w-1/2 min-w-[340px]">
              <ChartBlock
                title="Energy Consumption"
                yLabel="Energy (PJ)"
                data={energySeries}
                hoveredYear={hoveredYear}
                setHoveredYear={setHoveredYear}
                chartRef={energyChartRef}
                syncLegendVisibility={syncLegendVisibility}
                syncLegendHover={syncLegendHover}
              />
            </div>
          </div>

          <div className="mt-5">
            <RawJsonBlock data={raw} />
          </div>

          {updated && (
            <p className="mt-4 text-right text-xs text-slate-500">Last updated {updated}</p>
          )}
        </div>
      );
}

export default DataDetails;
