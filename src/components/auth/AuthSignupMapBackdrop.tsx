'use client';

import { LocationPicker } from '@/components/ui/LocationPicker';
import { SIGNUP_MAP_DEFAULT, type SignupMapLocation } from '@/lib/signupMap';

type AuthSignupMapBackdropProps = {
    /** Street point chosen during signup — map centres here when set */
    mapLocation?: SignupMapLocation | null;
    sheetCollapsed?: boolean;
};

/** Read-only MapLibre layer behind auth bottom sheets (matches signup flow). */
export function AuthSignupMapBackdrop({
    mapLocation = null,
    sheetCollapsed = false,
}: AuthSignupMapBackdropProps) {
    return (
        <>
            <LocationPicker
                initialLocation={mapLocation}
                mapHeight="signup-fullscreen"
                defaultCenter={SIGNUP_MAP_DEFAULT}
                readOnly
                presentation="premium"
                label="Huud point"
                showRetry={false}
            />
            <div
                className={[
                    'auth-signup-map-scrim',
                    'auth-signup-map-scrim--preview',
                    sheetCollapsed ? 'auth-signup-map-scrim--sheet-collapsed' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-hidden
            />
        </>
    );
}
