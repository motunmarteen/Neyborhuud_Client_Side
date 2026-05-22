type AuthFlowHeroProps = {
    icon: string;
    eyebrow: string;
    title: string;
    meta?: string;
    error?: boolean;
    pulse?: boolean;
};

export function AuthFlowHero({ icon, eyebrow, title, meta, error, pulse }: AuthFlowHeroProps) {
    return (
        <div className="auth-flow-hero-card">
            <span
                className={`auth-flow-hero-card__icon${error ? ' auth-flow-hero-card__icon--error' : ''}`}
                aria-hidden
            >
                <i className={`bi ${icon}${pulse ? ' animate-pulse' : ''}`} />
            </span>
            <div className="min-w-0 flex-1">
                <p className={`auth-flow-hero-card__eyebrow${error ? ' auth-flow-hero-card__eyebrow--error' : ''}`}>
                    {eyebrow}
                </p>
                <p className="auth-flow-hero-card__title truncate">{title}</p>
                {meta ? <p className="auth-flow-hero-card__meta truncate">{meta}</p> : null}
            </div>
        </div>
    );
}
