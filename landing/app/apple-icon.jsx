import { ImageResponse } from "next/og";
import { PwaIconMark } from "./components/landing/PwaIconMark";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const w = 180;
  return new ImageResponse(<PwaIconMark variant="maskable" sizePx={w} />, {
    width: w,
    height: w,
  });
}
