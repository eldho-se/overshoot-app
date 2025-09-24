"use client";
import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { DrilldownOptions, SeriesOptionsType } from "highcharts";

type Props = {
  title?: string | null;
  data: SeriesOptionsType[];
  drilldown?: DrilldownOptions;
  unit?: string;
};

export default function HCPieChart({ title = null, data, drilldown, unit = "kt CO₂" }: Props) {
  const [ready, setReady] = React.useState<boolean>(Boolean((Highcharts as any).__drilldownLoaded));

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === "undefined") return; 
      try {
        if (!(Highcharts as any).__drilldownLoaded) {
          const modAny: any = await import("highcharts/modules/drilldown");
          const init = modAny?.default || modAny;
          if (typeof init === "function") init(Highcharts);
          (Highcharts as any).__drilldownLoaded = true;
        }
        if (mounted) setReady(true);
      } catch {
      }
    })();
    return () => { mounted = false; };
  }, []);

  const options = React.useMemo<Highcharts.Options>(() => ({
    chart: {
      backgroundColor: "#060d1d",
      style: { fontFamily: "Inter, sans-serif" },
      type: "pie",
      animation: { duration: 600 },
      events: {
        load: function (this: Highcharts.Chart) {
          try {
            const chart = this as Highcharts.Chart;
            const container = chart.container as HTMLElement;
            if (!container.id) {
              container.id = `hc-${Math.random().toString(36).slice(2)}`;
            }

            if (!container.querySelector('style[data-hc-breadcrumb-fix]')) {
              const style = document.createElement('style');
              style.setAttribute('data-hc-breadcrumb-fix', 'true');
              style.innerHTML = `
                #${container.id} .highcharts-data-label a { text-decoration: none !important; fill: #ffffff !important; color: #ffffff !important; }
                #${container.id} .highcharts-data-label a tspan { fill: #ffffff !important; }
                #${container.id} .highcharts-breadcrumbs-group text { fill: #ffffff !important; }
                #${container.id} .highcharts-breadcrumbs-button:hover { fill: transparent !important; text-decoration: none !important; }
                #${container.id} .highcharts-breadcrumbs-separator { fill: #aaaaaa !important; }
              `;
              container.appendChild(style);
            }
          } catch {}
        },
        drilldown: function (this: Highcharts.Chart, e: any) {
          try {
            const chart = this;
            const parentColor: any = e?.point?.color || Highcharts.getOptions().colors?.[0];
            const rows: any[] = (e?.seriesOptions && (e.seriesOptions as any).data) || [];
            const childData = rows.map((row: any, i: number) => {
              const name = Array.isArray(row) ? row[0] : row.name;
              const y = Array.isArray(row) ? row[1] : row.y;
              const brightness = 0.2 - (i / rows.length) * 0.4;
              const color = Highcharts.color(parentColor).brighten(brightness).get("rgb");
              return { name, y, color };
            });
            const seriesOptions: Highcharts.SeriesPieOptions = {
              type: "pie",
              name: e?.point?.name || "Details",
              data: childData as any,
              animation: { duration: 600 } as any,
              dataLabels: { enabled: true, distance: 12, style: { color: "#ffffff" } },
            };
            if (typeof e?.preventDefault === "function") e.preventDefault();
            (chart as any).addSingleSeriesAsDrilldown(e.point, seriesOptions);
            (chart as any).applyDrilldown();
          } catch {}
        },
      },
    },
    title: { text: title ?? undefined, style: { color: "#ffffff" } },
    accessibility: {
      announceNewData: { enabled: true },
      point: { valueSuffix: "%" },
    },
    plotOptions: {
      series: { animation: { duration: 600 } as any },
      pie: {
        borderColor: "#060d1d",
        borderWidth: 3,
        borderRadius: 5,
        colorByPoint: true,
        colors: Highcharts.getOptions().colors,
        dataLabels: [
          {
            enabled: true,
            distance: 15,
            format: '<span style="color:#ffffff;text-decoration:none;text-outline:none;font-weight:normal">{point.name}</span>',
            useHTML: true,
            style: {
              color: "#ffffff",
              textOutline: "none",
              textDecoration: "none",
              fontWeight: "normal",
            },
          },
          {
            enabled: true,
            distance: "-30%",
            filter: { property: "percentage", operator: ">", value: 5 } as any,
            format: "{point.percentage:.1f} %",
            useHTML: true,
            style: { fontSize: "0.9em", color: "#000000", fontWeight: "bold", textOutline: "none",
              textDecoration: "none" },

            textOutline: "none",
          },
        ] as any,
      },
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat:
        `<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f} ${unit}</b><br/> <span></span>`,
      backgroundColor: "#060d1d",
      style: { color: "#ffffff" },
    },
    series: data,
    drilldown: {
      ...(drilldown || {}),
      animation: { duration: 600 } as any,
      drillUpButton: {
        relativeTo: "spacingBox",
        position: { x: 0, y: 0 },
        theme: { fill: "#0b1735", style: { color: "#ffffff" }, states: { hover: { fill: "#12204a" } } } as any,
      },
    },
    credits: { enabled: false },
  }), [title, data, drilldown]);

  if (!ready) return null;
  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
