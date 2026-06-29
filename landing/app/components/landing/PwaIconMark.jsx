/** JSX for OG / PWA ImageResponse icons (keep dependency-free vs route handler). */

export function PwaIconMark({ variant = "square", sizePx = 512 }) {
  const isMaskable = variant === "maskable";
  const nhColor = "#ffffff";

  const scale = isMaskable ? 0.2 : 0.34;
  const fontSize = Math.max(13, Math.round(sizePx * scale));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: isMaskable ? "12%" : "0%",
        background: "linear-gradient(155deg, #00d431 0%, #006f35 100%)",
      }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          fontFamily:
            '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
          lineHeight: 1,
          color: nhColor,
        }}
      >
        NH
      </span>
    </div>
  );
}
