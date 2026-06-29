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
    return "What's up in your Huud tonight?";
  }
  return "What's up in your Huud today?";
}

/** Expressive weather line — warm & local; no repeat of temp (above) or time (in greeting). */
export function getExpressiveWeatherLine(params: {
  condition: string;
  temp: number;
  huudName: string;
  ambientWeather: WeatherCondition;
}): string {
  const { condition, temp, huudName, ambientWeather } = params;
  const tone = getTempTone(temp);
  const conditionLower = condition.toLowerCase();

  switch (ambientWeather) {
    case 'rain':
      return `Rain rolling through ${huudName}. Hope you're staying dry.`;
    case 'storm':
      return `Storms over ${huudName}. Stay indoors if you can.`;
    case 'fog':
      return `It's ${tone} and misty in ${huudName}.`;
    case 'snow':
      return `It's a ${tone}, chilly one in ${huudName}.`;
    case 'cloudy':
      return `It's ${tone} with ${conditionLower} in ${huudName}.`;
    case 'clear':
    default:
      return `It's ${tone} with clear skies in ${huudName}.`;
  }
}
