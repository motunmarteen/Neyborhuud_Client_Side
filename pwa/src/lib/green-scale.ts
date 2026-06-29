/**
 * NeyborHuud green family — single hue ladder.
 * Keep in sync with `--green-*` tokens in globals.css.
 */
export const GREEN_SCALE = {
  50: '#E9F6E6',
  100: '#D4EDCF',
  200: '#B8E0B0',
  300: '#52C952',
  400: '#00D431',
  500: '#00B82A',
  600: '#006F35',
  700: '#004D25',
} as const;

/** Semantic roles — where each shade shows up in the product */
export const GREEN_ROLE = {
  /** Page/card wash, sidebar tints */
  surface: GREEN_SCALE[50],
  /** Hover fills, chip backgrounds */
  fill: GREEN_SCALE[100],
  /** Dividers on green-tinted surfaces */
  border: GREEN_SCALE[200],
  /** Secondary icons, meta labels, Sentinel at rest */
  muted: GREEN_SCALE[300],
  /** CTAs, active nav, success pulse */
  brand: GREEN_SCALE[400],
  /** Pressed buttons, gradient midpoints */
  press: GREEN_SCALE[500],
  /** Readable text & icons on light backgrounds */
  deep: GREEN_SCALE[600],
  /** FAB depth, wordmark accents, map zones */
  forest: GREEN_SCALE[700],
} as const;
