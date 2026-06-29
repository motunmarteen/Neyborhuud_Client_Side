'use client';

import { useAppTheme } from '@/hooks/useAppTheme';
import { CitySilhouette } from '@/components/ambient/CitySilhouette';

/** Building silhouettes only — last item in the left sidebar (no sky). */
export function SidebarBuildingSilhouette() {
  const appTheme = useAppTheme();
  const buildingColor = appTheme === 'dark' ? '#0c1628' : '#1e3a5a';

  return (
    <div className="left-sidebar__buildings" data-app-theme={appTheme} aria-hidden>
      <CitySilhouette color={buildingColor} height={42} layout="inline" />
    </div>
  );
}
