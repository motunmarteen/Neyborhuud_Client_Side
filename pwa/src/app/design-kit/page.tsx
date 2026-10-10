import type { Metadata } from 'next';
import { ArrowRight, Plus, Siren, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CardsAndChipsDemo } from './CardsAndChipsDemo';

export const metadata: Metadata = {
  title: 'Design kit',
  robots: { index: false, follow: false },
};

/**
 * Living reference for the Phase 2 design foundation (F-01 colours, F-02 fonts, F-03 buttons, ...).
 * Every building block is shown here as it is built, so it can be checked on a phone in one place.
 */

const SWATCHES: { name: string; hex: string; use: string; dark?: boolean }[] = [
  { name: 'Green', hex: '#00B82E', use: 'Brand, main buttons', dark: true },
  { name: 'Deep green', hex: '#0E8A3E', use: 'Pressed, text on green tint', dark: true },
  { name: 'Navy', hex: '#1D2433', use: 'Main text', dark: true },
  { name: 'Muted', hex: '#5B6478', use: 'Secondary text', dark: true },
  { name: 'Faint', hex: '#9AA3B1', use: 'Hints, placeholders' },
  { name: 'Line', hex: '#DDE3EC', use: 'Borders, dividers' },
  { name: 'Background', hex: '#EEF2F7', use: 'App background' },
  { name: 'Safety red', hex: '#E5484D', use: 'SOS, danger, errors', dark: true },
  { name: 'Amber', hex: '#F6C344', use: 'HuudCredit, warnings' },
  { name: 'Purple', hex: '#7A4FD8', use: 'Events, Sentinel AI', dark: true },
  { name: 'Blue', hex: '#3B82C4', use: 'Links, info', dark: true },
];

const TINTS = [
  { name: 'Green tint', hex: '#E8F7EC' },
  { name: 'Red tint', hex: '#FDECEC' },
  { name: 'Amber tint', hex: '#FFF4E5' },
  { name: 'Purple tint', hex: '#F0EBFF' },
  { name: 'Blue tint', hex: '#E6F0FA' },
];

function Section({ id, title, note, children }: { id: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 id={id} className="text-xl font-extrabold text-navy">{title}</h2>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DesignKitPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-8 text-navy">
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-green-dark">NeyborHuud · Phase 2</p>
          <h1 className="mt-1 text-3xl font-black">Design kit</h1>
          <p className="mt-1 text-sm text-muted">The building blocks every screen is made from. Light theme only.</p>
        </header>

        <Section id="colours" title="Colours (F-01)" note="Use these tokens; no new hex colours in components.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SWATCHES.map((s) => (
              <div key={s.hex} className="overflow-hidden rounded-2xl border border-line">
                <div className="flex h-16 items-end p-2" style={{ background: s.hex }}>
                  <span className={`text-xs font-bold ${s.dark ? 'text-white' : 'text-navy'}`}>{s.hex}</span>
                </div>
                <div className="p-2">
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="text-xs text-muted">{s.use}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TINTS.map((t) => (
              <span key={t.hex} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold" style={{ background: t.hex }}>
                {t.name} {t.hex}
              </span>
            ))}
          </div>
        </Section>

        <Section id="type" title="Type (F-02)" note="Nunito for headings, Nunito Sans for text.">
          <p className="font-heading text-3xl font-black">Wetin dey happen for your street?</p>
          <p className="mt-2 font-heading text-xl font-extrabold">Ọjà Ìbàdàn · Nnọọ · Sannu ɓ ɗ ƙ</p>
          <p className="mt-2 text-[15px] leading-relaxed">
            Light don come back for Adeola Odeku. Two neighbours confirmed it, and you earned <strong>5 HuudCredit</strong>{' '}
            for the update. Gate fee: <strong>₦2,500</strong>.
          </p>
          <p className="mt-1 text-sm text-muted">Secondary text looks like this.</p>
          <p className="mt-1 text-xs text-faint">Hints and timestamps look like this · 2 mins ago</p>
        </Section>

        <Section id="buttons" title="Buttons (F-03)" note="Pills. One green button per screen for the main action. Default height 48px.">
          <div className="flex flex-col gap-3">
            <Button fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>Enter your Huud</Button>
            <Button variant="secondary" fullWidth leftIcon={<MapPin className="h-4 w-4" />}>Use my location</Button>
            <Button variant="danger" fullWidth leftIcon={<Siren className="h-4 w-4" />}>Send SOS</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="soft" leftIcon={<Plus className="h-4 w-4" />}>Follow</Button>
              <Button variant="ghost">Not now</Button>
              <Button loading>Saving</Button>
              <Button disabled>Confirm my street</Button>
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-faint">Sizes</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small 40</Button>
              <Button size="md">Medium 48</Button>
              <Button size="lg">Large 56</Button>
            </div>
            <p className="text-xs text-muted">Small buttons still have a 48px tap area.</p>
          </div>
        </Section>

        <Section id="cards" title="Cards and chips (F-04)" note="White cards with soft shadows. Filter chips turn navy when on, like the map layers.">
          <CardsAndChipsDemo />
        </Section>
      </div>
    </main>
  );
}
