/** Post-signup setup steps — matches signup chrome progress pattern. */
export const AUTH_SETUP_STEPS = [
    { id: 'pick', label: 'Pick Huud', icon: 'bi-house-heart-fill' },
    { id: 'verify', label: 'Verify location', icon: 'bi-crosshair' },
    { id: 'profile', label: 'Complete profile', icon: 'bi-person-badge-fill' },
] as const;

export type AuthSetupStepId = (typeof AUTH_SETUP_STEPS)[number]['id'];

export function getAuthSetupProgress(stepId: AuthSetupStepId) {
    const index = AUTH_SETUP_STEPS.findIndex((step) => step.id === stepId);
    const step = AUTH_SETUP_STEPS[index];
    return {
        active: index + 1,
        total: AUTH_SETUP_STEPS.length,
        stepLabel: step?.label ?? '',
        icon: step?.icon ?? 'bi-circle',
    };
}
