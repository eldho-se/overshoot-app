import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { fetchJson, getApiBase } from '../lib/http';

interface ForecastData {
  year: number;
  world_biocap: number;
  germany_ef: number;
  overshoot_day: number;
  is_predicted: boolean;
}

const BoxPlotChart: React.FC = () => {
  const [data, setData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = getApiBase();
    fetchJson(`${apiBase}/forcast/`)
      .then((json) => {
        setData(json);
      })
      .catch((e) => {
        console.error('Error fetching forecast:', e);
      })
      .finally(() => setLoading(false));
  }, []);

  const chartData = data.map(d => [
    new Date(`${d.year}-01-01`).getTime(),
    d.overshoot_day
  ]);

  const divisionIndex = data.findIndex(d => d.is_predicted);
  const divisionTimestamp = divisionIndex !== -1
    ? new Date(`${data[divisionIndex].year}-01-01`).getTime()
    : null;

    const options: Highcharts.Options = {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        height: 500,
      },
      title: {
        text: 'Germany: Overshoot Day Forecast',
        align: 'left',
  style: { color: '#fff', fontSize: '1.2rem', fontWeight: '700' },
      },
      xAxis: {
        type: 'datetime',
        title: { text: 'Year', style: { color: '#fff' } },
        labels: { style: { color: '#fff' } },
        plotLines: divisionTimestamp
          ? [
              {
                color: '#4840d6',
                width: 2,
                value: divisionTimestamp,
                zIndex: 5,
                dashStyle: 'Dash',
                label: {
                  text: 'Forcsast',
                  rotation: 0,
                  y: 20,
                  style: { color: '#fff' },
                },
              },
            ]
          : [],
      },
      yAxis: {
        min: 0,
        max:  300,
        title: { text: 'Days of the year', style: { color: '#fff' } },
        labels: { style: { color: '#fff' } },
        gridLineColor: 'rgba(255,255,255,0.2)',
        gridLineWidth: 1,
      },
      legend: { enabled: false },
      tooltip: {
        valueSuffix: '',
        formatter: function () {
          // @ts-ignore
          return `<b>Overshoot Day:</b> ${Math.round(this.y)}`;
        }
      },
      series: [
        {
          type: 'line',
          name: 'Overshoot Day',
          data: chartData,
          zoneAxis: 'x',
          lineWidth: 4,
          marker: {
            lineWidth: 2,
            lineColor: '#4840d6',
            fillColor: '#fff',
          },
          color: {
            linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
            stops: [
              [0, '#fa4fed'],
              [1, '#5897ff'],
            ],
          },
          zones: divisionTimestamp
            ? [
                { value: divisionTimestamp },
                { dashStyle: 'Dot' },
              ]
            : [],
        },
      ],
      credits: { enabled: false },
    };

  if (loading) return <div className="text-white">Loading...</div>;

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default BoxPlotChart;
