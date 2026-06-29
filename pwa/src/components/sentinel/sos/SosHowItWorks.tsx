const STEPS = [
  {
    icon: 'touch_app',
    title: 'Arm or trigger',
    body: 'Set countdown & options on the Now tab, tap the red button, or long-press SOS in the bottom nav for silent mode.',
  },
  {
    icon: 'groups',
    title: 'Circle responds',
    body: 'Guardians get your live location and can acknowledge. Emergency services dispatch if you enabled them.',
  },
  {
    icon: 'task_alt',
    title: 'Mark safe',
    body: 'When the danger passes, tap “I’m safe” to close the incident and save a recap in History.',
  },
] as const;

export function SosHowItWorks() {
  return (
    <div className="space-y-0">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400 px-6 pt-4 pb-2">How SOS works</p>
      <div className="flex flex-col bg-white">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-4 border-b border-gray-100 py-5 px-6 last:border-b-0 bg-white rounded-none shadow-none">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100/50">
              <span className="text-xs font-black tabular-nums">{i + 1}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-600" aria-hidden>
                  {step.icon}
                </span>
                <p className="text-sm font-bold text-gray-800">
                  {step.title}
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
