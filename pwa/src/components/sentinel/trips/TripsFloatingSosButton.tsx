'use client';

type TripsFloatingSosButtonProps = {
  onClick: () => void;
};

export function TripsFloatingSosButton({ onClick }: TripsFloatingSosButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Trigger SOS emergency"
      className="fixed z-[60] flex items-center gap-2 rounded-full bg-brand-red px-4 py-3 text-sm font-bold text-white shadow-2xl"
      style={{
        bottom: '80px',
        right: '16px',
        boxShadow: '0 0 0 4px rgba(220,38,38,0.25), 0 8px 24px rgba(220,38,38,0.4)',
        animation: 'trips-sos-pulse 2s ease-in-out infinite',
      }}
    >
      <span className="material-symbols-outlined fill-1" style={{ fontSize: '20px' }}>
        sos
      </span>
      SOS
      <style>{`
        @keyframes trips-sos-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(220,38,38,0.25), 0 8px 24px rgba(220,38,38,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(220,38,38,0.15), 0 8px 32px rgba(220,38,38,0.55); }
        }
      `}</style>
    </button>
  );
}
