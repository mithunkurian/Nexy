// Swedish electricity prices via elprisetjustnu.se — completely free, no API key

export interface HourlyPrice {
  hour: number;   // 0-23
  price: number;  // öre/kWh
}

export interface ElectricityData {
  priceNow: number;    // öre/kWh
  priceMin: number;    // today's lowest öre/kWh
  priceMax: number;    // today's highest öre/kWh
  zone: string;
  level: "cheap" | "normal" | "expensive";
  hourlyPrices: HourlyPrice[];  // all 24 hours today
}

export async function fetchElectricityPrice(
  zone: string = "SE3",
): Promise<ElectricityData | null> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const res = await fetch(
      `https://www.elprisetjustnu.se/api/v1/prices/${year}/${month}-${day}_${zone}.json`,
    );
    if (!res.ok) return null;

    const prices: { SEK_per_kWh: number; time_start: string }[] = await res.json();
    if (!prices.length) return null;

    const currentHour = now.getHours();
    const current = prices[currentHour];
    if (!current) return null;

    const priceNow = Math.round(current.SEK_per_kWh * 100);
    const all = prices.map((p) => Math.round(p.SEK_per_kWh * 100));
    const priceMin = Math.min(...all);
    const priceMax = Math.max(...all);

    // Classify price relative to today's range
    const range = priceMax - priceMin;
    const threshold = range / 3;
    const level: ElectricityData["level"] =
      priceNow <= priceMin + threshold
        ? "cheap"
        : priceNow >= priceMax - threshold
          ? "expensive"
          : "normal";

    const hourlyPrices: HourlyPrice[] = prices.map((p, i) => ({
      hour: i,
      price: Math.round(p.SEK_per_kWh * 100),
    }));

    return { priceNow, priceMin, priceMax, zone, level, hourlyPrices };
  } catch {
    return null;
  }
}
