/**
 * Weather on the map (tracker M-05), from the Home Concept mockup's six looks, driven by the
 * real weather where the map is (lib/weatherClient: our API, Open-Meteo fallback).
 *
 * Harmattan is not a weather code: haze, dust or fog in the dry season (November–March) shows
 * as harmattan; outside it, as cloud. Pure functions, no DOM.
 */

export type MapWeather = 'clear' | 'cloudy' | 'harmattan' | 'drizzle' | 'rain' | 'storm';

export const MAP_WEATHERS: MapWeather[] = ['clear', 'cloudy', 'harmattan', 'drizzle', 'rain', 'storm'];

/** WMO weather code (+ month, 0–11) → the map's look. */
export function mapWeatherFromWmo(code: number, month: number): MapWeather {
  const drySeason = month >= 10 || month <= 2; // Nov–Mar
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return drySeason ? 'harmattan' : 'cloudy';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 95 && code <= 99) return 'storm';
  return 'clear';
}

export type WeatherLook = {
  /** Wash over the sky band (CSS background). */
  skyWash: string;
  /** Haze over the land, and its strength. */
  mapHaze: string;
  mapHazeAlpha: number;
  cloudOpacity: number;
  /** Dark patches drifting over the land under the clouds. */
  shadows: number;
  /** Harmattan dust over everything. */
  dust: number;
  drops: number;
  dropWidth: number;
  dropLength: [number, number];
  /** Seconds per drop fall (faster in a storm). */
  dropSpeed: number;
  lightning: boolean;
  puddles: number;
  /** Clouds or dust hide the stars; the sun and moon dim. */
  hidesStars: boolean;
  sunOpacity: number;
  moonOpacity: number;
};

const LOOKS: Record<MapWeather, Omit<WeatherLook, 'hidesStars' | 'sunOpacity' | 'moonOpacity'>> = {
  clear: { skyWash: 'transparent', mapHaze: '#FFFFFF', mapHazeAlpha: 0, cloudOpacity: 0.35, shadows: 0.25, dust: 0, drops: 0, dropWidth: 0, dropLength: [0, 0], dropSpeed: 0, lightning: false, puddles: 0 },
  cloudy: { skyWash: 'linear-gradient(180deg, rgba(150,160,175,.35), rgba(200,206,215,.25))', mapHaze: '#8A93A3', mapHazeAlpha: 0.12, cloudOpacity: 1, shadows: 0.8, dust: 0, drops: 0, dropWidth: 0, dropLength: [0, 0], dropSpeed: 0, lightning: false, puddles: 0 },
  harmattan: { skyWash: 'linear-gradient(180deg, rgba(214,190,150,.55), rgba(235,215,180,.6))', mapHaze: '#D9C09A', mapHazeAlpha: 0.32, cloudOpacity: 0.15, shadows: 0, dust: 0.16, drops: 0, dropWidth: 0, dropLength: [0, 0], dropSpeed: 0, lightning: false, puddles: 0 },
  drizzle: { skyWash: 'linear-gradient(180deg, rgba(130,140,158,.45), rgba(180,188,200,.35))', mapHaze: '#7C889B', mapHazeAlpha: 0.16, cloudOpacity: 0.9, shadows: 0.5, dust: 0, drops: 22, dropWidth: 1, dropLength: [9, 27], dropSpeed: 1.1, lightning: false, puddles: 0.45 },
  rain: { skyWash: 'linear-gradient(180deg, rgba(100,110,130,.6), rgba(150,160,175,.45))', mapHaze: '#5E6B80', mapHazeAlpha: 0.24, cloudOpacity: 1, shadows: 0.35, dust: 0, drops: 46, dropWidth: 1.8, dropLength: [16, 34], dropSpeed: 0.65, lightning: false, puddles: 0.9 },
  storm: { skyWash: 'linear-gradient(180deg, rgba(45,50,70,.8), rgba(90,95,115,.6))', mapHaze: '#2E3548', mapHazeAlpha: 0.36, cloudOpacity: 1, shadows: 0.3, dust: 0, drops: 72, dropWidth: 1.8, dropLength: [16, 40], dropSpeed: 0.45, lightning: true, puddles: 0.9 },
};

export function weatherLook(wx: MapWeather): WeatherLook {
  const covered = wx === 'cloudy' || wx === 'drizzle' || wx === 'rain' || wx === 'storm';
  return {
    ...LOOKS[wx],
    hidesStars: covered || wx === 'harmattan',
    sunOpacity: covered ? 0.35 : wx === 'harmattan' ? 0.55 : 1,
    moonOpacity: covered ? 0.3 : 1,
  };
}

/** Cloud colour for the hour: dark in storms, grey in rain, tinted by the sky otherwise. */
export function cloudColor(wx: MapWeather, dark: number, skyBot: string): string {
  if (wx === 'storm') return '#5A6175';
  if (wx === 'rain') return '#9AA3B3';
  if (dark > 0.6) return '#3B4470';
  return mixWhite(skyBot, Math.min(0.45, dark * 0.6));
}

function mixWhite(hex: string, t: number): string {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return '#' + c.map((v) => Math.round(255 + (v - 255) * t).toString(16).padStart(2, '0')).join('');
}

/** Weather in plain words for the map's label (Pidgin-friendly, nationwide). */
export const WEATHER_WORDS: Record<MapWeather, { icon: string; label: string }> = {
  clear: { icon: '☀️', label: 'Clear' },
  cloudy: { icon: '☁️', label: 'Cloudy' },
  harmattan: { icon: '🌫️', label: 'Harmattan' },
  drizzle: { icon: '🌦️', label: 'Small rain' },
  rain: { icon: '🌧️', label: 'Rain' },
  storm: { icon: '⛈️', label: 'Thunderstorm' },
};
