import { ImageResponse } from "next/og";
import { PwaIconMark } from "../components/landing/PwaIconMark";

export const runtime = "edge";

export async function GET() {
  const size = 192;
  return new ImageResponse(<PwaIconMark variant="square" sizePx={size} />, {
    width: size,
    height: size,
  });
}
