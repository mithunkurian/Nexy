"use client";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { fetchWeather, type WeatherData } from "@/lib/weather";
import { fetchDepartures, type DepartureInfo } from "@/lib/sl";
import { fetchElectricityPrice, type ElectricityData } from "@/lib/electricity";

export interface LiveInfo {
  weather: WeatherData | null;
  departuresTo: DepartureInfo[];    // from home stop → destination
  departuresFrom: DepartureInfo[];  // from destination → home stop
  electricity: ElectricityData | null;
  loading: boolean;
}

export function useLiveInfo(): LiveInfo {
  const { settings } = useSettings();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [departuresTo, setDeparturesTo] = useState<DepartureInfo[]>([]);
  const [departuresFrom, setDeparturesFrom] = useState<DepartureInfo[]>([]);
  const [electricity, setElectricity] = useState<ElectricityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // Weather and electricity work without any API key
      const [wx, elec] = await Promise.all([
        settings.address ? fetchWeather(settings.address) : Promise.resolve(null),
        fetchElectricityPrice(settings.electricityZone || "SE3"),
      ]);

      if (cancelled) return;
      setWeather(wx);
      setElectricity(elec);

      // Bus data only when API key + both stop names are configured
      if (settings.trafiklabApiKey && settings.commuteStopA && settings.commuteStopB) {
        const [to, from] = await Promise.all([
          fetchDepartures(settings.commuteStopA, settings.trafiklabApiKey),
          fetchDepartures(settings.commuteStopB, settings.trafiklabApiKey),
        ]);
        if (cancelled) return;
        setDeparturesTo(to);
        setDeparturesFrom(from);
      } else {
        setDeparturesTo([]);
        setDeparturesFrom([]);
      }

      if (!cancelled) setLoading(false);
    }

    load();

    // Refresh every 2 minutes
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    settings.address,
    settings.electricityZone,
    settings.trafiklabApiKey,
    settings.commuteStopA,
    settings.commuteStopB,
  ]);

  return { weather, departuresTo, departuresFrom, electricity, loading };
}
