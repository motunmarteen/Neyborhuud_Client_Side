/**
 * The profile-photo map pin shape (owner request 2026-10-11: "more pin alike", no thick border).
 * A classic map pin: round head, straight sides to a sharp point. Drawn in a 100 x 115 box
 * (BrandPinAvatar, MapPinAvatar) and at 2x for the photo editor (200 x 230), so the editor's
 * guide is exactly the pin people will see.
 */
export const PIN_VIEWBOX = '0 0 100 115';
export const PIN_PATH = 'M50 112 L16.97 69.94 A42 42 0 1 1 83.03 69.94 Z';
export const PIN_PATH_2X = 'M100 224 L33.94 139.88 A84 84 0 1 1 166.06 139.88 Z';
/** A hairline white edge so the photo still reads on a busy background. */
export const PIN_EDGE = 2;
