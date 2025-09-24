"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import worldMap from "@highcharts/map-collection/custom/world.geo.json";


import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { fetchJson, getApiBase } from "../lib/http";
import labels from "./data";
import { animate } from "highcharts";


countries.registerLocale(enLocale);

const Highcharts = typeof window !== "undefined" ? require("highcharts/highmaps") : null;
const HighchartsReact = dynamic(() => import("highcharts-react-official"), { ssr: false });

interface WorldMapProps {
  onCountrySelect?: (country: { countryCode: string; countryName: string }) => void;
  selectedCountry?: { countryCode: string; countryName: string };
  year?: number;
}

const WorldMap: React.FC<WorldMapProps> = ({ onCountrySelect, selectedCountry, year = 2024 }) => {
  const chartRef = useRef<any>(null);
  const [chart, setChart] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapData, setMapData] = useState<any[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);


  useEffect(() => {
    if (selectedCountry && selectedCountry.countryCode !== '5001') {
      setSelectedCountries([selectedCountry.countryCode]);
      if (chart && chart.get) {
        const point = chart.series[0]?.data?.find((p: any) => p.apiCode === selectedCountry.countryCode);
        if (point && !point.selected) {
          point.select(true, false);
        }
      }
    } else {
      setSelectedCountries([]);
      if (chart && chart.series && chart.series[0] && chart.series[0].data) {
        chart.series[0].data.forEach((p: any) => {
          if (p.selected) {
            p.select(false, false);
          }
        });
      }
    }
  }, [selectedCountry, chart]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiBase = getApiBase();
        const data = await fetchJson<any[]>(`${apiBase}/country/all/${year}`);
        const worldJson = await fetchJson<any[]>(`${apiBase}/country/ct/5001?record=BiocapPerCap&year=${year}`);
        const worldBio = worldJson[0]?.total;

        const efByCountry: Record<string, number> = {};

        data.forEach((item: any) => {
          if (item.record === "EFConsPerCap") {
            efByCountry[item.countryName] = item.total;
          }
        });

        const overshootData = Object.keys(efByCountry).map(countryName => {
          const ef = efByCountry[countryName];
          if (ef && worldBio && ef > 0) {
            let day = Math.round(365 * worldBio / ef);
            day = Math.min(Math.max(day, 1), 365);
            const iso2 = countries.getAlpha2Code(countryName, "en");
            const hcKey = iso2 ? iso2.toLowerCase() : null;
            const item = data.find((d: any) => d.countryName === countryName && d.record === "EFConsPerCap");
            if (!item || !item.countryCode) {
              console.warn("Skipping country with missing code:", countryName, item);
              return null;
            }
            return hcKey ? {
              'hc-key': hcKey,
              value: day,
              apiCode: String(item.countryCode),
              apiCountry: {
                countryCode: String(item.countryCode),
                countryName: item.countryName || "Unknown"
              }
            } : null;
          }
          return null;
        }).filter((item: any) => item !== null);

        setMapData(overshootData);
      } catch (error) {
        console.error("Failed to fetch EF data:", error);
      }
    };
    fetchData();
  }, [year]);

  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_MAP === '1' || process.env.NODE_ENV !== 'production';
  const dlog = (...args: any[]) => { if (DEBUG) console.log('[WorldMap]', ...args); };

  const getCountryData = (hcKey: string) => {
    const item = mapData.find((d: any) => d['hc-key'] === hcKey.toLowerCase());
    if (item && item.apiCountry) {
      return item.apiCountry;
    }
    console.warn("No matching ApiCountry for hcKey:", hcKey, mapData);
    return null;
  };
  
  const options = useMemo(() => {
    return {
      chart: { 
        backgroundColor: 'transparent',
        animation: false, 
        events: {
          load: function () {
            setReady(true);
            try {
              (window as any).__worldMapChart = this;
              dlog('chart load: exposed as window.__worldMapChart');
            } catch {}
          }
        }
      },
      title: { text: undefined },
      credits: { enabled: false },
      accessibility: { enabled: false },
      mapNavigation: { enabled: true },
      mapView: undefined,
      
      colorAxis: {

        min: 1,
        max: 365,
        labels: {
          style: {
            color: '#fff',
            fontWeight: 'bold'
          }
        },
        type: "linear",
        minColor: "#131831",
        maxColor: "#147846", 
        stops: [
          [0.100, '#131831'],      
          [0.20, '#2e6ab2'],   
          [0.27, '#3c7dcd'],   
          [0.49, '#32c39a'],   
          [0.7, '#2Eb28d'],    
          [1, '#147846']      
        ]
      },
      series: [
        {
          type: "map",
          name: "EF per capita",
          mapData: worldMap,
          animation: false,
          data: mapData.map(point => ({
            ...point,
            selected: selectedCountries.includes(point.apiCode)
          })),
          joinBy: ["hc-key", "hc-key"],
          nullColor: "#0f172a",
          borderColor: "#334155",
          allowPointSelect: true,
          states: {
            select: {
              color: undefined,
              borderColor: "#ffffff",
              borderWidth: 3,
              opacity: 1
            }
          },
          point: {
            events: {
              select: function(this: any) {
                const country = getCountryData(this['hc-key']);
                if (country) {
                  setSelectedCountries([country.countryCode]);
                  onCountrySelect?.(country);
                }
              },
              unselect: function(this: any) {
                const country = getCountryData(this['hc-key']);
                if (country) {
                  setSelectedCountries([]);
                }
              }
            }
          },
          tooltip: {
            formatter: function (this: any): string {
              const day = this.point?.value as number;
              const label: string = (this.point && (this.point as any).name) || (this.key as string) || "Unknown";
              if (typeof day !== "number" || isNaN(day) || day === 0) {
                return `${label}: No data available`;
              }
              if (day < 1 || day > 365) return "";
              const year = 2022;
              const date = new Date(year, 0);
              date.setDate(day);
              const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
              return `${label}: ${date.toLocaleDateString(undefined, options)}`;
            }
          }
        },
      ],
    } as any;
  }, [mapData, selectedCountries]);

    const zoomToEurope = () => {
    const c = chartRef.current?.chart || chart;
    if (!c) return;
    const mv = c.mapView as any;
    const center: [number, number] = [10,58];
    const zoom = 1; // close-in zoom for Europe


    const coords = [4500, 8290] as const satisfies Highcharts.LonLatArray;
    if (mv && typeof mv.setView === 'function') {
      console.log('Zooming to Europe:', { center, zoom });
      mv.zoomBy(1.8, coords,[10000000000,58],animate);
      return;
    }


  };

  const resetView = () => {
    const c = chartRef.current?.chart || chart;
    if (!c) return;
    const series = c.series && c.series[0];
    if (c.mapView && typeof c.mapView.fitToBounds === 'function' && series && (series as any).bounds) {
      c.mapView.fitToBounds((series as any).bounds, void 0, true, { duration: 700 });
    } else {
      c.update({ mapView: {} }, true, true, { duration: 700 });
    }
  };

  return (
    <div className="space-y-3">
      {mounted && Highcharts ? (
        <HighchartsReact
          highcharts={Highcharts}
          constructorType="mapChart"
          options={options}
          ref={chartRef}
          callback={(c: any) => setChart(c)}
          containerProps={{ style: { height: "500px", width: "100%" } }}
        />
      ) : (
        <div style={{ height: "5400px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>Loading map...</div>
      )}
      <div className="mt-2 flex font-bold items-center gap-6 text-sm  w-100% justify-center">
        <span className="text-[#3c7dcd]">Early Overshoot</span>
        <span className="text-[#32c39a]">Mid Overshoot</span>
        <span className="text-[#159857]">Late Overshoot</span>
      </div>
      <div className="flex gap-4 mt-4 justify-center">
        <button
          type="button"
          onClick={zoomToEurope}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          disabled={!(mounted && ready && (chartRef.current?.chart || chart))}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Zoom to Europe
        </button>

        <button
          type="button"
          onClick={resetView}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold shadow hover:from-gray-600 hover:to-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          disabled={!(mounted && ready && (chartRef.current?.chart || chart))}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16m16-8H4" /></svg>
          Reset View
        </button>
      </div>
     
      
    </div>
  );
};

export default WorldMap;
