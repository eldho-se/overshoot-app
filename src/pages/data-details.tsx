import React from "react";
import { useRouter } from "next/router";
import DataDetails from "../components/DataDetails";
import Card from "../components/Card";
import InfoButton from "../components/Infobutton";


export default function DataDetailsPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Germany's CO₂ Emissions vs Energy Consumption</h1>
          <p className="mt-1 text-slate-300">
         
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
        >
          ← Back
        </button>
      </header>
    <div>
      <Card className=" group"
      >
        <InfoButton className=" m-2 " info={
          <span>The timeline comparison is used to analyze the trends in Germany’s CO₂ emissions and energy consumption by sector. <br /><br />While they are measured in different units (kt of CO₂ vs. PJ of energy) and are not directly comparable, the trends show a general relationship: reductions in energy consumption often lead to reductions in emissions. <br /><br />The similarity in overall movement highlights the link between energy consumption patterns and associated emissions.
          <br /><br />Data Source: <a href="https://www.umweltbundesamt.de/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Umwelt Bundesamt</a> and <a href="https://ag-energiebilanzen.de/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">AGEB</a>
          </span>
        } />
      <DataDetails
        title="Sector Insights"
        subtitle="Germany (1990–2024)"
        co2CsvUrl="/data/CO2_Emission Sector wise.csv"
        energyCsvUrl="/data/Energy_Consumption _Sectorwise.csv"
        tags={["CO₂", "Energy", "Sectors", "1990–2024"]}
        lastUpdated={new Date()}
      />
      </Card>
      </div>
    </main>
  );
}
