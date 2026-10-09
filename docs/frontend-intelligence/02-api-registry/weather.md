# API Registry — Weather

> Mount: `app.use("/api/v1/weather", weatherRoutes)` — `app.ts:347`
> Source: `NeyborHuud-ServerSide/src/modules/weather/weather.routes.ts`
>
> **Total: 1 route.** Public — source comment: "weather is community-visible information."

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/current` | public | `getCurrentWeather` | Query params: `?lat=&lon=` or `?city=Alimosho` or `?lga=Alimosho` — three alternative location-input shapes |

## Known issues found while building this registry

- None. Smallest, cleanest module in the registry — a single well-documented public endpoint.
