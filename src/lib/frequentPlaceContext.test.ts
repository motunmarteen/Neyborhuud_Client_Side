import { describe, it, expect } from "vitest";
import {
  formatPlaceContextLine,
  formatPlaceContextSubtitle,
} from "@/lib/frequentPlaceContext";
import type { FeedPlaceContext } from "@/types/api";

const sample: FeedPlaceContext = {
  id: "work-1",
  kind: "work",
  kindLabel: "Work",
  label: "My Office",
  lga: "Alimosho",
  state: "Lagos",
  neighborhood: "Idimu",
  distanceKm: 0.12,
  lat: 6.58,
  lng: 3.28,
};

describe("frequentPlaceContext", () => {
  it("formats near-work line with neighborhood", () => {
    expect(formatPlaceContextLine(sample)).toBe("Near Work · Idimu");
  });

  it("falls back to LGA when neighborhood missing", () => {
    expect(
      formatPlaceContextLine({ ...sample, neighborhood: undefined }),
    ).toBe("Near Work · Alimosho");
  });

  it("builds subtitle with label and LGA", () => {
    expect(formatPlaceContextSubtitle(sample)).toContain("My Office");
    expect(formatPlaceContextSubtitle(sample)).toContain("Alimosho");
  });
});
