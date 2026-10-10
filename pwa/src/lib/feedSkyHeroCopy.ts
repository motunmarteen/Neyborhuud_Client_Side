import type { TimePeriod, WeatherCondition } from '@/components/navigation/AmbientProfileCard';

function getTempTone(temp: number): string {
  if (temp >= 36) return 'hot';
  if (temp >= 30) return 'warm';
  if (temp >= 24) return 'pleasant';
  if (temp >= 18) return 'mild';
  return 'cool';
}

/** Branded sky-hero composer — name lives in the greeting above. */
export function getHuudComposerPrompt(timePeriod: TimePeriod): string {
  if (timePeriod === 'night') {
    return "Anything happening around you tonight?";
  }
  return "Wetin dey happen around you today?";
}

/** Weather line in everyday Nigerian English; no repeat of temp (above) or time (in greeting). See docs/LANGUAGE.md. */
export function getExpressiveWeatherLine(params: {
  condition: string;
  temp: number;
  huudName: string;
  ambientWeather: WeatherCondition;
}): string {
  const { temp, huudName, ambientWeather } = params;
  const tone = getTempTone(temp);
  const hot = tone === 'hot' || tone === 'warm';

  switch (ambientWeather) {
    case 'rain':
      return `Rain don start for ${huudName}. Stay dry o.`;
    case 'storm':
      return `Heavy rain for ${huudName}. Stay inside if you can.`;
    case 'fog':
      // Fog/haze in Nigeria is usually harmattan dust.
      return `Harmattan haze for ${huudName}. Drive carefully.`;
    case 'snow':
      return `It's a ${tone}, chilly one in ${huudName}.`;
    case 'cloudy':
      return hot
        ? `Cloudy but hot for ${huudName}. Drink water.`
        : `Cloudy weather for ${huudName} today.`;
    case 'clear':
    default:
      return hot
        ? `Sun dey hot for ${huudName} today. Drink water.`
        : `Fine weather for ${huudName} today.`;
  }
}
