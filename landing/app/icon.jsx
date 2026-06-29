import { ImageResponse } from "next/og";
import { PwaIconMark } from "./components/landing/PwaIconMark";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const w = 32;
  return new ImageResponse(<PwaIconMark variant="square" sizePx={w} />, {
    width: w,
    height: w,
  });
}
