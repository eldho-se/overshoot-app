import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Card from '../components/Card';
import WorldMap from '../components/WorldMap';
import DonutChart from '../components/DonutChart';
import YearSelector from '../components/YearSelector';
import OvershootSimulator from '../components/OvershootSimulator';
import BoxPlotChart from '../components/BoxPlot';
import PieCharts from '../components/PieChart';
import ChartBlock from '../components/LineChart';
import OvershootDayInfo from '../components/OvershootDayInfo';
import EarthRequirementCard from '../components/earth';
import labels from '../components/data';
import { fetchJson, getApiBase } from '../lib/http';
import InfoButton from '../components/Infobutton';
const CountrySelector = dynamic(() => import('../components/CountrySelector'), { ssr: false });



export type ApiCountry = {
  countryCode: string;
  countryName: string;
  shortName: string;
  abbr: string;
  people: string;
};

type ApiRecord = {
  year: number;
  countryCode: number;
  countryName: string;
  record: "EFConsPerCap" | "BiocapPerCap";
  cropLand: number;
  grazingLand: number;
  forestLand: number;
  fishingGround: number;
  builtupLand: number;
  carbon: number;
  total: number;
  availableYears?: number[];
};

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
const dayOfYearToDate = (year: number, dayOfYear: number): Date => {
  console.log(dayOfYear)
  const d = new Date(year, 0, 1);
  d.setDate(dayOfYear + 1);
  return d;
};

const calculateOvershootDay = (data: ApiRecord[], world: ApiRecord[]): string | null => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const year = data[0].year;
  const biocap = world.find(r => r.record === "BiocapPerCap")?.total;
  const footprint = data.find(r => r.record === "EFConsPerCap")?.total;
  if (biocap == null || footprint == null || footprint === 0) return null;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  let dayOfYear = Math.floor(daysInYear * (biocap / footprint));
  if (dayOfYear > 365) {
    return `${year}-12-31`;
  }
  const date = dayOfYearToDate(year, dayOfYear);
  return date.toISOString().slice(0, 10);
};


const StatCard = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <div className="text-slate-300 text-sm">{label}</div>
    <div className="mt-2 text-4xl font-semibold text-white">{value}</div>
  </Card>
);

const Home: React.FC = () => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'en' || saved === 'de') setLanguage(saved);
    } catch { }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('lang', language); } catch { }
  }, [language]);
  const t = labels[language as keyof typeof labels];
  const [countries, setCountries] = React.useState<ApiCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = React.useState<ApiCountry>({
    countryCode: '5001',
    countryName: 'World',
    shortName: 'World',
    abbr: 'World',
    people: 'people of the world'
  });
  const [selectedYear, setSelectedYear] = React.useState<number>(2024);
  const [baselineCountry, setBaselineCountry] = React.useState<ApiCountry>({
    countryCode: '5001',
    countryName: 'World',
    shortName: 'World',
    abbr: 'World',
    people: 'people of the world'
  });
  const [worldData, setWorldData] = React.useState<ApiRecord[] | null>(null);
  const [countryData, setCountryData] = React.useState<ApiRecord[] | null>(null);
  const [overshootDate, setOvershootDate] = React.useState<string | null>(null);
  const [germanyData, setGermanyData] = React.useState<ApiRecord[] | null>(null);
  const [germanyOvershootDate, setGermanyOvershootDate] = React.useState<string | null>(null);
  const [overshootDateDisplay, setOvershootDateDisplay] = React.useState<string | null>(null);

  const [progress, setProgress] = React.useState<number>(0);

  const apiBase = getApiBase();


  React.useEffect(() => {
    fetchJson(`${apiBase}/country/country_list`)
      .then(data => {
        if (data) {
          setCountries(data);

          const url = `${apiBase}/country/ct/${selectedCountry.countryCode}/${selectedYear}`;
          fetchJson(url)
            .then(world => {
              if (world) {
                setWorldData(world);
                const od = calculateOvershootDay(world, world);
                if (od) setOvershootDate(od);
                const biocap = world.find((r: ApiRecord) => r.record === "BiocapPerCap")?.total;
                const footprint = world.find((r: ApiRecord) => r.record === "EFConsPerCap")?.total;
                if (biocap != null && footprint != null && footprint > 0) {
                  setProgress(Math.min(biocap / footprint, 1));
                } else {
                  setProgress(0);
                }
                console.log("Fetched initial World data:", world);
              }
            })
            .catch(err => console.error("Error fetching initial World data:", err));
        }
      })
      .catch(err => console.error("Error fetching countries:", err));
  }, []);

  React.useEffect(() => {
    if (!selectedCountry || !selectedYear) return;
    const urlWorld = `${apiBase}/country/ct/5001/${selectedYear}`;
    fetchJson(urlWorld)
      .then(world => {
        if (world) {
          setWorldData(world);
          const urlCountry = `${apiBase}/country/ct/${selectedCountry.countryCode}/${selectedYear}`;
          fetchJson(urlCountry)
            .then(data => {
              if (data) {
                setCountryData(data);
                const od = calculateOvershootDay(data, world);
                if (od) setOvershootDate(od);
                const biocap = data.find((r: ApiRecord) => r.record === "BiocapPerCap")?.total;
                const footprint = data.find((r: ApiRecord) => r.record === "EFConsPerCap")?.total;
                if (biocap != null && footprint != null && footprint > 0) {
                  setProgress(Math.min(biocap / footprint, 1));
                } else {
                  setProgress(0);
                }
              }
            })
            .catch(err => console.error('Error fetching country-year data:', err));
          if (selectedCountry.countryCode === '5001') {
            const urlGermany = `${apiBase}/country/ct/79/${selectedYear}`;
            fetchJson(urlGermany)
              .then(germanyData => {
                console.log('Germany API response:', germanyData);
                setGermanyData(germanyData)
                if (germanyData && Array.isArray(germanyData)) {
                  const od = calculateOvershootDay(germanyData, world);
                  console.log('Germany overshoot date:', od);
                  setGermanyOvershootDate(od || null);
                } else {
                  setGermanyOvershootDate(null);
                }
              })
              .catch(err => {
                setGermanyOvershootDate(null);
                console.error('Error fetching Germany data:', err);
              });
          } else {
            setGermanyOvershootDate(null);
          }
        }
      })
      .catch(err => console.error('Error fetching world-year data:', err));
  }, [selectedCountry, selectedYear]);

  return (
    <>
      <main className="relative mx-auto max-w-7xl px-6 py-10">

        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white">{t.title}</h1>
          <p className="mt-2 text-slate-300">{t.description}</p>
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-full px-3 py-1 shadow-md">
            <span className="text-slate-300 text-xl" aria-label="Language">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path stroke="currentColor" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
              </svg>
            </span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
              className="text-slate-200 text-sm font-semibold focus:outline-none hover:text-white transition"
              aria-label="Switch language"
            >
              {language === 'en' ? 'EN' : 'DE'}
            </button>
          </div>

        </header>

        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-12 md:col-span-5">
            <div className="flex flex-row gap-1">
              <div className=" w-[42%] ">
                <OvershootDayInfo
                  countryName="World"
                  overshootDate={(() => {
                    if (Array.isArray(worldData)) {
                      const od = calculateOvershootDay(worldData, worldData);
                      return od || null;
                    }
                    return null;
                  })()}
                  selectedYear={selectedYear}
                />
              </div>
              <div className="w-[58%]">
                <OvershootDayInfo
                  key={selectedCountry.countryCode === '5001' ? `germany-${germanyOvershootDate}-${selectedYear}` : `${selectedCountry.countryCode}-${overshootDate}-${selectedYear}`}
                  countryName={
                    selectedCountry.countryCode === '5001'
                      ? 'Germany'
                      : ((selectedCountry.shortName?.length ?? 0) > 16
                          ? (selectedCountry.shortName.split(' ')[0] || selectedCountry.shortName)
                          : selectedCountry.shortName)
                  }
                  overshootDate={selectedCountry.countryCode === '5001' ? (germanyOvershootDate || null) : (overshootDate || null)}
                  selectedYear={selectedYear}
                  worldOvershootDate={(() => {

                    if (Array.isArray(worldData)) {
                      const od = calculateOvershootDay(worldData, worldData);
                      return od || null;
                    }
                    return null;
                  })()}
                />
              </div>

            </div>
          </div>
          <div className="col-span-12 md:col-span-3">
            <Card title="Overshoot Indicator" className='group '>
               <InfoButton info="Overshoot occurs when the average per-person ecological footprint exceeds the available per-person biocapacity" />
              <div className="mt-3 h-4 w-full rounded-full bg-slate-800 flex overflow-hidden">
                {(() => {
                  const biocap = worldData?.find((r: ApiRecord) => r.record === "BiocapPerCap")?.total ?? 0;
                  const ef = countryData?.find((r: ApiRecord) => r.record === "EFConsPerCap")?.total ?? 0;
                  const total = biocap + ef;
                  const bioPercent = total > 0 ? (biocap / total) * 100 : 0;
                  const efPercent = total > 0 ? (ef / total) * 100 : 0;
                  const showGlow = ef > biocap;
                  return (
                    <>
                      <div
                        className="h-4 relative transition-all duration-500"
                        style={{ width: `${bioPercent}%`, backgroundColor: '#34D399', borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}
                      >
                         {!showGlow && bioPercent > 10 && (
                          <span className="text-black text-xs opacity-0 group-hover:opacity-100 font-semibold absolute right-12 translate-x-1/2">No Overshoot</span>
                        )}
                      </div>
                      <div
                        className={showGlow ? "h-4 relative transition-all duration-500 bg-blue-600 shadow-[0_0_16px_4px_rgba(255,0,0,0.5)] flex items-center justify-center" : "h-4 transition-all duration-500 bg-blue-600 flex items-center justify-center"}
                        style={{ width: `${efPercent}%`, borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem', position: 'relative' }}
                      >
                        {showGlow && efPercent > 10 && (
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-slim absolute left-10 -translate-x-1/2">Overshoot</span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div
                className="relative"
                style={{ height: 0 }}
              >
                <div
                  className="absolute  group-hover:z-[-10] top-[-22px] h-7 w-1 bg-[#c74c3f]"
                  style={{ left: 'calc(50% - 2px)', borderRadius: '1px' }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <div className="flex flex-col items-start">
                  <span>Biocapacity</span>
                  <span className="text-white text-base font-semibold">{worldData?.find((r: ApiRecord) => r.record === "BiocapPerCap")?.total?.toFixed(2) ?? "-"} GHa</span>
                </div>
                <div className="flex flex-col items-end">
                  <span>Ecological Footprint</span>
                  <span className="text-white text-base font-semibold">{countryData?.find((r: ApiRecord) => r.record === "EFConsPerCap")?.total?.toFixed(2) ?? "-"} GHa</span>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-span-12 md:col-span-4 flex items-stretch">
            <Card className='w-full group' >
              <InfoButton info={
                <span>The number of Earths needed if everyone on the planet lived like an average person in {selectedCountry.countryName}.
                <br /><br /> Data Source: <a href="https://data.footprintnetwork.org/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Global Footprint Network</a>
                </span>} 
                />
              <EarthRequirementCard
                country={selectedCountry.countryCode === '5001' ? "today's people" : selectedCountry.people}
                earthsRequired={
                  (() => {
                    
                      const efTotal = countryData?.find((r: ApiRecord) => r.record === "EFConsPerCap")?.total;
                      const bio = worldData?.find((r: ApiRecord) => r.record === "BiocapPerCap")?.total;
                      const numberofearth = bio && efTotal ? efTotal / bio : 1;
                      return numberofearth && numberofearth !== 0 ? numberofearth : 1;
                    

                  })()
                }
                maxIcons={3}
              />

            </Card>

          </div>
          <div className="col-span-12 md:col-span-9">
            <Card className='group'>
                <InfoButton
                  info={
                    <span>
                      Countries are color-coded by Overshoot Day: darker blue means earlier dates, lighter green means later.<br />
                      <br />EF per capita: Ecological Footprint per person is the land and water area needed to support one person’s resource use and waste, in global hectares (gha).<br />
                      <br />
                      Data Source: <a href="https://data.footprintnetwork.org/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Global Footprint Network</a>
                    </span>
                  }
                />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-semibold text-white">Overshoot Day Map </span>
                <div className="flex items-end gap-4">
                  {/* <div className="w-54">
                    
                    <CountrySelector
                      label='Baseline Country'
                      options={countries.filter(c => [
                        'World', 'Poland', 'France', 'Italy'
                      ].includes(c.countryName))}
                      value={baselineCountry.countryCode}
                      onChange={(country) => {
                        if (country) {
                          if (
                            country
                          ) {
                            setBaselineCountry(country);
                            setSelectedYear(2024); 
                          } else {
                            console.warn('Selected baseline country missing required properties:', country);
                          }
                        } else {
                          console.log('Selection cleared');
                        }
                      }}
                    />
                  </div> */}
                  <div className="w-74">
                    
                    <CountrySelector
                      options={countries}
                      value={selectedCountry.countryCode}
                      onChange={(country) => {
                        if (country) {
                          if (
                            country
                          ) {
                            setSelectedCountry(country);
                            setSelectedYear(2024);
                          } else {
                            console.warn('Selected country missing required properties:', country);
                          }
                        } else {
                          console.log('Selection cleared');
                        }
                      }}
                    />
                  </div>
                  <YearSelector
                  label='Year'
                    years={
                      countryData
                        ? countryData
                          .filter((r: ApiRecord) => r.record === "EFConsPerCap")
                          .flatMap((r: ApiRecord) => r.availableYears ?? [])
                        : []
                    }
                    value={selectedYear}
                    onChange={(y) => {
                      setSelectedYear(y);
                      console.log('Selected year:', y);
                    }}
                  />
                </div>
              </div>
              <div className="mt-2">
                <WorldMap
                  year={selectedYear}
                  onCountrySelect={(country) => {
                    if (country) {
                      const code = String(country.countryCode);
                      const matched = countries.find(c => String(c.countryCode) === code);
                      if (matched) {
                        setSelectedCountry(matched);

                      } else {
                        setSelectedCountry({
                          countryCode: '5001',
                          countryName: 'World',
                          shortName: 'World',
                          abbr: 'World',
                          people: 'people of the world'
                        });
                      }
                    }
                  }}
                  selectedCountry={selectedCountry}
                />
              </div>
            </Card>
          </div>

          <div className="col-span-12 md:col-span-3 space-y-5">
            <Card title="Biocapacity Breakdown" className="h-full flex flex-col justify-between">
              <div className="flex-1 flex items-center justify-center p-0 m-0 group">
                <InfoButton info={
                  <span>Biocapacity: The capacity of ecosystems to generate biological resources and assimilate waste from human activities, expressed in global hectares (gha). <br /><br />Ecological Footprint: The biologically productive land and water area required to provide the resources consumed by a population and to absorb its waste, expressed in global hectares (gha). <br /> <br />Data Source: <a href="https://data.footprintnetwork.org/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Global Footprint Network</a>
                  </span>
                } />
                {(() => {
                  const biocap = countryData?.find((r: ApiRecord) => r.record === "BiocapPerCap");
                  const donutData: [
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string }
                  ] = [
                      { label: "Crop Land", value: biocap?.cropLand ?? 0, color: "#92400e" }, // amber-900 (brown)
                      { label: "Grazing Land", value: biocap?.grazingLand ?? 0, color: "#fbbf24" }, // yellow-400
                      { label: "Forest Land", value: biocap?.forestLand ?? 0, color: "#22c55e" }, // green-500
                      { label: "Built-up Land", value: biocap?.builtupLand ?? 0, color: "#a78bfa" }, // purple-400
                      { label: "Fishing Ground", value: biocap?.fishingGround ?? 0, color: "#be185d" }, // pink-800
                      { label: "Carbon", value: biocap?.carbon ?? 0, color: "#3b82f6" } // blue-500 (lighter blue)
                    ];
                  return <DonutChart data={donutData} />;
                })()}
              </div>
              <div className="mt-6 text-lg font-semibold text-white">Ecological Footprint Breakdown</div>
              <div className="flex-1 flex items-center justify-center p-0 m-0">
                {(() => {
                  const biocap = countryData?.find((r: ApiRecord) => r.record === "EFConsPerCap");
                  const donutData: [
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string },
                    { label: string; value: number; color: string }
                  ] = [
                      { label: "Crop Land", value: biocap?.cropLand ?? 0, color: "#92400e" }, 
                      { label: "Grazing Land", value: biocap?.grazingLand ?? 0, color: "#fbbf24" }, 
                      { label: "Forest Land", value: biocap?.forestLand ?? 0, color: "#22c55e" }, 
                      { label: "Built-up Land", value: biocap?.builtupLand ?? 0, color: "#a78bfa" }, 
                      { label: "Fishing Ground", value: biocap?.fishingGround ?? 0, color: "#be185d" }, 
                      { label: "Carbon", value: biocap?.carbon ?? 0, color: "#3b82f6" }
                    ];
                  return <DonutChart data={donutData} />;
                })()}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm px-2">
                <LegendDot className="bg-amber-900" label="Crop Land" />
                <LegendDot className="bg-yellow-400" label="Grazing Land" />
                <LegendDot className="bg-green-500" label="Forest Land" />
                <LegendDot className="bg-purple-400" label="Built-up Land" />
                <LegendDot className="bg-pink-800" label="Fishing Ground" />
                <LegendDot className="bg-blue-500" label="Carbon" />
              </div>
              <div className="mt-4 flex justify-center">
                <Link href={`/evolution?code=${selectedCountry.countryCode}`}>
                  <button
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 text-white font-bold shadow-lg border border-blue-700/60 backdrop-blur-md bg-opacity-80 hover:from-blue-950 hover:to-blue-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-base"
                    style={{ boxShadow: '0 2px 12px 0 rgba(30, 64, 175, 0.18), 0 1px 3px 0 rgba(30, 58, 138, 0.10)' }}
                  >
                    <span className="inline-flex items-center gap-2 drop-shadow-sm">
                      <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4-4-4-4m8 8V7" />
                      </svg>
                      Timeline View
                    </span>
                  </button>
                </Link>
              </div>
            </Card>
          </div>


          <div className="col-span-12">
            <Card title="Overshoot Timeline" className="min-h-[320px] p-4 pt-4 group">
              <InfoButton info={
                <span>
                  The legend allows comparison of Germany with any selected country. <br /> <br /> Overshoot Day is calculated using the latest data published by the Global Footprint Network. Values for the most recent three years are preliminary estimates and may be revised.
                <br /><br />Data Source: <a href="https://data.footprintnetwork.org/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Global Footprint Network</a>
                </span> 
              } />
                
              <div className="w-full">
                <ChartBlock
                  title="Overshoot Timeline"
                  yLabel="Days of the year"
                  apiBasePoint={apiBase}
                  selection={selectedCountry}
                />
              </div>
              <div className="flex justify-center mt-10">
      <Link href={`/calculation?code=${selectedCountry.countryCode}`}>
        <button
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 text-white font-bold shadow-lg border border-blue-700/60 backdrop-blur-md bg-opacity-80 hover:from-blue-950 hover:to-blue-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-base"
          style={{ boxShadow: '0 2px 12px 0 rgba(30, 64, 175, 0.18), 0 1px 3px 0 rgba(30, 58, 138, 0.10)' }}
        >
          <span className="inline-flex items-center gap-2 drop-shadow-sm">
            <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4-4-4-4m8 8V7" />
            </svg>
            Overshoot Calculation
          </span>
        </button>
      </Link>
    </div>
            </Card>
               
          </div>


          <div className="col-span-12">
            <Card className='group'>
              <InfoButton info={
                <span>  CO₂ emissions primarily result from the use of non-renewable energy sources. <br /><br />The chart is interactive, click a slice to view sub-categories. In the emissions chart, sub-categories represent economic subsectors, while in the energy consumption chart, sub-categories indicate different energy sources. <br /><br />
                Data Source: <a href="https://www.umweltbundesamt.de/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Umwelt Bundesamt</a> and <a href="https://ag-energiebilanzen.de/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">AGEB</a>
                </span>   
              }/>
              <PieCharts />
            </Card>
          </div>


          <div className="col-span-12">
            <OvershootSimulator />
          </div>

          <div className="col-span-12">
            <Card className='group'>
              <InfoButton info={
                <span>Forecasts are generated using a Prophet time-series model trained on Germany’s per-person Ecological Footprint and Biocapacity (1961–2024). <br /><br />The dotted line shows predicted values with uncertainty. Prophet was chosen for its ability to capture long-term trends, seasonality, and provide uncertainty intervals. <br /><br />Forecasts are preliminary and subject to revision as new data becomes available.
                </span>
              }/>
              <BoxPlotChart />
            </Card>
          </div>



        </div>
      </main>
 
    </>
  );
};

const LegendDot = ({ className, label }: { className?: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span className={`inline-block h-3 w-3 rounded-full ${className}`} />
    <span className="text-slate-300">{label}</span>
  </div>
);

export default Home;
