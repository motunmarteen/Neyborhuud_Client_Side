import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', intensity = 'medium', ...props }) => {
    const intensityClasses = {
        low: 'bg-white/10 backdrop-blur-sm',
        medium: 'glass',
        high: 'bg-white/40 dark:bg-surface-dark/60 dark:bg-surface-dark/60 backdrop-blur-2xl',
    };

    return (
        <div className={`${intensityClasses[intensity]} rounded-[2.5rem] p-6 border border-white/10 active:scale-[0.98] transition-all ${className}`} {...props}>
            {children}
        </div>
    );
};

interface NeumorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    isBtn?: boolean;
    isActive?: boolean;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
    children,
    className = '',
    isBtn = true,
    isActive = false,
    ...props
}) => {
    return (
        <div
            className={`
                ${isActive ? 'neumorphic-inset' : 'neumorphic'} 
                p-8 rounded-[3.5rem] transition-all duration-500 shadow-xl
                ${isBtn && !isActive ? 'neumorphic-btn cursor-pointer' : ''} 
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
};

export const NeumorphicInset: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
    return (
        <div className={`neumorphic-inset p-5 rounded-3xl ${className}`} {...props}>
            {children}
        </div>
    );
};

export const NeumorphicCircle: React.FC<NeumorphicCardProps> = ({
    children,
    className = '',
    isBtn = true,
    isActive = false,
    ...props
}) => {
    return (
        <div
            className={`
                ${isActive ? 'neumorphic-inset shadow-inner' : 'neumorphic-circle'} 
                flex items-center justify-center transition-all duration-500
                ${isBtn && !isActive ? 'neumorphic-circle-btn cursor-pointer' : ''} 
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
};
