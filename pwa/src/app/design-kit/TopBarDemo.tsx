'use client';

import { TopBar } from '@/components/navigation/TopNav';

const noop = () => {};

const STATES = [
  { label: 'Home (signed in)', props: { isHome: true, title: '', area: 'Somolu', signedIn: true, credit: 120, unreadCount: 3, initial: 'T' } },
  { label: 'Inside a page', props: { isHome: false, title: 'Marketplace', area: null, signedIn: true, credit: 1450, unreadCount: 0, initial: 'A' } },
  { label: 'Balance still loading', props: { isHome: true, title: '', area: 'Yaba', signedIn: true, credit: null, unreadCount: 0, initial: 'K' } },
  { label: 'Visitor (not signed in)', props: { isHome: true, title: '', area: 'Ikeja GRA', signedIn: false, credit: null, unreadCount: 0, initial: '' } },
];

export function TopBarDemo() {
  return (
    <div className="flex flex-col gap-4">
      {STATES.map((s, i) => (
        <div key={s.label} className="relative" style={{ zIndex: STATES.length - i }}>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-faint">{s.label}</p>
          {/* A map-coloured strip so the floating shadow shows the way it does on the home screen. */}
          <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#D3E6BE] py-3">
            <TopBar {...s.props} avatarUrl={null} onBack={noop} onSearch={noop} onMe={noop} />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted">Tap ＋ to see the create menu. Search shows on phones 400px and wider.</p>
    </div>
  );
}
