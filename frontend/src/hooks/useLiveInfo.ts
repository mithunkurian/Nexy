"use client";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { fetchWeather, type WeatherData } from "@/lib/weather";
import { fetchRouteDepartures, type RouteDeparture } from "@/lib/sl";
import { fetchElectricityPrice, type ElectricityData } from "@/lib/electricity";
import { fetchCalendarEvents, type CalendarEvent } from "@/lib/calendar";

export interface LiveInfo {
  weather: WeatherData | null;
  routeDepartures: RouteDeparture[];
  electricity: ElectricityData | null;
  calendarEvents: CalendarEvent[];
  loading: boolean;
}

export function useLiveInfo(): LiveInfo {
  const { settings } = useSettings();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [routeDepartures, setRouteDepartures] = useState<RouteDeparture[]>([]);
  const [electricity, setElectricity] = useState<ElectricityData | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
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

      // Transit: only when API key + at least one route configured
      if (settings.trafiklabApiKey && settings.transitRoutes.length > 0) {
        const departures = await fetchRouteDepartures(settings.transitRoutes, settings.trafiklabApiKey);
        if (cancelled) return;
        setRouteDepartures(departures);
      } else {
        setRouteDepartures([]);
      }

      // Google Calendar — only when API key + at least one calendar configured
      if (settings.googleCalendarApiKey && settings.calendars.length > 0) {
        const events = await fetchCalendarEvents(
          settings.calendars,
          settings.googleCalendarApiKey,
        );
        if (cancelled) return;
        setCalendarEvents(events);
      } else {
        setCalendarEvents([]);
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
    settings.transitRoutes,
    settings.calendars,
    settings.googleCalendarApiKey,
  ]);

  return { weather, routeDepartures, electricity, calendarEvents, loading };
}
