
import React, { useEffect, useState } from "react";
import type { DrilldownOptions, SeriesOptionsType } from "highcharts";
import HCSunburst from "./HCPieChart";
import { fetchJson, getApiBase } from "../lib/http";
import YearSelector from "./YearSelector";


export default function PieCharts() {
  const [year, setYear] = useState<number>(2024);   

  const [co2Series, setCo2Series] = useState<SeriesOptionsType[]>([]);
  const [co2Drilldown, setCo2Drilldown] = useState<DrilldownOptions>({
    series: [],
  });

  const [energySeries, setEnergySeries] = useState<SeriesOptionsType[]>([]);
  const [energyDrilldown, setEnergyDrilldown] = useState<DrilldownOptions>({
    series: [],
  });


  useEffect(() => {
    const apiBase = getApiBase();
    fetchJson(`${apiBase}/pie_data/co2?year=${year}`)
      .then((data) => {
        setCo2Series(data.co2Series || []);
        setCo2Drilldown(data.co2Drilldown || { series: [] });
      })
      .catch((err) => {
        console.error("Error fetching CO2 pie data:", err);
      });

    fetchJson(`${apiBase}/pie_data/energy?year=${year}`)
      .then((data) => {
        setEnergySeries(data.energySeries || []);
        setEnergyDrilldown(data.energyDrilldown || { series: [] });
      })
      .catch((err) => {
        console.error("Error fetching Energy pie data:", err);
      });
  }, [year]);

  return (
    <section className="w-full mt-4 mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between md:mb-16">
        <h2 className="text-2xl sm:text-xl font-bold text-white m-3 mb-2 sm:mb-0">
          Germany: CO₂ Emissions & Energy Consumption by Sector
        </h2>
  <YearSelector value={year} onChange={setYear} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
  <div className="rounded-xl border border-black/10 dark:border-white/10 p-2 hover:shadow-[0_4px_24px_0_rgba(180,200,255,0.35)] transition-shadow duration-300">
          <HCSunburst
            title="CO₂ Emissions"
            data={co2Series}
            drilldown={co2Drilldown}
            unit="kt CO₂"
          />
        </div>
        <div className="rounded-xl decoration-0 border border-black/10 dark:border-white/10 p-2 hover:shadow-[0_4px_24px_0_rgba(180,200,255,0.35)] transition-shadow duration-300">
          <HCSunburst
            title="Energy Consumption"
            data={energySeries}
            drilldown={energyDrilldown}
            unit="PJ"
          />
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <button
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 text-white font-bold shadow-lg border border-blue-700/60 backdrop-blur-md bg-opacity-80 hover:from-blue-950 hover:to-blue-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-base"
          style={{ boxShadow: '0 2px 12px 0 rgba(30, 64, 175, 0.18), 0 1px 3px 0 rgba(30, 58, 138, 0.10)' }}
          onClick={() => window.location.href = '/data-details'}
        >
          <span className="inline-flex items-center gap-2 drop-shadow-sm">
            <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4-4-4-4m8 8V7" />
            </svg>
            Timeline Comparison
          </span>
        </button>
      </div>
    </section>
  );
}
