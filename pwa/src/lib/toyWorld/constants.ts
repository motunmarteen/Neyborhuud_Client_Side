/**
 * The toy-world layer's name, types and lighting, kept apart from the layer itself so
 * screens can talk to it without loading three.js (M-16: three.js loads only once the map
 * is showing, and never in Calm view).
 */
import type * as maplibregl from 'maplibre-gl';

export const TOY_LAYER_ID = 'toy-world';

export type ToyBillboard = {
  id: string;
  lng: number;
  lat: number;
  title: string;
  line?: string;
  colour: string;
  /** Text colour that reads on `colour` (see boardInk). */
  ink: string;
  /** "Ad", or "Sample" for previews. */
  chip: string;
};

export type ToyWorldLayer = maplibregl.CustomLayerInterface & {
  setDark: (dark: number) => void;
  /** Map billboard ads to stand in 3D (useMapAds). */
  setBillboards: (list: ToyBillboard[]) => void;
  /** The 3D billboard under a point in the map canvas (CSS px), if any. */
  pickBillboard: (point: { x: number; y: number }) => string | null;
};

/** The toy-world layer on this map, once it has loaded. */
export function toyLayerOf(map: maplibregl.Map): ToyWorldLayer | undefined {
  if (!map.getStyle()) return undefined;
  return (map.getLayer(TOY_LAYER_ID) as unknown as { implementation?: ToyWorldLayer } | undefined)?.implementation;
}

const darkByMap = new WeakMap<maplibregl.Map, number>();

/** Night for the models (lit windows, lamps). Remembered, so a layer that loads later starts right. */
export function setToyDark(map: maplibregl.Map, dark: number) {
  darkByMap.set(map, dark);
  toyLayerOf(map)?.setDark(dark);
}

export function toyDarkOf(map: maplibregl.Map): number {
  return darkByMap.get(map) ?? 0;
}
