type AuthSheetStageHeaderProps = {
    icon: string;
    eyebrow: string;
    title: string;
    meta?: string;
    signal?: string;
    badge?: string;
    error?: string;
};

/** Signup-style sheet header (location / identity stages). */
export function AuthSheetStageHeader({
    icon,
    eyebrow,
    title,
    meta,
    signal,
    badge = 'N',
    error,
}: AuthSheetStageHeaderProps) {
    return (
        <>
            <div className="mb-3 flex items-center gap-3">
                <div className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-[0_18px_34px_rgba(0,111,53,0.34)]">
                    {badge ? (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-primary shadow-md">
                            {badge}
                        </span>
                    ) : null}
                    <i className={`bi ${icon} text-xl`} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
                        {signal ? (
                            <>
                                <span className="h-1 w-1 rounded-full bg-brand-blue/60" aria-hidden />
                                <p className="truncate text-[9px] font-bold uppercase tracking-wider text-brand-blue">
                                    {signal}
                                </p>
                            </>
                        ) : null}
                    </div>
                    <h2 className="truncate text-[1.35rem] font-black tracking-tighter text-brand-black">{title}</h2>
                    {meta ? (
                        <p className="truncate text-[11px] font-medium text-[var(--neu-text-muted)]">{meta}</p>
                    ) : null}
                </div>
            </div>
            {error ? (
                <div className="auth-flow-notice auth-flow-notice--error mb-3" role="alert">
                    <i className="bi bi-exclamation-circle-fill shrink-0" aria-hidden />
                    <span>{error}</span>
                </div>
            ) : null}
        </>
    );
}
