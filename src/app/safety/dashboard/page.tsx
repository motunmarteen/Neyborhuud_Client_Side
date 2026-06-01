import { redirect } from 'next/navigation';

/** Alias for hub “Dashboard” button — same as /safety/manage */
export default function SafetyDashboardAliasPage() {
  redirect('/safety/manage');
}
