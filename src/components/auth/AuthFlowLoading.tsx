/** Unified loading shell for auth-flow Suspense boundaries. */
export function AuthFlowLoading() {
  return (
    <div className="auth-signup-page fixed-app flex items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
