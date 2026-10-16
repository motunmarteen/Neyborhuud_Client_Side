/**
 * Lets the toy-world 3D layer read the living map's figures (vehicles, people, kids, the ball)
 * for the same map, so it can draw them as 3D models instead of flat icons.
 */
import type * as maplibregl from 'maplibre-gl';
import type { Agent } from '@/lib/livingMap';

const registry = new WeakMap<maplibregl.Map, () => Agent[]>();

export function registerLiving(map: maplibregl.Map, get: () => Agent[]) {
  registry.set(map, get);
}

export function unregisterLiving(map: maplibregl.Map) {
  registry.delete(map);
}

export function livingAgents(map: maplibregl.Map): Agent[] {
  return registry.get(map)?.() ?? [];
}
