import React, { useEffect, useState } from "react";
import { fetchJson, getApiBase } from "../lib/http";
import OvershootFlow from "../components/OvershootFlow";
import InfoButton from "../components/Infobutton";
import { useRouter } from "next/router";

const apiBase = getApiBase();

export default function CalculationPage() {
    const [efConsPerCap, setEfConsPerCap] = useState<any>(null);
    const [worldBiocap, setWorldBiocap] = useState<any>(null);
    const router = useRouter();
  
    useEffect(() => {

    let code = router.query.code ? String(router.query.code) : "79";
    code = code === "5001" ? "79" : code;

    fetchJson(`https://overshoot-server-961082160702.us-central1.run.app/country/ct/${code}/2024?record=EFConsPerCap`)
      .then((data) => {
        if (Array.isArray(data)) {
          setEfConsPerCap(data); 
        } else {
          setEfConsPerCap([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching EFConsPerCap data:", err);
      });

    fetchJson("https://overshoot-server-961082160702.us-central1.run.app/country/ct/5001/2024?record=BiocapPerCap")
      .then((data) => {
        if (Array.isArray(data)) {
          setWorldBiocap(data); 
        } else {
          setWorldBiocap([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching World BiocapPerCap data:", err);
      });
  }, [router.query.code]);

  let overshootFlowProps = {};
  if (Array.isArray(worldBiocap) && worldBiocap.length > 0 && Array.isArray(efConsPerCap) && efConsPerCap.length > 0) {
    const d = worldBiocap[0];
    overshootFlowProps = {
      year: d.year,
      biocapPerCap: d.total,
      bcSources: [
        { label: "Crop Land", color: "#F59E0B", value: d.cropLand },
        { label: "Grazing Land", color: "#4ADE80", value: d.grazingLand },
        { label: "Forest Land", color: "#A3E635", value: d.forestLand },
        { label: "Fishing Ground", color: "#22D3EE", value: d.fishingGround },
        { label: "Built-up Land", color: "#34D399", value: d.builtupLand }
      ],
      efPerCap: efConsPerCap[0].total,
      efName: efConsPerCap[0].countryName,
      efSources: [
        { label: "Carbon", color: "#EF4444", value: efConsPerCap[0].carbon },
        { label: "Crop Land", color: "#F97316", value: efConsPerCap[0].cropLand },
        { label: "Grazing Land", color: "#F97316", value: efConsPerCap[0].grazingLand},
        { label: "Forest Land", color: "#8B5CF6", value: efConsPerCap[0].forestLand },
        { label: "Fishing Ground", color: "#3B82F6", value: efConsPerCap[0].fishingGround },
        { label: "Built-up Land", color: "#10B981", value: efConsPerCap[0].builtupLand }
      ]
    };
  }
  console.log("OvershootFlow Props:", overshootFlowProps);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="relative group">
        <div className="absolute right-4 top-4">
          <InfoButton
            info={
              <span>
                Biocapacity and Ecological Footprint per person are measured across land-use types: cropland (for food and fiber production), grazing land (for livestock), forest land (for timber, fuelwood, and ecological services), fishing grounds (for marine and freshwater resources), built-up land (for housing, transport, and infrastructure), and carbon (the forest area required to absorb CO₂ emissions from fossil fuel use). Values are expressed in global hectares (gha) per person. 
                <br /><br />The Ecological Footprint is based on the country selected on the home page, and the calculation demonstration uses data from the latest year (2024 only). The Earth’s per-person biocapacity remains constant for all selected countries in 2024. 
                <br /><br />Data source: <a href="https://data.footprintnetwork.org/" target="_blank" rel="noopener noreferrer" className=" text-[#5d7389] italic hover:text-blue-300 break-all">Global Footprint Network</a>
              </span>
            }
          />
        </div>
        <div className="mb-4 flex justify-end pr-16">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
          >
            ← Back
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Overshoot Flow Diagram</h2>
        <OvershootFlow {...overshootFlowProps} />
      </div>
    </main>
  );
}
