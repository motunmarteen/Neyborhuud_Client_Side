'use client';

/**
 * How Sentinel keeps you safe: one plain guide to every safety tool and to Sentinel AI
 * (owner, 2026-10-17). Every line was checked against the code that runs today; when a tool
 * cannot do something (for example, call the police for you), the guide says so plainly.
 * Feature screens link here with #section, which opens that section.
 *
 * Keep it true: when a safety tool changes, change its section here too.
 */

import Link from 'next/link';
import { useEffect } from 'react';
import { SentinelSubpageLayout } from '@/components/sentinel/SentinelSubpageLayout';

type Section = {
  id: string;
  icon: string;
  title: string;
  what: string;
  steps: string[];
  know?: string[];
  open?: { href: string; label: string };
};

const GROUPS: { title: string; sections: Section[] }[] = [
  {
    title: 'When you are in danger',
    sections: [
      {
        id: 'sos',
        icon: '🆘',
        title: 'SOS',
        what: 'One button that tells your guardians you are in danger right now, with your location.',
        steps: [
          'Tap the red SOS button (it sits on almost every screen) to open SOS. You can set a short countdown so you can cancel a mistake.',
          'Press and hold the SOS button to send a silent alert at once: nothing changes on your screen, so nobody near you can see it.',
          'Your guardians get your live location and can tap “I’m responding”. If nobody at the first level answers, the app tells your next guardians.',
          'When you are safe, tap “I’m safe”. Every SOS keeps a recap in History: who was told, when, and who responded.',
        ],
        know: [
          'NeyborHuud does not call the police for you. If your guardians do not respond, the app shows you the right number (112, 122 for road accidents, 767 in Lagos) and a ready message, so one tap calls or texts them.',
          'No network? Your SOS is saved and goes the moment your phone is back online.',
          'You can practise: “Run a drill” stays on your screen only; “Run a guardian drill” sends a clearly marked 🧪 practice alert to your guardians and can never become a real emergency.',
        ],
        open: { href: '/sos', label: 'Open SOS' },
      },
      {
        id: 'panic-pin',
        icon: '🔢',
        title: 'Panic PIN',
        what: 'A secret code that looks like a normal unlock screen. Typing it quietly sends an SOS.',
        steps: [
          'Set a 4 to 6 digit PIN that is different from your everyday PIN.',
          'If someone forces you to unlock, type the panic PIN on its plain-looking screen. The screen looks the same for right and wrong PINs, so they learn nothing.',
          'The right PIN sends a silent SOS. A wrong PIN does nothing.',
        ],
        know: [
          'The real panic screen has its own address that is not linked anywhere in the app. Save it on your phone under an ordinary name.',
          'Use “Practice” to try it safely: the practice screen never sends anything, even if you type your real PIN.',
        ],
        open: { href: '/safety/panic-pin', label: 'Set up Panic PIN' },
      },
      {
        id: 'live-tracking',
        icon: '📡',
        title: 'Live Tracking',
        what: 'For very dangerous moments, like someone taking you somewhere against your will: your phone sends its location to your guardians again and again.',
        steps: [
          'Start a session, choose the type of danger and how often your phone should send its location.',
          'Your guardians watch your location update on a map until you stop the session.',
          'If your phone stops sending (3 missed updates), guardians see “lost signal” so they know to act.',
        ],
        know: [
          'You need a verified email to start a session. This stops people misusing it to track others.',
          'Emergency services are not alerted automatically. Guardians are.',
          'Updates sent while offline are kept and sent when the network comes back.',
        ],
        open: { href: '/safety/kidnapping-tracking', label: 'Open Live Tracking' },
      },
      {
        id: 'fake-call',
        icon: '📞',
        title: 'Fake Call',
        what: 'A pretend incoming call, with ringtone and a caller name you choose, to help you leave an uncomfortable situation.',
        steps: [
          'Pick who is “calling” and when the phone should ring.',
          'When it rings, answer to keep up the act, or decline.',
          'From anywhere, press and hold the Sentinel tab to jump straight to Fake Call.',
        ],
        know: ['Nothing leaves your phone. It is private, so it does not alert anyone. Use SOS for that.'],
        open: { href: '/safety/fake-call', label: 'Open Fake Call' },
      },
    ],
  },
  {
    title: 'Before anything goes wrong',
    sections: [
      {
        id: 'trips',
        icon: '🚗',
        title: 'Safe Trips',
        what: 'Tell the app where you are going and when you should arrive. If you go quiet on the way, your guardians are told.',
        steps: [
          'Set where you start, where you are going, when you expect to arrive and how often to check in. Start now or plan it for later.',
          'Your guardians are told the trip has started. Your location updates while the trip is on.',
          'Tap check-in when asked. Mark “Arrived” when you reach.',
        ],
        know: ['Miss 3 check-ins in a row and the app sends a silent SOS for you automatically.'],
        open: { href: '/safety/trips', label: 'Start a trip' },
      },
      {
        id: 'checkins',
        icon: '⏰',
        title: 'Wellness check-ins',
        what: 'A simple “are you okay?” timer, good for someone living alone or an elderly relative.',
        steps: [
          'Pick how often, start it, and tap “I’m okay” each time it asks.',
          '1 missed check-in: a quiet note. 2 missed: your guardians get a notification. 3 missed: a silent SOS is sent automatically.',
        ],
        know: ['If the app has no location for you at all, it will not send a blind SOS; it records the problem instead.'],
        open: { href: '/safety/manage#checkins', label: 'Set up check-ins' },
      },
      {
        id: 'geofences',
        icon: '⭕',
        title: 'Safe zones',
        what: 'Invisible circles you draw on the map (home, school, a place to avoid) that react when you enter or leave.',
        steps: [
          'Tap the map, set the size and the kind of zone, then save.',
          'Safe zone: confirms you arrived. Alert zone: warns you. Restricted zone: can tell your guardians or send an SOS.',
        ],
        know: ['Up to 20 zones. Each one adds a small location check, which uses a little battery.'],
        open: { href: '/safety/geofences', label: 'Open Safe zones' },
      },
    ],
  },
  {
    title: 'Your people',
    sections: [
      {
        id: 'guardians',
        icon: '🛡️',
        title: 'Guardians',
        what: 'The few people you trust most (family, close friends). They get your SOS, trips, missed check-ins and your exact location in an emergency.',
        steps: [
          'You can only add someone who follows you and whom you follow back.',
          'Send a guardian request; they become your guardian when they accept.',
          'Give each guardian a priority. In an SOS the first level is told first, then the next level if nobody answers.',
        ],
        know: ['Up to 100 guardians. You can remove anyone at any time.'],
        open: { href: '/safety/manage#guardians', label: 'Manage guardians' },
      },
      {
        id: 'circle',
        icon: '👥',
        title: 'Safety Circle and live status',
        what: 'A lighter group than guardians: they see how you are (“Safe”, “Heading home”…), but not your exact location and not your emergencies.',
        steps: [
          'Invite people who follow you back; they join when they accept.',
          'Post a status: Safe, On the move, In transit, Heading home, Arrived, Unsafe or Need attention. Add a short note or your location if you want.',
          '“Unsafe” and “Need attention” also send a notification to your guardians.',
        ],
        know: ['Guardians get emergencies and your location; Circle only sees your status.'],
        open: { href: '/safety/manage#linkers', label: 'Open your Circle' },
      },
    ],
  },
  {
    title: 'Your neighbourhood',
    sections: [
      {
        id: 'emergency-report',
        icon: '🚑',
        title: 'Report an emergency (calling for help)',
        what: 'For a fire, accident, medical or crime emergency: it gives you the right number for where you are and keeps a record.',
        steps: [
          'Choose the type and how serious it is.',
          'You get the right number for your location (112 across Nigeria, 122 for road accidents, 767 in Lagos) and a ready message, so one tap calls or texts them.',
          'Update the report, mark it resolved, or cancel it if it was a mistake. Your guardians can acknowledge it.',
        ],
        know: [
          'NeyborHuud does not contact the police, fire service or hospitals for you. Always call the number shown.',
        ],
        open: { href: '/safety/emergency', label: 'Report an emergency' },
      },
      {
        id: 'community-emergency',
        icon: '📣',
        title: 'Community emergency posts',
        what: 'Warn your neighbours fast about a danger in the area: a fire, flood, collapsed building, road attack.',
        steps: [
          'Post the emergency with how serious it is and where. It goes to the Feed and the map for people nearby.',
          'Neighbours tap “I’m nearby” or confirm it. Once enough of them confirm, it is marked community confirmed.',
          'It disappears by itself: after 6 hours (low), 12 hours (medium) or 24 hours (critical).',
        ],
        know: [
          'You can post up to 3 an hour, to stop panic spam.',
          'You earn 15 HuudCredit only after neighbours confirm your report, never just for posting.',
        ],
        open: { href: '/community-emergency', label: 'Open community emergencies' },
      },
      {
        id: 'incident-reports',
        icon: '📋',
        title: 'Incident reports',
        what: 'Report something that happened in your area (crime, fire, flood, accident, broken pipe, missing person) so neighbours know.',
        steps: [
          'Describe what happened, when and where. Add photos if you have them. You can report without showing your name.',
          'Neighbours mark “I saw it”, confirm or dispute it. 3 confirmations with no disputes (or 10 confirmations) make it community confirmed.',
          'Follow updates until it is resolved or closed.',
        ],
        know: ['Anonymous reports never show your name to other neighbours.'],
        open: { href: '/incident-reports', label: 'Open incident reports' },
      },
      {
        id: 'recap',
        icon: '🧾',
        title: 'Incident recap',
        what: 'After an SOS, a clear record of what happened: who was told and when, who responded, and how it ended.',
        steps: ['Open it from SOS History. Add a short note of your own, for example “false alarm”.'],
        open: { href: '/sos?tab=history', label: 'See SOS history' },
      },
    ],
  },
  {
    title: 'Sentinel AI',
    sections: [
      {
        id: 'sentinel-watch',
        icon: '👁️',
        title: 'How Sentinel watches the neighbourhood',
        what: 'Sentinel looks over public posts, listings and comments for signs of danger in an area. It watches places, not people.',
        steps: [
          'It looks for danger words (for example robbery, gunshots, kidnap) and checks if other people in the same area mentioned the same thing in the last 30 minutes.',
          'From that it gives a score from 0 to 10. At 8 or more it sends a Red Zone alert to people in that area. From 3 to 7 it keeps watch. Below that, nothing happens.',
          'Abusive or hateful slang is sent to our moderators to check.',
        ],
        know: [
          'The score comes from clear rules, not guesswork, so every alert can be explained.',
          'Everyone in an area is scored the same way. In Sentinel settings you choose which alerts reach you: all, high and above, critical only, or your own sensitivity from 0 to 10.',
          'It reads public posts only. It never reads your chats.',
        ],
        open: { href: '/safety/sentinel/settings', label: 'Sentinel alert settings' },
      },
      {
        id: 'ask-sentinel',
        icon: '✨',
        title: 'Ask Sentinel',
        what: 'One box on the Sentinel tab for searching and asking questions about your area.',
        steps: [
          'Type a name, word or #tag and results show as you type. No AI is used for this.',
          'Ask a question (“Is light on?”, “Any go-slow?”, “Plumber near me”) and press enter. Sentinel reads the latest reports from neighbours within about 2 km of you, plus nearby services, and answers in a few sentences with its sources.',
          'Under the answer you see the posts, people and places it found.',
        ],
        know: [
          'Sentinel only knows what neighbours have reported. If nobody reported anything, it says so. It never tells you “all clear” or “light is on” without reports.',
          'Ask Sentinel cannot contact anyone. In danger, use SOS.',
          'It needs your location to answer about your area.',
        ],
        open: { href: '/sentinel', label: 'Ask Sentinel' },
      },
      {
        id: 'privacy',
        icon: '🔒',
        title: 'What Sentinel never does',
        what: 'The promises behind every safety tool.',
        steps: [
          'Your live location goes to your guardians only during an SOS, a trip, live tracking or a check-in that escalates. Anywhere else, it is shared only when you choose to add it (to a status or a post).',
          'Pins and activity on the map are approximate (about a street block), never someone’s house.',
          'Safety reports never earn cash. HuudCredit for an emergency post comes only after neighbours confirm it.',
          'No tool pretends that police or emergency services have been told when they have not.',
        ],
      },
    ],
  },
];

export default function SafetyHowItWorksPage() {
  // A feature screen links here with #section: open it and bring it into view.
  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace('#', ''));
      const el = id ? (document.getElementById(id) as HTMLDetailsElement | null) : null;
      if (el) {
        el.open = true;
        el.scrollIntoView({ block: 'start' });
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  return (
    <SentinelSubpageLayout
      pageTitle="How Sentinel keeps you safe"
      pageSubtitle="Every safety tool and Sentinel AI, in plain words: what it does, how to use it, and what it cannot do."
      icon="menu_book"
      iconAccent="primary"
    >
      <nav aria-label="Jump to a tool" className="flex flex-wrap gap-2">
        {GROUPS.flatMap((g) => g.sections).map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => {
              const el = document.getElementById(s.id) as HTMLDetailsElement | null;
              if (el) el.open = true;
            }}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-white px-3 text-xs font-bold text-navy"
          >
            <span aria-hidden>{s.icon}</span>
            {s.title}
          </a>
        ))}
      </nav>

      {GROUPS.map((g) => (
        <section key={g.title} className="flex flex-col gap-2" aria-label={g.title}>
          <h2 className="px-1 pt-2 text-[11px] font-black uppercase tracking-[0.14em] text-muted">{g.title}</h2>
          {g.sections.map((s) => (
            <details
              key={s.id}
              id={s.id}
              className="group scroll-mt-28 rounded-[20px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3">
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-soft text-lg">
                  {s.icon}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-extrabold text-navy">{s.title}</span>
                  <span className="text-xs font-semibold text-muted">{s.what}</span>
                </span>
                <span aria-hidden className="material-symbols-outlined text-muted transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4">
                <ol className="flex flex-col gap-2">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm font-semibold text-navy">
                      <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-white">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {s.know?.length ? (
                  <div className="rounded-2xl bg-amber-soft p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8A5A00]">Good to know</p>
                    <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm font-semibold text-navy">
                      {s.know.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {s.open ? (
                  <Link
                    href={s.open.href}
                    className="inline-flex min-h-11 items-center justify-center self-start rounded-full bg-primary px-5 text-sm font-bold text-white"
                  >
                    {s.open.label}
                  </Link>
                ) : null}
              </div>
            </details>
          ))}
        </section>
      ))}
    </SentinelSubpageLayout>
  );
}
