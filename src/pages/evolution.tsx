
import React, { useEffect, useState } from "react";
import { fetchJson, getApiBase } from "../lib/http";
import { useRouter } from "next/router";
import LineRaceShaded from "../components/LineRaceShaded";

const apiBase = getApiBase();

export default function EvolutionPage() {
  const [countries, setCountries] = useState<any[]>([]);
  const [efConsPerCap, setEfConsPerCap] = useState<any>(null);
  const [worldEfCons, setWorldEfCons] = useState<any>(null);
  const [worldBiocap, setWorldBiocap] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchJson("/country/country_list")
      .then((data) => {
        setCountries(data || []);
      })
      .catch((err) => {
        console.error("Error fetching country list:", err);
      });

    let code = router.query.code  ? String(router.query.code) : "79";
    code = code==="5001" ? "79" : code;

  

    fetchJson(`${apiBase}/country/ct/${code}?record=EFConsPerCap`)
      .then((data) => {
        if (Array.isArray(data)) {
          setEfConsPerCap(data.map((r: any) => ({ year: r.year, total: r.total })));
        } else {
          setEfConsPerCap([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching EFConsPerCap data:", err);
      });

    fetchJson(`${apiBase}/country/ct/5001?record=BiocapPerCap`)
      .then((data) => {
        if (Array.isArray(data)) {
          setWorldBiocap(data.map((r: any) => ({ year: r.year, total: r.total })));
        } else {
          setWorldBiocap([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching World BiocapPerCap data:", err);
      });
    fetchJson(`${apiBase}/country/ct/5001?record=EFConsPerCap`)
      .then((data) => {
        if (Array.isArray(data)) {
          setWorldEfCons(data.map((r: any) => ({ year: r.year, total: r.total })));
        } else {
          setWorldEfCons([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching World EFConsPerCap data:", err);
      });

  }, [router.query.code]);

  return (
    <main >
      
        <LineRaceShaded
          worldBio={Array.isArray(worldBiocap) ? worldBiocap.map((r: any) => [r.year, r.total]) : []}
          worldEf={Array.isArray(worldEfCons) ? worldEfCons.map((r: any) => [r.year, r.total]) : []}
          countryEf={Array.isArray(efConsPerCap) ? efConsPerCap.map((r: any) => [r.year, r.total]) : []}
          countryName={(() => {
            let code = router.query.code ? String(router.query.code) : "79";
            code = code === "5001" ? "79" : code;
            return countries.find((c: any) => String(c.countryCode) === code)?.countryName || "Germany";
          })()}
          startYear={1961}
          endYear={2024}
          autoPlay={true}
        />
         
     
    </main>
  );
}
