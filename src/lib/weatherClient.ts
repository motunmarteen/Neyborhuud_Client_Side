import type { WeatherCondition as AmbientWeather } from '@/components/navigation/AmbientProfileCard';
import { getApiBaseUrl, isLocalDevHost } from '@/lib/api-client';
import { reverseGeocode, type LocationAddress } from '@/lib/reverseGeocode';

/** Ignore trace model output — common cause of false drizzle/rain. */
const PRECIP_THRESHOLD_MM = 0.2;

export interface CurrentWeather {
  temp: number;
  condition: string;
  city: string;
  wmoCode: number;
}

export function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Partly Cloudy';
}

export function wmoToAmbient(code: number): AmbientWeather {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  // Drizzle alone is cloudy/misty — reserve rain animation for measurable rain.
  if (code >= 51 && code <= 57) return 'cloudy';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'storm';
  return 'clear';
}

function owmIdToWmo(id: number): number {
  if (id >= 200 && id <= 232) return 95;
  if (id >= 300 && id <= 321) return 51;
  if (id >= 500 && id <= 504) return 61;
  if (id === 511) return 66;
  if (id >= 520 && id <= 531) return 80;
  if (id >= 600 && id <= 622) return 71;
  if (id >= 701 && id <= 781) return 45;
  if (id === 800) return 0;
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id >= 803) return 3;
  return 2;
}

function owmIdToCondition(id: number, description: string): string {
  if (description) return description.charAt(0).toUpperCase() + description.slice(1);
  return interpretWeatherCode(owmIdToWmo(id));
}

function isPrecipitationCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
}

function downgradeDryPrecipitation(code: number): number {
  if (code >= 45 && code <= 48) return code;
  if (code >= 95) return code;
  if (code >= 51 && code <= 57) return 3;
  if (code >= 61 && code <= 67) return 2;
  if (code >= 80 && code <= 82) return 2;
  return code;
}

function reconcileOpenMeteoCode(
  primaryCode: number,
  precipMm: number,
  showersMm: number,
  ukmoCode: number,
  ukmoPrecipMm: number,
): number {
  let code = primaryCode;

  // Only trust UKMO rain when it reports meaningful precipitation.
  if (ukmoCode >= 61 && ukmoPrecipMm >= PRECIP_THRESHOLD_MM) {
    code = ukmoCode;
  } else if (ukmoCode >= 51 && ukmoCode < 61 && ukmoPrecipMm >= PRECIP_THRESHOLD_MM) {
    code = ukmoCode;
  }

  if (precipMm >= PRECIP_THRESHOLD_MM && code < 50) {
    code = showersMm >= PRECIP_THRESHOLD_MM ? 80 : 61;
  }

  if (isPrecipitationCode(code) && precipMm < PRECIP_THRESHOLD_MM) {
    code = downgradeDryPrecipitation(code);
  }

  return code;
}

function readBackendPrecipMm(weather: Record<string, unknown>): number {
  const precipitation = weather.precipitation as { current?: number } | undefined;
  const rain = weather.rain as { '1h'?: number } | undefined;
  return precipitation?.current ?? rain?.['1h'] ?? 0;
}

function reconcileBackendWeather(
  owmId: number,
  description: string,
  isRaining: boolean,
  isShowering: boolean,
  precipMm: number,
): { wmoCode: number; condition: string } {
  let wmoCode = owmIdToWmo(owmId);
  let condition = owmIdToCondition(owmId, description);

  const owmSaysPrecip = owmId >= 300 && owmId < 600;
  const hasPrecip = precipMm >= PRECIP_THRESHOLD_MM;

  if (owmSaysPrecip && !hasPrecip) {
    wmoCode = owmId >= 803 ? 3 : owmId >= 801 ? 2 : 3;
    condition = interpretWeatherCode(wmoCode);
  } else if (isRaining && wmoCode < 50 && hasPrecip) {
    wmoCode = isShowering ? 80 : 61;
    condition = isShowering ? 'Rain Showers' : 'Rain';
  } else if (isPrecipitationCode(wmoCode) && !hasPrecip) {
    wmoCode = downgradeDryPrecipitation(wmoCode);
    condition = interpretWeatherCode(wmoCode);
  }

  return { wmoCode, condition };
}

function areaLabelFromAddress(loc: LocationAddress): string | null {
  if (loc.neighborhood?.trim()) return loc.neighborhood.trim();
  if (loc.lga?.trim()) return loc.lga.trim();
  if (loc.formatted?.trim()) {
    const first = loc.formatted.split(',')[0]?.trim();
    if (first) return first;
  }
  if (loc.state?.trim()) return loc.state.trim();
  return null;
}

async function reverseGeocodeCity(latitude: number, longitude: number): Promise<string> {
  try {
    const loc = await reverseGeocode(latitude, longitude);
    const label = loc ? areaLabelFromAddress(loc) : null;
    if (label) return label;
  } catch {
    // fall through to direct Nominatim
  }

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=12`,
      { headers: { 'User-Agent': 'NeyborHuud/1.0' }, signal: AbortSignal.timeout(5000) },
    );
    if (!geoRes.ok) return 'Your Area';
    const geoData = await geoRes.json();
    const a = geoData?.address;
    return a?.suburb || a?.neighbourhood || a?.city_district || a?.town || a?.city
      || a?.village || a?.county || a?.state || 'Your Area';
  } catch {
    return 'Your Area';
  }
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  const cityName = await reverseGeocodeCity(latitude, longitude);

  const apiBase = getApiBaseUrl();
  // Frontend-only dev (no local backend): Open-Meteo works without the API.
  if (apiBase && !isLocalDevHost(apiBase)) {
    try {
      const backendRes = await fetch(
        `${apiBase}/weather/current?lat=${latitude}&lon=${longitude}`,
        { signal: AbortSignal.timeout(6000) },
      );
      if (backendRes.ok) {
        const json = await backendRes.json();
        const w = json?.data?.weather as Record<string, unknown> | undefined;
        if (w) {
          const owmCondition = (w.conditions as Array<{ id?: number; description?: string }> | undefined)?.[0];
          const owmId = owmCondition?.id ?? 800;
          const desc = owmCondition?.description ?? '';
          const precipMm = readBackendPrecipMm(w);
          const { wmoCode, condition } = reconcileBackendWeather(
            owmId,
            desc,
            Boolean(w.isRaining),
            Boolean(w.isShowering),
            precipMm,
          );
          const location = w.location as { name?: string } | undefined;
          const temperature = w.temperature as { current?: number } | undefined;
          const city = cityName !== 'Your Area' ? cityName : (location?.name || cityName);
          return {
            temp: temperature?.current ?? 28,
            condition,
            city,
            wmoCode,
          };
        }
      }
    } catch {
      // fall through to Open-Meteo
    }
  }

  const [defaultRes, ukmoRes] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,rain,showers,precipitation&timezone=auto`,
      { signal: AbortSignal.timeout(6000) },
    ).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,rain,showers,precipitation&models=ukmo_seamless&timezone=auto`,
      { signal: AbortSignal.timeout(6000) },
    ).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);

  const defaultCur = defaultRes?.current as {
    temperature_2m?: number;
    weather_code?: number;
    rain?: number;
    showers?: number;
    precipitation?: number;
  } | undefined;
  const ukmoCur = ukmoRes?.current as {
    weather_code?: number;
    rain?: number;
    showers?: number;
    precipitation?: number;
  } | undefined;

  if (defaultCur) {
    const temp = Math.round(defaultCur.temperature_2m || 31);
    const rain = defaultCur.rain ?? 0;
    const showers = defaultCur.showers ?? 0;
    const precipMm = Math.max(defaultCur.precipitation ?? 0, rain + showers);
    const ukmoCode = ukmoCur?.weather_code ?? 0;
    const ukmoPrecipMm = (ukmoCur?.rain ?? 0) + (ukmoCur?.showers ?? 0) + (ukmoCur?.precipitation ?? 0);
    const code = reconcileOpenMeteoCode(
      defaultCur.weather_code || 0,
      precipMm,
      showers,
      ukmoCode,
      ukmoPrecipMm,
    );
    return {
      temp,
      condition: interpretWeatherCode(code),
      city: cityName,
      wmoCode: code,
    };
  }

  return { temp: 31, condition: 'Partly Cloudy', city: cityName, wmoCode: 2 };
}
