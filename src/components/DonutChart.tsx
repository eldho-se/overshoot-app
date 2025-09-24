"use client";

import dynamic from 'next/dynamic';
import React, { useMemo, useEffect, useState } from 'react';

const Highcharts = typeof window !== 'undefined' ? require('highcharts') : null;
const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });


type DonutValue = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  data: [DonutValue, DonutValue, DonutValue, DonutValue, DonutValue, DonutValue];
};

const DonutChart: React.FC<Props> = ({ data }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const options = useMemo(() => ({
    chart: {
      backgroundColor: 'transparent',
      height: null, 
      spacing: [12, 12, 12, 12],
      margin: [0, 0, 0, 0],
      reflow: true,
      events: {
        render: function () {
          try {
            const c = this as unknown as any;
            const plotSize = Math.min(c.plotWidth, c.plotHeight);
            const padding = 12; 
            const shrink = 0.98; 
            const targetSize = Math.max(0, Math.floor((plotSize - padding * 2) * shrink));
            const s = c.series && c.series[0];
            if (s && s.type === 'pie') {
              const currentSize = s.options && s.options.size;
              if (currentSize !== targetSize) {
                s.update({ size: targetSize, center: ['50%', '50%'] }, false);
              }
            }
          } catch {}
        },
      },
    },
    title: { text: undefined },
    credits: { enabled: false },
    tooltip: { pointFormat: '{series.name}: <b>{point.y:.2f} gha/person</b>' },
    plotOptions: {
      pie: {
        innerSize: '65%',
        dataLabels: { enabled: false },
        borderWidth: 0,
        center: ['50%', '50%'],

      },
    },
    series: [
      {
        type: 'pie',
        name: 'Share',
        data: data.map((item, idx) => ({
          name: item.label,
          y: item.value,
          color: item.color || undefined,
        })),
      },
    ],
  }), [data]);

  if (!mounted || !Highcharts) {
    return (
      <div style={{ width: '100%', height: '100%' }} />
    );
  }
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      containerProps={{ style: { width: '100%', height: '90%', display: 'block', overflow: 'hidden' } }}
    />
  );
};

export default DonutChart;
