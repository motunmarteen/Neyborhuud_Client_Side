/**
 * One knob for every font size on the platform (owner 2026-11-25: smaller text by default, so
 * screens fit more phones). Rewrites each `font-size` in the built CSS (Tailwind classes,
 * text-[15px], globals.css) to follow --font-scale, set at the top of globals.css and changed
 * by Settings → Text size. Text of 10px or less is never made smaller, so it stays readable.
 * Left alone: em and % (they follow their parent), max(16px…) on inputs (stops iPhone zoom),
 * and the logo.
 */
const FLOOR = '10px';
const plain = /^(?:\d*\.)?\d+(?:px|rem)$/;
const token = /^var\(--text-[\w-]+\)$/;

module.exports = () => ({
  postcssPlugin: 'nh-font-scale',
  Declaration: {
    'font-size': (decl) => {
      const v = decl.value.trim();
      if (v.includes('--font-scale')) return;
      const selector = decl.parent && decl.parent.selector;
      if (!selector || /^(html|:root)\b/.test(selector)) return;
      if (!plain.test(v) && !token.test(v) && !/^clamp\(/.test(v)) return;
      decl.value = `max(min(${v}, ${FLOOR}), calc(${v} * var(--font-scale, 1)))`;
    },
  },
});
module.exports.postcss = true;
