"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { ApiCountry } from "../pages/index"

async function calculateOvershoot(BioCap: any[], EfCap: any[]) {
  const result: { name: string; data: { overshoot: number; year: number }[] } = {
    name: EfCap && EfCap.length > 0 && EfCap[0]?.countryName ? EfCap[0].countryName : "Unknown",
    data: []
  };
  if (!BioCap || !EfCap) return result;
  BioCap.forEach(bioItem => {
    const efItem = EfCap.find(f => f.year === bioItem.year);
    if (efItem) {
      const overshoot = (bioItem.total / efItem.total) * 365;
      result.data.push({ overshoot, year: bioItem.year });
    }
  });
  return result;
}

const ChartBlock: React.FC<{
  title: string;
  yLabel: string;
  apiBasePoint: string;
  selection:  ApiCountry;
}> = ({ title, yLabel, apiBasePoint, selection }) => {
  const [selectedCountry, setSelectedCountry] = useState<ApiCountry>(selection);

  const [seriesData, setSeriesData] = useState<any[]>([]);
  useEffect(() => {
    setSelectedCountry(selection);
  }, [selection]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bioResponse = await axios.get(apiBasePoint + "/country/ct/5001?record=BiocapPerCap");
        const efWorldResponse = await axios.get(apiBasePoint + "/country/ct/5001?record=EFConsPerCap");
        const efGermanyResponse = await axios.get(apiBasePoint + "/country/ct/79?record=EFConsPerCap");
        const overshootWorldData = await calculateOvershoot(bioResponse.data, efWorldResponse.data);
        const overshootGermanyData = await calculateOvershoot(bioResponse.data, efGermanyResponse.data);
        const newSeries = [];
        if (overshootWorldData.data && overshootWorldData.data.length) {
          const filteredWorldData = overshootWorldData.data
            .filter((d: any) => typeof d.year === "number" && typeof d.overshoot === "number" && !isNaN(d.year) && !isNaN(d.overshoot))
            .map((d: any) => [d.year, d.overshoot]);
          newSeries.push({
            type: "line",
            name: "World",
            data: filteredWorldData,
            color: colors.World,
          });
        }
        if (overshootGermanyData.data && overshootGermanyData.data.length) {
          const filteredGermanyData = overshootGermanyData.data
            .filter((d: any) => typeof d.year === "number" && typeof d.overshoot === "number" && !isNaN(d.year) && !isNaN(d.overshoot))
            .map((d: any) => [d.year, d.overshoot]);
          newSeries.push({
            type: "line",
            name: "Germany",
            data: filteredGermanyData,
            color: colors.Germany,
            visible: selectedCountry.countryCode === "5001" || selectedCountry.countryCode === "79",
          });
        }
        if (selectedCountry.countryCode !== "5001" && selectedCountry.countryCode !== "79") {
          try {
            const efResp = await axios.get(apiBasePoint + `/country/ct/${selectedCountry.countryCode}?record=EFConsPerCap`);
            const efData = efResp.data;
            const overshootData = await calculateOvershoot(bioResponse.data, efData);
            if (overshootData.data && overshootData.data.length) {
              const filteredData = overshootData.data
                .filter((d: any) => typeof d.year === "number" && typeof d.overshoot === "number" && !isNaN(d.year) && !isNaN(d.overshoot))
                .map((d: any) => [d.year, d.overshoot]);
              if (filteredData.length > 0) {
                newSeries.push({
                  type: "line",
                  name: overshootData.name,
                  data: filteredData,
                  color: selectedCountry.countryCode === "79" ? colors.Germany : colors[selectedCountry.countryName] || undefined,
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching or calculating overshoot for country ${selectedCountry.countryCode}:`, err);
          }
        }
        setSeriesData(newSeries);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [selectedCountry]);


  const colors: Record<string, string> = {
    Germany: "#965af5",
    Poland: "#0b6ee7ff",
    France: "#d97706",
    [selectedCountry.countryName]: "#f29422",
    World: "#10b981",
  };


  const options: Highcharts.Options = useMemo(() => ({
    chart: { backgroundColor: "transparent", height: 420 },
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
    },
    legend: { itemStyle: { color: "#cbd5e1" } },
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: 'rgba(30,41,59,0.98)', 
      borderColor: '#334155', 
      style: { color: '#e2e8f0', fontSize: '15px' }, 
      formatter: function() {
        if (!this.points) return `<strong>Year: ${this.x}</strong>`;
        const year = this.x;
        const overshootData = this.points.map(point => {
          const rounded = Math.round(point.y ?? 0);
          const color = point.series.color || '#888';

          const icon = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>`;
          return `${icon}<span style="color:${color};font-weight:bold;">${point.series.name}</span>: <b>${rounded}</b> days`;
        }).join('<br/>');
        return `<div style="padding:4px 0;"><strong>Year: ${year}</strong></div><div>${overshootData}</div>`;
      }
    },
    plotOptions: { series: { marker: { enabled: false }, lineWidth: 3 } },
    series: [...seriesData],
  }), [seriesData, yLabel, selectedCountry]);

  return (
    <figure className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 md:pt-16">
      <div className="w-full">
        {seriesData.length > 0 && <HighchartsReact highcharts={Highcharts} options={options} immutable />}
      </div>
    </figure>
  );
};

export default ChartBlock;

axios.defaults.headers.common['x-api-key'] = process.env.NEXT_PUBLIC_X_API_KEY;