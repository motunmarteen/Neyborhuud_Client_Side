export type SignupSheetSnap = 'expanded' | 'collapsed';

/** Decide snap target after a handle drag on the signup bottom sheet. */
export function resolveSignupSheetSnap(params: {
    offsetY: number;
    velocityY: number;
    collapseOffset: number;
    currentlyCollapsed: boolean;
}): SignupSheetSnap {
    const { offsetY, velocityY, collapseOffset, currentlyCollapsed } = params;

    if (collapseOffset <= 0) {
        return 'expanded';
    }

    const base = currentlyCollapsed ? collapseOffset : 0;
    const projected = base + offsetY;

    if (velocityY > 420) {
        return 'collapsed';
    }

    if (velocityY < -420) {
        return 'expanded';
    }

    if (projected > collapseOffset * 0.55) {
        return 'collapsed';
    }

    if (projected < collapseOffset * 0.45) {
        return 'expanded';
    }

    return currentlyCollapsed ? 'collapsed' : 'expanded';
}

export function signupSheetTranslateY(collapsed: boolean, collapseOffset: number): number {
    return collapsed ? collapseOffset : 0;
}
